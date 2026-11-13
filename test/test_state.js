import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

const STORAGE_KEY = 'uneb_math_2026_v1';

const {
  getState,
  loadState,
  setState,
  resetStudentProgress,
  subscribe
} = await import('../js/state.js');
const { calcJuros } = await import('../js/modules/financas.js');
const { calcSturgesFormula } = await import('../js/modules/stats.js');

console.log('Running state & edge-case tests...');

// 1. Corrupt/hostile localStorage hydration must fall back safely
store.set(STORAGE_KEY, JSON.stringify({
  mode: 'admin',
  currentView: 'nonexistent_view',
  selectedEdition: 'uneb_1999',
  quizMode: 'invalid_mode',
  completedModules: { 'mod-logica': 'yes', hackedMod: true },
  quizAnswersByEdition: { uneb_2025: null, __proto__: { polluted: true } },
  quizSubmittedByEdition: { uneb_2025: 'yes' },
  params: { sliderN: 'bad', finCapital: -50, seqType: 'HACK' }
}));

loadState();
const hydrated = getState();
assert.equal(hydrated.mode, 'student');
assert.equal(hydrated.currentView, 'day1');
assert.equal(hydrated.selectedEdition, 'uneb_2025');
assert.equal(hydrated.quizMode, 'simulado');
assert.equal(hydrated.completedModules['mod-logica'], false);
assert.equal('hackedMod' in hydrated.completedModules, false);
assert.equal(typeof hydrated.quizAnswersByEdition.uneb_2025, 'object');
assert.notEqual(hydrated.quizAnswersByEdition.uneb_2025, null);
assert.equal(hydrated.quizSubmittedByEdition.uneb_2025, false);
assert.equal(hydrated.params.seqType, 'pa');
assert.equal(typeof hydrated.params.sliderN, 'number');

// 2. Quiz answer update via setState(null, 'quiz-answer') notifies subscribers and updates XP
resetStudentProgress();
let notifiedKey = null;
let notifiedScore = null;
const unsubscribe = subscribe((state, key) => {
  notifiedKey = key;
  notifiedScore = state.score;
});

hydrated.quizAnswersByEdition.uneb_2025[1] = 2; // Q1 uneb_2025 correct is 2 (verify below if needed) or test any correct question
// Use Q1's actual correct index from getCurrentQuizData via BANCO_PROVAS
const { BANCO_PROVAS } = await import('../js/data/banco_questoes.js');
hydrated.quizAnswersByEdition.uneb_2025[1] = BANCO_PROVAS.uneb_2025.questions[0].correct;
setState(null, 'quiz-answer');
unsubscribe();

assert.equal(notifiedKey, 'quiz-answer');
assert.equal(notifiedScore, 25);
assert.equal(getState().score, 25);

// 3. Zero values in calcJuros must NOT coerce to defaults (1000 / 10%)
const jurosZeroCap = calcJuros(0, 10, 2);
assert.equal(jurosZeroCap.c, 0);
assert.equal(jurosZeroCap.montanteSimples, 0);
assert.equal(jurosZeroCap.montanteComposto, 0);

const jurosZeroRate = calcJuros(500, 0, 5);
assert.equal(jurosZeroRate.i, 0);
assert.equal(jurosZeroRate.montanteSimples, 500);
assert.equal(jurosZeroRate.montanteComposto, 500);

// 4. Zero values in calcSturgesFormula must clamp minimally (2, 0.1), NOT snap to defaults (50, 20)
const sturgesZero = calcSturgesFormula(0, 0);
assert.equal(sturgesZero.roundedI, 2); // 1 + 3.3*log10(2) ≈ 1.993 -> 2
assert.ok(sturgesZero.h < 0.1, `Expected h < 0.1 for clamped AA=0.1, got ${sturgesZero.h}`);

console.log('ALL STATE & EDGE-CASE TESTS PASSED!');
