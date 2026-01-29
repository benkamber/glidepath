import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import NetWorthCalculator from "@/pages/NetWorthCalculator";
import Methodology from "@/pages/Methodology";
import { LandingPage } from "@/components/LandingPage";

const ONBOARDED_KEY = "nw_tracker_onboarded";

function AppContent() {
  const [showLanding, setShowLanding] = useState(() => {
    return !localStorage.getItem(ONBOARDED_KEY);
  });

  const handleGetStarted = () => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <>
      <Switch>
        <Route path="/" component={NetWorthCalculator} />
        <Route path="/methodology" component={Methodology} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
