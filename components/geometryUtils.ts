import * as THREE from 'three';

/**
 * Creates the cloud-like shape for the tree foliage.
 * Uses 2D shape extrusion.
 */
export const createTreeGeometry = (): THREE.ExtrudeGeometry => {
  const shape = new THREE.Shape();

  // Define the cloud shape using arcs (circles)
  // We want a shape that looks like 3 stacked blobs, getting smaller towards top
  
  // Starting point (bottom center-ish)
  shape.moveTo(0, 0);

  // Bottom tier (widest)
  // Right side
  shape.absarc(1.4, 0.5, 1.4, -Math.PI * 0.8, Math.PI * 0.1, false);
  
  // Middle tier
  // shape.bezierCurveTo(2.8, 1.5, 2.8, 3.5, 1.5, 4.0); // manual curve attempt
  // Let's use arcs for cleaner circles
  shape.absarc(1.1, 2.5, 1.3, -Math.PI * 0.3, Math.PI * 0.2, false);

  // Top tier
  shape.absarc(0, 4.2, 1.1, -Math.PI * 0.2, Math.PI * 1.2, false);

  // Mirror down left side
  // Middle tier left
  shape.absarc(-1.1, 2.5, 1.3, Math.PI * 0.8, Math.PI * 1.3, false);

  // Bottom tier left
  shape.absarc(-1.4, 0.5, 1.4, Math.PI * 0.9, Math.PI * 1.8, false);

  // Close the shape nicely at bottom
  shape.lineTo(0, -0.9);

  const extrudeSettings = {
    steps: 1,
    depth: 1.5, // Thickness of the "cookie"
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.1,
    bevelSegments: 5,
    curveSegments: 24 // smooth curves
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Center the geometry
  geometry.center();
  
  return geometry;
};

/**
 * Creates the stick/trunk geometry.
 * A simple capsule-like shape (extruded rounded rect).
 */
export const createStickGeometry = (padding: number = 0): THREE.ExtrudeGeometry => {
  const shape = new THREE.Shape();
  
  const width = 0.5 + padding;
  const height = 3.5 + padding;
  const radius = (width) / 2;

  // Draw a rounded rectangle (Capsule)
  // Start top left
  shape.moveTo(-width/2, height/2);
  shape.lineTo(width/2, height/2);
  shape.lineTo(width/2, -height/2 + radius);
  shape.absarc(0, -height/2 + radius, radius, 0, Math.PI, false); // Bottom curve
  shape.lineTo(-width/2, height/2);

  const extrudeSettings = {
    steps: 1,
    depth: 0.8,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.05,
    bevelSegments: 3
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  return geometry;
};
