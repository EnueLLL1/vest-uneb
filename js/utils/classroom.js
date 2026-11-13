/**
 * @fileoverview Diagnóstico híbrido de turma: agregação por Eixo, código offline UNEB1 e sincronização Supabase.
 */

import { BANCO_PROVAS } from '../data/banco_questoes.js';
import {
  DEFAULT_CLASS_CODE,
  normalizeStudentName,
  normalizeClassCode,
  normalizeStudentKey
} from './session.js';

export const SUPABASE_URL = 'https://dfjyaveuxgogyyduhxcc.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mV22YRyjwbOo6Mt6HGxjdg_crncxEb_';
export const TEACHER_ROSTER_STORAGE_KEY = 'uneb_teacher_roster_v1';

export const AXIS_META = {
  'mod-logica': { modId: 'mod-logica', axisNumber: 1, shortTitle: 'Lógica', title: 'Eixo 1: Lógica Matemática', view: 'day1' },
  'mod-numeros': { modId: 'mod-numeros', axisNumber: 2, shortTitle: 'Números & Contagem', title: 'Eixo 2: Números, Sequências e Combinatória', view: 'day1' },
  'mod-algebra': { modId: 'mod-algebra', axisNumber: 3, shortTitle: 'Álgebra & Funções', title: 'Eixo 3: Álgebra e Funções', view: 'day1' },
  'mod-trig': { modId: 'mod-trig', axisNumber: 4, shortTitle: 'Geom. & Trigonometria', title: 'Eixo 4: Geometria e Trigonometria', view: 'day2' },
  'mod-financas': { modId: 'mod-financas', axisNumber: 5, shortTitle: 'Finanças', title: 'Eixo 5: Matemática Financeira e Proporções', view: 'day2' },
  'mod-estatistica': { modId: 'mod-estatistica', axisNumber: 6, shortTitle: 'Estatística', title: 'Eixo 6: Tratamento da Informação', view: 'day2' }
};

const MOD_IDS = Object.keys(AXIS_META);

/**
 * Mapeia o texto de `q.axis` do BANCO_PROVAS para um dos 6 módulos temáticos do portal.
 * @param {string} axisStr
 * @returns {string}
 */
export function mapAxisToModuleId(axisStr) {
  const s = typeof axisStr === 'string' ? axisStr.toLowerCase() : '';
  if (/l[oó]gica/.test(s)) return 'mod-logica';
  if (/finan|proporc|porcent|juros|mistur|vaz[aã]o/.test(s)) return 'mod-financas';
  if (/estat|tratamento|m[eé]dia|gr[aá]f/.test(s)) return 'mod-estatistica';
  if (/trig|geom|arco|tang/.test(s)) return 'mod-trig';
  if (/[aá]lgeb|fun[cç]|quadr|equa[cç]|matriz|polin|complex|modelagem/.test(s)) return 'mod-algebra';
  if (/n[uú]mer|combinat|probab|conjun|sequ|permut|bin[oô]m|contag|\(pa\b|\(pg\b/.test(s)) return 'mod-numeros';

  if (s.includes('eixo 1')) return 'mod-logica';
  if (s.includes('eixo 2')) return 'mod-numeros';
  if (s.includes('eixo 3')) return 'mod-algebra';
  if (s.includes('eixo 4')) return 'mod-trig';
  if (s.includes('eixo 5')) return 'mod-financas';
  if (s.includes('eixo 6')) return 'mod-estatistica';
  return 'mod-numeros';
}

function toBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64Utf8(b64) {
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(b64, 'base64');
    // Reject non-base64 noise by round-tripping stripped padding
    const clean = b64.replace(/\s+/g, '').replace(/=+$/, '');
    if (!/^[A-Za-z0-9+/]*$/.test(clean) || buf.length === 0) {
      throw new Error('Base64 inválido');
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/**
 * Monta o registro diagnóstico padronizado a partir do estado do estudante.
 * @param {object} state
 * @returns {object}
 */
export function buildStudentDiagnosticPayload(state) {
  const studentName = normalizeStudentName(state?.studentName) || 'Estudante';
  const classCode = normalizeClassCode(state?.classCode || DEFAULT_CLASS_CODE);
  const completedModules = {};
  const modulePractice = {};
  const moduleAttempts = {};

  for (const modId of MOD_IDS) {
    completedModules[modId] = Boolean(state?.completedModules?.[modId]);
    const solved = Array.isArray(state?.modulePractice?.[modId]) ? state.modulePractice[modId] : [];
    modulePractice[modId] = [...new Set(solved.filter((n) => Number.isInteger(n) && n >= 0 && n < 3))];
    const attempts = Array.isArray(state?.moduleAttempts?.[modId]) ? state.moduleAttempts[modId] : [0, 0, 0];
    moduleAttempts[modId] = [0, 1, 2].map((i) => (Number.isInteger(attempts[i]) && attempts[i] >= 0 ? attempts[i] : 0));
  }

  return {
    class_code: classCode,
    student_key: normalizeStudentKey(studentName),
    student_name: studentName,
    score: Number.isInteger(state?.score) && state.score >= 0 ? state.score : 0,
    completed_modules: completedModules,
    module_practice: modulePractice,
    module_attempts: moduleAttempts,
    quiz_answers: state?.quizAnswersByEdition && typeof state.quizAnswersByEdition === 'object' ? state.quizAnswersByEdition : {},
    quiz_submitted: state?.quizSubmittedByEdition && typeof state.quizSubmittedByEdition === 'object' ? state.quizSubmittedByEdition : {},
    updated_at: new Date().toISOString()
  };
}

/**
 * Codifica um payload de diagnóstico em string compacta compartilhável (`UNEB1:...`).
 * @param {object} payload
 * @returns {string}
 */
export function encodeStudentReportCode(payload) {
  const compact = {
    v: 1,
    c: normalizeClassCode(payload?.class_code),
    n: normalizeStudentName(payload?.student_name) || 'Estudante',
    s: Number.isInteger(payload?.score) ? payload.score : 0,
    cm: payload?.completed_modules || {},
    mp: payload?.module_practice || {},
    ma: payload?.module_attempts || {},
    qa: payload?.quiz_answers || {},
    qs: payload?.quiz_submitted || {},
    t: payload?.updated_at || new Date().toISOString()
  };
  return `UNEB1:${toBase64Utf8(JSON.stringify(compact))}`;
}

/**
 * Decodifica e valida uma string `UNEB1:...` de volta para o registro diagnóstico.
 * @param {string} codeStr
 * @returns {object|null}
 */
export function decodeStudentReportCode(codeStr) {
  if (typeof codeStr !== 'string') return null;
  const trimmed = codeStr.trim();
  if (!trimmed.startsWith('UNEB1:')) return null;
  const rawB64 = trimmed.slice(6).trim();
  if (!rawB64) return null;

  try {
    const parsed = JSON.parse(fromBase64Utf8(rawB64));
    if (!parsed || typeof parsed !== 'object' || parsed.v !== 1) return null;
    const studentName = normalizeStudentName(parsed.n);
    if (!studentName) return null;
    const classCode = normalizeClassCode(parsed.c);
    return {
      class_code: classCode,
      student_key: normalizeStudentKey(studentName),
      student_name: studentName,
      score: Number.isInteger(parsed.s) && parsed.s >= 0 ? parsed.s : 0,
      completed_modules: parsed.cm && typeof parsed.cm === 'object' ? parsed.cm : {},
      module_practice: parsed.mp && typeof parsed.mp === 'object' ? parsed.mp : {},
      module_attempts: parsed.ma && typeof parsed.ma === 'object' ? parsed.ma : {},
      quiz_answers: parsed.qa && typeof parsed.qa === 'object' ? parsed.qa : {},
      quiz_submitted: parsed.qs && typeof parsed.qs === 'object' ? parsed.qs : {},
      updated_at: typeof parsed.t === 'string' ? parsed.t : new Date().toISOString()
    };
  } catch {
    return null;
  }
}

/**
 * Calcula métricas detalhadas de domínio e erros por Eixo para um único aluno.
 * @param {object} record
 * @returns {object}
 */
export function computeStudentDiagnostic(record) {
  const byAxis = {};
  let totalModuleErrors = 0;
  let totalSolvedChallenges = 0;
  let totalQuizAnswered = 0;
  let totalQuizCorrect = 0;
  let completedModulesCount = 0;

  for (const modId of MOD_IDS) {
    const solvedArr = Array.isArray(record?.module_practice?.[modId]) ? record.module_practice[modId] : [];
    const attemptsArr = Array.isArray(record?.module_attempts?.[modId]) ? record.module_attempts[modId] : [0, 0, 0];
    const moduleErrors = [0, 1, 2].reduce((sum, i) => sum + (Number.isInteger(attemptsArr[i]) ? attemptsArr[i] : 0), 0);
    const isCompleted = Boolean(record?.completed_modules?.[modId]) || solvedArr.length >= 3;
    if (isCompleted) completedModulesCount++;

    totalModuleErrors += moduleErrors;
    totalSolvedChallenges += solvedArr.length;

    byAxis[modId] = {
      ...AXIS_META[modId],
      solvedChallenges: solvedArr.length,
      moduleCompleted: isCompleted,
      moduleErrors,
      quizAnswered: 0,
      quizCorrect: 0,
      quizErrors: 0,
      hasEvidence: isCompleted || solvedArr.length > 0 || moduleErrors > 0,
      mastery: 0
    };
  }

  const quizAnswers = record?.quiz_answers && typeof record.quiz_answers === 'object' ? record.quiz_answers : {};
  for (const [edKey, answersMap] of Object.entries(quizAnswers)) {
    const edition = BANCO_PROVAS?.[edKey];
    if (!edition || !answersMap || typeof answersMap !== 'object') continue;

    for (const q of edition.questions) {
      const picked = answersMap[q.id];
      if (picked === undefined || picked === null) continue;

      const modId = mapAxisToModuleId(q.axis);
      const axisBucket = byAxis[modId];
      if (!axisBucket) continue;

      const isCorrect = Boolean(q.isCancelled || picked === q.correct);
      totalQuizAnswered++;
      axisBucket.quizAnswered++;
      axisBucket.hasEvidence = true;
      if (isCorrect) {
        totalQuizCorrect++;
        axisBucket.quizCorrect++;
      } else {
        axisBucket.quizErrors++;
      }
    }
  }

  const weakAxes = [];
  for (const modId of MOD_IDS) {
    const bucket = byAxis[modId];
    if (!bucket.hasEvidence) {
      bucket.mastery = null;
      continue;
    }

    const totalSignals = bucket.solvedChallenges + bucket.quizAnswered;
    const rawSuccess = bucket.solvedChallenges + bucket.quizCorrect;
    const denominator = Math.max(1, totalSignals + Math.min(4, bucket.moduleErrors) * 0.5);
    const computed = Math.round(Math.min(100, Math.max(0, (rawSuccess / denominator) * 100)));
    bucket.mastery = bucket.moduleCompleted && bucket.quizErrors === 0 && bucket.moduleErrors === 0
      ? 100
      : computed;

    const totalErrors = bucket.moduleErrors + bucket.quizErrors;
    if (bucket.mastery < 65 || totalErrors >= 2) {
      weakAxes.push(bucket);
    }
  }

  weakAxes.sort((a, b) => (a.mastery ?? 100) - (b.mastery ?? 100) || (b.moduleErrors + b.quizErrors) - (a.moduleErrors + a.quizErrors));

  return {
    classCode: normalizeClassCode(record?.class_code),
    studentKey: normalizeStudentKey(record?.student_name || record?.student_key),
    studentName: normalizeStudentName(record?.student_name) || 'Estudante',
    score: Number.isInteger(record?.score) ? record.score : 0,
    completedModulesCount,
    totalSolvedChallenges,
    totalModuleErrors,
    totalQuizAnswered,
    totalQuizCorrect,
    quizAccuracyPct: totalQuizAnswered > 0 ? Math.round((totalQuizCorrect / totalQuizAnswered) * 100) : null,
    updatedAt: record?.updated_at || null,
    byAxis,
    weakAxes
  };
}

/**
 * Agrega diagnósticos individuais em termômetro por Eixo e ranking de erros da turma.
 * @param {Array<object>} records
 * @returns {object}
 */
export function computeClassDiagnostics(records = []) {
  const cleanRecords = Array.isArray(records) ? records : [];
  const students = cleanRecords.map(computeStudentDiagnostic);

  const axisSummary = {};
  for (const modId of MOD_IDS) {
    axisSummary[modId] = {
      ...AXIS_META[modId],
      masterySamples: [],
      avgMastery: null,
      strugglingCount: 0,
      totalModuleErrors: 0,
      totalQuizErrors: 0,
      quizAnswered: 0,
      totalErrors: 0
    };
  }

  const questionErrorsMap = new Map();
  const challengeErrorsMap = new Map();

  for (const st of students) {
    for (const modId of MOD_IDS) {
      const b = st.byAxis[modId];
      const agg = axisSummary[modId];
      agg.totalModuleErrors += b.moduleErrors;
      agg.totalQuizErrors += b.quizErrors;
      agg.quizAnswered += b.quizAnswered;
      agg.totalErrors += b.moduleErrors + b.quizErrors;
      if (b.mastery !== null) {
        agg.masterySamples.push(b.mastery);
      }
      if (st.weakAxes.some((w) => w.modId === modId)) {
        agg.strugglingCount++;
      }
    }
  }

  for (const record of cleanRecords) {
    // Aggregate module challenge attempts
    const attempts = record?.module_attempts || {};
    for (const modId of MOD_IDS) {
      const arr = Array.isArray(attempts[modId]) ? attempts[modId] : [];
      arr.forEach((errs, idx) => {
        if (Number.isInteger(errs) && errs > 0) {
          const key = `${modId}#${idx}`;
          const prev = challengeErrorsMap.get(key) || {
            modId,
            challengeIdx: idx,
            axisTitle: AXIS_META[modId].shortTitle,
            errorCount: 0,
            studentsCount: 0
          };
          prev.errorCount += errs;
          prev.studentsCount += 1;
          challengeErrorsMap.set(key, prev);
        }
      });
    }

    // Aggregate quiz missed questions
    const quizAnswers = record?.quiz_answers || {};
    for (const [edKey, answersMap] of Object.entries(quizAnswers)) {
      const edition = BANCO_PROVAS?.[edKey];
      if (!edition || !answersMap || typeof answersMap !== 'object') continue;
      for (const q of edition.questions) {
        const picked = answersMap[q.id];
        if (picked === undefined || picked === null) continue;
        if (!q.isCancelled && picked !== q.correct) {
          const key = `${edKey}:${q.id}`;
          const modId = mapAxisToModuleId(q.axis);
          const prev = questionErrorsMap.get(key) || {
            editionKey: edKey,
            editionTitle: edition.title,
            questionId: q.id,
            modId,
            axisTitle: AXIS_META[modId]?.shortTitle || q.axis,
            questionPreview: String(q.question || '').slice(0, 110),
            errorCount: 0,
            attempts: 0
          };
          prev.errorCount += 1;
          prev.attempts += 1;
          questionErrorsMap.set(key, prev);
        } else {
          const key = `${edKey}:${q.id}`;
          const prev = questionErrorsMap.get(key);
          if (prev) prev.attempts += 1;
        }
      }
    }
  }

  const axesRank = Object.values(axisSummary).map((agg) => {
    const avg = agg.masterySamples.length > 0
      ? Math.round(agg.masterySamples.reduce((a, b) => a + b, 0) / agg.masterySamples.length)
      : null;
    return {
      ...agg,
      avgMastery: avg
    };
  });

  // Sort weakest first (lowest avgMastery, highest errors)
  axesRank.sort((a, b) => {
    if (a.avgMastery === null && b.avgMastery === null) return b.totalErrors - a.totalErrors;
    if (a.avgMastery === null) return 1;
    if (b.avgMastery === null) return -1;
    return a.avgMastery - b.avgMastery || b.totalErrors - a.totalErrors;
  });

  const topMissedQuestions = [...questionErrorsMap.values()]
    .sort((a, b) => b.errorCount - a.errorCount || b.attempts - a.attempts)
    .slice(0, 8);

  const topMissedChallenges = [...challengeErrorsMap.values()]
    .sort((a, b) => b.errorCount - a.errorCount || b.studentsCount - a.studentsCount)
    .slice(0, 6);

  return {
    studentCount: students.length,
    students,
    axesRank,
    topMissedQuestions,
    topMissedChallenges
  };
}

function getHeaders(extra = {}) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json',
    ...extra
  };
}

/**
 * Envia (upsert) o diagnóstico do aluno logado para a tabela `student_diagnostics` do Supabase.
 * Retorna `{ ok: true, payload }` ou `{ ok: false, reason, payload }`.
 */
export async function syncStudentToCloud(state) {
  const payload = buildStudentDiagnosticPayload(state);
  if (typeof fetch !== 'function') {
    return { ok: false, reason: 'fetch_unavailable', payload };
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/student_diagnostics?on_conflict=class_code,student_key`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, status: res.status, reason: errText || 'http_error', payload };
    }
    return { ok: true, payload };
  } catch (err) {
    return { ok: false, reason: err?.message || 'network_error', payload };
  }
}

/**
 * Busca todos os diagnósticos da turma informada no Supabase.
 * @param {string} classCode
 */
export async function fetchClassFromCloud(classCode) {
  const cleanClass = normalizeClassCode(classCode);
  if (typeof fetch !== 'function') {
    return { ok: false, reason: 'fetch_unavailable', records: [] };
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/student_diagnostics?class_code=eq.${encodeURIComponent(cleanClass)}&order=updated_at.desc&limit=200`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, status: res.status, reason: errText || 'http_error', records: [] };
    }
    const data = await res.json();
    return { ok: true, records: Array.isArray(data) ? data : [] };
  } catch (err) {
    return { ok: false, reason: err?.message || 'network_error', records: [] };
  }
}

export function loadLocalTeacherRoster() {
  try {
    const raw = localStorage.getItem(TEACHER_ROSTER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalTeacherRoster(records) {
  try {
    localStorage.setItem(TEACHER_ROSTER_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Erro ao salvar lista local da turma:', err);
  }
}

export function upsertLocalTeacherRecord(record) {
  if (!record || !record.student_key || !record.class_code) return loadLocalTeacherRoster();
  const list = loadLocalTeacherRoster();
  const idx = list.findIndex((r) => r.class_code === record.class_code && r.student_key === record.student_key);
  if (idx >= 0) list[idx] = record;
  else list.unshift(record);
  saveLocalTeacherRoster(list);
  return list;
}

/**
 * Mescla registros da nuvem com importações/caches locais priorizando o `updated_at` mais recente.
 */
export function mergeClassRecords(cloudRecords = [], localRecords = [], classCode = DEFAULT_CLASS_CODE) {
  const targetClass = normalizeClassCode(classCode);
  const byKey = new Map();

  for (const rec of [...localRecords, ...cloudRecords]) {
    if (!rec) continue;
    const recClass = normalizeClassCode(rec.class_code);
    if (recClass !== targetClass) continue;
    const key = rec.student_key || normalizeStudentKey(rec.student_name);
    const existing = byKey.get(key);
    if (!existing || String(rec.updated_at || '') >= String(existing.updated_at || '')) {
      byKey.set(key, { ...rec, class_code: recClass, student_key: key });
    }
  }
  return [...byKey.values()].sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
}

/**
 * Gera 5 registros simulados realistas para o professor testar o painel antes da aula.
 */
export function buildDemoClassRoster(classCode = DEFAULT_CLASS_CODE) {
  const c = normalizeClassCode(classCode);
  const now = new Date().toISOString();
  const qIds = BANCO_PROVAS.imersao_fixacao.questions;
  const pickWrong = (q) => (q.correct + 1) % q.options.length;

  const ansAllWeakTrig = Object.fromEntries(qIds.map((q) => {
    const m = mapAxisToModuleId(q.axis);
    return [q.id, (m === 'mod-trig' || m === 'mod-financas') ? pickWrong(q) : q.correct];
  }));

  const ansMixed = Object.fromEntries(qIds.map((q) => {
    const m = mapAxisToModuleId(q.axis);
    return [q.id, (m === 'mod-trig' || m === 'mod-algebra') ? pickWrong(q) : q.correct];
  }));

  const ansTop = Object.fromEntries(qIds.map((q) => [q.id, q.correct]));

  return [
    {
      class_code: c,
      student_key: 'demo:ana beatriz',
      student_name: 'Ana Beatriz (Teste)',
      score: 175,
      completed_modules: { 'mod-logica': true, 'mod-numeros': true },
      module_practice: { 'mod-logica': [0, 1, 2], 'mod-numeros': [0, 1, 2], 'mod-trig': [0] },
      module_attempts: { 'mod-logica': [0, 0, 0], 'mod-trig': [4, 2, 1], 'mod-financas': [2, 1, 0] },
      quiz_answers: { imersao_fixacao: ansAllWeakTrig },
      quiz_submitted: { imersao_fixacao: true },
      updated_at: now
    },
    {
      class_code: c,
      student_key: 'demo:lucas mendes',
      student_name: 'Lucas Mendes (Teste)',
      score: 125,
      completed_modules: { 'mod-logica': true },
      module_practice: { 'mod-logica': [0, 1, 2], 'mod-algebra': [0, 1] },
      module_attempts: { 'mod-algebra': [3, 2, 0], 'mod-trig': [3, 3, 2] },
      quiz_answers: { imersao_fixacao: ansMixed },
      quiz_submitted: { imersao_fixacao: true },
      updated_at: now
    },
    {
      class_code: c,
      student_key: 'demo:mariana costa',
      student_name: 'Mariana Costa (Teste)',
      score: 300,
      completed_modules: { 'mod-logica': true, 'mod-numeros': true, 'mod-algebra': true, 'mod-estatistica': true },
      module_practice: { 'mod-logica': [0, 1, 2], 'mod-numeros': [0, 1, 2], 'mod-algebra': [0, 1, 2], 'mod-estatistica': [0, 1, 2] },
      module_attempts: { 'mod-trig': [1, 0, 0] },
      quiz_answers: { imersao_fixacao: ansTop },
      quiz_submitted: { imersao_fixacao: true },
      updated_at: now
    },
    {
      class_code: c,
      student_key: 'demo:gabriel souza',
      student_name: 'Gabriel Souza (Teste)',
      score: 75,
      completed_modules: {},
      module_practice: { 'mod-logica': [0, 1] },
      module_attempts: { 'mod-logica': [1, 0, 0], 'mod-trig': [5, 2, 0], 'mod-financas': [3, 1, 0] },
      quiz_answers: { imersao_fixacao: ansAllWeakTrig },
      quiz_submitted: { imersao_fixacao: true },
      updated_at: now
    },
    {
      class_code: c,
      student_key: 'demo:camila oliveira',
      student_name: 'Camila Oliveira (Teste)',
      score: 200,
      completed_modules: { 'mod-logica': true, 'mod-estatistica': true },
      module_practice: { 'mod-logica': [0, 1, 2], 'mod-estatistica': [0, 1, 2], 'mod-algebra': [0] },
      module_attempts: { 'mod-algebra': [2, 2, 0], 'mod-trig': [2, 1, 0] },
      quiz_answers: { imersao_fixacao: ansMixed },
      quiz_submitted: { imersao_fixacao: true },
      updated_at: now
    }
  ];
}
