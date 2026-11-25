import * as THREE from 'three';

export function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function createStudioScreenTexture(
  renderer: THREE.WebGLRenderer,
  accentHex = '#F5B800',
  label = 'CYBERNEST STUDIO',
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#14111A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle editorial grid
    ctx.strokeStyle = 'rgba(242, 235, 221, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 320);
      ctx.stroke();
    }
    for (let y = 0; y <= 320; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Header bar
    ctx.fillStyle = '#4C138E';
    ctx.fillRect(24, 24, 464, 34);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(label, 40, 46);

    // Architectural geometry preview blocks
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(24, 78, 220, 148);

    // Wave plot
    ctx.beginPath();
    ctx.strokeStyle = '#F5B800';
    ctx.lineWidth = 2.5;
    for (let i = 0; i <= 180; i += 8) {
      const px = 42 + i;
      const py = 152 + Math.sin(i * 0.055) * 32 + Math.cos(i * 0.025) * 14;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Side data bars
    const bars = [140, 200, 110, 175];
    bars.forEach((w, idx) => {
      const y = 84 + idx * 36;
      ctx.fillStyle = 'rgba(242, 235, 221, 0.14)';
      ctx.fillRect(268, y, 220, 20);
      ctx.fillStyle = idx % 2 === 0 ? '#F5B800' : '#4C138E';
      ctx.fillRect(268, y, w, 20);
    });

    // Bottom footer rule
    ctx.fillStyle = 'rgba(242, 235, 221, 0.6)';
    ctx.font = '12px monospace';
    ctx.fillText('KAMPALA · UGANDA · SYSTEMS ARCHITECTURE', 24, 280);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}

export function createBrushedMetalBumpTexture(
  renderer: THREE.WebGLRenderer,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 2) {
      const shade = 116 + ((y * 37) % 28);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, 256, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}
