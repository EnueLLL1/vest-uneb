/**
 * ORQUESTRADOR PRINCIPAL DO PORTAL VESTIBULAR UNEB 2026
 * Inicialização, roteamento de abas, sincronização de métricas e delegação de eventos.
 */

import {
  getState,
  setState,
  loadState,
  saveState,
  subscribe,
  recalculateScore,
  markModuleComplete,
  resetStudentProgress
} from './state.js';
import { showToast } from './utils/toast.js';
import { initLogic } from './modules/logica.js';
import { initCombinatoria, setSeqType } from './modules/combinatoria.js';
import { initParabola, renderQuadratic } from './modules/parabola.js';
import { initTrigonometria, renderTrigCircle, setTrigAngle } from './modules/trig.js';
import { initFinancas, renderFinance } from './modules/financas.js';
import { initStats, calculateStatistics } from './modules/stats.js';
import { initQuiz, renderQuizQuestions, startTimer } from './modules/quiz.js';

let resizeTimer = null;

function debounceResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const state = getState();
    if (state.currentView === 'day1') {
      renderQuadratic();
    } else if (state.currentView === 'day2') {
      renderTrigCircle();
      renderFinance();
      calculateStatistics();
    }
  }, 120);
}

export function updateMetricUI() {
  const state = getState();
  const completedCount = Object.values(state.completedModules).filter(Boolean).length;
  const totalModules = 6;
  const percent = Math.round((completedCount / totalModules) * 100);

  const elPercent = document.getElementById('metric-percent');
  const elBar = document.getElementById('metric-progress-bar');
  const elScore = document.getElementById('metric-score');
  const elDoneCount = document.getElementById('metric-done-count');

  if (elPercent) elPercent.textContent = `${percent}%`;
  if (elBar) elBar.style.width = `${percent}%`;
  if (elScore) elScore.textContent = state.score;
  if (elDoneCount) elDoneCount.textContent = completedCount;

  Object.entries(state.completedModules).forEach(([modId, done]) => {
    const btn = document.getElementById(`btn-comp-${modId}`);
    if (btn) {
      if (done) {
        btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
        btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-300');
        btn.textContent = 'Módulo Concluído ✓';
      } else {
        btn.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-600');
        btn.classList.add('bg-white', 'text-slate-700', 'border-slate-300');
        btn.textContent = 'Marcar como Concluído ✓';
      }
    }
  });
}

export function switchView(viewName, save = true) {
  const state = getState();
  state.currentView = viewName;

  ['day1', 'day2', 'quiz'].forEach(id => {
    const viewEl = document.getElementById(`view-${id}`);
    const navEl = document.getElementById(`nav-${id}`);
    if (viewEl) viewEl.classList.add('hidden');
    if (navEl) {
      navEl.classList.remove('bg-uneb-accent', 'text-white');
      navEl.classList.add('text-slate-300');
    }
  });

  const activeView = document.getElementById(`view-${viewName}`);
  const activeNav = document.getElementById(`nav-${viewName}`);
  if (activeView) activeView.classList.remove('hidden');
  if (activeNav) {
    activeNav.classList.add('bg-uneb-accent', 'text-white');
    activeNav.classList.remove('text-slate-300');
  }

  if (save) saveState();

  requestAnimationFrame(() => {
    if (viewName === 'day1') {
      renderQuadratic();
    } else if (viewName === 'day2') {
      renderTrigCircle();
      renderFinance();
      calculateStatistics();
    } else if (viewName === 'quiz') {
      renderQuizQuestions();
      startTimer();
    }
  });
}

export function setAppMode(mode, notify = true) {
  const state = getState();
  state.mode = mode;
  const btnStudent = document.getElementById('btn-mode-student');
  const btnTeacher = document.getElementById('btn-mode-teacher');

  if (mode === 'student') {
    if (btnStudent) {
      btnStudent.classList.add('bg-white', 'text-uneb-primary', 'shadow-sm');
      btnStudent.classList.remove('text-blue-200');
    }
    if (btnTeacher) {
      btnTeacher.classList.remove('bg-white', 'text-uneb-primary', 'shadow-sm');
      btnTeacher.classList.add('text-blue-200');
    }
    document.querySelectorAll('.teacher-note').forEach(el => el.classList.add('hidden'));
    if (notify) showToast('Modo Estudante ativado: foco no treino autônomo.');
  } else {
    if (btnTeacher) {
      btnTeacher.classList.add('bg-white', 'text-uneb-primary', 'shadow-sm');
      btnTeacher.classList.remove('text-blue-200');
    }
    if (btnStudent) {
      btnStudent.classList.remove('bg-white', 'text-uneb-primary', 'shadow-sm');
      btnStudent.classList.add('text-blue-200');
    }
    document.querySelectorAll('.teacher-note').forEach(el => el.classList.remove('hidden'));
    if (notify) showToast('Modo Professor ativado: gabaritos e notas didáticas em destaque.');
  }

  renderQuizQuestions();
  if (notify) saveState();
}

function restoreInputsFromParams() {
  const setV = (id, v) => {
    const el = document.getElementById(id);
    if (el && v !== undefined) el.value = v;
  };
  const state = getState();
  const p = state.params;
  if (!p) return;

  setV('slider-n', p.sliderN);
  setV('slider-p', p.sliderP);
  setV('seq-a1', p.seqA1);
  setV('seq-raz', p.seqRaz);
  setV('seq-n', p.seqN);
  if (p.seqType) setSeqType(p.seqType);
  setV('slider-quad-a', p.quadA);
  setV('slider-quad-b', p.quadB);
  setV('slider-quad-c', p.quadC);
  if (p.trigAngle !== undefined) {
    setTrigAngle(p.trigAngle);
  }
  setV('fin-capital', p.finCapital);
  setV('fin-taxa', p.finTaxa);
  setV('fin-tempo', p.finTempo);
  setV('sturges-n', p.sturgesN);
  setV('sturges-aa', p.sturgesAA);
  setV('stat-input-data', p.statData);
}

function handleResetStudentProgress() {
  resetStudentProgress();
  updateMetricUI();
  renderQuizQuestions();
  const resCard = document.getElementById('quiz-result-card');
  if (resCard) resCard.classList.add('hidden');
  showToast('Progresso reiniciado com sucesso.');
}

function setupGlobalListeners() {
  // Modo Aluno vs Professor
  const btnStudent = document.getElementById('btn-mode-student');
  const btnTeacher = document.getElementById('btn-mode-teacher');
  if (btnStudent) btnStudent.addEventListener('click', () => setAppMode('student'));
  if (btnTeacher) btnTeacher.addEventListener('click', () => setAppMode('teacher'));

  // Reset de Progresso
  const btnReset = document.getElementById('btn-reset-progress');
  if (btnReset) btnReset.addEventListener('click', handleResetStudentProgress);

  // Navegação entre abas
  const navDay1 = document.getElementById('nav-day1');
  const navDay2 = document.getElementById('nav-day2');
  const navQuiz = document.getElementById('nav-quiz');
  if (navDay1) navDay1.addEventListener('click', () => switchView('day1'));
  if (navDay2) navDay2.addEventListener('click', () => switchView('day2'));
  if (navQuiz) navQuiz.addEventListener('click', () => switchView('quiz'));

  // Botões de conclusão dos módulos
  document.querySelectorAll('[data-comp-module]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modId = btn.getAttribute('data-comp-module');
      const isNowDone = markModuleComplete(modId);
      if (isNowDone) {
        showToast('Módulo concluído! +50 XP acumulados.');
      } else {
        showToast('Módulo desmarcado.');
      }
      updateMetricUI();
    });
  });

  window.addEventListener('resize', debounceResize);
}

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  restoreInputsFromParams();
  recalculateScore();
  updateMetricUI();

  // Inscrição reativa para métricas
  subscribe(() => {
    updateMetricUI();
  });

  setupGlobalListeners();

  // Inicializa cada submódulo
  initLogic();
  initCombinatoria();
  initParabola();
  initTrigonometria();
  initFinancas();
  initStats();
  initQuiz();

  const state = getState();
  setAppMode(state.mode || 'student', false);
  switchView(state.currentView || 'day1', false);
});
