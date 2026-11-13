/**
 * EIXO 1: LÓGICA MATEMÁTICA
 * Explorador conceitual, Tabela-Verdade dinâmica em 4 linhas e Prática Híbrida.
 */

import { setupModuleStage } from '../utils/module-stage.js';

let propP = true;
let propQ = true;

const LOGIC_RULES = {
  condicional: {
    title: 'Condicional (P → Q)',
    formula: 'P → Q só é FALSO quando P = V e Q = F (Vera Fischer)',
    example: 'Promessa: "Se chover (P), então levo guarda-chuva (Q)". Só quebro a promessa se chover (V) e eu não levar (F).',
    tip: 'Dica UNEB: Se a condição P for falsa, a condicional inteira já é verdadeira automaticamente.'
  },
  negacao: {
    title: 'Negação da Condicional ~(P → Q)',
    formula: '~(P → Q) ≡ P ∧ ~Q  (Regra do MANÉ: MAntém a 1ª E NEga a 2ª)',
    example: 'Negar "Se estudar, passo" é dizer: "Estudei (P) E não passei (~Q)". Nunca use "Se... então" para negar!',
    tip: 'Pegadinha clássica: A negação de "Se P então Q" NÃO é "Se não P então não Q".'
  },
  contrapositiva: {
    title: 'Equivalência Contrapositiva (P → Q ≡ ~Q → ~P)',
    formula: 'P → Q  ≡  ~Q → ~P  (Inverte negando tudo)',
    example: '"Se nasci em Salvador, sou baiano" equivale a "Se NÃO sou baiano, então NÃO nasci em Salvador".',
    tip: 'Segunda equivalência famosa: P → Q ≡ ~P ∨ Q ("nega a 1ª OU mantém a 2ª").'
  },
  demorgan: {
    title: 'Leis de De Morgan ~(P ∧ Q) e ~(P ∨ Q)',
    formula: '~(P ∧ Q) ≡ ~P ∨ ~Q   |   ~(P ∨ Q) ≡ ~P ∧ ~Q',
    example: 'Negar "Passou em Matemática E em Física" vira "Não passou em Matemática OU não passou em Física".',
    tip: 'Troque E por OU (e OU por E) enquanto nega as duas partes!'
  }
};

export const LOGIC_CHALLENGES = [
  {
    type: 'lab',
    prompt: 'Missão no Simulador: Configure P e Q de forma que a condicional P → Q resulte em FALSO (único caso que quebra a regra).',
    hints: [
      'Na condicional P → Q, teste deixar P = V e Q = F ("Vera Fischer").',
      'Clique no botão de P para deixá-lo VERDADEIRO (V) e no de Q para deixá-lo FALSO (F).'
    ],
    successMessage: 'Correto! P = V e Q = F é a única linha da tabela em que a condicional P → Q é Falsa.',
    teacherExplanation: 'Destacar em aula a regra mnemônica Vera Fischer: V → F = F. Nas outras 3 linhas da tabela abaixo, P → Q permanece V.'
  },
  {
    type: 'mc',
    prompt: '(Estilo UNEB) Qual alternativa é logicamente EQUIVALENTE à frase: "Se o edital da UNEB sair, então começarei a revisão"?',
    options: [
      'Se o edital da UNEB não sair, então não começarei a revisão.',
      'Se eu não começar a revisão, então o edital da UNEB não saiu.',
      'O edital da UNEB saiu e eu não comecei a revisão.',
      'Começarei a revisão se e somente se o edital da UNEB sair.'
    ],
    correctIndex: 1,
    hints: [
      'Equivalência mantém a tabela-verdade idêntica. Inverte e nega as duas partes (contrapositiva).',
      'Aplique ~Q → ~P: se NÃO começar a revisão (~Q), então o edital NÃO saiu (~P).'
    ],
    successMessage: 'Excelente! A contrapositiva (~Q → ~P) possui exatamente a mesma tabela-verdade de P → Q.',
    teacherExplanation: 'Gabarito: Alternativa B (~Q → ~P). Cuidado com A (~P → ~Q, recíproca da inversa, NÃO é equivalente) e C (negação).'
  },
  {
    type: 'mc',
    prompt: '(Estilo UNEB) Assinale a NEGAÇÃO lógica correta da proposição composta: "A questão é de geometria E o gráfico é linear".',
    options: [
      'A questão não é de geometria e o gráfico não é linear.',
      'A questão não é de geometria OU o gráfico não é linear.',
      'Se a questão é de geometria, então o gráfico não é linear.',
      'A questão é de geometria OU o gráfico é linear.'
    ],
    correctIndex: 1,
    hints: [
      'Para negar uma conjunção (P ∧ Q), aplique a Lei de De Morgan.',
      'Negue a 1ª parte, troque "E" por "OU" e negue a 2ª parte: ~P ∨ ~Q.'
    ],
    successMessage: 'Perfeito! Pela Lei de De Morgan, ~(P ∧ Q) ≡ ~P ∨ ~Q.',
    teacherExplanation: 'Gabarito: Alternativa B (~P ∨ ~Q). Erro mais comum dos alunos é responder A (esquecer de trocar E por OU).'
  }
];

export function evaluateLogicChallenge(idx, ctx = {}) {
  const ch = LOGIC_CHALLENGES[idx];
  if (!ch) return false;
  if (idx === 0) {
    return ctx.propP === true && ctx.propQ === false;
  }
  return ctx.selectedOption === ch.correctIndex;
}

function setLogicBadge(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = val ? 'V' : 'F';
  el.className = `text-sm font-bold py-1 rounded ${val ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`;
}

function renderTruthTable() {
  const tbody = document.getElementById('logic-truth-table-rows');
  if (!tbody) return;
  const rows = [
    [true, true],
    [true, false],
    [false, true],
    [false, false]
  ];
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

  rows.forEach(([pVal, qVal]) => {
    const isActive = pVal === propP && qVal === propQ;
    const tr = document.createElement('tr');
    tr.className = isActive
      ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-300 font-bold text-slate-900'
      : 'text-slate-600 hover:bg-slate-50';

    const vals = [pVal, qVal, pVal && qVal, pVal || qVal, !pVal || qVal, pVal === qVal];
    vals.forEach((v, cIdx) => {
      const td = document.createElement('td');
      td.className = 'py-1.5 px-2 text-center font-mono text-xs border-b border-slate-100';
      if (cIdx === 4 && !v) {
        td.className += ' text-rose-700 bg-rose-50 font-bold';
      } else if (v) {
        td.className += ' text-emerald-700';
      } else {
        td.className += ' text-rose-600';
      }
      td.textContent = v ? 'V' : 'F';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

export function updateLogicUI() {
  const btnP = document.getElementById('toggle-p');
  const btnQ = document.getElementById('toggle-q');
  if (!btnP || !btnQ) return;

  btnP.textContent = propP ? 'VERDADEIRO (V)' : 'FALSO (F)';
  btnP.className = `px-4 py-2 rounded-lg font-bold text-xs transition-all shadow cursor-pointer ${propP ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`;

  btnQ.textContent = propQ ? 'VERDADEIRO (V)' : 'FALSO (F)';
  btnQ.className = `px-4 py-2 rounded-lg font-bold text-xs transition-all shadow cursor-pointer ${propQ ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`;

  const conj = propP && propQ;
  const disj = propP || propQ;
  const cond = !propP || propQ;
  const bicond = propP === propQ;

  setLogicBadge('res-conj', conj);
  setLogicBadge('res-disj', disj);
  setLogicBadge('res-cond', cond);
  setLogicBadge('res-bicond', bicond);

  const liveSentence = document.getElementById('logic-live-sentence');
  if (liveSentence) {
    liveSentence.textContent = `Com P = ${propP ? 'V' : 'F'} ("Chove hoje") e Q = ${propQ ? 'V' : 'F'} ("Levo guarda-chuva"), a promessa P → Q vale ${cond ? 'VERDADEIRO (promessa mantida)' : 'FALSO (promessa quebrada!)'}.`;
  }

  renderTruthTable();
}

export function toggleProp(which) {
  if (which === 'p') propP = !propP;
  if (which === 'q') propQ = !propQ;
  updateLogicUI();
}

export function checkLogicAnswer(optionIndex) {
  const fb = document.getElementById('logic-feedback');
  if (!fb) return;
  fb.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-900', 'border-emerald-200', 'bg-rose-50', 'text-rose-900', 'border-rose-200');

  if (optionIndex === 3) {
    fb.classList.add('bg-emerald-50', 'text-emerald-900', 'border', 'border-emerald-200');
    fb.textContent = 'Correto! (Alternativa C) A negação formal da condicional P → Q é P ∧ ~Q.';
  } else {
    fb.classList.add('bg-rose-50', 'text-rose-900', 'border', 'border-rose-200');
    fb.textContent = 'Atenção: mantenha a 1ª afirmativa e adicione "E" negando a 2ª parte (P ∧ ~Q).';
  }
}

function selectLogicConceptRule(ruleKey) {
  const data = LOGIC_RULES[ruleKey];
  if (!data) return;

  document.querySelectorAll('[data-logic-rule]').forEach((btn) => {
    const active = btn.getAttribute('data-logic-rule') === ruleKey;
    btn.setAttribute('aria-pressed', String(active));
    btn.className = active
      ? 'px-3 py-2 rounded-lg text-xs font-bold bg-uneb-primary text-white shadow-sm cursor-pointer transition-all text-left'
      : 'px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 cursor-pointer transition-all text-left';
  });

  const titleEl = document.getElementById('logic-concept-title');
  const formulaEl = document.getElementById('logic-concept-formula');
  const exEl = document.getElementById('logic-concept-example');
  const tipEl = document.getElementById('logic-concept-tip');

  if (titleEl) titleEl.textContent = data.title;
  if (formulaEl) formulaEl.textContent = data.formula;
  if (exEl) exEl.textContent = data.example;
  if (tipEl) tipEl.textContent = data.tip;
}

export function initLogic() {
  const btnP = document.getElementById('toggle-p');
  const btnQ = document.getElementById('toggle-q');
  if (btnP) btnP.addEventListener('click', () => toggleProp('p'));
  if (btnQ) btnQ.addEventListener('click', () => toggleProp('q'));

  document.querySelectorAll('[data-logic-opt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const optIdx = parseInt(btn.getAttribute('data-logic-opt'), 10);
      checkLogicAnswer(optIdx);
    });
  });

  document.querySelectorAll('[data-logic-rule]').forEach((btn) => {
    btn.addEventListener('click', () => selectLogicConceptRule(btn.getAttribute('data-logic-rule')));
  });
  selectLogicConceptRule('condicional');

  updateLogicUI();

  setupModuleStage({
    modId: 'mod-logica',
    challenges: LOGIC_CHALLENGES,
    evaluateChallenge: evaluateLogicChallenge,
    getLabContext: () => ({ propP, propQ }),
    onApplySolution: (idx) => {
      if (idx === 0) {
        propP = true;
        propQ = false;
        updateLogicUI();
      }
    }
  });
}
