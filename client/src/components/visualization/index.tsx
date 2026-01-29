import { lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Box } from "lucide-react";
import { ThreeSceneLoader } from "./ThreeScene";

// Lazy load the 3D component for better initial load performance
const WealthGlidepath3DLazy = lazy(() =>
  import("./WealthGlidepath3D").then((module) => ({
    default: module.WealthGlidepath3D,
  }))
);

interface WealthGlidepath3DProps {
  historicalData: Array<{ age: number; netWorth: number }>;
  monteCarloData?: {
    percentile5: number[];
    percentile25: number[];
    percentile50: number[];
    percentile75: number[];
    percentile95: number[];
    ages: number[];
  };
  profileProjection?: Array<{ age: number; netWorth: number }>;
  fireThresholds?: Array<{ name: string; amount: number; color: string }>;
}

/**
 * Performance-optimized 3D Wealth Glidepath with lazy loading
 *
 * Features:
 * - Code splitting: Three.js bundle only loads when component is used
 * - Suspense boundary: Shows loading state while 3D assets load
 * - WebGL detection: Falls back to 2D if WebGL is unavailable
 * - Adaptive rendering: Adjusts quality based on device performance
 */
export function WealthGlidepath3D(props: WealthGlidepath3DProps) {
  return (
    <Suspense
      fallback={
        <Card className="terminal-card">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Box className="h-5 w-5" />
              3D Wealth Glidepath
            </CardTitle>
            <CardDescription>
              Interactive Bloomberg-terminal-inspired visualization of your wealth trajectory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px]">
              <ThreeSceneLoader />
            </div>
          </CardContent>
        </Card>
      }
    >
      <WealthGlidepath3DLazy {...props} />
    </Suspense>
  );
}

// Re-export other components
export { ThreeScene, ThreeSceneLoader, WebGLNotSupported } from "./ThreeScene";
