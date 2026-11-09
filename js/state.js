/**
 * MÓDULO CENTRAL DE ESTADO REATIVO & PERSISTÊNCIA (localStorage)
 * Padrão Pub/Sub enxuto (~90 linhas), sem dependências externas.
 */

import { BANCO_PROVAS } from './data/banco_questoes.js';

const APP_STORAGE_KEY = 'uneb_math_2026_v1';

const defaultState = {
  score: 0,
  mode: 'student', // 'student' ou 'teacher'
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

export function loadState() {
  try {
    const saved = localStorage.getItem(APP_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        appState.mode = parsed.mode === 'teacher' ? 'teacher' : 'student';
        appState.currentView = parsed.currentView || 'day1';
        if (parsed.selectedEdition) appState.selectedEdition = parsed.selectedEdition;
        if (parsed.quizMode) appState.quizMode = parsed.quizMode;
        if (parsed.completedModules) Object.assign(appState.completedModules, parsed.completedModules);
        if (parsed.quizAnswersByEdition) Object.assign(appState.quizAnswersByEdition, parsed.quizAnswersByEdition);
        if (parsed.quizSubmittedByEdition) Object.assign(appState.quizSubmittedByEdition, parsed.quizSubmittedByEdition);
        if (parsed.params) Object.assign(appState.params, parsed.params);
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar do localStorage:', e);
  }
  recalculateScore();
}

export function setState(partial, changeKey = 'generic') {
  if (partial && typeof partial === 'object') {
    if (partial.params) {
      Object.assign(appState.params, partial.params);
      delete partial.params;
    }
    Object.assign(appState, partial);
  }
  recalculateScore();
  saveState();
  notify(changeKey);
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
  appState.completedModules = {
    'mod-logica': false,
    'mod-numeros': false,
    'mod-algebra': false,
    'mod-trig': false,
    'mod-financas': false,
    'mod-estatistica': false
  };
  appState.quizAnswersByEdition = {
    uneb_2025: {},
    uneb_2024: {},
    uneb_2023: {},
    imersao_fixacao: {}
  };
  appState.quizSubmittedByEdition = {
    uneb_2025: false,
    uneb_2024: false,
    uneb_2023: false,
    imersao_fixacao: false
  };
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
