import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createBrushedMetalBumpTexture,
  createStudioScreenTexture,
  detectSoftwareWebGL,
} from './threeUtils';

export const HeroSculptureCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const isSoftwareGl = detectSoftwareWebGL();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setFallbackMode(true);
      return;
    }

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 560;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a1a1a, 0.035);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 10.2);

    // Balanced warm/cool studio lighting
    const hemiLight = new THREE.HemisphereLight(0xd9d2ff, 0x2a1f16, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.4);
    keyLight.position.set(5, 7, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 22;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x8e52e8, 1.8);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    const goldAccentLight = new THREE.PointLight(0xf5b800, 3.0, 14, 2);
    goldAccentLight.position.set(2.5, 2.2, 2.5);
    scene.add(goldAccentLight);

    // Procedural textures
    const bumpTex = createBrushedMetalBumpTexture(renderer);
    const screenTex = createStudioScreenTexture(renderer, '#F5B800', 'CYBERNEST CORE');
    const windowTex = createStudioScreenTexture(renderer, '#4C138E', 'VOXLAN · SCHOLAR');

    // Materials (varied roughness & metalness >= 0.25 contrast)
    const purpleAnodizedMat = new THREE.MeshPhysicalMaterial({
      color: 0x4c138e,
      metalness: 0.78,
      roughness: 0.24,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      bumpMap: bumpTex,
      bumpScale: 0.015,
    });

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.35,
      roughness: 0.68,
    });

    const goldBrassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5b800,
      metalness: 0.92,
      roughness: 0.18,
      anisotropy: 0.7,
      bumpMap: bumpTex,
      bumpScale: 0.01,
    });

    const creamCeramicMat = new THREE.MeshStandardMaterial({
      color: 0xf2ebdd,
      metalness: 0.08,
      roughness: 0.52,
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8d5b38,
      metalness: 0.12,
      roughness: 0.74,
    });

    const screenMat = new THREE.MeshStandardMaterial({
      map: screenTex,
      emissive: new THREE.Color(0x221036),
      emissiveMap: screenTex,
      emissiveIntensity: 0.75,
      roughness: 0.22,
      metalness: 0.1,
    });

    const windowMat = new THREE.MeshStandardMaterial({
      map: windowTex,
      emissive: new THREE.Color(0x1f1430),
      emissiveMap: windowTex,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.12,
    });

    // Root hero assembly
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Central Abstract CyberNest Core Sculpture (multi-part composite)
    const coreGroup = new THREE.Group();
    rootGroup.add(coreGroup);

    const innerPrism = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0), purpleAnodizedMat);
    innerPrism.castShadow = !isSoftwareGl;
    coreGroup.add(innerPrism);

    const obsidianCage = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.22, 0),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.5,
        roughness: 0.4,
        wireframe: true,
      }),
    );
    coreGroup.add(obsidianCage);

    // Precision gold gimbal rings
    const outerGimbal = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, 0.045, 20, 72),
      goldBrassMat,
    );
    outerGimbal.rotation.x = Math.PI * 0.36;
    outerGimbal.rotation.y = Math.PI * 0.18;
    coreGroup.add(outerGimbal);

    const innerGimbal = new THREE.Mesh(
      new THREE.TorusGeometry(1.42, 0.035, 16, 64),
      creamCeramicMat,
    );
    innerGimbal.rotation.x = -Math.PI * 0.28;
    innerGimbal.rotation.z = Math.PI * 0.25;
    coreGroup.add(innerGimbal);

    // Architectural hexagonal halo ring
    const hexRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.98, 0.028, 6, 6),
      purpleAnodizedMat,
    );
    hexRing.rotation.z = Math.PI / 6;
    coreGroup.add(hexRing);

    // 2. Floating Precision Laptop Assembly (5-part composite)
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(-1.72, 0.72, 0.65);
    laptopGroup.rotation.set(0.24, 0.48, -0.1);
    laptopGroup.scale.setScalar(0.86);
    rootGroup.add(laptopGroup);

    const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.06, 0.92), obsidianMat);
    laptopGroup.add(laptopBase);

    const laptopDeck = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.02, 0.55), woodMat);
    laptopDeck.position.set(0, 0.038, -0.05);
    laptopGroup.add(laptopDeck);

    const laptopTrackpad = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.22), goldBrassMat);
    laptopTrackpad.position.set(0, 0.036, 0.3);
    laptopGroup.add(laptopTrackpad);

    const laptopLidGroup = new THREE.Group();
    laptopLidGroup.position.set(0, 0.03, -0.44);
    laptopLidGroup.rotation.x = -0.35;
    laptopGroup.add(laptopLidGroup);

    const laptopLidFrame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.88, 0.045), purpleAnodizedMat);
    laptopLidFrame.position.set(0, 0.44, 0);
    laptopLidGroup.add(laptopLidFrame);

    const laptopDisplay = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.76), screenMat);
    laptopDisplay.position.set(0, 0.44, 0.025);
    laptopLidGroup.add(laptopDisplay);

    // 3. Floating Software Interface Window (3-part composite)
    const windowGroup = new THREE.Group();
    windowGroup.position.set(1.78, 0.88, -0.15);
    windowGroup.rotation.set(-0.1, -0.45, 0.08);
    windowGroup.scale.setScalar(0.86);
    rootGroup.add(windowGroup);

    const windowChassis = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.05), obsidianMat);
    windowGroup.add(windowChassis);

    const windowTrim = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.05, 0.07), goldBrassMat);
    windowTrim.position.set(0, 0.51, 0);
    windowGroup.add(windowTrim);

    const windowFace = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.88), windowMat);
    windowFace.position.set(0, 0, 0.028);
    windowGroup.add(windowFace);

    // 4. Floating Code & AI Terminal Module (4-part composite)
    const codeNodeGroup = new THREE.Group();
    codeNodeGroup.position.set(1.42, -1.08, 0.78);
    codeNodeGroup.rotation.set(0.2, -0.3, 0.14);
    codeNodeGroup.scale.setScalar(0.88);
    rootGroup.add(codeNodeGroup);

    const terminalBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.62, 0.12),
      obsidianMat,
    );
    codeNodeGroup.add(terminalBase);

    const terminalAccentBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.94, 0.06, 0.14),
      goldBrassMat,
    );
    terminalAccentBar.position.set(0, 0.3, 0);
    codeNodeGroup.add(terminalAccentBar);

    const terminalScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.46),
      screenMat,
    );
    terminalScreen.position.set(0, -0.02, 0.065);
    codeNodeGroup.add(terminalScreen);

    const aiCoreDiamond = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      goldBrassMat,
    );
    aiCoreDiamond.position.set(0.36, -0.22, 0.18);
    codeNodeGroup.add(aiCoreDiamond);

    // 5. Instanced Orbital Motes
    const moteCount = 36;
    const moteGeo = new THREE.OctahedronGeometry(0.05, 0);
    const moteMesh = new THREE.InstancedMesh(moteGeo, goldBrassMat, moteCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < moteCount; i++) {
      const angle = (i / moteCount) * Math.PI * 2;
      const radius = 2.75 + (i % 3) * 0.45;
      const yOffset = Math.sin(i * 1.3) * 1.1;
      dummy.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius * 0.65);
      const s = 0.65 + (i % 4) * 0.25;
      dummy.scale.set(s, s, s);
      dummy.rotation.set(i * 0.5, i * 0.3, 0);
      dummy.updateMatrix();
      moteMesh.setMatrixAt(i, dummy.matrix);
    }
    moteMesh.instanceMatrix.needsUpdate = true;
    moteMesh.computeBoundingSphere();
    rootGroup.add(moteMesh);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Mouse pointer parallax listener
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ny = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
      pointerRef.current.x = THREE.MathUtils.clamp(nx, -1, 1);
      pointerRef.current.y = THREE.MathUtils.clamp(ny, -1, 1);
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    let frameId = 0;
    let disposed = false;
    const startTime = performance.now();
    let lastTime = startTime;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 90);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 8);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 85);
        }
      };
      frameId = window.setTimeout(poll, 8);
    }

    function renderFrame() {
      if (disposed) return;
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      const elapsed = (now - startTime) / 1000;
      lastTime = now;

      if (!prefersReducedMotion) {
        innerPrism.rotation.y += delta * 0.35;
        innerPrism.rotation.x += delta * 0.18;
        obsidianCage.rotation.y -= delta * 0.25;
        outerGimbal.rotation.z += delta * 0.22;
        innerGimbal.rotation.y -= delta * 0.3;
        hexRing.rotation.z += delta * 0.08;

        laptopGroup.position.y = 0.72 + Math.sin(elapsed * 1.1) * 0.12;
        windowGroup.position.y = 0.88 + Math.cos(elapsed * 0.95) * 0.11;
        codeNodeGroup.position.y = -1.08 + Math.sin(elapsed * 1.25 + 1.2) * 0.1;
        codeNodeGroup.rotation.y = -0.3 + Math.sin(elapsed * 0.7) * 0.2;
        aiCoreDiamond.rotation.y += delta * 0.9;

        moteMesh.rotation.y += delta * 0.09;

        const targetRotY = pointerRef.current.x * 0.28;
        const targetRotX = -pointerRef.current.y * 0.18;
        rootGroup.rotation.y = THREE.MathUtils.damp(rootGroup.rotation.y, targetRotY, 4.5, delta);
        rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, targetRotX, 4.5, delta);
      }

      renderer.render(scene, camera);

      if (prefersReducedMotion) {
        return; // Single clean frame for reduced motion
      }

      if (isSoftwareGl) {
        afterDraw(renderFrame);
      } else {
        frameId = requestAnimationFrame(renderFrame);
      }
    }

    renderFrame();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      bumpTex.dispose();
      screenTex.dispose();
      windowTex.dispose();
      envTexture.dispose();
      moteGeo.dispose();
      renderer.dispose();
    };
  }, []);

  if (fallbackMode) {
    return (
      <div
        data-testid="hero-3d-fallback"
        className="w-full h-full flex items-center justify-center rounded-xl border border-white/10 bg-[#1A1A1A] p-8"
      >
        <svg viewBox="0 0 360 360" className="w-72 h-72" aria-label="CyberNest 3D Sculpture Fallback">
          <circle cx="180" cy="180" r="140" stroke="#F5B800" strokeWidth="1.5" strokeDasharray="6 6" fill="none" />
          <polygon points="180,55 288,117 288,243 180,305 72,243 72,117" stroke="#4C138E" strokeWidth="3" fill="#4C138E" fillOpacity="0.22" />
          <polygon points="180,105 245,180 180,255 115,180" stroke="#F5B800" strokeWidth="2" fill="none" />
          <circle cx="180" cy="180" r="14" fill="#F5B800" />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      data-testid="hero-3d-canvas"
      className="w-full h-full min-h-[380px] lg:min-h-[540px]"
      aria-label="Interactive 3D CyberNest geometric sculpture and floating software interfaces"
    />
  );
};
