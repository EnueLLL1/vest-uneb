/**
 * EIXO 2: NÚMEROS, SEQUÊNCIAS (PA/PG) & ANÁLISE COMBINATÓRIA
 * Fórmulas puras testáveis e interface interativa com sliders.
 */

import { getState, saveState } from '../state.js';

export function factorial(k) {
  if (k <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= k; i++) res *= i;
  return res;
}

export function calcArranjo(n, p) {
  if (p < 0 || p > n) return 0;
  return factorial(n) / factorial(n - p);
}

export function calcCombinacao(n, p) {
  if (p < 0 || p > n) return 0;
  return calcArranjo(n, p) / factorial(p);
}

export function calcPA(a1, r, n) {
  const an = a1 + (n - 1) * r;
  const sn = ((a1 + an) * n) / 2;
  const terms = [];
  for (let i = 1; i <= Math.min(n, 12); i++) {
    const val = a1 + (i - 1) * r;
    terms.push(Number.isInteger(val) ? val : Math.round(val * 100) / 100);
  }
  return { an, sn, terms };
}

export function calcPG(a1, q, n) {
  const an = a1 * Math.pow(q, n - 1);
  let sn = 0;
  if (q === 1) {
    sn = a1 * n;
  } else {
    sn = (a1 * (Math.pow(q, n) - 1)) / (q - 1);
  }
  const terms = [];
  for (let i = 1; i <= Math.min(n, 10); i++) {
    const val = a1 * Math.pow(q, i - 1);
    terms.push(Number.isInteger(val) ? val : Math.round(val * 100) / 100);
  }
  return { an, sn, terms };
}

let currentSeqType = 'pa';

export function updateCombinatorics() {
  const sliderN = document.getElementById('slider-n');
  const sliderP = document.getElementById('slider-p');
  if (!sliderN || !sliderP) return;

  const n = parseInt(sliderN.value, 10) || 7;
  sliderP.max = n;
  let p = parseInt(sliderP.value, 10) || 3;
  if (p > n) {
    p = n;
    sliderP.value = n;
  }

  const valN = document.getElementById('val-n');
  const valP = document.getElementById('val-p');
  if (valN) valN.textContent = n;
  if (valP) valP.textContent = p;

  const arranjo = calcArranjo(n, p);
  const combinacao = calcCombinacao(n, p);

  const resArranjo = document.getElementById('res-arranjo');
  const resComb = document.getElementById('res-combinacao');
  const combRatio = document.getElementById('comb-ratio');
  const combFormula = document.getElementById('comb-formula');

  if (resArranjo) resArranjo.textContent = arranjo.toLocaleString('pt-BR');
  if (resComb) resComb.textContent = combinacao.toLocaleString('pt-BR');
  if (combRatio) combRatio.textContent = factorial(p);
  if (combFormula) combFormula.textContent = `p! = ${p}! = ${factorial(p)}`;

  const state = getState();
  state.params.sliderN = n;
  state.params.sliderP = p;
  saveState();
}

export function setSeqType(type) {
  currentSeqType = type;
  const tabPa = document.getElementById('tab-pa');
  const tabPg = document.getElementById('tab-pg');
  const label = document.getElementById('seq-raz-label');

  if (tabPa && tabPg && label) {
    if (type === 'pa') {
      tabPa.className = 'px-3 py-1 font-medium bg-uneb-primary text-white rounded-l-lg border border-uneb-primary';
      tabPg.className = 'px-3 py-1 font-medium bg-white text-slate-700 hover:bg-slate-100 rounded-r-lg border border-slate-300';
      label.innerHTML = 'Razão (<span class="math-font">r</span>)';
    } else {
      tabPg.className = 'px-3 py-1 font-medium bg-uneb-primary text-white rounded-r-lg border border-uneb-primary';
      tabPa.className = 'px-3 py-1 font-medium bg-white text-slate-700 hover:bg-slate-100 rounded-l-lg border border-slate-300';
      label.innerHTML = 'Razão (<span class="math-font">q</span>)';
    }
  }
  const state = getState();
  state.params.seqType = type;
  calculateSequence();
}

export function calculateSequence() {
  const elA1 = document.getElementById('seq-a1');
  const elRaz = document.getElementById('seq-raz');
  const elN = document.getElementById('seq-n');
  if (!elA1 || !elRaz || !elN) return;

  const a1 = parseFloat(elA1.value) || 0;
  const r = parseFloat(elRaz.value) || 0;
  const n = Math.max(1, parseInt(elN.value, 10) || 1);

  const termLabel = document.getElementById('seq-term-label');
  const sumLabel = document.getElementById('seq-sum-label');
  if (termLabel) termLabel.textContent = `a${n}`;
  if (sumLabel) sumLabel.textContent = `S${n}`;

  const result = currentSeqType === 'pa' ? calcPA(a1, r, n) : calcPG(a1, r, n);

  const resAn = document.getElementById('seq-res-an');
  const resSn = document.getElementById('seq-res-sn');
  const preview = document.getElementById('seq-preview');

  if (resAn) resAn.textContent = Number.isFinite(result.an) ? result.an.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : 'Muito grande';
  if (resSn) resSn.textContent = Number.isFinite(result.sn) ? result.sn.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : 'Infinito/Indefinido';
  if (preview) preview.textContent = result.terms.join(', ') + (n > result.terms.length ? '...' : '');

  const state = getState();
  state.params.seqA1 = a1;
  state.params.seqRaz = r;
  state.params.seqN = n;
  state.params.seqType = currentSeqType;
  saveState();
}

export function initCombinatoria() {
  const sliderN = document.getElementById('slider-n');
  const sliderP = document.getElementById('slider-p');
  if (sliderN) sliderN.addEventListener('input', updateCombinatorics);
  if (sliderP) sliderP.addEventListener('input', updateCombinatorics);

  const tabPa = document.getElementById('tab-pa');
  const tabPg = document.getElementById('tab-pg');
  if (tabPa) tabPa.addEventListener('click', () => setSeqType('pa'));
  if (tabPg) tabPg.addEventListener('click', () => setSeqType('pg'));

  const elA1 = document.getElementById('seq-a1');
  const elRaz = document.getElementById('seq-raz');
  const elN = document.getElementById('seq-n');
  if (elA1) elA1.addEventListener('input', calculateSequence);
  if (elRaz) elRaz.addEventListener('input', calculateSequence);
  if (elN) elN.addEventListener('input', calculateSequence);

  updateCombinatorics();
  calculateSequence();
}
