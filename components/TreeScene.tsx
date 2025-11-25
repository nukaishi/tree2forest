
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createTreeGeometry, createStickGeometry } from './geometryUtils';
import { createGradientMaterial, createOutlineMaterial, createStickMaterial, createDotGridTexture } from './materialUtils';

interface TreeSceneProps {
  treeCount: number;
}

export const TreeScene: React.FC<TreeSceneProps> = ({ treeCount }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const treeGroupRef = useRef<THREE.Group | null>(null);
  
  // Store reusable assets to prevent memory leaks and improve perf
  const assetsRef = useRef<{
    stickGeometry: THREE.BufferGeometry;
    stickOutlineGeometry: THREE.BufferGeometry;
    foliageGeometry: THREE.BufferGeometry;
    floorGeometry: THREE.BufferGeometry;
    stickMaterial: THREE.Material;
    stickOutlineMaterial: THREE.Material;
    foliageMaterial: THREE.Material;
    outlineMaterial: THREE.Material;
    floorBaseMaterial: THREE.Material;
    floorShadowMaterial: THREE.Material;
  } | null>(null);

  // Initialize Scene
  useEffect(() => {
    if (!mountRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    // --- Lighting ---
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light for shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    
    // Adjust shadow camera to cover the whole scene
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Use Orthographic camera for that "flat" vector look
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 20; 
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      1,
      1000
    );
    
    // Isometric View Position
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Enable shadow map for better depth perception
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.minZoom = 0.5;
    controls.maxZoom = 2;

    // --- Group to hold the trees ---
    const treeGroup = new THREE.Group();
    scene.add(treeGroup);
    treeGroupRef.current = treeGroup;

    // --- Asset Creation (Once) ---
    const stickGeometry = createStickGeometry();
    const stickOutlineGeo = createStickGeometry(0.08); // Slightly larger
    const foliageGeometry = createTreeGeometry();
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000); // Massive floor
    
    // Compute bounding box for shader
    foliageGeometry.computeBoundingBox();
    const box = foliageGeometry.boundingBox!;
    const height = box.max.y - box.min.y;
    const minY = box.min.y;

    // Create Floor Texture
    const floorTexture = createDotGridTexture();
    floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    // Repeat texture extensively
    floorTexture.repeat.set(250, 250);

    assetsRef.current = {
      stickGeometry,
      stickOutlineGeometry: stickOutlineGeo,
      foliageGeometry,
      floorGeometry,
      stickMaterial: createStickMaterial(),
      stickOutlineMaterial: createOutlineMaterial(),
      foliageMaterial: createGradientMaterial(minY, height),
      outlineMaterial: createOutlineMaterial(),
      // Use BasicMaterial for the pattern to ensure it stays pure white (unlit)
      floorBaseMaterial: new THREE.MeshBasicMaterial({ 
        map: floorTexture,
        color: 0xffffff 
      }),
      // Use ShadowMaterial for a transparent layer that only captures shadows
      floorShadowMaterial: new THREE.ShadowMaterial({ 
        opacity: 0.08, 
        color: 0x000000 
      }),
    };

    // --- Animation Loop ---
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      const aspect = window.innerWidth / window.innerHeight;
      
      camera.left = -frustumSize * aspect / 2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose resources
      stickGeometry.dispose();
      stickOutlineGeo.dispose();
      foliageGeometry.dispose();
      floorGeometry.dispose();
      assetsRef.current?.stickMaterial.dispose();
      assetsRef.current?.stickOutlineMaterial.dispose();
      assetsRef.current?.foliageMaterial.dispose();
      assetsRef.current?.outlineMaterial.dispose();
      assetsRef.current?.floorBaseMaterial.dispose();
      assetsRef.current?.floorShadowMaterial.dispose();
      floorTexture.dispose();
      renderer.dispose();
    };
  }, []);

  // Update Trees when count changes
  useEffect(() => {
    if (!treeGroupRef.current || !assetsRef.current) return;

    const group = treeGroupRef.current;
    const assets = assetsRef.current;

    // Clear existing
    while(group.children.length > 0){ 
      group.remove(group.children[0]); 
    }

    // Constants for vertical positioning
    const TREE_BASE_Y = -3.25; // Where the tree trunk ends
    const FLOOR_Y = TREE_BASE_Y; // Surface of the dotted floor

    // --- Add Floor Layers ---
    
    // 1. Base Pattern (Pure White, Unlit)
    const floorBase = new THREE.Mesh(assets.floorGeometry, assets.floorBaseMaterial);
    floorBase.rotation.x = -Math.PI / 2;
    floorBase.position.y = FLOOR_Y;
    floorBase.receiveShadow = false;
    group.add(floorBase);

    // 2. Shadow Overlay (Transparent, Receives Shadow)
    const floorShadow = new THREE.Mesh(assets.floorGeometry, assets.floorShadowMaterial);
    floorShadow.rotation.x = -Math.PI / 2;
    // Slightly offset vertically to prevent z-fighting
    floorShadow.position.y = FLOOR_Y + 0.02; 
    floorShadow.receiveShadow = true;
    group.add(floorShadow);

    // --- Layout Calculation: Row-Centered Grid ---
    // This naturally creates triangles for odd numbers (like 3) and squares for even squares (like 4).
    const spacingX = 5.0;
    const spacingZ = 5.0;
    
    const cols = Math.ceil(Math.sqrt(treeCount));
    const rows = Math.ceil(treeCount / cols);
    
    const positions: {x: number, z: number}[] = [];
    
    let treesProcessed = 0;
    
    // Iterate row by row (from back to front in Z)
    for (let r = 0; r < rows; r++) {
      // How many trees in this specific row?
      const remaining = treeCount - treesProcessed;
      const treesInRow = Math.min(cols, remaining);
      
      // Calculate total width of this row to center it
      const rowWidth = (treesInRow - 1) * spacingX;
      const startX = -rowWidth / 2;
      
      for (let c = 0; c < treesInRow; c++) {
        positions.push({
          x: startX + c * spacingX,
          z: r * spacingZ
        });
      }
      
      treesProcessed += treesInRow;
    }

    // Center the entire group in Z
    // Z positions currently go from 0 to (rows-1)*spacingZ
    const totalDepth = (rows - 1) * spacingZ;
    const zOffset = totalDepth / 2;
    
    // Adjust Z positions to center around (0,0,0)
    positions.forEach(p => {
      p.z -= zOffset;
    });

    // --- Add Trees ---
    positions.forEach((pos) => {
      const tree = new THREE.Group();
      
      // Center the tree position
      tree.position.set(pos.x, 0, pos.z);
      tree.scale.setScalar(1);

      // --- 1. Stick ---
      const stickMesh = new THREE.Mesh(assets.stickGeometry, assets.stickMaterial);
      stickMesh.position.y = -1.5;
      stickMesh.position.z = -0.1;
      stickMesh.castShadow = true;
      stickMesh.receiveShadow = true;
      tree.add(stickMesh);

      // Stick Outline
      const stickOutline = new THREE.Mesh(assets.stickOutlineGeometry, assets.stickOutlineMaterial);
      stickOutline.position.copy(stickMesh.position);
      stickOutline.scale.z = 1.05; 
      tree.add(stickOutline);

      // --- 2. Foliage ---
      const foliageMesh = new THREE.Mesh(assets.foliageGeometry, assets.foliageMaterial);
      foliageMesh.position.y = 1.0;
      foliageMesh.castShadow = true;
      foliageMesh.receiveShadow = true;
      tree.add(foliageMesh);

      // Foliage Outline
      const foliageOutline = new THREE.Mesh(assets.foliageGeometry, assets.outlineMaterial);
      foliageOutline.position.copy(foliageMesh.position);
      foliageOutline.scale.multiplyScalar(1.05);
      tree.add(foliageOutline);

      group.add(tree);
    });
  }, [treeCount]);

  return <div ref={mountRef} className="w-full h-full outline-none" />;
};
