import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  age: integer("age"),
  disease: text("disease"),
  city: text("city"),
  profileComplete: boolean("profile_complete").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const profileSchema = createInsertSchema(users).pick({
  fullName: true,
  age: true,
  disease: true,
  city: true,
});

// Medication frequency enum
export const frequencyEnum = pgEnum('frequency', ['daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'weekly', 'as_needed', 'other']);

// Medications table
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: frequencyEnum("frequency").notNull(),
  startTime: timestamp("start_time").notNull(),
  notes: text("notes"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Medication reminders
export const medicationReminders = pgTable("medication_reminders", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull().references(() => medications.id),
  reminderTime: timestamp("reminder_time").notNull(),
  taken: boolean("taken").default(false),
  takenAt: timestamp("taken_at"),
  skipped: boolean("skipped").default(false),
});

// Caregivers table
export const caregivers = pgTable("caregivers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email").notNull(),
  relation: text("relation"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User-caregiver relationship
export const userCaregivers = pgTable("user_caregivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  caregiverId: integer("caregiver_id").notNull().references(() => caregivers.id),
  accessLevel: text("access_level").notNull().default('full'), // full, limited, read-only
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas for inserting/validating data
export const medicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
});

export const medicationReminderSchema = createInsertSchema(medicationReminders).omit({
  id: true,
  takenAt: true,
});

export const caregiverSchema = createInsertSchema(caregivers).omit({
  id: true,
  createdAt: true,
});

export const userCaregiverSchema = createInsertSchema(userCaregivers).omit({
  id: true,
  createdAt: true,
});

// Extended schemas with additional validation for forms
export const medicationFormSchema = medicationSchema.extend({
  frequency: z.enum(['daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'weekly', 'as_needed', 'other']),
  startTime: z.coerce.date(),
});

export const caregiverFormSchema = caregiverSchema.extend({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ProfileData = z.infer<typeof profileSchema>;
export type User = typeof users.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type MedicationReminder = typeof medicationReminders.$inferSelect;
export type InsertMedication = z.infer<typeof medicationSchema>;
export type Caregiver = typeof caregivers.$inferSelect;
export type InsertCaregiver = z.infer<typeof caregiverSchema>;
export type UserCaregiver = typeof userCaregivers.$inferSelect;
export type InsertUserCaregiver = z.infer<typeof userCaregiverSchema>;
