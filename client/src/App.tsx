import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import NetWorthCalculator from "@/pages/NetWorthCalculator";
import Methodology from "@/pages/Methodology";
import { LandingPage } from "@/components/LandingPage";
import { DisclaimerModal } from "@/components/DisclaimerModal";

const ONBOARDED_KEY = "nw_tracker_onboarded";

function AppContent() {
  const [showLanding, setShowLanding] = useState(() => {
    return !localStorage.getItem(ONBOARDED_KEY);
  });

  const handleGetStarted = () => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    setShowLanding(false);
  };

  const handleLoadDemo = () => {
    // Pre-populate with realistic demo data (P1-4: Demo Mode)
    const demoProfile = {
      age: 32,
      occupation: "software_engineer",
      level: "senior",
      metro: "san_francisco",
      totalCompensation: 220000,
      targetAllocation: {
        cashPercent: 0.10,
        investmentPercent: 0.85,
        otherPercent: 0.05,
      },
      monthlyExpenses: 5500,
      targetRetirementAge: 55,
      targetRetirementSpending: 6000,
    };

    const demoEntries = [
      { date: "2020-01-01", totalNetWorth: 80000, cash: 15000, investment: 65000 },
      { date: "2021-01-01", totalNetWorth: 150000, cash: 20000, investment: 130000 },
      { date: "2022-01-01", totalNetWorth: 250000, cash: 25000, investment: 225000 },
      { date: "2023-01-01", totalNetWorth: 380000, cash: 30000, investment: 350000 },
      { date: "2024-01-01", totalNetWorth: 550000, cash: 40000, investment: 510000 },
      { date: "2025-01-01", totalNetWorth: 750000, cash: 50000, investment: 700000 },
    ];

    // Store demo data
    localStorage.setItem("user-profile", JSON.stringify(demoProfile));
    localStorage.setItem("net-worth-entries", JSON.stringify(demoEntries));
    localStorage.setItem("nw_tracker_demo_mode", "true"); // Flag for demo mode

    // Proceed to app
    handleGetStarted();
  };

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} onLoadDemo={handleLoadDemo} />;
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <DisclaimerModal />
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
