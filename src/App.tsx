import { useEffect } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CardanoWalletProvider } from "@/contexts/WeldContext";
import { TutorialProvider } from "@/components/tutorial/TutorialProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { CookieBanner } from "@/components/CookieBanner";
import { sessionLogger } from "@/lib/session-logger";
import { convex, clerkPublishableKey } from "@/lib/convex";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectSettings from "./pages/ProjectSettings";
import Profile from "./pages/Profile";
import Credits from "./pages/Credits";
import TermsOfService from "./pages/TermsOfService";
import Collection from "./pages/Collection";
import Marketplace from "./pages/Marketplace";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Documentation from "./pages/Documentation";
import Status from "./pages/Status";
import Tutorial from "./pages/Tutorial";
import ArtFund from "./pages/ArtFund";

const queryClient = new QueryClient();

// Track navigation for bug reports
function NavigationTracker() {
  const location = useLocation();
  
  useEffect(() => {
    sessionLogger.addAction('navigation', location.pathname);
  }, [location.pathname]);
  
  return null;
}

// Inner app content with all routes
function AppContent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <LanguageProvider>
          <CardanoWalletProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <NavigationTracker />
                <AuthProvider>
                  <TutorialProvider>
                    <MaintenanceGuard>
                      <Routes>
                        <Route path="/status" element={<Status />} />
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <Profile />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/credits"
                          element={
                            <ProtectedRoute>
                              <Credits />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/project/new"
                          element={
                            <ProtectedRoute>
                              <NewProject />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/project/:id"
                          element={
                            <ProtectedRoute>
                              <ProjectDetail />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/project/:id/settings"
                          element={
                            <ProtectedRoute>
                              <ProjectSettings />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/collection/:projectId" element={<Collection />} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/documentation" element={<Documentation />} />
                        <Route path="/creators" element={<Tutorial />} />
                        <Route path="/artfund" element={<ArtFund />} />
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute>
                              <Admin />
                            </ProtectedRoute>
                          }
                        />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </MaintenanceGuard>
                    <CookieBanner />
                  </TutorialProvider>
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </CardanoWalletProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Wrapper with Convex + Clerk auth when Clerk is configured
function ConvexClerkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey!}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

// Simple Convex wrapper for development without Clerk
function ConvexOnlyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}

const App = () => {
  const hasClerk = Boolean(clerkPublishableKey);

  return (
    <HelmetProvider>
      {hasClerk ? (
        <ConvexClerkWrapper>
          <AppContent />
        </ConvexClerkWrapper>
      ) : (
        <ConvexOnlyWrapper>
          <AppContent />
        </ConvexOnlyWrapper>
      )}
    </HelmetProvider>
  );
};

export default App;
