/**
 * EIXO 3: FUNÇÃO QUADRÁTICA E PARÁBOLA
 * Explorador visual dos coeficientes, Canvas cartesiano numerado + eixo de simetria e Prática Híbrida.
 */

import { setupCanvasResolution } from '../utils/canvas.js';
import { getState, saveState } from '../state.js';
import { setupModuleStage } from '../utils/module-stage.js';

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

const QUAD_CONCEPT_NOTES = {
  a: {
    title: 'Coeficiente a (Concavidade)',
    desc: 'Se a > 0, a parábola tem "boca para cima" e possui ponto de MÍNIMO. Se a < 0, abre para baixo e tem ponto de MÁXIMO. Quanto maior |a|, mais fechada ela fica.'
  },
  b: {
    title: 'Coeficiente b (Inclinação ao cruzar Y)',
    desc: 'Indica se a parábola cruza o eixo Y subindo (b > 0), descendo (b < 0) ou exatamente no vértice (b = 0). Além disso, move o vértice horizontalmente: xᵥ = -b / (2a).'
  },
  c: {
    title: 'Coeficiente c (Corte no Eixo Y)',
    desc: 'É sempre a altura onde a parábola corta o eixo vertical: ponto (0, c). Basta fazer x = 0 na fórmula!'
  },
  delta: {
    title: 'Discriminante Δ = b² - 4ac (Quantidade de Raízes)',
    desc: 'Δ > 0 gera 2 raízes reais (corta X duas vezes). Δ = 0 tangencia X em 1 raiz dupla. Δ < 0 não toca o eixo X.'
  }
};

export const PARABOLA_CHALLENGES = [
  {
    type: 'lab',
    prompt: 'Missão no Simulador: Ajuste a, b e c para obter uma parábola com concavidade para cima (a > 0) e vértice exatamente em V(2, -1).',
    hints: [
      'Use a = 1 (concavidade para cima). Em seguida calcule b usando xᵥ = -b / (2a) = 2.',
      'Com a = 1 e xᵥ = 2, temos b = -4. Depois ajuste c = 3 para f(2) = 4 - 8 + 3 = -1.'
    ],
    successMessage: 'Excelente! f(x) = x² - 4x + 3 possui concavidade para cima, vértice em (2, -1) e raízes x = 1 e x = 3.',
    teacherExplanation: 'Mostrar na lousa que qualquer variação proporcional mantém o vértice apenas se respeitar -b/(2a)=2 e yᵥ=-1; nos sliders inteiros, a solução exata é a=1, b=-4, c=3.'
  },
  {
    type: 'mc',
    prompt: '(Estilo UNEB) O lucro diário de um produtor é modelado por L(x) = -x² + 12x - 20, em que x é a produção em toneladas. Qual quantidade x maximiza o lucro?',
    options: [
      '2 toneladas',
      '6 toneladas',
      '10 toneladas',
      '16 toneladas'
    ],
    correctIndex: 1,
    hints: [
      'Quando a < 0, o máximo ocorre no vértice. Observe se a questão pede o "x" (toneladas) ou o "y" (lucro máximo).',
      'Calcule xᵥ = -b / (2a) = -12 / (2 · (-1)) = 6.'
    ],
    successMessage: 'Correto! A produção ótima ocorre em xᵥ = -12 / (-2) = 6 toneladas (com lucro máximo yᵥ = 16).',
    teacherExplanation: 'Gabarito: B (6 toneladas). Destacar que D (16) é o lucro máximo (yᵥ), o distrator nº 1 quando o aluno não lê se o enunciado pede xᵥ ou yᵥ.'
  },
  {
    type: 'mc',
    prompt: 'Em uma função quadrática f(x) = ax² + bx + c, sabendo que a > 0 e Δ < 0, o que podemos afirmar sobre o gráfico?',
    options: [
      'Corta o eixo X em dois pontos simétricos.',
      'Tangencia o eixo X no ponto xᵥ.',
      'Fica inteiramente acima do eixo X (f(x) > 0 para todo x real).',
      'Tem ponto de máximo negativo.'
    ],
    correctIndex: 2,
    hints: [
      'Lembre o significado geométrico de Δ < 0: não existem raízes reais.',
      'Se não cruza X e a > 0 (abre para cima), toda a curva fica acima do eixo horizontal.'
    ],
    successMessage: 'Isso mesmo! Δ < 0 significa zero raízes reais; com a > 0, f(x) é estritamente positiva.',
    teacherExplanation: 'Gabarito: C. Esse conceito conecta inequação do 2º grau com análise gráfica.'
  }
];

export function evaluateParabolaChallenge(idx, ctx = {}) {
  const ch = PARABOLA_CHALLENGES[idx];
  if (!ch) return false;
  if (idx === 0) {
    const calc = calcBhaskara(Number(ctx.a), Number(ctx.b), Number(ctx.c));
    return (
      calc.isQuadratic &&
      Number(ctx.a) > 0 &&
      calc.vertex !== null &&
      Math.abs(calc.vertex.xv - 2) < 1e-6 &&
      Math.abs(calc.vertex.yv + 1) < 1e-6
    );
  }
  return ctx.selectedOption === ch.correctIndex;
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
  const stepBox = document.getElementById('quad-bhaskara-steps');

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
    if (stepBox) {
      stepBox.textContent = `Δ = (${b})² - 4·(${a})·(${c}) = ${calc.delta}  |  xᵥ = -(${b}) / (2·${a}) = ${calc.vertex.xv.toFixed(2)}  |  Corte Y = (0, ${c})`;
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
    if (stepBox) {
      stepBox.textContent = 'Com a = 0 a função deixa de ser quadrática e vira função afim (1º grau).';
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

  // Eixos principais + Ticks numéricos
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(w, originY);
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, h);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px "JetBrains Mono", monospace';
  const maxUnitX = Math.floor((w / 2) / scale);
  for (let u = -maxUnitX; u <= maxUnitX; u += 2) {
    if (u === 0) continue;
    const tx = originX + u * scale;
    ctx.fillText(String(u), tx - 5, originY + 13);
  }
  const maxUnitY = Math.floor((h / 2) / scale);
  for (let u = -maxUnitY; u <= maxUnitY; u += 2) {
    if (u === 0) continue;
    const ty = originY - u * scale;
    ctx.fillText(String(u), originX + 5, ty + 3);
  }

  // Eixo de simetria x = xv
  if (calc.isQuadratic && calc.vertex) {
    const vPx = originX + (calc.vertex.xv * scale);
    if (vPx >= 0 && vPx <= w) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(vPx, 0);
      ctx.lineTo(vPx, h);
      ctx.stroke();
      ctx.restore();
    }
  }

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

  // Corte no eixo Y: (0, c)
  const cPy = originY - (c * scale);
  if (cPy >= 8 && cPy <= h - 8) {
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(originX, cPy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e9d5ff';
    ctx.fillText(`(0,${c})`, originX + 7, cPy - 4);
  }

  // Vértice se a !== 0
  if (calc.isQuadratic && calc.vertex) {
    const vPx = originX + (calc.vertex.xv * scale);
    const vPy = originY - (calc.vertex.yv * scale);
    if (vPx >= 0 && vPx <= w && vPy >= 0 && vPy <= h) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(vPx, vPy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      const vxTxt = Number.isInteger(calc.vertex.xv) ? calc.vertex.xv : calc.vertex.xv.toFixed(1);
      const vyTxt = Number.isInteger(calc.vertex.yv) ? calc.vertex.yv : calc.vertex.yv.toFixed(1);
      ctx.fillText(`V(${vxTxt},${vyTxt})`, Math.min(w - 58, vPx + 7), Math.max(12, vPy + (a > 0 ? 15 : -8)));
    }
  }

  // Raízes reais no eixo X
  ctx.fillStyle = '#10b981';
  calc.roots.forEach((r, idx) => {
    if (r !== null && Number.isFinite(r)) {
      const rPx = originX + (r * scale);
      if (rPx >= 0 && rPx <= w) {
        ctx.beginPath();
        ctx.arc(rPx, originY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6ee7b7';
        const rTxt = Number.isInteger(r) ? r : r.toFixed(1);
        ctx.fillText(`x${idx + 1}=${rTxt}`, Math.min(w - 38, rPx + 4), originY - 8);
        ctx.fillStyle = '#10b981';
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

function selectQuadConcept(key) {
  const note = QUAD_CONCEPT_NOTES[key];
  if (!note) return;

  document.querySelectorAll('[data-quad-coef]').forEach((btn) => {
    const active = btn.getAttribute('data-quad-coef') === key;
    btn.setAttribute('aria-pressed', String(active));
    btn.className = active
      ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 text-white shadow-sm cursor-pointer transition-all'
      : 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-sky-300 cursor-pointer transition-all';
  });

  const titleEl = document.getElementById('quad-concept-title');
  const descEl = document.getElementById('quad-concept-desc');
  if (titleEl) titleEl.textContent = note.title;
  if (descEl) descEl.textContent = note.desc;
}

function applyQuadPreset(preset) {
  const presets = {
    duas: [1, -2, -3],
    dupla: [1, -4, 4],
    sem: [1, 0, 2],
    maximo: [-1, 4, -1]
  };
  const vals = presets[preset];
  if (!vals) return;
  const [a, b, c] = vals;
  const elA = document.getElementById('slider-quad-a');
  const elB = document.getElementById('slider-quad-b');
  const elC = document.getElementById('slider-quad-c');
  if (elA) elA.value = String(a);
  if (elB) elB.value = String(b);
  if (elC) elC.value = String(c);
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

  document.querySelectorAll('[data-quad-coef]').forEach((btn) => {
    btn.addEventListener('click', () => selectQuadConcept(btn.getAttribute('data-quad-coef')));
  });
  selectQuadConcept('a');

  document.querySelectorAll('[data-quad-preset]').forEach((btn) => {
    btn.addEventListener('click', () => applyQuadPreset(btn.getAttribute('data-quad-preset')));
  });

  renderQuadratic();

  setupModuleStage({
    modId: 'mod-algebra',
    challenges: PARABOLA_CHALLENGES,
    evaluateChallenge: evaluateParabolaChallenge,
    getLabContext: () => ({
      a: parseFloat(document.getElementById('slider-quad-a')?.value || '1'),
      b: parseFloat(document.getElementById('slider-quad-b')?.value || '-2'),
      c: parseFloat(document.getElementById('slider-quad-c')?.value || '-3')
    }),
    onApplySolution: (idx) => {
      if (idx === 0) {
        const elA = document.getElementById('slider-quad-a');
        const elB = document.getElementById('slider-quad-b');
        const elC = document.getElementById('slider-quad-c');
        if (elA) elA.value = '1';
        if (elB) elB.value = '-4';
        if (elC) elC.value = '3';
        renderQuadratic();
      }
    },
    onShowWorkbench: renderQuadratic
  });
}
