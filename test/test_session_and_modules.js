import assert from 'node:assert/strict';

// Minimal localStorage polyfill for Node ESM state tests
const memoryStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoryStore.has(k) ? memoryStore.get(k) : null),
  setItem: (k, v) => memoryStore.set(k, String(v)),
  removeItem: (k) => memoryStore.delete(k),
  clear: () => memoryStore.clear()
};

import {
  TEACHER_ACCESS_CODE,
  validateTeacherCode,
  normalizeStudentName
} from '../js/utils/session.js';
import {
  APP_STORAGE_KEY,
  getState,
  setState,
  loadState,
  resetStudentProgress,
  isTeacherModeActive,
  completeModuleChallenge
} from '../js/state.js';
import { LOGIC_CHALLENGES, evaluateLogicChallenge } from '../js/modules/logica.js';
import { COMB_CHALLENGES, evaluateCombChallenge } from '../js/modules/combinatoria.js';
import { PARABOLA_CHALLENGES, evaluateParabolaChallenge } from '../js/modules/parabola.js';
import { TRIG_CHALLENGES, evaluateTrigChallenge } from '../js/modules/trig.js';
import { FINANCAS_CHALLENGES, evaluateFinancasChallenge } from '../js/modules/financas.js';
import { STATS_CHALLENGES, evaluateStatsChallenge } from '../js/modules/stats.js';

let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`PASS: ${name}`);
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// 1. Session helper tests
test('validateTeacherCode accepts UNEB2026 case-insensitively with whitespace trimming', () => {
  assert.equal(TEACHER_ACCESS_CODE, 'UNEB2026');
  assert.equal(validateTeacherCode('UNEB2026'), true);
  assert.equal(validateTeacherCode('  uneb2026 \n'), true);
  assert.equal(validateTeacherCode('Uneb2026'), true);
  assert.equal(validateTeacherCode('UNEB2025'), false);
  assert.equal(validateTeacherCode(''), false);
  assert.equal(validateTeacherCode(null), false);
});

test('normalizeStudentName trims, collapses spaces, and caps length at 40 chars', () => {
  assert.equal(normalizeStudentName('  Ana   Clara  '), 'Ana Clara');
  assert.equal(normalizeStudentName('   '), '');
  assert.equal(normalizeStudentName(undefined), '');
  const longName = 'A'.repeat(60);
  assert.equal(normalizeStudentName(longName).length, 40);
});

// 2. State session & modulePractice hydration/progression tests
test('loadState validates sessionRole, studentName, teacher flags, and modulePractice safely', () => {
  localStorage.clear();
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({
    sessionRole: 'hacker',
    studentName: '   Lucas   Silva  ',
    teacherShowAnswers: 'yes',
    teacherPreviewAsStudent: 1,
    modulePractice: {
      'mod-logica': [0, 2, 2, 99, -1, '1'],
      'mod-unknown': [0]
    }
  }));

  loadState();
  const s = getState();
  assert.equal(s.sessionRole, null);
  assert.equal(s.studentName, 'Lucas Silva');
  assert.equal(s.teacherShowAnswers, false);
  assert.equal(s.teacherPreviewAsStudent, false);
  assert.deepEqual(s.modulePractice['mod-logica'], [0, 2]);
  assert.equal('mod-unknown' in s.modulePractice, false);
});

test('isTeacherModeActive returns true only when sessionRole=teacher and not previewing as student', () => {
  localStorage.clear();
  loadState();
  assert.equal(isTeacherModeActive(), false);

  setState({ sessionRole: 'student', teacherPreviewAsStudent: false });
  assert.equal(isTeacherModeActive(), false);

  setState({ sessionRole: 'teacher', teacherPreviewAsStudent: false });
  assert.equal(isTeacherModeActive(), true);
  assert.equal(getState().mode, 'teacher');

  setState({ teacherPreviewAsStudent: true });
  assert.equal(isTeacherModeActive(), false);
  assert.equal(getState().mode, 'student');
});

test('completeModuleChallenge tracks 3 solved challenges and auto-awards +50 XP module completion', () => {
  localStorage.clear();
  loadState();
  setState({ sessionRole: 'student', studentName: 'Maria' });

  completeModuleChallenge('mod-trig', 0, 3);
  completeModuleChallenge('mod-trig', 0, 3); // duplicate ignored
  completeModuleChallenge('mod-trig', 2, 3);

  let s = getState();
  assert.deepEqual(s.modulePractice['mod-trig'], [0, 2]);
  assert.equal(s.completedModules['mod-trig'], false);
  assert.equal(s.score, 0);

  completeModuleChallenge('mod-trig', 1, 3);
  s = getState();
  assert.deepEqual(s.modulePractice['mod-trig'], [0, 1, 2]);
  assert.equal(s.completedModules['mod-trig'], true);
  assert.equal(s.score, 50);
});

test('resetStudentProgress clears modulePractice and XP while preserving sessionRole and studentName', () => {
  localStorage.clear();
  loadState();
  setState({
    sessionRole: 'student',
    studentName: 'Joao',
    teacherShowAnswers: false
  });
  completeModuleChallenge('mod-logica', 0, 3);
  completeModuleChallenge('mod-logica', 1, 3);
  completeModuleChallenge('mod-logica', 2, 3);

  resetStudentProgress();
  const s = getState();
  assert.equal(s.sessionRole, 'student');
  assert.equal(s.studentName, 'Joao');
  assert.equal(s.score, 0);
  assert.equal(s.completedModules['mod-logica'], false);
  assert.deepEqual(s.modulePractice['mod-logica'], []);
});

// 3. Challenge structure & pure evaluator tests across all 6 Eixos
test('All 6 modules expose exactly 3 structured challenges each', () => {
  const groups = [
    LOGIC_CHALLENGES,
    COMB_CHALLENGES,
    PARABOLA_CHALLENGES,
    TRIG_CHALLENGES,
    FINANCAS_CHALLENGES,
    STATS_CHALLENGES
  ];
  for (const list of groups) {
    assert.equal(Array.isArray(list), true);
    assert.equal(list.length, 3);
    assert.equal(list[0].type, 'lab');
  }
});

test('Logic challenges evaluate truth-table mission and MC deductions accurately', () => {
  assert.equal(evaluateLogicChallenge(0, { propP: true, propQ: false }), true);
  assert.equal(evaluateLogicChallenge(0, { propP: true, propQ: true }), false);
  assert.equal(evaluateLogicChallenge(0, { propP: false, propQ: false }), false);
  assert.equal(evaluateLogicChallenge(1, { selectedOption: LOGIC_CHALLENGES[1].correctIndex }), true);
  assert.equal(evaluateLogicChallenge(2, { selectedOption: LOGIC_CHALLENGES[2].correctIndex }), true);
});

test('Combinatorics challenges evaluate lab arrangement/combination mission and MC questions', () => {
  // Mission 0: target C(5,3) = 10 or specific N=6, P=2 -> let's test using declared expected params
  assert.equal(evaluateCombChallenge(0, { n: 6, p: 2, isCombinationMode: true }), true);
  assert.equal(evaluateCombChallenge(0, { n: 6, p: 2, isCombinationMode: false }), false);
  assert.equal(evaluateCombChallenge(1, { selectedOption: COMB_CHALLENGES[1].correctIndex }), true);
  assert.equal(evaluateCombChallenge(2, { selectedOption: COMB_CHALLENGES[2].correctIndex }), true);
});

test('Parabola challenges evaluate vertex-and-roots configuration mission and MC questions', () => {
  // Mission 0: upward parabola with vertex (2, -1) -> a=1, b=-4, c=3
  assert.equal(evaluateParabolaChallenge(0, { a: 1, b: -4, c: 3 }), true);
  assert.equal(evaluateParabolaChallenge(0, { a: -1, b: -4, c: 3 }), false);
  assert.equal(evaluateParabolaChallenge(1, { selectedOption: PARABOLA_CHALLENGES[1].correctIndex }), true);
  assert.equal(evaluateParabolaChallenge(2, { selectedOption: PARABOLA_CHALLENGES[2].correctIndex }), true);
});

test('Trigonometry challenges evaluate angle quadrant/ratio mission and MC questions', () => {
  // Mission 0: angle 150 deg (cos < 0, sin = 1/2)
  assert.equal(evaluateTrigChallenge(0, { angleDeg: 150 }), true);
  assert.equal(evaluateTrigChallenge(0, { angleDeg: 30 }), false);
  assert.equal(evaluateTrigChallenge(1, { selectedOption: TRIG_CHALLENGES[1].correctIndex }), true);
  assert.equal(evaluateTrigChallenge(2, { selectedOption: TRIG_CHALLENGES[2].correctIndex }), true);
});

test('Financas challenges evaluate compound-interest simulation mission and MC questions', () => {
  // Mission 0: C=2000, i=10%, t=2 -> compound amount = 2420
  assert.equal(evaluateFinancasChallenge(0, { capital: 2000, rate: 10, time: 2 }), true);
  assert.equal(evaluateFinancasChallenge(0, { capital: 1000, rate: 10, time: 2 }), false);
  assert.equal(evaluateFinancasChallenge(1, { selectedOption: FINANCAS_CHALLENGES[1].correctIndex }), true);
  assert.equal(evaluateFinancasChallenge(2, { selectedOption: FINANCAS_CHALLENGES[2].correctIndex }), true);
});

test('Stats challenges evaluate Sturges/median dataset mission and MC questions', () => {
  // Mission 0: dataset matching median=7 and mean=7 with at least 8 points -> e.g. "4, 6, 7, 7, 7, 8, 8, 9"
  assert.equal(evaluateStatsChallenge(0, { values: [4, 6, 7, 7, 7, 8, 8, 9] }), true);
  assert.equal(evaluateStatsChallenge(0, { values: [1, 2, 3] }), false);
  assert.equal(evaluateStatsChallenge(1, { selectedOption: STATS_CHALLENGES[1].correctIndex }), true);
  assert.equal(evaluateStatsChallenge(2, { selectedOption: STATS_CHALLENGES[2].correctIndex }), true);
});

if (!process.exitCode) {
  console.log(`\nAll ${passed} tests passed.`);
}
