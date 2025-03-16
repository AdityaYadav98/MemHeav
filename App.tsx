import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ProfileSetup from "@/pages/profile-setup";
import SuccessPage from "@/pages/success-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "./lib/protected-route";

// Import the medication pages
import MedicationsPage from "@/pages/medications-page";
import MedicationDetailPage from "@/pages/medication-detail-page";
import AddMedicationPage from "@/pages/add-medication-page";
import EditMedicationPage from "@/pages/edit-medication-page";

// Import the caregiver pages
import CaregiversPage from "@/pages/caregivers-page";
import AddCaregiverPage from "@/pages/add-caregiver-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/medications" component={MedicationsPage} />
      <ProtectedRoute path="/medications/add" component={AddMedicationPage} />
      <ProtectedRoute path="/medications/:id" component={MedicationDetailPage} />
      <ProtectedRoute path="/medications/:id/edit" component={EditMedicationPage} />
      <ProtectedRoute path="/caregivers" component={CaregiversPage} />
      <ProtectedRoute path="/caregivers/add" component={AddCaregiverPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/profile-setup" component={ProfileSetup} />
      <Route path="/success" component={SuccessPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
