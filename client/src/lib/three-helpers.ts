import * as THREE from "three";

/**
 * Convert age to X coordinate
 */
export function ageToX(age: number, minAge: number, maxAge: number, scale: number = 10): number {
  return ((age - minAge) / (maxAge - minAge)) * scale - scale / 2;
}

/**
 * Convert net worth to Y coordinate (logarithmic scale)
 */
export function netWorthToY(
  netWorth: number,
  minNetWorth: number,
  maxNetWorth: number,
  scale: number = 10
): number {
  // Use logarithmic scale for better visualization of exponential growth
  const logMin = Math.log10(Math.max(1, minNetWorth));
  const logMax = Math.log10(Math.max(1, maxNetWorth));
  const logValue = Math.log10(Math.max(1, netWorth));

  return ((logValue - logMin) / (logMax - logMin)) * scale - scale / 2;
}

/**
 * Convert percentile to Z coordinate
 */
export function percentileToZ(percentile: number, scale: number = 5): number {
  // Percentile ranges from 5 to 95
  return ((percentile - 50) / 45) * scale;
}

/**
 * Create a line from points
 */
export function createLine(
  points: THREE.Vector3[],
  color: number | string,
  lineWidth: number = 2,
  dashed: boolean = false
): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: typeof color === "string" ? new THREE.Color(color) : color,
    linewidth: lineWidth,
    ...(dashed && { linecap: "round", linejoin: "round" }),
  });

  const line = new THREE.Line(geometry, material);

  if (dashed) {
    const dashedMaterial = new THREE.LineDashedMaterial({
      color: typeof color === "string" ? new THREE.Color(color) : color,
      linewidth: lineWidth,
      dashSize: 0.3,
      gapSize: 0.2,
    });
    line.material = dashedMaterial;
    line.computeLineDistances();
  }

  return line;
}

/**
 * Create a plane (for FIRE thresholds)
 */
export function createPlane(
  yPosition: number,
  size: number,
  color: number | string,
  opacity: number = 0.3
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshBasicMaterial({
    color: typeof color === "string" ? new THREE.Color(color) : color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
  });

  const plane = new THREE.Mesh(geometry, material);
  plane.position.y = yPosition;
  plane.rotation.x = Math.PI / 2;

  return plane;
}

/**
 * Create a confidence band surface
 */
export function createConfidenceSurface(
  lowerPoints: THREE.Vector3[],
  upperPoints: THREE.Vector3[],
  color: number | string,
  opacity: number = 0.2
): THREE.Mesh {
  const vertices: number[] = [];
  const indices: number[] = [];

  // Create vertices
  for (let i = 0; i < lowerPoints.length; i++) {
    vertices.push(lowerPoints[i].x, lowerPoints[i].y, lowerPoints[i].z);
  }
  for (let i = 0; i < upperPoints.length; i++) {
    vertices.push(upperPoints[i].x, upperPoints[i].y, upperPoints[i].z);
  }

  // Create faces
  for (let i = 0; i < lowerPoints.length - 1; i++) {
    const a = i;
    const b = i + 1;
    const c = i + lowerPoints.length;
    const d = i + 1 + lowerPoints.length;

    // Two triangles per quad
    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color: typeof color === "string" ? new THREE.Color(color) : color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}

/**
 * Create grid lines
 */
export function createGrid(
  size: number,
  divisions: number,
  color: string = "#333333"
): THREE.GridHelper {
  return new THREE.GridHelper(size, divisions, color, color);
}

/**
 * Create axis labels (as sprites)
 */
export function createTextSprite(
  text: string,
  position: THREE.Vector3,
  color: string = "#ffffff",
  fontSize: number = 32
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  canvas.width = 256;
  canvas.height = 128;

  context.fillStyle = color;
  context.font = `${fontSize}px "JetBrains Mono", monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);

  sprite.position.copy(position);
  sprite.scale.set(2, 1, 1);

  return sprite;
}

/**
 * Format net worth for display
 */
export function formatNetWorth(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`;
  } else {
    return `$${Math.round(value)}`;
  }
}

/**
 * Check if WebGL is available
 */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

/**
 * Create camera with optimal positioning
 */
export function createCamera(aspect: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.set(8, 8, 8);
  camera.lookAt(0, 0, 0);
  return camera;
}

/**
 * Create scene with Bloomberg terminal styling
 */
export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000); // Pure black

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  return scene;
}

/**
 * Animate camera rotation
 */
export function animateCamera(
  camera: THREE.Camera,
  target: THREE.Vector3,
  duration: number = 1000
): void {
  // Smooth camera animation (could be enhanced with GSAP or similar)
  const startPosition = camera.position.clone();
  const endPosition = new THREE.Vector3(8, 8, 8);

  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);

    camera.position.lerpVectors(startPosition, endPosition, eased);
    camera.lookAt(target);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}
