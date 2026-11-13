/**
 * EIXO 5: MATEMÁTICA FINANCEIRA (SIMPLES VS. COMPOSTO)
 * Explorador conceitual PA vs PG & À Vista vs Parcelado, evolução período a período e Prática Híbrida.
 */

import { setupCanvasResolution } from '../utils/canvas.js';
import { getState, saveState } from '../state.js';
import { setupModuleStage } from '../utils/module-stage.js';

const FIN_CONCEPTS = {
  regimes: {
    title: 'Juros Simples (PA) vs. Juros Compostos (PG)',
    formula: 'Simples: M = C·(1 + i·t)   |   Composto: M = C·(1 + i)^t',
    desc: 'Nos Juros Simples, os juros incidem sempre sobre o capital inicial (crescimento linear em reta). Nos Compostos, rendem "juros sobre juros" (exponencial).'
  },
  avista: {
    title: 'Armadilha clássica: Desconto À Vista vs. Juros no Parcelado',
    formula: 'Taxa real i = (Preço_Parcelado / Preço_À_Vista) - 1',
    desc: 'Se um item de R$ 100 sai por R$ 90 à vista ou R$ 100 após 1 mês, os juros pagos NÃO são 10%! Você paga R$ 10 sobre R$ 90 financiados: 10/90 ≈ 11,11%.'
  },
  sucessivos: {
    title: 'Aumentos e Descontos Sucessivos (Fator Multiplicativo)',
    formula: 'Fator = (1 + i₁) · (1 - d₂) ...  ≠  soma direta das porcentagens!',
    desc: 'Subir 10% e depois cair 10% resulta em 1,10 · 0,90 = 0,99 (redução líquida de 1%), nunca volta ao mesmo preço original!'
  }
};

export const FINANCAS_CHALLENGES = [
  {
    type: 'lab',
    prompt: 'Missão no Simulador: Configure Capital = R$ 2.000, Taxa = 10% ao período e Tempo = 2 períodos para comparar os dois regimes em aula.',
    hints: [
      'Digite 2000 no campo Capital (R$), arraste a Taxa para 10% e o Tempo para 2.',
      'Com esses valores, o Simples dá R$ 2.400,00 e o Composto alcança R$ 2.420,00 (diferença de R$ 20,00).'
    ],
    successMessage: 'Correto! 10% sobre os R$ 200 de juros do 1º mês geram exatos R$ 20 extras no 2º mês.',
    teacherExplanation: 'Mostrar na tabela de evolução abaixo que no t=1 ambos empatam em R$ 2.200, e só a partir de t=2 nasce o "juros sobre juros" (+R$ 20).'
  },
  {
    type: 'mc',
    prompt: '(Estilo UNEB) Um boleto de R$ 500,00 sofreu dois reajustes compostos sucessivos de 10%. Qual é o valor final corrigido?',
    options: [
      'R$ 550,00',
      'R$ 600,00',
      'R$ 605,00',
      'R$ 610,00'
    ],
    correctIndex: 2,
    hints: [
      'Não some 10% + 10% = 20% (isso seria juro simples = R$ 600). Multiplique pelo fator 1,10 duas vezes.',
      'Calcule 500 · 1,10 · 1,10 = 500 · 1,21 = 605.'
    ],
    successMessage: 'Excelente! 500 · (1,10)² = R$ 605,00 (aumento equivalente a 21%, não 20%).',
    teacherExplanation: 'Gabarito: C (R$ 605,00). Reforçar o conceito de fator multiplicativo (1,10 × 1,10 = 1,21).'
  },
  {
    type: 'mc',
    prompt: 'Uma TV custa R$ 2.000,00 no cartão em 30 dias ("sem acréscimo") ou tem 10% de desconto à vista (R$ 1.800,00). Qual a taxa mensal aproximada embutida para quem escolhe pagar em 30 dias?',
    options: [
      '10,00%',
      '11,11%',
      '12,50%',
      '9,00%'
    ],
    correctIndex: 1,
    hints: [
      'O valor realmente financiado ao cliente é o preço à vista (R$ 1.800), e não R$ 2.000.',
      'Os juros pagos são R$ 200 sobre R$ 1.800: divida 200 / 1800 = 1/9 ≈ 0,1111.'
    ],
    successMessage: 'Acertou! A taxa real incide sobre o valor à vista: 200 / 1800 = 11,11% ao mês.',
    teacherExplanation: 'Gabarito: B (11,11%). Questão clássica da UNEB de matemática financeira aplicada ao cotidiano.'
  }
];

export function evaluateFinancasChallenge(idx, ctx = {}) {
  const ch = FINANCAS_CHALLENGES[idx];
  if (!ch) return false;
  if (idx === 0) {
    return (
      Math.abs(Number(ctx.capital) - 2000) < 0.01 &&
      Math.abs(Number(ctx.rate) - 10) < 0.01 &&
      Number(ctx.time) === 2
    );
  }
  return ctx.selectedOption === ch.correctIndex;
}

export function calcJuros(capital, taxaPercent, tempo) {
  const c = Number.isFinite(capital) ? Math.max(0, capital) : 1000;
  const i = Number.isFinite(taxaPercent) ? Math.max(0, taxaPercent) / 100 : 0.1;
  const t = Number.isFinite(tempo) ? Math.max(0, tempo) : 6;

  const montanteSimples = c * (1 + (i * t));
  const montanteComposto = c * Math.pow(1 + i, t);
  const diff = montanteComposto - montanteSimples;

  return { c, i, t, montanteSimples, montanteComposto, diff };
}

function renderEvolutionRows(c, i, t) {
  const tbody = document.getElementById('fin-evolution-rows');
  if (!tbody) return;
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

  const periodsToShow = [];
  if (t <= 6) {
    for (let p = 0; p <= t; p++) periodsToShow.push(p);
  } else {
    for (let p = 0; p <= 4; p++) periodsToShow.push(p);
    periodsToShow.push(t);
  }

  const fmt = (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  periodsToShow.forEach((p, idx) => {
    const ms = c * (1 + i * p);
    const mc = c * Math.pow(1 + i, p);
    const diff = mc - ms;

    const tr = document.createElement('tr');
    tr.className = idx === periodsToShow.length - 1
      ? 'bg-emerald-50/70 font-semibold text-slate-900'
      : 'text-slate-600 border-b border-slate-100';

    const cells = [
      p === 0 ? 'Inicial (t=0)' : `t = ${p}`,
      fmt(ms),
      fmt(mc),
      `+ ${fmt(diff)}`
    ];
    cells.forEach((txt, cIdx) => {
      const td = document.createElement('td');
      td.className = 'py-1.5 px-2 font-mono text-[11px] ' + (cIdx === 3 ? 'text-amber-700 font-bold text-right' : cIdx > 0 ? 'text-right' : 'text-left');
      td.textContent = txt;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

export function renderFinance() {
  const elC = document.getElementById('fin-capital');
  const elI = document.getElementById('fin-taxa');
  const elT = document.getElementById('fin-tempo');
  if (!elC || !elI || !elT) return;

  const rawC = parseFloat(elC.value);
  const rawI = parseFloat(elI.value);
  const rawT = parseInt(elT.value, 10);

  const { c, i, t, montanteSimples, montanteComposto, diff } = calcJuros(rawC, rawI, rawT);

  const labelRate = document.getElementById('label-fin-rate');
  const labelTime = document.getElementById('label-fin-time');
  const resSimple = document.getElementById('fin-res-simple');
  const resComp = document.getElementById('fin-res-comp');
  const resDiff = document.getElementById('fin-res-diff');
  const formulaSteps = document.getElementById('fin-formula-steps');

  if (labelRate) labelRate.textContent = `${(i * 100).toFixed(1)}% ao período`;
  if (labelTime) labelTime.textContent = `${t} período${t === 1 ? '' : 's'}`;
  if (resSimple) resSimple.textContent = `R$ ${montanteSimples.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (resComp) resComp.textContent = `R$ ${montanteComposto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (resDiff) resDiff.textContent = `R$ ${diff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (formulaSteps) {
    formulaSteps.textContent = `Simples: ${c}·(1 + ${i.toFixed(2)}·${t}) = ${montanteSimples.toFixed(2)}  |  Composto: ${c}·(${(1 + i).toFixed(2)})^${t} = ${montanteComposto.toFixed(2)}`;
  }

  renderEvolutionRows(c, i, t);

  const canvas = document.getElementById('canvas-finance');
  const res = setupCanvasResolution(canvas);
  if (!res) return;
  const { ctx, width: w, height: h } = res;

  ctx.clearRect(0, 0, w, h);

  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const plotW = Math.max(10, w - padLeft - padRight);
  const plotH = Math.max(10, h - padTop - padBottom);

  const minVal = c * 0.9;
  const maxVal = Math.max(minVal + 10, montanteComposto * 1.08);
  const range = Math.max(1, maxVal - minVal);

  const safePlotT = Math.max(1, t);
  function getX(period) {
    return padLeft + (period / safePlotT) * plotW;
  }
  function getY(val) {
    return padTop + plotH - ((val - minVal) / range) * plotH;
  }

  // Grade e Eixos
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  const stepT = t > 10 ? 2 : 1;
  for (let p = 0; p <= t; p += stepT) {
    const x = getX(p);
    ctx.beginPath();
    ctx.moveTo(x, padTop);
    ctx.lineTo(x, padTop + plotH);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText(`t=${p}`, x - 8, h - 10);
  }

  // Linha Juros Simples
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let p = 0; p <= t; p++) {
    const v = c * (1 + (i * p));
    const x = getX(p);
    const y = getY(v);
    if (p === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Linha Juros Compostos
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let p = 0; p <= t; p++) {
    const v = c * Math.pow(1 + i, p);
    const x = getX(p);
    const y = getY(v);
    if (p === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const state = getState();
  state.params.finCapital = c;
  state.params.finTaxa = i * 100;
  state.params.finTempo = t;
  saveState();
}

function selectFinConcept(key) {
  const data = FIN_CONCEPTS[key];
  if (!data) return;

  document.querySelectorAll('[data-fin-concept]').forEach((btn) => {
    const active = btn.getAttribute('data-fin-concept') === key;
    btn.setAttribute('aria-pressed', String(active));
    btn.className = active
      ? 'px-3 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white shadow-sm cursor-pointer transition-all text-left'
      : 'px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-amber-300 cursor-pointer transition-all text-left';
  });

  const titleEl = document.getElementById('fin-concept-title');
  const formEl = document.getElementById('fin-concept-formula');
  const descEl = document.getElementById('fin-concept-desc');
  if (titleEl) titleEl.textContent = data.title;
  if (formEl) formEl.textContent = data.formula;
  if (descEl) descEl.textContent = data.desc;
}

export function initFinancas() {
  const elC = document.getElementById('fin-capital');
  const elI = document.getElementById('fin-taxa');
  const elT = document.getElementById('fin-tempo');

  if (elC) elC.addEventListener('input', renderFinance);
  if (elI) elI.addEventListener('input', renderFinance);
  if (elT) elT.addEventListener('input', renderFinance);

  document.querySelectorAll('[data-fin-concept]').forEach((btn) => {
    btn.addEventListener('click', () => selectFinConcept(btn.getAttribute('data-fin-concept')));
  });
  selectFinConcept('regimes');

  document.querySelectorAll('[data-fin-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-fin-preset');
      const map = {
        curto: [1000, 10, 3],
        poupanca: [5000, 1, 12],
        cartao: [1500, 12, 6]
      };
      const vals = map[preset];
      if (!vals) return;
      if (elC) elC.value = String(vals[0]);
      if (elI) elI.value = String(vals[1]);
      if (elT) elT.value = String(vals[2]);
      renderFinance();
    });
  });

  renderFinance();

  setupModuleStage({
    modId: 'mod-financas',
    challenges: FINANCAS_CHALLENGES,
    evaluateChallenge: evaluateFinancasChallenge,
    getLabContext: () => ({
      capital: parseFloat(document.getElementById('fin-capital')?.value || '0'),
      rate: parseFloat(document.getElementById('fin-taxa')?.value || '0'),
      time: parseInt(document.getElementById('fin-tempo')?.value || '0', 10)
    }),
    onApplySolution: (idx) => {
      if (idx === 0) {
        if (elC) elC.value = '2000';
        if (elI) elI.value = '10';
        if (elT) elT.value = '2';
        renderFinance();
      }
    },
    onShowWorkbench: renderFinance
  });
}
