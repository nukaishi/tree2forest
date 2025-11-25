import * as THREE from 'three';

/**
 * Shader material for the Gradient + Noise effect on the foliage.
 */
export const createGradientMaterial = (minY: number, height: number): THREE.ShaderMaterial => {
  // Top Color: Light Green #96E258 (approx) -> vec3(0.588, 0.886, 0.345)
  // Bottom Color: Teal Green #22A486 (approx) -> vec3(0.133, 0.643, 0.525)
  
  const vertexShader = `
    varying vec3 vPos;
    varying vec2 vUv;
    void main() {
      vPos = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 colorTop;
    uniform vec3 colorBottom;
    uniform float minY;
    uniform float height;
    
    varying vec3 vPos;
    varying vec2 vUv;

    // Simple pseudo-random noise function
    float random(vec2 uv) {
      return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      // Normalize height for gradient (0.0 at bottom, 1.0 at top)
      // We use vPos.y (world space y relative to mesh center)
      // Adjust these offsets based on the geometry centering
      float t = smoothstep(-2.5, 2.5, vPos.y); 

      // Mix colors
      vec3 finalColor = mix(colorBottom, colorTop, t);

      // Add noise
      // We use screen coordinates or UVs for noise. 
      // Using vPos * scale ensures noise stays stuck to object.
      float noise = (random(vPos.xy * 20.0) - 0.5) * 0.15;
      
      // Add a subtle "grain" brightness variation
      finalColor += noise;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      colorTop: { value: new THREE.Color('#96E258') },
      colorBottom: { value: new THREE.Color('#22A486') },
      minY: { value: minY },
      height: { value: height },
    },
    vertexShader,
    fragmentShader,
  });

  return material;
};

/**
 * Material for the Stick (Wood with grain).
 */
export const createStickMaterial = (): THREE.ShaderMaterial => {
  // Stick Color: #C29B7F
  
  const vertexShader = `
    varying vec3 vPos;
    void main() {
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 color;
    varying vec3 vPos;

    float random(vec2 uv) {
      return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      float noise = (random(vPos.xy * 50.0) - 0.5) * 0.2;
      gl_FragColor = vec4(color + noise, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color('#D6B698') }, // Light wood
    },
    vertexShader,
    fragmentShader,
  });
};

/**
 * Solid black material for the cartoon outline.
 */
export const createOutlineMaterial = (): THREE.MeshBasicMaterial => {
  return new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide, // Inverted hull method works best with perspective, but for ortho we scale and place behind
  });
};

/**
 * Creates a seamless texture with a staggered dot pattern.
 * Pattern: Grey dots on white background.
 */
export const createDotGridTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  const size = 64; // Power of 2 for better mipmaps
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background - White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Dots - Light Grey
  ctx.fillStyle = '#cbd5e1'; // Equivalent to Tailwind gray-300
  const radius = 3.5;

  const drawDot = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Create a staggered grid pattern (hexagonal packing look)
  // Row 1
  drawDot(16, 16);
  drawDot(48, 16);

  // Row 2 (Shifted)
  // We draw at 0 and 64 for seamless tiling on the edges
  drawDot(0, 48);
  drawDot(32, 48);
  drawDot(64, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return texture;
};