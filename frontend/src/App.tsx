import React, { useEffect, useState } from "react";
import { ClerkProvider, SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import { hiIN, enUS } from "@clerk/localizations";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConvexProviderWrapper } from "@/components/ConvexProvider";
import { UserProfileProvider } from "@/components/UserProfileProvider";
import { TopNavigation } from "@/components/navigation/TopNavigation";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { AIAssistant } from "@/components/ai/AIAssistant";
import LanguageLanding from "@/components/LanguageLanding";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import Index from "@/pages/index";
import ClinicalDocs from "./pages/ClinicalDocs";
import Symptomate from "./pages/Symptomate";
import Medicine from "./pages/Medicine";
import Cart from "./pages/Cart";
import Reminders from "./pages/Reminders";
import LabTests from "./pages/LabTests";
import Doctors from "./pages/Doctors";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Get your publishable key from env vars
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_demo_key_for_development';

// Check if Clerk is properly configured
if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY === 'pk_test_demo_key_for_development') {
  console.warn("VITE_CLERK_PUBLISHABLE_KEY is not set. Using demo mode for development.");
}

const AppContent = () => {
  const { language } = useLanguage();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  const isOffline =
    typeof navigator !== "undefined" && navigator && !navigator.onLine;

  // Offline mode: bypass Clerk entirely and show a stripped-down, read-only shell
  if (isOffline) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
            <div className="max-w-lg w-full text-center space-y-4">
              <h1 className="text-2xl font-semibold">
                SehatBeat (Offline Mode)
              </h1>
              <p className="text-sm text-muted-foreground">
                You&apos;re currently offline. The app is in a stripped-down,
                read-only mode with only the AI assistant available.
              </p>
            </div>
            <AIAssistant />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // If Clerk is not configured, render without authentication
  if (!PUBLISHABLE_KEY) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen w-full bg-background flex flex-col">
              <TopNavigation />
              <main className="w-full flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/clinical-docs" element={<ClinicalDocs />} />
                  <Route path="/sehatbeat-ai" element={<Symptomate />} />
                  <Route path="/medicine" element={<Medicine />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/reminders" element={<Reminders />} />
                  <Route path="/lab-tests" element={<LabTests />} />
                  <Route path="/doctors" element={<Doctors />} />
                  {/* Legacy route redirect */}
                  <Route path="/symptomate" element={<Symptomate />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <BottomNavigation />
              <AIAssistant />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Render with Clerk authentication and Convex
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      localization={language === 'hi' ? hiIN : enUS}
    >
      <ConvexProviderWrapper>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <UserProfileProvider>
                <div className="min-h-screen w-full bg-background flex flex-col">
                  {/* Only show navigation if authenticated */}
                  <SignedIn>
                    <TopNavigation />
                  </SignedIn>
                  
                  <main className="w-full flex-1 flex flex-col">
                    <SignedOut>
                      <div className="flex-1 flex flex-col min-h-[80vh] items-center justify-center p-4 w-full">
                        <SignIn routing="hash" />
                      </div>
                    </SignedOut>
                    <SignedIn>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/clinical-docs" element={<ClinicalDocs />} />
                        <Route path="/sehatbeat-ai" element={<Symptomate />} />
                        <Route path="/medicine" element={<Medicine />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/reminders" element={<Reminders />} />
                        <Route path="/lab-tests" element={<LabTests />} />
                        <Route path="/doctors" element={<Doctors />} />
                        {/* Legacy route redirect */}
                        <Route path="/symptomate" element={<Symptomate />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </SignedIn>
                  </main>
                  
                  <SignedIn>
                    <BottomNavigation />
                    <AIAssistant />
                  </SignedIn>
                </div>
              </UserProfileProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ConvexProviderWrapper>
    </ClerkProvider>
  );
};

const App = () => {
  return (
    <LanguageProvider>
      <LanguageLanding />
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
