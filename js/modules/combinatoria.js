/**
 * EIXO 2: NÚMEROS, SEQUÊNCIAS (PA/PG) & ANÁLISE COMBINATÓRIA
 * Explorador visual Ordem vs Grupo, fórmulas puras testáveis e Prática Híbrida.
 */

import { getState, saveState } from '../state.js';
import { setupModuleStage } from '../utils/module-stage.js';

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

export const COMB_CHALLENGES = [
  {
    type: 'lab',
    prompt: 'Missão no Simulador: Queremos formar uma comissão de 2 representantes (P = 2) entre 6 estudantes (N = 6). Escolha o tipo correto (Ordem NÃO importa vs Ordem importa) e configure os sliders para obter o total de comissões.',
    hints: [
      'Em uma comissão sem cargos distintos, {Ana, Beto} é o mesmo grupo que {Beto, Ana} — portanto use Combinação.',
      'Clique em "Ordem NÃO importa (Combinação)" e ajuste N = 6 e P = 2 para encontrar C(6,2) = 15.'
    ],
    successMessage: 'Exato! Como não há hierarquia na comissão, usamos Combinação: C(6,2) = 30 / 2! = 15 grupos.',
    teacherExplanation: 'Reforçar em aula: quando a pergunta diz "comissão, equipe, duplas, subconjuntos", a ordem dos escolhidos não cria novos grupos (divide por p!).'
  },
  {
    type: 'mc',
    prompt: '(Estilo UNEB) Quantos anagramas distintos podem ser formados com todas as letras da palavra SALVADOR?',
    options: [
      '40.320',
      '20.160',
      '10.080',
      '5.040'
    ],
    correctIndex: 1,
    hints: [
      'Conte o total de letras (8) e observe se alguma letra se repete.',
      'A letra "A" aparece 2 vezes: calcule 8! / 2! = 40.320 / 2.'
    ],
    successMessage: 'Correto! 8 letras com repetição de "A" (2 vezes) geram 8! / 2! = 20.160 anagramas.',
    teacherExplanation: 'Gabarito: B (20.160). Permutação com repetição é recorrente na UNEB; alunos costumam marcar 40.320 (8!) ao esquecer do 2!.'
  },
  {
    type: 'mc',
    prompt: 'Em uma cultura de laboratório, o número de bactérias dobra a cada hora. Partindo de 3 indivíduos (a₁ = 3), qual será o 5º termo dessa progressão?',
    options: [
      '15',
      '32',
      '48',
      '96'
    ],
    correctIndex: 2,
    hints: [
      'Crescer multiplicando por um fator constante (dobrar: q = 2) define uma PG, não uma PA.',
      'Use a₅ = a₁ · q^(5-1) = 3 · 2⁴ = 3 · 16.'
    ],
    successMessage: 'Muito bem! PG com a₁ = 3 e q = 2 resulta em a₅ = 3 · 2⁴ = 48 bactérias.',
    teacherExplanation: 'Gabarito: C (48). Mostrar na lousa que o 5º termo só multiplica a razão 4 vezes (n - 1), evitando o erro de calcular 3 · 2⁵ = 96.'
  }
];

export function evaluateCombChallenge(idx, ctx = {}) {
  const ch = COMB_CHALLENGES[idx];
  if (!ch) return false;
  if (idx === 0) {
    return ctx.n === 6 && ctx.p === 2 && ctx.isCombinationMode === true;
  }
  return ctx.selectedOption === ch.correctIndex;
}

let currentSeqType = 'pa';
let isCombinationMode = false;

function renderSeqVisualBars(terms) {
  const barsContainer = document.getElementById('seq-visual-bars');
  if (!barsContainer) return;
  while (barsContainer.firstChild) barsContainer.removeChild(barsContainer.firstChild);

  const slice = terms.slice(0, 8);
  const absMax = Math.max(1, ...slice.map((v) => Math.abs(v)));

  slice.forEach((val, i) => {
    const col = document.createElement('div');
    col.className = 'flex-1 flex flex-col items-center gap-1 min-w-[24px]';

    const pct = Math.max(10, Math.round((Math.abs(val) / absMax) * 100));
    const barWrap = document.createElement('div');
    barWrap.className = 'w-full h-16 flex items-end justify-center bg-slate-100 rounded p-0.5';

    const bar = document.createElement('div');
    bar.className = currentSeqType === 'pa'
      ? 'w-full rounded-sm bg-uneb-primary transition-all duration-300'
      : 'w-full rounded-sm bg-emerald-600 transition-all duration-300';
    bar.style.height = `${pct}%`;

    const lbl = document.createElement('span');
    lbl.className = 'text-[10px] font-mono text-slate-600 truncate max-w-full';
    lbl.textContent = `a${i + 1}`;

    barWrap.appendChild(bar);
    col.append(barWrap, lbl);
    barsContainer.appendChild(col);
  });
}

function updateOrderModeUI() {
  const btnArr = document.getElementById('comb-mode-arr');
  const btnComb = document.getElementById('comb-mode-comb');
  const cardArr = document.getElementById('card-arranjo');
  const cardComb = document.getElementById('card-combinacao');

  if (btnArr && btnComb) {
    btnArr.setAttribute('aria-pressed', String(!isCombinationMode));
    btnComb.setAttribute('aria-pressed', String(isCombinationMode));
    btnArr.className = !isCombinationMode
      ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm cursor-pointer transition-all'
      : 'px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all';
    btnComb.className = isCombinationMode
      ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm cursor-pointer transition-all'
      : 'px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all';
  }

  if (cardArr) {
    cardArr.className = !isCombinationMode
      ? 'bg-indigo-50 p-3 rounded-lg border-2 border-indigo-500 text-center ring-2 ring-indigo-200 transition-all'
      : 'bg-indigo-50/40 p-3 rounded-lg border border-indigo-200 text-center opacity-70 transition-all';
  }
  if (cardComb) {
    cardComb.className = isCombinationMode
      ? 'bg-emerald-50 p-3 rounded-lg border-2 border-emerald-500 text-center ring-2 ring-emerald-200 transition-all'
      : 'bg-emerald-50/40 p-3 rounded-lg border border-emerald-200 text-center opacity-70 transition-all';
  }
}

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
  const stepBox = document.getElementById('comb-step-formula');

  if (resArranjo) resArranjo.textContent = arranjo.toLocaleString('pt-BR');
  if (resComb) resComb.textContent = combinacao.toLocaleString('pt-BR');
  if (combRatio) combRatio.textContent = factorial(p);
  if (combFormula) combFormula.textContent = `p! = ${p}! = ${factorial(p)}`;
  if (stepBox) {
    stepBox.textContent = isCombinationMode
      ? `C(${n},${p}) = ${n}! / (${p}! · ${n - p}!) = ${arranjo} / ${factorial(p)} = ${combinacao}`
      : `A(${n},${p}) = ${n}! / (${n - p})! = ${arranjo} ordenações distintas`;
  }

  updateOrderModeUI();

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
      tabPa.className = 'px-3 py-1 font-medium bg-uneb-primary text-white rounded-l-lg border border-uneb-primary cursor-pointer';
      tabPg.className = 'px-3 py-1 font-medium bg-white text-slate-700 hover:bg-slate-100 rounded-r-lg border border-slate-300 cursor-pointer';
      tabPa.setAttribute('aria-pressed', 'true');
      tabPg.setAttribute('aria-pressed', 'false');
      label.textContent = 'Razão (r)';
    } else {
      tabPg.className = 'px-3 py-1 font-medium bg-uneb-primary text-white rounded-r-lg border border-uneb-primary cursor-pointer';
      tabPa.className = 'px-3 py-1 font-medium bg-white text-slate-700 hover:bg-slate-100 rounded-l-lg border border-slate-300 cursor-pointer';
      tabPg.setAttribute('aria-pressed', 'true');
      tabPa.setAttribute('aria-pressed', 'false');
      label.textContent = 'Razão (q)';
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

  renderSeqVisualBars(result.terms);

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

  const btnArr = document.getElementById('comb-mode-arr');
  const btnComb = document.getElementById('comb-mode-comb');
  if (btnArr) {
    btnArr.addEventListener('click', () => {
      isCombinationMode = false;
      updateCombinatorics();
    });
  }
  if (btnComb) {
    btnComb.addEventListener('click', () => {
      isCombinationMode = true;
      updateCombinatorics();
    });
  }

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

  setupModuleStage({
    modId: 'mod-numeros',
    challenges: COMB_CHALLENGES,
    evaluateChallenge: evaluateCombChallenge,
    getLabContext: () => ({
      n: parseInt(document.getElementById('slider-n')?.value || '7', 10),
      p: parseInt(document.getElementById('slider-p')?.value || '3', 10),
      isCombinationMode
    }),
    onApplySolution: (idx) => {
      if (idx === 0) {
        const sN = document.getElementById('slider-n');
        const sP = document.getElementById('slider-p');
        if (sN) sN.value = '6';
        if (sP) sP.value = '2';
        isCombinationMode = true;
        updateCombinatorics();
      }
    }
  });
}
