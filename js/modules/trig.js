/**
 * EIXO 4: GEOMETRIA E CÍRCULO TRIGONOMÉTRICO
 * Cálculos trigonométricos, projeções geométricas e Canvas 2D interativo com PointerEvents.
 */

import { setupCanvasResolution } from '../utils/canvas.js';
import { getState, saveState } from '../state.js';

let currentTrigAngle = 45;

const radLabels = {
  0: '0 rad', 30: 'π/6 rad', 45: 'π/4 rad', 60: 'π/3 rad',
  90: 'π/2 rad', 120: '2π/3 rad', 135: '3π/4 rad', 150: '5π/6 rad',
  180: 'π rad', 210: '7π/6 rad', 225: '5π/4 rad', 240: '4π/3 rad',
  270: '3π/2 rad', 300: '5π/3 rad', 315: '7π/4 rad', 330: '11π/6 rad',
  360: '2π rad'
};

export function calcTrigValues(deg) {
  const rad = (deg * Math.PI) / 180;
  const clean = v => Math.abs(v) < 1e-6 ? 0 : v;

  const sinVal = clean(Math.sin(rad));
  const cosVal = clean(Math.cos(rad));
  const tanVal = Math.abs(cosVal) < 1e-6 ? 'Indefinida' : clean(Math.tan(rad));
  const radText = radLabels[deg] || `${((deg / 180)).toFixed(2)}π rad`;

  return { rad, sinVal, cosVal, tanVal, radText };
}

export function setTrigAngle(deg) {
  currentTrigAngle = Math.max(0, Math.min(360, parseInt(deg, 10) || 0));
  const slider = document.getElementById('slider-trig-angle');
  if (slider) slider.value = currentTrigAngle;
  renderTrigCircle();

  const state = getState();
  state.params.trigAngle = currentTrigAngle;
  saveState();
}

export function renderTrigCircle() {
  const canvas = document.getElementById('canvas-trig');
  const res = setupCanvasResolution(canvas);
  if (!res) return;
  const { ctx, width: w, height: h } = res;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) * 0.72;

  ctx.clearRect(0, 0, w, h);

  const { sinVal, cosVal, tanVal, radText } = calcTrigValues(currentTrigAngle);

  const labelDeg = document.getElementById('label-trig-deg');
  const valSin = document.getElementById('val-trig-sin');
  const valCos = document.getElementById('val-trig-cos');
  const valTan = document.getElementById('val-trig-tan');

  if (labelDeg) labelDeg.textContent = `${currentTrigAngle}° (${radText})`;
  if (valSin) valSin.textContent = (sinVal > 0 ? '+' : '') + sinVal.toFixed(3);
  if (valCos) valCos.textContent = (cosVal > 0 ? '+' : '') + cosVal.toFixed(3);
  if (valTan) valTan.textContent = typeof tanVal === 'number' ? ((tanVal > 0 ? '+' : '') + tanVal.toFixed(3)) : tanVal;

  // Eixos do Círculo
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - radius - 20, cy);
  ctx.lineTo(cx + radius + 20, cy);
  ctx.moveTo(cx, cy - radius - 20);
  ctx.lineTo(cx, cy + radius + 20);
  ctx.stroke();

  // Círculo unitário
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Coordenadas projetadas
  const px = cx + (cosVal * radius);
  const py = cy - (sinVal * radius);

  // Linha do Cosseno (Horizontal no eixo X)
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, cy);
  ctx.stroke();

  // Linha do Seno (Vertical projetada)
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, cy);
  ctx.lineTo(px, py);
  ctx.stroke();

  // Raio tracejado
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, py);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ponto sobre a circunferência
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fill();

  // Rótulos 0, 90, 180, 270
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText('0°', cx + radius + 6, cy + 4);
  ctx.fillText('90°', cx - 10, cy - radius - 8);
  ctx.fillText('180°', cx - radius - 30, cy + 4);
  ctx.fillText('270°', cx - 12, cy + radius + 18);
}

export function initTrigonometria() {
  const slider = document.getElementById('slider-trig-angle');
  if (slider) {
    slider.addEventListener('input', (e) => setTrigAngle(e.target.value));
  }

  document.querySelectorAll('[data-trig-angle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const angle = parseInt(btn.getAttribute('data-trig-angle'), 10);
      setTrigAngle(angle);
    });
  });

  const canvas = document.getElementById('canvas-trig');
  if (canvas) {
    let isDragging = false;

    function updateFromPointer(e) {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const x = e.clientX - cx;
      const y = e.clientY - cy;

      let rad = Math.atan2(-y, x);
      if (rad < 0) rad += 2 * Math.PI;
      const deg = Math.round((rad * 180) / Math.PI) % 360;
      setTrigAngle(deg);
    }

    canvas.addEventListener('pointerdown', (e) => {
      isDragging = true;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
      updateFromPointer(e);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (isDragging) updateFromPointer(e);
    });

    const stopDrag = (e) => {
      if (isDragging) {
        isDragging = false;
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) { }
      }
    };

    canvas.addEventListener('pointerup', stopDrag);
    canvas.addEventListener('pointercancel', stopDrag);
  }

  renderTrigCircle();
}
