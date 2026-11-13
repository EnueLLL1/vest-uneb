/**
 * EIXO 6: STURGES E ESTATÍSTICA DESCRITIVA
 * Explorador Apêndice A (Excel), ROL visual ordenado, tabela de frequência, Histograma Canvas e Prática Híbrida.
 */

import { setupCanvasResolution } from '../utils/canvas.js';
import { getState, saveState } from '../state.js';
import { setupModuleStage } from '../utils/module-stage.js';

export const STAT_PRESETS = {
  quick: '15, 22, 22, 28, 35, 40, 42, 50, 50, 50, 62',
  rat: '52, 55, 56, 58, 60, 61, 62, 63, 64, 65, 65, 66, 67, 68, 68, 69, 70, 70, 71, 72, 72, 73, 74, 75, 75, 76, 77, 78, 78, 79, 80, 81, 82, 82, 83, 84, 85, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 98',
  fans: '12, 14, 15, 15, 16, 18, 18, 19, 20, 20, 20, 22, 24, 25, 25, 26, 28, 30, 32, 35',
  ufsc: '120, 145, 180, 210, 245, 280, 310, 340, 390, 450, 510, 580, 640, 710, 820'
};

const STAT_CHARTS_GUIDE = {
  barra: {
    title: 'Colunas / Barras (Comparação Categórica)',
    when: 'Ideal para comparar quantidades entre categorias discretas (ex: candidatos por curso, vendas por loja). Possui espaço entre as barras.'
  },
  linha: {
    title: 'Linhas (Evolução Temporal Contínua)',
    when: 'Padrão-ouro para séries ao longo do tempo (ex: inflação mês a mês, temperatura ao longo do dia). Evidencia tendências e inclinações.'
  },
  setor: {
    title: 'Setores / Pizza (Proporção do Todo = 100%)',
    when: 'Mostra a participação percentual de poucas categorias (idealmente 2 a 5 fatias). Evite quando há muitas categorias ou valores parecidos.'
  },
  hist: {
    title: 'Histograma (Distribuição em Classes Contínuas)',
    when: 'Barras coladas sem espaço entre si porque representam intervalos numéricos contínuos definidos pela Regra de Sturges!'
  }
};

export const STATS_CHALLENGES = [
  {
    type: 'lab',
    prompt: 'Missão no Simulador: Digite ou ajuste os dados no campo de amostra para obter um conjunto com pelo menos 8 elementos onde Média e Mediana sejam ambas iguais a 7,00.',
    hints: [
      'A Mediana de uma lista ordenada par é a média dos dois termos centrais; distribua valores simétricos em torno de 7.',
      'Experimente por exemplo: 4, 6, 7, 7, 7, 8, 8, 9 (soma 56 para 8 itens ⇒ Média = 7,00 e centro = 7,00).'
    ],
    successMessage: 'Excelente! Sua amostra simétrica equilibrou Média = 7,00 e Mediana = 7,00 com distribuição válida.',
    teacherExplanation: 'Mostrar no ROL ordenado abaixo que qualquer amostra simétrica em torno de 7 faz Média e Mediana coincidirem (ex.: 4, 6, 7, 7, 7, 8, 8, 9).'
  },
  {
    type: 'mc',
    prompt: '(Estilo UNEB) Em um grupo de 6 candidatos, as notas ordenadas foram: [5, 6, 7, 9, 9, 10]. Qual é a MEDIANA desse conjunto?',
    options: [
      '7,0',
      '8,0',
      '8,5',
      '9,0'
    ],
    correctIndex: 1,
    hints: [
      'Como n = 6 é par, não há apenas 1 termo central: pegue o 3º e o 4º valores do rol ordenado.',
      'Calcule a média aritmética entre o 3º termo (7) e o 4º termo (9): (7 + 9) / 2 = 8.'
    ],
    successMessage: 'Correto! Com número par de termos ordenados, a mediana é a média entre 7 e 9: 8,0.',
    teacherExplanation: 'Gabarito: B (8,0). Destacar que D (9,0) é a Moda, e lembrar sempre de ORDENAR os dados antes de achar a posição central.'
  },
  {
    type: 'mc',
    prompt: 'Qual gráfico do Excel/UNEB (Apêndice A) é o mais indicado para visualizar a variação contínua da temperatura em Salvador ao longo das 24 horas do dia?',
    options: [
      'Gráfico de Linhas',
      'Gráfico de Setores (Pizza)',
      'Gráfico de Radar',
      'Histograma sem eixo temporal'
    ],
    correctIndex: 0,
    hints: [
      'Observe qual tipo de variável está no eixo X: tempo contínuo (horas do dia).',
      'Séries temporais pedem continuidade visual de pontos conectados por segmento: Gráfico de Linhas.'
    ],
    successMessage: 'Isso mesmo! O Gráfico de Linhas evidencia a taxa de variação e picos ao longo do tempo.',
    teacherExplanation: 'Gabarito: A. Setores (B) comparam partes de um todo estático, nunca evolução temporal.'
  }
];

export function evaluateStatsChallenge(idx, ctx = {}) {
  const ch = STATS_CHALLENGES[idx];
  if (!ch) return false;
  if (idx === 0) {
    if (!Array.isArray(ctx.values) || ctx.values.length < 8) return false;
    const sorted = [...ctx.values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (sorted.length < 8) return false;
    const stats = computeStatsFromData(sorted);
    return stats !== null && Math.abs(stats.media - 7) < 0.05 && Math.abs(stats.mediana - 7) < 0.05;
  }
  return ctx.selectedOption === ch.correctIndex;
}

export function calcSturgesFormula(n, aa) {
  const safeN = Number.isFinite(n) ? Math.max(2, n) : 50;
  const safeAA = Number.isFinite(aa) ? Math.max(0.1, aa) : 20;

  const rawI = 1 + (3.3 * Math.log10(safeN));
  const roundedI = Math.max(1, Math.round(rawI));
  const h = safeAA / roundedI;
  const sugH = h < 1 ? (Math.round(h * 10) / 10) : Math.ceil(h);

  return { rawI, roundedI, h, sugH };
}

export function computeStatsFromData(values) {
  if (!values || values.length === 0) return null;

  const soma = values.reduce((acc, curr) => acc + curr, 0);
  const media = soma / values.length;

  let mediana = 0;
  const mid = Math.floor(values.length / 2);
  if (values.length % 2 === 0) {
    mediana = (values[mid - 1] + values[mid]) / 2;
  } else {
    mediana = values[mid];
  }

  const freqs = {};
  let maxFreq = 0;
  values.forEach(v => {
    freqs[v] = (freqs[v] || 0) + 1;
    if (freqs[v] > maxFreq) maxFreq = freqs[v];
  });
  const modas = Object.keys(freqs).filter(k => freqs[k] === maxFreq && maxFreq > 1);
  const modaText = modas.length > 0 ? modas.join(', ') : 'Amodal';

  const variance = values.length > 1
    ? values.reduce((acc, curr) => acc + Math.pow(curr - media, 2), 0) / (values.length - 1)
    : 0;
  const desvio = Math.sqrt(variance);

  return { media, mediana, modaText, desvio, count: values.length };
}

export function calcSturges() {
  const elN = document.getElementById('sturges-n');
  const elAA = document.getElementById('sturges-aa');
  if (!elN || !elAA) return;

  const n = parseInt(elN.value, 10);
  const aa = parseFloat(elAA.value);

  const { rawI, roundedI, h, sugH } = calcSturgesFormula(n, aa);

  const resI = document.getElementById('sturges-res-i');
  const resH = document.getElementById('sturges-res-h');

  if (resI) resI.textContent = `${rawI.toFixed(2)} ≈ ${roundedI} classes`;
  if (resH) resH.textContent = `h = ${h.toFixed(2)} (sugere-se ${sugH})`;

  const state = getState();
  state.params.sturgesN = n;
  state.params.sturgesAA = aa;
  saveState();
}

function buildFrequencyClasses(values) {
  const minVal = values[0];
  const maxVal = values[values.length - 1];
  const range = maxVal - minVal;

  const numClasses = Math.max(1, Math.min(8, Math.round(1 + (3.3 * Math.log10(values.length)))));
  const classWidth = range > 0 ? (range / numClasses) : 1;

  const classCounts = new Array(numClasses).fill(0);
  const classRanges = [];

  for (let i = 0; i < numClasses; i++) {
    const lower = minVal + (i * classWidth);
    const upper = (i === numClasses - 1) ? maxVal + 0.001 : (lower + classWidth);
    const dispUpper = (i === numClasses - 1) ? maxVal : (lower + classWidth);
    classRanges.push({
      lower,
      upper,
      label: lower.toFixed(1),
      rangeLabel: `${lower.toFixed(1)} ⊢ ${dispUpper.toFixed(1)}`
    });
  }

  values.forEach(v => {
    for (let i = 0; i < numClasses; i++) {
      if (v >= classRanges[i].lower && v < classRanges[i].upper) {
        classCounts[i]++;
        break;
      }
    }
  });

  return { minVal, maxVal, numClasses, classCounts, classRanges };
}

function renderStatRolAndTable(values, stats) {
  const rolEl = document.getElementById('stat-rol-chips');
  if (rolEl) {
    while (rolEl.firstChild) rolEl.removeChild(rolEl.firstChild);
    const limit = Math.min(values.length, 24);
    const n = values.length;
    const midA = n % 2 === 0 ? (n / 2) - 1 : Math.floor(n / 2);
    const midB = n % 2 === 0 ? (n / 2) : Math.floor(n / 2);
    const modalNums = stats.modaText === 'Amodal'
      ? new Set()
      : new Set(stats.modaText.split(',').map((s) => parseFloat(s.trim())));

    values.slice(0, limit).forEach((v, idx) => {
      const chip = document.createElement('span');
      const isMedianPos = idx === midA || idx === midB;
      const isMode = modalNums.has(v);
      let cls = 'px-2 py-0.5 rounded text-[11px] font-mono border ';
      if (isMedianPos && isMode) {
        cls += 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold';
      } else if (isMedianPos) {
        cls += 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
      } else if (isMode) {
        cls += 'bg-sky-50 border-sky-400 text-sky-900 font-semibold';
      } else {
        cls += 'bg-white border-slate-200 text-slate-700';
      }
      chip.className = cls;
      chip.textContent = String(v);
      rolEl.appendChild(chip);
    });
    if (values.length > limit) {
      const more = document.createElement('span');
      more.className = 'text-[11px] font-mono text-slate-500 self-center';
      more.textContent = `+${values.length - limit} itens`;
      rolEl.appendChild(more);
    }
  }

  const freqBody = document.getElementById('stat-freq-rows');
  if (freqBody && values.length > 0) {
    while (freqBody.firstChild) freqBody.removeChild(freqBody.firstChild);
    const { classCounts, classRanges } = buildFrequencyClasses(values);
    let fac = 0;
    classCounts.forEach((fi, i) => {
      fac += fi;
      const fr = (fi / values.length) * 100;
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 text-slate-700';
      [classRanges[i].rangeLabel, String(fi), `${fr.toFixed(1)}%`, String(fac)].forEach((txt, cIdx) => {
        const td = document.createElement('td');
        td.className = 'py-1 px-2 font-mono text-[11px] ' + (cIdx > 0 ? 'text-right' : 'text-left');
        td.textContent = txt;
        tr.appendChild(td);
      });
      freqBody.appendChild(tr);
    });
  }
}

export function renderHistogramCanvas(values) {
  const canvas = document.getElementById('canvas-stat');
  const res = setupCanvasResolution(canvas);
  if (!res) return;
  const { ctx, width: w, height: h } = res;

  ctx.clearRect(0, 0, w, h);
  if (!values || values.length === 0) return;

  const { maxVal, numClasses, classCounts, classRanges } = buildFrequencyClasses(values);

  const maxCount = Math.max(...classCounts, 1);
  const padX = 28;
  const padRight = 24;
  const padBottom = 26;
  const padTop = 24;
  const plotW = Math.max(10, w - padX - padRight);
  const plotH = Math.max(10, h - padTop - padBottom);
  const barWidth = Math.max(8, (plotW / numClasses) - 4);

  classCounts.forEach((count, idx) => {
    const barH = (count / maxCount) * plotH;
    const x = padX + (idx * (plotW / numClasses)) + 2;
    const y = h - padBottom - barH;

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x, y, barWidth, barH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barH);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(count), x + (barWidth / 2), Math.max(14, y - 6));

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText(classRanges[idx].label, x, h - 8);
  });

  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(maxVal.toFixed(1), padX + plotW, h - 8);
  ctx.textAlign = 'left';
}

function parseStatValues(raw) {
  return raw.split(/[,\s;]+/)
    .map(x => parseFloat(x.trim()))
    .filter(x => !isNaN(x))
    .sort((a, b) => a - b);
}

export function calculateStatistics() {
  const inputEl = document.getElementById('stat-input-data');
  if (!inputEl) return;

  const raw = inputEl.value;
  const values = parseStatValues(raw);

  const countEl = document.getElementById('stat-count-items');
  const resMedia = document.getElementById('stat-res-media');
  const resMediana = document.getElementById('stat-res-mediana');
  const resModa = document.getElementById('stat-res-moda');
  const resDesvio = document.getElementById('stat-res-desvio');

  if (values.length === 0) {
    if (countEl) countEl.textContent = '0 elementos';
    if (resMedia) resMedia.textContent = '—';
    if (resMediana) resMediana.textContent = '—';
    if (resModa) resModa.textContent = '—';
    if (resDesvio) resDesvio.textContent = '—';
    const res = setupCanvasResolution(document.getElementById('canvas-stat'));
    if (res) res.ctx.clearRect(0, 0, res.width, res.height);
    const rolEl = document.getElementById('stat-rol-chips');
    if (rolEl) while (rolEl.firstChild) rolEl.removeChild(rolEl.firstChild);
    const freqBody = document.getElementById('stat-freq-rows');
    if (freqBody) while (freqBody.firstChild) freqBody.removeChild(freqBody.firstChild);
    const state = getState();
    state.params.statData = raw;
    saveState();
    return;
  }

  const stats = computeStatsFromData(values);
  if (!stats) return;

  if (countEl) countEl.textContent = `${stats.count} elementos`;
  if (resMedia) resMedia.textContent = stats.media.toFixed(2);
  if (resMediana) resMediana.textContent = stats.mediana.toFixed(2);
  if (resModa) resModa.textContent = stats.modaText;
  if (resDesvio) resDesvio.textContent = stats.desvio.toFixed(2);

  renderStatRolAndTable(values, stats);
  renderHistogramCanvas(values);

  const state = getState();
  state.params.statData = raw;
  saveState();
}

export function loadStatPreset(key) {
  if (STAT_PRESETS[key]) {
    const inputEl = document.getElementById('stat-input-data');
    if (inputEl) inputEl.value = STAT_PRESETS[key];
    calculateStatistics();
  }
}

function selectStatChartConcept(key) {
  const info = STAT_CHARTS_GUIDE[key];
  if (!info) return;

  document.querySelectorAll('[data-stat-chart]').forEach((btn) => {
    const active = btn.getAttribute('data-stat-chart') === key;
    btn.setAttribute('aria-pressed', String(active));
    btn.className = active
      ? 'px-3 py-2 rounded-lg text-xs font-bold bg-sky-600 text-white shadow-sm cursor-pointer transition-all text-left'
      : 'px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-sky-300 cursor-pointer transition-all text-left';
  });

  const titleEl = document.getElementById('stat-chart-title');
  const descEl = document.getElementById('stat-chart-desc');
  if (titleEl) titleEl.textContent = info.title;
  if (descEl) descEl.textContent = info.when;
}

export function initStats() {
  const elN = document.getElementById('sturges-n');
  const elAA = document.getElementById('sturges-aa');
  if (elN) elN.addEventListener('input', calcSturges);
  if (elAA) elAA.addEventListener('input', calcSturges);

  const inputEl = document.getElementById('stat-input-data');
  const btnCalc = document.getElementById('btn-calc-stats');
  if (inputEl) inputEl.addEventListener('change', calculateStatistics);
  if (btnCalc) btnCalc.addEventListener('click', calculateStatistics);

  document.querySelectorAll('[data-stat-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-stat-preset');
      loadStatPreset(presetKey);
    });
  });

  document.querySelectorAll('[data-stat-chart]').forEach(btn => {
    btn.addEventListener('click', () => selectStatChartConcept(btn.getAttribute('data-stat-chart')));
  });
  selectStatChartConcept('hist');

  calcSturges();
  calculateStatistics();

  setupModuleStage({
    modId: 'mod-estatistica',
    challenges: STATS_CHALLENGES,
    evaluateChallenge: evaluateStatsChallenge,
    getLabContext: () => ({
      values: parseStatValues(document.getElementById('stat-input-data')?.value || '')
    }),
    onApplySolution: (idx) => {
      if (idx === 0) {
        if (inputEl) inputEl.value = '4, 6, 7, 7, 7, 8, 8, 9';
        calculateStatistics();
      }
    },
    onShowWorkbench: calculateStatistics
  });
}
