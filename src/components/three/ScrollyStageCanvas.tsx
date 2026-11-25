import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { detectSoftwareWebGL } from './threeUtils';

export type ChapterVisualMode = 'idea' | 'technology' | 'creations' | 'impact' | 'future';

interface ScrollyStageCanvasProps {
  activeMode: ChapterVisualMode;
}

const MODE_PRESETS: Record<
  ChapterVisualMode,
  {
    coreScale: number;
    ringTilt: number;
    orbitSpread: number;
    cameraZ: number;
    accentHex: number;
  }
> = {
  idea: { coreScale: 1.0, ringTilt: 0.4, orbitSpread: 1.15, cameraZ: 6.8, accentHex: 0xf5b800 },
  technology: { coreScale: 1.15, ringTilt: 1.15, orbitSpread: 1.45, cameraZ: 6.4, accentHex: 0x4c138e },
  creations: { coreScale: 0.92, ringTilt: -0.65, orbitSpread: 1.65, cameraZ: 6.6, accentHex: 0xf5b800 },
  impact: { coreScale: 1.22, ringTilt: 0.85, orbitSpread: 1.85, cameraZ: 7.0, accentHex: 0x8d5b38 },
  future: { coreScale: 1.32, ringTilt: 0.15, orbitSpread: 2.05, cameraZ: 6.2, accentHex: 0xf5b800 },
};

export const ScrollyStageCanvas: React.FC<ScrollyStageCanvasProps> = ({ activeMode }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<ChapterVisualMode>(activeMode);
  const requestRenderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    modeRef.current = activeMode;
    requestRenderRef.current?.();
  }, [activeMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const w = container.clientWidth || 480;
    const h = container.clientHeight || 420;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 60);
    camera.position.set(0, 0.4, 6.8);

    const hemi = new THREE.HemisphereLight(0xf2ebdd, 0x241630, 1.0);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff0d1, 2.2);
    key.position.set(4, 6, 5);
    scene.add(key);

    const purpleBack = new THREE.DirectionalLight(0x6e2ec4, 1.6);
    purpleBack.position.set(-4, -3, -4);
    scene.add(purpleBack);

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x4c138e,
      metalness: 0.78,
      roughness: 0.22,
      clearcoat: 0.7,
    });
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5b800,
      metalness: 0.9,
      roughness: 0.18,
    });
    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xf2ebdd,
      metalness: 0.1,
      roughness: 0.45,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8d5b38,
      metalness: 0.12,
      roughness: 0.7,
    });

    const corePoly = new THREE.Mesh(new THREE.DodecahedronGeometry(0.82, 0), coreMat);
    stageGroup.add(corePoly);

    const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.04, 16, 64), goldMat);
    stageGroup.add(ringA);

    const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.03, 14, 64), ceramicMat);
    stageGroup.add(ringB);

    // 4 orbiting satellite pillars representing software development, VOXLAN, AI, and programming lessons
    const satellites: THREE.Mesh[] = [];
    const satGeos = [
      new THREE.BoxGeometry(0.32, 0.46, 0.08),
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.CylinderGeometry(0.16, 0.2, 0.38, 12),
      new THREE.BoxGeometry(0.34, 0.26, 0.24),
    ];
    const satMats = [ceramicMat, goldMat, woodMat, coreMat];

    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(satGeos[i], satMats[i]);
      stageGroup.add(mesh);
      satellites.push(mesh);
    }

    let currentScale = 1;
    let currentTilt = 0.4;
    let currentSpread = 1.15;
    let currentCamZ = 6.8;
    let spinAngle = 0;

    let frameId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 6);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 6);
    }

    function stepAndRender() {
      if (disposed) return;
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        const target = MODE_PRESETS[modeRef.current];
        currentScale = THREE.MathUtils.damp(currentScale, target.coreScale, 5.5, dt);
        currentTilt = THREE.MathUtils.damp(currentTilt, target.ringTilt, 5.5, dt);
        currentSpread = THREE.MathUtils.damp(currentSpread, target.orbitSpread, 5.5, dt);
        currentCamZ = THREE.MathUtils.damp(currentCamZ, target.cameraZ, 5.5, dt);
        spinAngle += dt * 0.45;

        corePoly.scale.setScalar(currentScale);
        corePoly.rotation.y = spinAngle;
        corePoly.rotation.x = currentTilt * 0.4;

        ringA.rotation.x = currentTilt;
        ringA.rotation.y = spinAngle * 0.7;

        ringB.rotation.z = -currentTilt * 0.8;
        ringB.rotation.x = Math.PI * 0.35;

        camera.position.z = currentCamZ;

        satellites.forEach((sat, idx) => {
          const angle = spinAngle * 0.65 + (idx * Math.PI) / 2;
          sat.position.set(
            Math.cos(angle) * currentSpread,
            Math.sin(angle * 1.5) * 0.55,
            Math.sin(angle) * currentSpread * 0.7,
          );
          sat.rotation.y = angle + idx;
          sat.rotation.x = currentTilt * 0.5;
        });

        renderer.render(scene, camera);

        const settled =
          Math.abs(currentScale - target.coreScale) < 0.008 &&
          Math.abs(currentTilt - target.ringTilt) < 0.008 &&
          Math.abs(currentSpread - target.orbitSpread) < 0.008;

        const finish = () => {
          renderBusy = false;
          if (!settled || renderDirty) {
            stepAndRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(finish);
        } else {
          finish();
        }
      });
    }

    requestRenderRef.current = () => {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      lastTime = performance.now();
      stepAndRender();
    };

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 480;
      const nh = container.clientHeight || 420;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      requestRenderRef.current?.();
    };
    window.addEventListener('resize', handleResize);

    // Initial render
    stepAndRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      satGeos.forEach((g) => g.dispose());
      envTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="scrolly-3d-canvas"
      data-mode={activeMode}
      className="w-full h-full min-h-[280px] lg:min-h-[380px]"
      aria-label={`Interactive 3D visualization for ${activeMode}`}
    />
  );
};
