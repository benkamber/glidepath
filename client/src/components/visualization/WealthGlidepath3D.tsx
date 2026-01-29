import { useMemo, useState, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Box, Info } from "lucide-react";
import * as THREE from "three";
import {
  ageToX,
  netWorthToY,
  percentileToZ,
  createLine,
  createPlane,
  createConfidenceSurface,
  createGrid,
  createTextSprite,
  formatNetWorth,
  isWebGLAvailable,
} from "@/lib/three-helpers";
import { ThreeScene, ThreeSceneLoader, WebGLNotSupported } from "./ThreeScene";

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

// Bloomberg Terminal Colors
const COLORS = {
  background: "#000000",
  historical: "#ff8c00", // Orange
  projection: "#10b981", // Green
  monteCarlo: "#6366f1", // Indigo
  grid: "#333333",
  text: "#ffffff",
  fire: {
    lean: "#fbbf24", // Yellow
    regular: "#10b981", // Green
    chubby: "#6366f1", // Indigo
    fat: "#f59e0b", // Amber
  },
};

function WealthGlidepath3DContent({
  historicalData,
  monteCarloData,
  profileProjection,
  fireThresholds,
}: WealthGlidepath3DProps) {
  const [showHistorical, setShowHistorical] = useState(true);
  const [showMonteCarlo, setShowMonteCarlo] = useState(true);
  const [showProjection, setShowProjection] = useState(true);
  const [showFIREPlanes, setShowFIREPlanes] = useState(true);

  // Calculate bounds for coordinate mapping
  const { minAge, maxAge, minNetWorth, maxNetWorth } = useMemo(() => {
    const allAges = [
      ...historicalData.map((d) => d.age),
      ...(monteCarloData?.ages || []),
      ...(profileProjection?.map((d) => d.age) || []),
    ];

    const allNetWorths = [
      ...historicalData.map((d) => d.netWorth),
      ...(monteCarloData?.percentile95 || []),
      ...(profileProjection?.map((d) => d.netWorth) || []),
      ...(fireThresholds?.map((t) => t.amount) || []),
    ];

    return {
      minAge: Math.min(...allAges),
      maxAge: Math.max(...allAges),
      minNetWorth: Math.max(1, Math.min(...allNetWorths)),
      maxNetWorth: Math.max(...allNetWorths),
    };
  }, [historicalData, monteCarloData, profileProjection, fireThresholds]);

  // Create 3D elements
  const sceneElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    // Historical trajectory line
    if (showHistorical && historicalData.length > 0) {
      const points = historicalData.map((d) => {
        return new THREE.Vector3(
          ageToX(d.age, minAge, maxAge),
          netWorthToY(d.netWorth, minNetWorth, maxNetWorth),
          0
        );
      });

      elements.push(
        <primitive
          key="historical-line"
          object={createLine(points, COLORS.historical, 3)}
        />
      );

      // Add spheres at each data point
      historicalData.forEach((d, i) => {
        elements.push(
          <mesh
            key={`historical-point-${i}`}
            position={[
              ageToX(d.age, minAge, maxAge),
              netWorthToY(d.netWorth, minNetWorth, maxNetWorth),
              0,
            ]}
          >
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={COLORS.historical} />
          </mesh>
        );
      });
    }

    // Monte Carlo confidence bands
    if (showMonteCarlo && monteCarloData) {
      const bands = [
        { lower: monteCarloData.percentile5, upper: monteCarloData.percentile95, opacity: 0.1 },
        { lower: monteCarloData.percentile25, upper: monteCarloData.percentile75, opacity: 0.15 },
      ];

      bands.forEach((band, bandIndex) => {
        const lowerPoints = band.lower.map((nw, i) => {
          const age = monteCarloData.ages[i];
          return new THREE.Vector3(
            ageToX(age, minAge, maxAge),
            netWorthToY(nw, minNetWorth, maxNetWorth),
            0
          );
        });

        const upperPoints = band.upper.map((nw, i) => {
          const age = monteCarloData.ages[i];
          return new THREE.Vector3(
            ageToX(age, minAge, maxAge),
            netWorthToY(nw, minNetWorth, maxNetWorth),
            0
          );
        });

        elements.push(
          <primitive
            key={`mc-band-${bandIndex}`}
            object={createConfidenceSurface(
              lowerPoints,
              upperPoints,
              COLORS.monteCarlo,
              band.opacity
            )}
          />
        );
      });

      // Median line
      const medianPoints = monteCarloData.percentile50.map((nw, i) => {
        const age = monteCarloData.ages[i];
        return new THREE.Vector3(
          ageToX(age, minAge, maxAge),
          netWorthToY(nw, minNetWorth, maxNetWorth),
          0
        );
      });

      elements.push(
        <primitive
          key="mc-median"
          object={createLine(medianPoints, COLORS.monteCarlo, 2)}
        />
      );
    }

    // Profile projection (dashed green line)
    if (showProjection && profileProjection && profileProjection.length > 0) {
      const points = profileProjection.map((d) => {
        return new THREE.Vector3(
          ageToX(d.age, minAge, maxAge),
          netWorthToY(d.netWorth, minNetWorth, maxNetWorth),
          0
        );
      });

      elements.push(
        <primitive
          key="projection-line"
          object={createLine(points, COLORS.projection, 2, true)}
        />
      );
    }

    // FIRE threshold planes
    if (showFIREPlanes && fireThresholds) {
      fireThresholds.forEach((threshold, i) => {
        const yPos = netWorthToY(threshold.amount, minNetWorth, maxNetWorth);

        elements.push(
          <primitive
            key={`fire-plane-${i}`}
            object={createPlane(yPos, 12, threshold.color, 0.15)}
          />
        );

        // Add label
        elements.push(
          <primitive
            key={`fire-label-${i}`}
            object={createTextSprite(
              `${threshold.name} - ${formatNetWorth(threshold.amount)}`,
              new THREE.Vector3(-6, yPos + 0.3, 0),
              threshold.color,
              24
            )}
          />
        );
      });
    }

    return elements;
  }, [
    historicalData,
    monteCarloData,
    profileProjection,
    fireThresholds,
    minAge,
    maxAge,
    minNetWorth,
    maxNetWorth,
    showHistorical,
    showMonteCarlo,
    showProjection,
    showFIREPlanes,
  ]);

  // Grid
  const grid = useMemo(() => {
    return <primitive object={createGrid(20, 20, COLORS.grid)} />;
  }, []);

  return (
    <div className="space-y-4">
      {/* Layer Toggles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <Label htmlFor="toggle-historical" className="text-xs">
            Historical
          </Label>
          <Switch
            id="toggle-historical"
            checked={showHistorical}
            onCheckedChange={setShowHistorical}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <Label htmlFor="toggle-monte-carlo" className="text-xs">
            Monte Carlo
          </Label>
          <Switch
            id="toggle-monte-carlo"
            checked={showMonteCarlo}
            onCheckedChange={setShowMonteCarlo}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <Label htmlFor="toggle-projection" className="text-xs">
            Projection
          </Label>
          <Switch
            id="toggle-projection"
            checked={showProjection}
            onCheckedChange={setShowProjection}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <Label htmlFor="toggle-fire" className="text-xs">
            FIRE Planes
          </Label>
          <Switch
            id="toggle-fire"
            checked={showFIREPlanes}
            onCheckedChange={setShowFIREPlanes}
          />
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="w-full h-[600px] bg-black rounded-lg border border-border overflow-hidden">
        <ThreeScene showControls>
          {grid}
          {sceneElements}
        </ThreeScene>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded">
          <div className="w-4 h-0.5" style={{ backgroundColor: COLORS.historical }} />
          <span className="text-muted-foreground">Historical Data</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded">
          <div className="w-4 h-0.5" style={{ backgroundColor: COLORS.monteCarlo }} />
          <span className="text-muted-foreground">Monte Carlo Bands</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded">
          <div
            className="w-4 h-0.5 border-t-2 border-dashed"
            style={{ borderColor: COLORS.projection }}
          />
          <span className="text-muted-foreground">Career Projection</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded">
          <div className="w-4 h-4 bg-primary/20 border border-primary" />
          <span className="text-muted-foreground">FIRE Thresholds</span>
        </div>
      </div>

      {/* Info */}
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Axes:</strong> X = Age (years) | Y = Net Worth (logarithmic) | Z = Confidence
          percentile (5th-95th)
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function WealthGlidepath3D(props: WealthGlidepath3DProps) {
  const [webGLSupported] = useState(() => isWebGLAvailable());

  if (!webGLSupported) {
    return (
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Box className="h-5 w-5" />
            3D Wealth Glidepath
          </CardTitle>
          <CardDescription>Interactive 3D visualization of your wealth trajectory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <WebGLNotSupported />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
        <Suspense fallback={<ThreeSceneLoader />}>
          <WealthGlidepath3DContent {...props} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
