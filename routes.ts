import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  medicationSchema, 
  medicationFormSchema, 
  caregiverFormSchema, 
  userCaregiverSchema 
} from "@shared/schema";
import { ZodError } from "zod";

// Middleware to check if user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Health check route
  app.get("/api/health", (_, res) => {
    res.status(200).json({ status: "healthy" });
  });

  // Profile update endpoint
  app.put("/api/profile", ensureAuthenticated, async (req, res) => {
    try {
      const user = await storage.updateUserProfile(req.user!.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ------------------------
  // Medication routes
  // ------------------------
  
  // Get all medications for the current user
  app.get("/api/medications", ensureAuthenticated, async (req, res) => {
    try {
      const medications = await storage.getMedications(req.user!.id);
      res.json(medications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  });

  // Get a specific medication
  app.get("/api/medications/:id", ensureAuthenticated, async (req, res) => {
    try {
      const medication = await storage.getMedication(parseInt(req.params.id));
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      
      // Check if medication belongs to the current user
      if (medication.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized access to medication" });
      }
      
      res.json(medication);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medication" });
    }
  });

  // Create a new medication
  app.post("/api/medications", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = medicationFormSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const medication = await storage.createMedication(validatedData);
      res.status(201).json(medication);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create medication" });
    }
  });

  // Update an existing medication
  app.put("/api/medications/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const medication = await storage.getMedication(id);
      
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      
      // Check if medication belongs to the current user
      if (medication.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized access to medication" });
      }
      
      const validatedData = medicationSchema.partial().parse(req.body);
      const updatedMedication = await storage.updateMedication(id, validatedData);
      
      res.json(updatedMedication);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update medication" });
    }
  });

  // Delete a medication
  app.delete("/api/medications/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const medication = await storage.getMedication(id);
      
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      
      // Check if medication belongs to the current user
      if (medication.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized access to medication" });
      }
      
      const success = await storage.deleteMedication(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Failed to delete medication" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete medication" });
    }
  });

  // ------------------------
  // Medication Reminder routes
  // ------------------------
  
  // Get reminders for a specific medication
  app.get("/api/medications/:id/reminders", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const medication = await storage.getMedication(id);
      
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      
      // Check if medication belongs to the current user
      if (medication.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized access to medication" });
      }
      
      const reminders = await storage.getMedicationReminders(id);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  // Mark a reminder as taken or skipped
  app.put("/api/reminders/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { taken, skipped } = req.body;
      
      const updatedReminder = await storage.updateMedicationReminder(id, taken, skipped);
      
      if (!updatedReminder) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      
      // Verify user has access to this reminder
      const medication = await storage.getMedication(updatedReminder.medicationId);
      if (!medication || medication.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized access to reminder" });
      }
      
      res.json(updatedReminder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update reminder" });
    }
  });

  // ------------------------
  // Caregiver routes
  // ------------------------
  
  // Get all caregivers for the current user
  app.get("/api/caregivers", ensureAuthenticated, async (req, res) => {
    try {
      const caregivers = await storage.getCaregivers(req.user!.id);
      res.json(caregivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch caregivers" });
    }
  });

  // Create a new caregiver and link to current user
  app.post("/api/caregivers", ensureAuthenticated, async (req, res) => {
    try {
      // First validate and create the caregiver
      const { confirmPassword, ...caregiverData } = caregiverFormSchema.parse(req.body);
      
      // Check if caregiver with this username already exists
      const existingCaregiver = await storage.getCaregiverByUsername(caregiverData.username);
      if (existingCaregiver) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const caregiver = await storage.createCaregiver(caregiverData);
      
      // Then link the caregiver to the current user
      const userCaregiverData = userCaregiverSchema.parse({
        userId: req.user!.id,
        caregiverId: caregiver.id,
        accessLevel: req.body.accessLevel || "full",
        active: true
      });
      
      const userCaregiver = await storage.linkCaregiverToUser(userCaregiverData);
      
      res.status(201).json({
        ...caregiver,
        accessLevel: userCaregiver.accessLevel
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create caregiver" });
    }
  });

  // Update caregiver access level
  app.put("/api/caregivers/:id/access", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { accessLevel, active } = req.body;
      
      const updatedUserCaregiver = await storage.updateCaregiverAccess(id, accessLevel, active);
      
      if (!updatedUserCaregiver) {
        return res.status(404).json({ error: "Caregiver link not found" });
      }
      
      // Verify this is the user's caregiver
      if (updatedUserCaregiver.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized access to caregiver" });
      }
      
      res.json(updatedUserCaregiver);
    } catch (error) {
      res.status(500).json({ error: "Failed to update caregiver access" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
