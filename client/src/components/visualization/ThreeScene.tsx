import { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Camera, Download, RotateCcw, Eye, EyeOff } from "lucide-react";
import * as THREE from "three";

interface ThreeSceneProps {
  children: React.ReactNode;
  onScreenshot?: () => void;
  showControls?: boolean;
}

export function ThreeScene({ children, onScreenshot, showControls = true }: ThreeSceneProps) {
  const controlsRef = useRef<any>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [8, 8, 8], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]} // Adaptive pixel ratio for performance
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.4} />

        {/* Camera Controls */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          panSpeed={0.5}
          minDistance={5}
          maxDistance={30}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
        />

        {/* Scene content */}
        {children}
      </Canvas>

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetCamera}
            className="bg-background/80 backdrop-blur-sm"
            title="Reset Camera"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
            className="bg-background/80 backdrop-blur-sm"
            title={autoRotate ? "Stop Auto-Rotate" : "Auto-Rotate"}
          >
            {autoRotate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>

          {onScreenshot && (
            <Button
              variant="outline"
              size="sm"
              onClick={onScreenshot}
              className="bg-background/80 backdrop-blur-sm"
              title="Take Screenshot"
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Instructions */}
      {showControls && (
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg text-xs text-muted-foreground max-w-xs">
          <p className="font-semibold text-foreground mb-1">Controls:</p>
          <ul className="space-y-0.5">
            <li>• Drag to rotate</li>
            <li>• Scroll to zoom</li>
            <li>• Right-click to pan</li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Loading placeholder component
 */
export function ThreeSceneLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading 3D visualization...</p>
      </div>
    </div>
  );
}

/**
 * WebGL not supported fallback
 */
export function WebGLNotSupported() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background border border-border rounded-lg p-6">
      <div className="text-center space-y-3 max-w-md">
        <div className="text-destructive text-4xl">⚠️</div>
        <h3 className="text-lg font-semibold text-foreground">3D Visualization Unavailable</h3>
        <p className="text-sm text-muted-foreground">
          Your browser doesn't support WebGL, which is required for 3D visualization.
          Please try using a modern browser like Chrome, Firefox, or Edge.
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          All other features of the app will continue to work normally.
        </p>
      </div>
    </div>
  );
}
