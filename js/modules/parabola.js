/**
 * EIXO 3: FUNÇÃO QUADRÁTICA E PARÁBOLA
 * Fórmulas puras de Bhaskara/Vértice e renderizador Canvas 2D.
 */

import { setupCanvasResolution } from '../utils/canvas.js';
import { getState, saveState } from '../state.js';

export function calcBhaskara(a, b, c) {
  if (a === 0) {
    return {
      isQuadratic: false,
      delta: null,
      roots: b !== 0 ? [-c / b] : [],
      infiniteRoots: b === 0 && c === 0,
      vertex: null
    };
  }
  const delta = (b * b) - (4 * a * c);
  let roots = [];
  if (delta > 0) {
    const r1 = (-b + Math.sqrt(delta)) / (2 * a);
    const r2 = (-b - Math.sqrt(delta)) / (2 * a);
    roots = [Math.min(r1, r2), Math.max(r1, r2)];
  } else if (Math.abs(delta) < 1e-9) {
    roots = [-b / (2 * a)];
  }
  const xv = -b / (2 * a);
  const yv = -delta / (4 * a);
  const type = a > 0 ? 'Mínimo' : 'Máximo';

  return {
    isQuadratic: true,
    delta,
    roots,
    vertex: { xv, yv, type }
  };
}

export function formatQuadraticEq(a, b, c) {
  let eqText = 'f(x) = ';
  if (a !== 0) {
    eqText += (a === 1 ? 'x²' : a === -1 ? '-x²' : `${a}x²`);
    if (b > 0) eqText += ` + ${b === 1 ? 'x' : b + 'x'}`;
    else if (b < 0) eqText += ` - ${b === -1 ? 'x' : Math.abs(b) + 'x'}`;
    if (c > 0) eqText += ` + ${c}`;
    else if (c < 0) eqText += ` - ${Math.abs(c)}`;
  } else {
    if (b !== 0) {
      eqText += (b === 1 ? 'x' : b === -1 ? '-x' : `${b}x`);
      if (c > 0) eqText += ` + ${c}`;
      else if (c < 0) eqText += ` - ${Math.abs(c)}`;
    } else {
      eqText += `${c}`;
    }
  }
  return eqText;
}

export function renderQuadratic() {
  const elA = document.getElementById('slider-quad-a');
  const elB = document.getElementById('slider-quad-b');
  const elC = document.getElementById('slider-quad-c');
  if (!elA || !elB || !elC) return;

  const a = parseFloat(elA.value);
  const b = parseFloat(elB.value);
  const c = parseFloat(elC.value);

  const valA = document.getElementById('val-quad-a');
  const valB = document.getElementById('val-quad-b');
  const valC = document.getElementById('val-quad-c');
  if (valA) valA.textContent = a;
  if (valB) valB.textContent = b;
  if (valC) valC.textContent = c;

  const labelEq = document.getElementById('label-quad-eq');
  const labelDelta = document.getElementById('label-quad-delta');
  const labelVert = document.getElementById('label-quad-vert');
  const labelRoots = document.getElementById('label-quad-roots');

  if (labelEq) labelEq.textContent = formatQuadraticEq(a, b, c);

  const calc = calcBhaskara(a, b, c);

  if (calc.isQuadratic) {
    if (labelDelta) labelDelta.textContent = calc.delta.toFixed(2);
    if (labelVert) labelVert.textContent = `(${calc.vertex.xv.toFixed(2)}, ${calc.vertex.yv.toFixed(2)}) [${calc.vertex.type}]`;
    if (labelRoots) {
      if (calc.roots.length === 2) {
        labelRoots.textContent = `x₁ = ${calc.roots[0].toFixed(2)}, x₂ = ${calc.roots[1].toFixed(2)}`;
      } else if (calc.roots.length === 1) {
        labelRoots.textContent = `Raiz dupla: x = ${calc.roots[0].toFixed(2)}`;
      } else {
        labelRoots.textContent = 'Nenhuma raiz real (Δ < 0)';
      }
    }
  } else {
    if (labelDelta) labelDelta.textContent = 'Não se aplica (reta afim)';
    if (labelVert) labelVert.textContent = 'Sem vértice (reta afim)';
    if (labelRoots) {
      if (calc.roots.length === 1) {
        labelRoots.textContent = `Função Afim: x = ${calc.roots[0].toFixed(2)}`;
      } else if (calc.infiniteRoots) {
        labelRoots.textContent = 'Infinitas raízes (eixo X)';
      } else {
        labelRoots.textContent = 'Nenhuma raiz (reta horizontal)';
      }
    }
  }

  // Desenho no Canvas
  const canvas = document.getElementById('canvas-algebra');
  const res = setupCanvasResolution(canvas);
  if (!res) return;
  const { ctx, width: w, height: h } = res;

  ctx.clearRect(0, 0, w, h);

  const originX = w / 2;
  const originY = h / 2;
  const scale = Math.min(24, Math.max(16, w / 24));

  // Grade
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let x = originX % scale; x < w; x += scale) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = originY % scale; y < h; y += scale) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Eixos principais
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(w, originY);
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, h);
  ctx.stroke();

  // Plot da Curva / Reta
  ctx.beginPath();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;

  let started = false;
  const step = 2;
  for (let px = 0; px <= w; px += step) {
    const xReal = (px - originX) / scale;
    const yReal = (a * xReal * xReal) + (b * xReal) + c;
    const py = originY - (yReal * scale);

    if (py >= -100 && py <= h + 100) {
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    } else {
      started = false;
    }
  }
  ctx.stroke();

  // Vértice se a !== 0
  if (calc.isQuadratic && calc.vertex) {
    const vPx = originX + (calc.vertex.xv * scale);
    const vPy = originY - (calc.vertex.yv * scale);
    if (vPx >= 0 && vPx <= w && vPy >= 0 && vPy <= h) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(vPx, vPy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Raízes reais no eixo X
  ctx.fillStyle = '#10b981';
  calc.roots.forEach(r => {
    if (r !== null && Number.isFinite(r)) {
      const rPx = originX + (r * scale);
      if (rPx >= 0 && rPx <= w) {
        ctx.beginPath();
        ctx.arc(rPx, originY, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  const state = getState();
  state.params.quadA = a;
  state.params.quadB = b;
  state.params.quadC = c;
  saveState();
}

export function resetQuadFunction() {
  const elA = document.getElementById('slider-quad-a');
  const elB = document.getElementById('slider-quad-b');
  const elC = document.getElementById('slider-quad-c');
  if (elA) elA.value = 1;
  if (elB) elB.value = -2;
  if (elC) elC.value = -3;
  renderQuadratic();
}

export function initParabola() {
  const elA = document.getElementById('slider-quad-a');
  const elB = document.getElementById('slider-quad-b');
  const elC = document.getElementById('slider-quad-c');
  const btnReset = document.getElementById('btn-reset-quad');

  if (elA) elA.addEventListener('input', renderQuadratic);
  if (elB) elB.addEventListener('input', renderQuadratic);
  if (elC) elC.addEventListener('input', renderQuadratic);
  if (btnReset) btnReset.addEventListener('click', resetQuadFunction);

  renderQuadratic();
}
