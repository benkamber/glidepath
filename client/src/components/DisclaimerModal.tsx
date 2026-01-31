import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const DISCLAIMER_KEY = "legal_accepted"; // P1-3: Liability Shield

export function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false);

  useEffect(() => {
    // Check if user has already accepted
    const hasAccepted = localStorage.getItem(DISCLAIMER_KEY);
    if (!hasAccepted || hasAccepted !== "true") {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    if (!hasReadDisclaimer) {
      return; // Require checkbox
    }
    localStorage.setItem(DISCLAIMER_KEY, "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            Important: Educational Use Only
          </DialogTitle>
          <DialogDescription className="text-base text-foreground mt-4 space-y-4">
            <p className="font-semibold text-lg">
              ⚠️ This tool is NOT financial advice
            </p>

            <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
              <p>
                <strong>Glidepath</strong> is a financial simulation tool for educational purposes only.
                It uses historical averages and user-provided inputs to model potential wealth trajectories.
              </p>

              <p className="text-yellow-600 dark:text-yellow-500 font-medium">
                ⚠️ Future market returns are unpredictable. Past performance does not guarantee future results.
              </p>

              <p>This tool:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Does NOT constitute financial, investment, tax, or legal advice</li>
                <li>Should NOT be your sole basis for financial decisions</li>
                <li>Cannot account for your unique personal circumstances</li>
                <li>Uses simplified assumptions that may not reflect reality</li>
                <li>May contain errors, bugs, or outdated data</li>
              </ul>

              <p className="pt-2">
                <strong>You are solely responsible for your own financial decisions.</strong>
              </p>

              <p className="text-xs text-muted-foreground pt-2">
                We strongly recommend consulting with a Certified Financial Planner (CFP®) or
                qualified financial advisor before making significant financial decisions.
              </p>
            </div>

            <div className="flex items-start gap-3 pt-4">
              <Checkbox
                id="disclaimer-check"
                checked={hasReadDisclaimer}
                onCheckedChange={(checked) => setHasReadDisclaimer(checked === true)}
              />
              <label
                htmlFor="disclaimer-check"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I understand this tool is for educational purposes only and does not constitute
                financial advice. I am responsible for my own financial decisions.
              </label>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!hasReadDisclaimer}
            className="w-full sm:w-auto"
            size="lg"
          >
            Enter Glidepath
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
