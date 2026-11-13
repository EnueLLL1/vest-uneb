import assert from 'node:assert/strict';

const memoryStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoryStore.has(k) ? memoryStore.get(k) : null),
  setItem: (k, v) => memoryStore.set(k, String(v)),
  removeItem: (k) => memoryStore.delete(k),
  clear: () => memoryStore.clear()
};

import {
  DEFAULT_CLASS_CODE,
  normalizeClassCode,
  normalizeStudentKey
} from '../js/utils/session.js';
import {
  getState,
  setState,
  loadState,
  resetStudentProgress,
  recordModuleAttempt
} from '../js/state.js';
import { BANCO_PROVAS } from '../js/data/banco_questoes.js';
import {
  AXIS_META,
  mapAxisToModuleId,
  buildStudentDiagnosticPayload,
  encodeStudentReportCode,
  decodeStudentReportCode,
  computeStudentDiagnostic,
  computeClassDiagnostics
} from '../js/utils/classroom.js';

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

test('normalizeClassCode sanitizes and falls back to DEFAULT_CLASS_CODE', () => {
  assert.equal(DEFAULT_CLASS_CODE, 'UNEB-A');
  assert.equal(normalizeClassCode('  uneb 2026! '), 'UNEB2026');
  assert.equal(normalizeClassCode('turma_b-01'), 'TURMA_B-01');
  assert.equal(normalizeClassCode(''), 'UNEB-A');
  assert.equal(normalizeClassCode(null), 'UNEB-A');
  assert.equal(normalizeClassCode('A'.repeat(30)).length, 20);
});

test('normalizeStudentKey removes accents, collapses spaces, and lowercases', () => {
  assert.equal(normalizeStudentKey('  João   Vítor Ávila  '), 'joao vitor avila');
  assert.equal(normalizeStudentKey(''), 'anonimo');
});

test('recordModuleAttempt tracks errors per challenge and delegates success to completion', () => {
  localStorage.clear();
  loadState();
  setState({ sessionRole: 'student', studentName: 'Ana Paula', classCode: 'TURMA-B' }, 'session');

  recordModuleAttempt('mod-logica', 1, false);
  recordModuleAttempt('mod-logica', 1, false);
  assert.deepEqual(getState().moduleAttempts['mod-logica'], [0, 2, 0]);
  assert.deepEqual(getState().modulePractice['mod-logica'], []);

  recordModuleAttempt('mod-logica', 1, true);
  assert.deepEqual(getState().modulePractice['mod-logica'], [1]);

  resetStudentProgress();
  assert.deepEqual(getState().moduleAttempts['mod-logica'], [0, 0, 0]);
  assert.equal(getState().classCode, 'TURMA-B');
});

test('mapAxisToModuleId covers every axis string present in BANCO_PROVAS', () => {
  assert.equal(Object.keys(AXIS_META).length, 6);
  for (const edition of Object.values(BANCO_PROVAS)) {
    for (const q of edition.questions) {
      const modId = mapAxisToModuleId(q.axis);
      assert.ok(
        Object.hasOwn(AXIS_META, modId),
        `Unmapped axis "${q.axis}" returned "${modId}"`
      );
    }
  }
});

test('encodeStudentReportCode / decodeStudentReportCode round-trips Unicode payloads and rejects invalid input', () => {
  localStorage.clear();
  loadState();
  setState({ sessionRole: 'student', studentName: 'José Conceição', classCode: 'UNEB-B' }, 'session');
  recordModuleAttempt('mod-algebra', 0, false);
  recordModuleAttempt('mod-algebra', 0, false);
  recordModuleAttempt('mod-logica', 0, true);

  const payload = buildStudentDiagnosticPayload(getState());
  const code = encodeStudentReportCode(payload);
  assert.ok(code.startsWith('UNEB1:'), 'Report code must start with UNEB1:');

  const decoded = decodeStudentReportCode(code);
  assert.equal(decoded.student_name, 'José Conceição');
  assert.equal(decoded.class_code, 'UNEB-B');
  assert.deepEqual(decoded.module_attempts['mod-algebra'], [2, 0, 0]);
  assert.deepEqual(decoded.module_practice['mod-logica'], [0]);

  assert.equal(decodeStudentReportCode('INVALID_CODE'), null);
  assert.equal(decodeStudentReportCode('UNEB1:not-valid-base64!!!'), null);
});

test('computeStudentDiagnostic and computeClassDiagnostics detect weakest axes and top missed questions', () => {
  const ed = BANCO_PROVAS.imersao_fixacao;
  const qTrig = ed.questions.find((q) => mapAxisToModuleId(q.axis) === 'mod-trig');
  const qFin = ed.questions.find((q) => mapAxisToModuleId(q.axis) === 'mod-financas');
  assert.ok(qTrig && qFin, 'Expected trig and financas questions in imersao_fixacao');

  const wrongTrigOpt = (qTrig.correct + 1) % qTrig.options.length;
  const wrongFinOpt = (qFin.correct + 1) % qFin.options.length;

  const studentA = {
    class_code: 'UNEB-A',
    student_key: 'maria clara',
    student_name: 'Maria Clara',
    score: 125,
    completed_modules: { 'mod-logica': true },
    module_practice: { 'mod-logica': [0, 1, 2], 'mod-trig': [] },
    module_attempts: { 'mod-logica': [0, 0, 0], 'mod-trig': [4, 2, 0] },
    quiz_answers: {
      imersao_fixacao: {
        [qTrig.id]: wrongTrigOpt,
        [qFin.id]: qFin.correct
      }
    },
    quiz_submitted: { imersao_fixacao: true },
    updated_at: '2026-11-13T15:00:00Z'
  };

  const studentB = {
    class_code: 'UNEB-A',
    student_key: 'pedro henrique',
    student_name: 'Pedro Henrique',
    score: 50,
    completed_modules: {},
    module_practice: { 'mod-trig': [] },
    module_attempts: { 'mod-trig': [3, 1, 1], 'mod-financas': [2, 0, 0] },
    quiz_answers: {
      imersao_fixacao: {
        [qTrig.id]: wrongTrigOpt,
        [qFin.id]: wrongFinOpt
      }
    },
    quiz_submitted: { imersao_fixacao: true },
    updated_at: '2026-11-13T15:05:00Z'
  };

  const diagA = computeStudentDiagnostic(studentA);
  assert.ok(diagA.weakAxes.some((a) => a.modId === 'mod-trig'), 'Maria Clara must flag mod-trig as weak');
  assert.equal(diagA.byAxis['mod-logica'].mastery, 100);
  assert.equal(diagA.totalModuleErrors, 6);

  const classSummary = computeClassDiagnostics([studentA, studentB]);
  assert.equal(classSummary.studentCount, 2);
  assert.equal(classSummary.axesRank[0].modId, 'mod-trig');
  assert.equal(classSummary.topMissedQuestions[0].questionId, qTrig.id);
  assert.equal(classSummary.topMissedQuestions[0].errorCount, 2);
});

if (!process.exitCode) {
  console.log(`\nAll ${passed} classroom diagnostics tests passed.`);
}
