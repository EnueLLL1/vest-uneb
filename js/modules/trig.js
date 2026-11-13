/**
 * EIXO 4: GEOMETRIA E CÍRCULO TRIGONOMÉTRICO
 * Explorador por quadrante, radicais notáveis, tangente geométrica no Canvas 2D e Prática Híbrida.
 */

import { setupCanvasResolution } from '../utils/canvas.js';
import { getState, saveState } from '../state.js';
import { setupModuleStage } from '../utils/module-stage.js';

let currentTrigAngle = 45;

const radLabels = {
  0: '0 rad', 30: 'π/6 rad', 45: 'π/4 rad', 60: 'π/3 rad',
  90: 'π/2 rad', 120: '2π/3 rad', 135: '3π/4 rad', 150: '5π/6 rad',
  180: 'π rad', 210: '7π/6 rad', 225: '5π/4 rad', 240: '4π/3 rad',
  270: '3π/2 rad', 300: '5π/3 rad', 315: '7π/4 rad', 330: '11π/6 rad',
  360: '2π rad'
};

const EXACT_TRIG_VALUES = {
  0: { sin: '0', cos: '1', tan: '0' },
  30: { sin: '1/2', cos: '√3/2', tan: '√3/3' },
  45: { sin: '√2/2', cos: '√2/2', tan: '1' },
  60: { sin: '√3/2', cos: '1/2', tan: '√3' },
  90: { sin: '1', cos: '0', tan: '∄ (Indef.)' },
  120: { sin: '√3/2', cos: '-1/2', tan: '-√3' },
  135: { sin: '√2/2', cos: '-√2/2', tan: '-1' },
  150: { sin: '1/2', cos: '-√3/2', tan: '-√3/3' },
  180: { sin: '0', cos: '-1', tan: '0' },
  210: { sin: '-1/2', cos: '-√3/2', tan: '√3/3' },
  225: { sin: '-√2/2', cos: '-√2/2', tan: '1' },
  240: { sin: '-√3/2', cos: '-1/2', tan: '√3' },
  270: { sin: '-1', cos: '0', tan: '∄ (Indef.)' },
  300: { sin: '-√3/2', cos: '1/2', tan: '-√3' },
  315: { sin: '-√2/2', cos: '√2/2', tan: '-1' },
  330: { sin: '-1/2', cos: '√3/2', tan: '-√3/3' },
  360: { sin: '0', cos: '1', tan: '0' }
};

const QUADRANT_INFO = {
  1: {
    title: '1º Quadrante (0° a 90°)',
    signs: 'sen (+)  |  cos (+)  |  tg (+)',
    rule: 'Referência base α. Todos os valores são positivos.',
    angleSample: 45
  },
  2: {
    title: '2º Quadrante (90° a 180°)',
    signs: 'sen (+)  |  cos (-)  |  tg (-)',
    rule: 'Redução ao 1º Q: 180° - θ = α. Ex.: sen(150°) = +sen(30°), cos(150°) = -cos(30°).',
    angleSample: 150
  },
  3: {
    title: '3º Quadrante (180° a 270°)',
    signs: 'sen (-)  |  cos (-)  |  tg (+)',
    rule: 'Redução ao 1º Q: θ - 180° = α. Tangente fica positiva pois (-)/(-) = (+).',
    angleSample: 225
  },
  4: {
    title: '4º Quadrante (270° a 360°)',
    signs: 'sen (-)  |  cos (+)  |  tg (-)',
    rule: 'Redução ao 1º Q: 360° - θ = α. Apenas o cosseno ("com sono / deitado positivo") fica (+).',
    angleSample: 330
  }
};

export const TRIG_CHALLENGES = [
  {
    type: 'lab',
    prompt: 'Missão no Simulador: Gire o ponto ou ajuste o slider para encontrar o ângulo simétrico a 30° localizado no 2º Quadrante (com sen = +1/2 e cos < 0).',
    hints: [
      'No 2º Quadrante, o ângulo simétrico a α é calculado por 180° - α.',
      'Calcule 180° - 30° = 150° (ou 5π/6 rad).'
    ],
    successMessage: 'Correto! 150° mantém a mesma altura vertical (+1/2) de 30°, porém no lado esquerdo (cos = -√3/2).',
    teacherExplanation: 'Mostrar no círculo a simetria horizontal entre 30° e 150°: mesma ordenada (seno igual) e abscissa oposta (cossenos contrários).'
  },
  {
    type: 'mc',
    prompt: '(Estilo UNEB) Se um arco x satisfaz simultaneamente sen(x) < 0 e cos(x) > 0, em qual quadrante está sua extremidade?',
    options: [
      '1º Quadrante',
      '2º Quadrante',
      '3º Quadrante',
      '4º Quadrante'
    ],
    correctIndex: 3,
    hints: [
      'cos(x) > 0 significa lado direito do círculo (1º ou 4º Quadrante).',
      'sen(x) < 0 significa metade inferior do círculo (abaixo do eixo X).'
    ],
    successMessage: 'Perfeito! Direita (cos > 0) e abaixo (sen < 0) define exclusivamente o 4º Quadrante.',
    teacherExplanation: 'Gabarito: D (4º Quadrante). Incentivar leitura geométrica no círculo ("seno em pé, cosseno deitado") em vez de decorar tabelas.'
  },
  {
    type: 'mc',
    prompt: 'Sabendo que sen(θ) = 3/5 e que θ pertence ao 2º Quadrante, qual é o valor exato de cos(θ)?',
    options: [
      '+4/5',
      '-4/5',
      '-3/4',
      '-16/25'
    ],
    correctIndex: 1,
    hints: [
      'Aplique a Relação Fundamental sen²(θ) + cos²(θ) = 1: (3/5)² + cos²(θ) = 1.',
      'cos²(θ) = 16/25 ⇒ cos(θ) = ±4/5. Como θ está no 2º Quadrante, o cosseno é negativo!'
    ],
    successMessage: 'Isso mesmo! cos(θ) = -4/5 (triângulo 3-4-5 com sinal negativo do 2º Q).',
    teacherExplanation: 'Gabarito: B (-4/5). Pegadinha clássica em A (+4/5): acertar a conta de Pitágoras mas esquecer o sinal do quadrante.'
  }
];

export function evaluateTrigChallenge(idx, ctx = {}) {
  const ch = TRIG_CHALLENGES[idx];
  if (!ch) return false;
  if (idx === 0) {
    return Number(ctx.angleDeg) === 150;
  }
  return ctx.selectedOption === ch.correctIndex;
}

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
  const radius = Math.min(cx, cy) * 0.68;

  ctx.clearRect(0, 0, w, h);

  const { rad, sinVal, cosVal, tanVal, radText } = calcTrigValues(currentTrigAngle);

  const labelDeg = document.getElementById('label-trig-deg');
  const valSin = document.getElementById('val-trig-sin');
  const valCos = document.getElementById('val-trig-cos');
  const valTan = document.getElementById('val-trig-tan');
  const exactBadge = document.getElementById('trig-exact-badge');
  const identityBadge = document.getElementById('trig-identity-check');

  const exact = EXACT_TRIG_VALUES[currentTrigAngle];
  if (labelDeg) labelDeg.textContent = `${currentTrigAngle}° (${radText})`;
  if (valSin) valSin.textContent = exact ? `${exact.sin} (${(sinVal > 0 ? '+' : '') + sinVal.toFixed(3)})` : (sinVal > 0 ? '+' : '') + sinVal.toFixed(3);
  if (valCos) valCos.textContent = exact ? `${exact.cos} (${(cosVal > 0 ? '+' : '') + cosVal.toFixed(3)})` : (cosVal > 0 ? '+' : '') + cosVal.toFixed(3);
  if (valTan) {
    valTan.textContent = exact
      ? (typeof tanVal === 'number' ? `${exact.tan} (${(tanVal > 0 ? '+' : '') + tanVal.toFixed(2)})` : exact.tan)
      : (typeof tanVal === 'number' ? ((tanVal > 0 ? '+' : '') + tanVal.toFixed(3)) : tanVal);
  }
  if (exactBadge) {
    const qNum = currentTrigAngle === 0 || currentTrigAngle === 360 || currentTrigAngle === 90 || currentTrigAngle === 180 || currentTrigAngle === 270
      ? 'Sobre Eixo'
      : currentTrigAngle < 90 ? '1º Quadrante' : currentTrigAngle < 180 ? '2º Quadrante' : currentTrigAngle < 270 ? '3º Quadrante' : '4º Quadrante';
    exactBadge.textContent = exact
      ? `${qNum} • Arco notável UNEB (${radText})`
      : `${qNum} • sen² + cos² = 1`;
  }
  if (identityBadge) {
    const sumSq = (sinVal * sinVal) + (cosVal * cosVal);
    identityBadge.textContent = `Relação Fundamental: (${sinVal.toFixed(2)})² + (${cosVal.toFixed(2)})² = ${sumSq.toFixed(3)}`;
  }

  // Eixos do Círculo
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - radius - 22, cy);
  ctx.lineTo(cx + radius + 22, cy);
  ctx.moveTo(cx, cy - radius - 22);
  ctx.lineTo(cx, cy + radius + 22);
  ctx.stroke();

  // Eixo vertical auxiliar da tangente (x = 1)
  const tanAxisX = cx + radius;
  ctx.save();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(tanAxisX, cy - radius - 14);
  ctx.lineTo(tanAxisX, cy + radius + 14);
  ctx.stroke();
  ctx.restore();

  // Setor angular sombreado
  if (currentTrigAngle > 0 && currentTrigAngle < 360) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius * 0.28, 0, -rad, true);
    ctx.closePath();
    ctx.fill();
  }

  // Círculo unitário
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Coordenadas projetadas
  const px = cx + (cosVal * radius);
  const py = cy - (sinVal * radius);

  // Projeção da Tangente no eixo x = 1 quando definida e dentro da área visível
  if (typeof tanVal === 'number' && Math.abs(tanVal) <= 2.4) {
    const tanPy = cy - (tanVal * radius);
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tanAxisX, tanPy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(tanAxisX, cy);
    ctx.lineTo(tanAxisX, tanPy);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(tanAxisX, tanPy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

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

  // Rótulos 0, 90, 180, 270 e Q1..Q4
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText('0°', cx + radius + 6, cy + 4);
  ctx.fillText('90°', cx - 10, cy - radius - 8);
  ctx.fillText('180°', cx - radius - 32, cy + 4);
  ctx.fillText('270°', cx - 12, cy + radius + 18);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.font = '10px monospace';
  ctx.fillText('1ºQ', cx + radius * 0.45, cy - radius * 0.45);
  ctx.fillText('2ºQ', cx - radius * 0.65, cy - radius * 0.45);
  ctx.fillText('3ºQ', cx - radius * 0.65, cy + radius * 0.55);
  ctx.fillText('4ºQ', cx + radius * 0.45, cy + radius * 0.55);
}

function selectTrigQuadrantConcept(qNum) {
  const info = QUADRANT_INFO[qNum];
  if (!info) return;

  document.querySelectorAll('[data-trig-quad]').forEach((btn) => {
    const active = Number(btn.getAttribute('data-trig-quad')) === qNum;
    btn.setAttribute('aria-pressed', String(active));
    btn.className = active
      ? 'px-3 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white shadow-sm cursor-pointer transition-all'
      : 'px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-teal-300 cursor-pointer transition-all';
  });

  const titleEl = document.getElementById('trig-quad-title');
  const signsEl = document.getElementById('trig-quad-signs');
  const ruleEl = document.getElementById('trig-quad-rule');
  if (titleEl) titleEl.textContent = info.title;
  if (signsEl) signsEl.textContent = info.signs;
  if (ruleEl) ruleEl.textContent = info.rule;
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

  document.querySelectorAll('[data-trig-quad]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qNum = parseInt(btn.getAttribute('data-trig-quad'), 10);
      selectTrigQuadrantConcept(qNum);
    });
  });
  selectTrigQuadrantConcept(1);

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

  setupModuleStage({
    modId: 'mod-trig',
    challenges: TRIG_CHALLENGES,
    evaluateChallenge: evaluateTrigChallenge,
    getLabContext: () => ({ angleDeg: currentTrigAngle }),
    onApplySolution: (idx) => {
      if (idx === 0) {
        setTrigAngle(150);
      }
    },
    onShowWorkbench: renderTrigCircle
  });
}
