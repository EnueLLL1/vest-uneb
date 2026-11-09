/**
 * EIXO 1: LÓGICA MATEMÁTICA
 * Simulador de Proposições, Tabela-Verdade e Desafio de Equivalência.
 */

let propP = true;
let propQ = true;

function setLogicBadge(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = val ? 'V' : 'F';
  el.className = `text-sm font-bold py-1 rounded ${val ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`;
}

export function updateLogicUI() {
  const btnP = document.getElementById('toggle-p');
  const btnQ = document.getElementById('toggle-q');
  if (!btnP || !btnQ) return;

  btnP.textContent = propP ? 'VERDADEIRO (V)' : 'FALSO (F)';
  btnP.className = `px-4 py-2 rounded-lg font-bold text-xs transition-all shadow ${propP ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`;

  btnQ.textContent = propQ ? 'VERDADEIRO (V)' : 'FALSO (F)';
  btnQ.className = `px-4 py-2 rounded-lg font-bold text-xs transition-all shadow ${propQ ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`;

  const conj = propP && propQ;
  const disj = propP || propQ;
  const cond = !propP || propQ; // Falso apenas se V -> F
  const bicond = propP === propQ;

  setLogicBadge('res-conj', conj);
  setLogicBadge('res-disj', disj);
  setLogicBadge('res-cond', cond);
  setLogicBadge('res-bicond', bicond);
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
    fb.innerHTML = '<strong>Correto! (Alternativa C)</strong> A negação formal da condicional <span class="math-font">P → Q</span> é obtida mantendo a primeira premissa verdadeira e negando o consequente (<span class="math-font">P ∧ ~Q</span>).';
  } else {
    fb.classList.add('bg-rose-50', 'text-rose-900', 'border', 'border-rose-200');
    fb.innerHTML = '<strong>Atenção:</strong> Lembre-se da regra do "Maném": mantenha a 1ª afirmativa como está e adicione "E" negando a 2ª parte. Tente novamente.';
  }
}

export function initLogic() {
  const btnP = document.getElementById('toggle-p');
  const btnQ = document.getElementById('toggle-q');
  if (btnP) btnP.addEventListener('click', () => toggleProp('p'));
  if (btnQ) btnQ.addEventListener('click', () => toggleProp('q'));

  document.querySelectorAll('[data-logic-opt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const optIdx = parseInt(btn.getAttribute('data-logic-opt'), 10);
      checkLogicAnswer(optIdx);
    });
  });

  updateLogicUI();
}
