/**
 * EIXO 6: STURGES E ESTATÍSTICA DESCRITIVA
 * Fórmulas puras (Sturges, Média, Mediana, Moda, Desvio Padrão) e Histograma Canvas 2D.
 */

import { setupCanvasResolution } from '../utils/canvas.js';
import { getState, saveState } from '../state.js';

export const STAT_PRESETS = {
  quick: '15, 22, 22, 28, 35, 40, 42, 50, 50, 50, 62',
  rat: '52, 55, 56, 58, 60, 61, 62, 63, 64, 65, 65, 66, 67, 68, 68, 69, 70, 70, 71, 72, 72, 73, 74, 75, 75, 76, 77, 78, 78, 79, 80, 81, 82, 82, 83, 84, 85, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 98',
  fans: '12, 14, 15, 15, 16, 18, 18, 19, 20, 20, 20, 22, 24, 25, 25, 26, 28, 30, 32, 35',
  ufsc: '120, 145, 180, 210, 245, 280, 310, 340, 390, 450, 510, 580, 640, 710, 820'
};

export function calcSturgesFormula(n, aa) {
  const safeN = Math.max(2, n || 50);
  const safeAA = Math.max(0.1, aa || 20);

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

export function renderHistogramCanvas(values) {
  const canvas = document.getElementById('canvas-stat');
  const res = setupCanvasResolution(canvas);
  if (!res) return;
  const { ctx, width: w, height: h } = res;

  ctx.clearRect(0, 0, w, h);
  if (!values || values.length === 0) return;

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
    classRanges.push({ lower, upper, label: lower.toFixed(1) });
  }

  values.forEach(v => {
    for (let i = 0; i < numClasses; i++) {
      if (v >= classRanges[i].lower && v < classRanges[i].upper) {
        classCounts[i]++;
        break;
      }
    }
  });

  const maxCount = Math.max(...classCounts, 1);
  const padX = 35;
  const padBottom = 26;
  const padTop = 20;
  const plotW = w - padX - 15;
  const plotH = h - padTop - padBottom;
  const barWidth = Math.max(8, (plotW / numClasses) - 4);

  classCounts.forEach((count, idx) => {
    const barH = (count / maxCount) * plotH;
    const x = padX + (idx * (plotW / numClasses)) + 2;
    const y = h - padBottom - barH;

    // Barra
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x, y, barWidth, barH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barH);

    // Frequência
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '10px monospace';
    ctx.fillText(count, x + (barWidth / 2) - 3, Math.max(12, y - 4));

    // Rótulo da classe
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(classRanges[idx].label, x, h - 8);
  });

  // Limite final
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText(maxVal.toFixed(1), padX + plotW - 14, h - 8);
}

export function calculateStatistics() {
  const inputEl = document.getElementById('stat-input-data');
  if (!inputEl) return;

  const raw = inputEl.value;
  const values = raw.split(/[,\s;]+/)
    .map(x => parseFloat(x.trim()))
    .filter(x => !isNaN(x))
    .sort((a, b) => a - b);

  if (values.length === 0) return;

  const stats = computeStatsFromData(values);
  if (!stats) return;

  const countEl = document.getElementById('stat-count-items');
  const resMedia = document.getElementById('stat-res-media');
  const resMediana = document.getElementById('stat-res-mediana');
  const resModa = document.getElementById('stat-res-moda');
  const resDesvio = document.getElementById('stat-res-desvio');

  if (countEl) countEl.textContent = `${stats.count} elementos`;
  if (resMedia) resMedia.textContent = stats.media.toFixed(2);
  if (resMediana) resMediana.textContent = stats.mediana.toFixed(2);
  if (resModa) resModa.textContent = stats.modaText;
  if (resDesvio) resDesvio.textContent = stats.desvio.toFixed(2);

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

  calcSturges();
  calculateStatistics();
}
