/**
 * MÓDULO CENTRAL DE ESTADO REATIVO & PERSISTÊNCIA (localStorage)
 * Padrão Pub/Sub enxuto (~90 linhas), sem dependências externas.
 */

import { BANCO_PROVAS } from './data/banco_questoes.js';
import { DEFAULT_CLASS_CODE, normalizeStudentName, normalizeClassCode } from './utils/session.js';

export const APP_STORAGE_KEY = 'uneb_math_2026_v1';

const MOD_KEYS = [
  'mod-logica',
  'mod-numeros',
  'mod-algebra',
  'mod-trig',
  'mod-financas',
  'mod-estatistica'
];

function createEmptyModulePractice() {
  return Object.fromEntries(MOD_KEYS.map((k) => [k, []]));
}

function createEmptyModuleAttempts() {
  return Object.fromEntries(MOD_KEYS.map((k) => [k, [0, 0, 0]]));
}

const defaultState = {
  score: 0,
  mode: 'student', // espelho legado de isTeacherModeActive()
  sessionRole: null, // null | 'student' | 'teacher'
  studentName: '',
  classCode: DEFAULT_CLASS_CODE,
  teacherShowAnswers: false,
  teacherPreviewAsStudent: false,
  selectedEdition: 'uneb_2025',
  quizMode: 'simulado', // 'simulado' ou 'estudo'
  quizAnswersByEdition: {
    uneb_2025: {},
    uneb_2024: {},
    uneb_2023: {},
    imersao_fixacao: {}
  },
  quizSubmittedByEdition: {
    uneb_2025: false,
    uneb_2024: false,
    uneb_2023: false,
    imersao_fixacao: false
  },
  completedModules: {
    'mod-logica': false,
    'mod-numeros': false,
    'mod-algebra': false,
    'mod-trig': false,
    'mod-financas': false,
    'mod-estatistica': false
  },
  modulePractice: createEmptyModulePractice(),
  moduleAttempts: createEmptyModuleAttempts(),
  currentView: 'day1',
  params: {
    sliderN: 7,
    sliderP: 3,
    seqA1: 2,
    seqRaz: 3,
    seqN: 10,
    seqType: 'pa',
    quadA: 1,
    quadB: -2,
    quadC: -3,
    trigAngle: 45,
    finCapital: 1000,
    finTaxa: 10,
    finTempo: 6,
    sturgesN: 100,
    sturgesAA: 48,
    statData: '15, 22, 22, 28, 35, 40, 42, 50, 50, 50, 62'
  }
};

let appState = JSON.parse(JSON.stringify(defaultState));
const subscribers = new Set();

export function getState() {
  return appState;
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify(changeKey) {
  for (const fn of subscribers) {
    try {
      fn(appState, changeKey);
    } catch (err) {
      console.error('Erro em subscriber de estado:', err);
    }
  }
}

export function recalculateScore() {
  const modXP = Object.values(appState.completedModules).filter(Boolean).length * 50;
  let quizXP = 0;
  if (BANCO_PROVAS) {
    Object.keys(BANCO_PROVAS).forEach(edKey => {
      const edAnswers = appState.quizAnswersByEdition?.[edKey] || {};
      const questions = BANCO_PROVAS[edKey]?.questions || [];
      questions.forEach(q => {
        if (edAnswers[q.id] !== undefined && (q.isCancelled || edAnswers[q.id] === q.correct)) {
          quizXP += 25;
        }
      });
    });
  }
  appState.score = modXP + quizXP;
}

export function saveState() {
  try {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('Erro ao salvar no localStorage:', e);
  }
}

export function isTeacherModeActive(stateSlice = appState) {
  return stateSlice?.sessionRole === 'teacher' && !stateSlice?.teacherPreviewAsStudent;
}

export function loadState() {
  const validViews = new Set(['home', 'day1', 'day2', 'quiz', 'turma']);
  const validQuizModes = new Set(['simulado', 'estudo']);
  const validRoles = new Set(['student', 'teacher']);

  appState.mode = defaultState.mode;
  appState.sessionRole = null;
  appState.studentName = '';
  appState.classCode = DEFAULT_CLASS_CODE;
  appState.teacherShowAnswers = false;
  appState.teacherPreviewAsStudent = false;
  appState.currentView = defaultState.currentView;
  appState.selectedEdition = defaultState.selectedEdition;
  appState.quizMode = defaultState.quizMode;
  appState.completedModules = { ...defaultState.completedModules };
  appState.modulePractice = createEmptyModulePractice();
  appState.moduleAttempts = createEmptyModuleAttempts();
  appState.quizAnswersByEdition = Object.fromEntries(Object.keys(BANCO_PROVAS).map(k => [k, {}]));
  appState.quizSubmittedByEdition = Object.fromEntries(Object.keys(BANCO_PROVAS).map(k => [k, false]));
  appState.params = { ...defaultState.params };

  try {
    const saved = localStorage.getItem(APP_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (validRoles.has(parsed.sessionRole)) {
          appState.sessionRole = parsed.sessionRole;
        }
        appState.studentName = normalizeStudentName(parsed.studentName);
        if (typeof parsed.classCode === 'string') {
          appState.classCode = normalizeClassCode(parsed.classCode);
        }
        if (typeof parsed.teacherShowAnswers === 'boolean') {
          appState.teacherShowAnswers = parsed.teacherShowAnswers;
        }
        if (typeof parsed.teacherPreviewAsStudent === 'boolean') {
          appState.teacherPreviewAsStudent = parsed.teacherPreviewAsStudent;
        }

        if (appState.sessionRole !== null) {
          appState.mode = isTeacherModeActive(appState) ? 'teacher' : 'student';
        } else {
          appState.mode = parsed.mode === 'teacher' ? 'teacher' : 'student';
        }

        if (validViews.has(parsed.currentView)) {
          appState.currentView = (parsed.currentView === 'turma' && !isTeacherModeActive(appState))
            ? 'day1'
            : parsed.currentView;
        }
        if (typeof parsed.selectedEdition === 'string' && Object.hasOwn(BANCO_PROVAS, parsed.selectedEdition)) {
          appState.selectedEdition = parsed.selectedEdition;
        }
        if (validQuizModes.has(parsed.quizMode)) appState.quizMode = parsed.quizMode;

        if (parsed.completedModules && typeof parsed.completedModules === 'object' && !Array.isArray(parsed.completedModules)) {
          for (const modKey of Object.keys(defaultState.completedModules)) {
            if (typeof parsed.completedModules[modKey] === 'boolean') {
              appState.completedModules[modKey] = parsed.completedModules[modKey];
            }
          }
        }

        if (parsed.modulePractice && typeof parsed.modulePractice === 'object' && !Array.isArray(parsed.modulePractice)) {
          for (const modKey of MOD_KEYS) {
            const rawList = Object.hasOwn(parsed.modulePractice, modKey) ? parsed.modulePractice[modKey] : null;
            if (Array.isArray(rawList)) {
              const uniqueValid = [...new Set(rawList.filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < 3))];
              appState.modulePractice[modKey] = uniqueValid.sort((a, b) => a - b);
            }
          }
        }

        if (parsed.moduleAttempts && typeof parsed.moduleAttempts === 'object' && !Array.isArray(parsed.moduleAttempts)) {
          for (const modKey of MOD_KEYS) {
            const rawArr = Object.hasOwn(parsed.moduleAttempts, modKey) ? parsed.moduleAttempts[modKey] : null;
            if (Array.isArray(rawArr)) {
              appState.moduleAttempts[modKey] = [0, 1, 2].map((i) => {
                const v = rawArr[i];
                return Number.isInteger(v) && v >= 0 && v <= 999 ? v : 0;
              });
            }
          }
        }

        if (parsed.quizAnswersByEdition && typeof parsed.quizAnswersByEdition === 'object' && !Array.isArray(parsed.quizAnswersByEdition)) {
          for (const edKey of Object.keys(BANCO_PROVAS)) {
            const rawEd = Object.hasOwn(parsed.quizAnswersByEdition, edKey) ? parsed.quizAnswersByEdition[edKey] : null;
            if (rawEd && typeof rawEd === 'object' && !Array.isArray(rawEd)) {
              const cleanEd = {};
              for (const [qId, ans] of Object.entries(rawEd)) {
                if (Number.isInteger(ans) && ans >= 0 && ans <= 4) {
                  cleanEd[qId] = ans;
                }
              }
              appState.quizAnswersByEdition[edKey] = cleanEd;
            }
          }
        }

        if (parsed.quizSubmittedByEdition && typeof parsed.quizSubmittedByEdition === 'object' && !Array.isArray(parsed.quizSubmittedByEdition)) {
          for (const edKey of Object.keys(BANCO_PROVAS)) {
            if (typeof parsed.quizSubmittedByEdition[edKey] === 'boolean') {
              appState.quizSubmittedByEdition[edKey] = parsed.quizSubmittedByEdition[edKey];
            }
          }
        }

        if (parsed.params && typeof parsed.params === 'object' && !Array.isArray(parsed.params)) {
          for (const paramKey of Object.keys(defaultState.params)) {
            const val = Object.hasOwn(parsed.params, paramKey) ? parsed.params[paramKey] : undefined;
            if (paramKey === 'seqType') {
              if (val === 'pa' || val === 'pg') appState.params.seqType = val;
            } else if (paramKey === 'statData') {
              if (typeof val === 'string') appState.params.statData = val;
            } else if (typeof val === 'number' && Number.isFinite(val)) {
              appState.params[paramKey] = val;
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar do localStorage:', e);
  }
  recalculateScore();
}

export function setState(partial, changeKey = 'generic') {
  if (partial && typeof partial === 'object') {
    const { params, ...rest } = partial;
    if (params) {
      Object.assign(appState.params, params);
    }
    if ('studentName' in rest) {
      rest.studentName = normalizeStudentName(rest.studentName);
    }
    if ('classCode' in rest) {
      rest.classCode = normalizeClassCode(rest.classCode);
    }
    if ('sessionRole' in rest && rest.sessionRole !== 'student' && rest.sessionRole !== 'teacher') {
      rest.sessionRole = null;
    }
    Object.assign(appState, rest);
    if ('sessionRole' in rest || 'teacherPreviewAsStudent' in rest) {
      appState.mode = isTeacherModeActive(appState) ? 'teacher' : 'student';
    }
  }
  recalculateScore();
  saveState();
  notify(changeKey);
}

export function recordModuleAttempt(modId, challengeIdx, isCorrect, totalChallenges = 3) {
  if (!Object.hasOwn(appState.moduleAttempts, modId)) return false;
  if (!Number.isInteger(challengeIdx) || challengeIdx < 0 || challengeIdx >= totalChallenges) return false;

  if (isCorrect) {
    return completeModuleChallenge(modId, challengeIdx, totalChallenges);
  }

  const currentArr = Array.isArray(appState.moduleAttempts[modId])
    ? [...appState.moduleAttempts[modId]]
    : [0, 0, 0];
  currentArr[challengeIdx] = Math.min(999, (currentArr[challengeIdx] || 0) + 1);
  appState.moduleAttempts[modId] = currentArr;
  saveState();
  notify('module-attempt');
  return false;
}

export function completeModuleChallenge(modId, challengeIdx, totalChallenges = 3) {
  if (!Object.hasOwn(appState.modulePractice, modId)) return false;
  if (!Number.isInteger(challengeIdx) || challengeIdx < 0 || challengeIdx >= totalChallenges) return false;

  const current = appState.modulePractice[modId] || [];
  if (!current.includes(challengeIdx)) {
    appState.modulePractice[modId] = [...current, challengeIdx].sort((a, b) => a - b);
  }
  if (appState.modulePractice[modId].length >= totalChallenges) {
    appState.completedModules[modId] = true;
  }
  recalculateScore();
  saveState();
  notify('module-practice');
  return appState.modulePractice[modId].length >= totalChallenges;
}

export function markModuleComplete(modId) {
  const current = Boolean(appState.completedModules[modId]);
  appState.completedModules[modId] = !current;
  recalculateScore();
  saveState();
  notify('module-completed');
  return appState.completedModules[modId];
}

export function resetStudentProgress() {
  appState.completedModules = { ...defaultState.completedModules };
  appState.modulePractice = createEmptyModulePractice();
  appState.moduleAttempts = createEmptyModuleAttempts();
  appState.quizAnswersByEdition = Object.fromEntries(Object.keys(BANCO_PROVAS).map(k => [k, {}]));
  appState.quizSubmittedByEdition = Object.fromEntries(Object.keys(BANCO_PROVAS).map(k => [k, false]));
  recalculateScore();
  saveState();
  notify('reset');
}

export function getCurrentQuizData() {
  const editionKey = appState.selectedEdition || 'uneb_2025';
  if (BANCO_PROVAS && BANCO_PROVAS[editionKey]) {
    return BANCO_PROVAS[editionKey];
  }
  if (BANCO_PROVAS && BANCO_PROVAS['uneb_2025']) {
    return BANCO_PROVAS['uneb_2025'];
  }
  return {
    id: 'vazio',
    title: 'Banco em Carregamento',
    subtitle: 'Aguarde o carregamento do banco de questões',
    description: 'Recarregue a página se os dados não aparecerem.',
    timeMinutes: 60,
    questions: []
  };
}

export function getAnswersForCurrentEdition() {
  const key = appState.selectedEdition || 'uneb_2025';
  if (!appState.quizAnswersByEdition) appState.quizAnswersByEdition = {};
  if (!appState.quizAnswersByEdition[key]) {
    appState.quizAnswersByEdition[key] = {};
  }
  return appState.quizAnswersByEdition[key];
}

export function isCurrentQuizSubmitted() {
  const key = appState.selectedEdition || 'uneb_2025';
  if (!appState.quizSubmittedByEdition) appState.quizSubmittedByEdition = {};
  return Boolean(appState.quizSubmittedByEdition[key]);
}

