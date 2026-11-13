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
  resetStudentProgress,
  isTeacherModeActive
} from './state.js';
import { validateTeacherCode, normalizeStudentName, normalizeClassCode } from './utils/session.js';
import {
  buildStudentDiagnosticPayload,
  encodeStudentReportCode,
  syncStudentToCloud
} from './utils/classroom.js';
import { showToast } from './utils/toast.js';
import { confirmAction } from './utils/confirm.js';
import { initLogic } from './modules/logica.js';
import { initCombinatoria, setSeqType } from './modules/combinatoria.js';
import { initParabola, renderQuadratic } from './modules/parabola.js';
import { initTrigonometria, renderTrigCircle, setTrigAngle } from './modules/trig.js';
import { initFinancas, renderFinance } from './modules/financas.js';
import { initStats, calculateStatistics } from './modules/stats.js';
import {
  initQuiz,
  renderQuizQuestions,
  startTimer,
  syncTimerForCurrentEdition,
  changeQuizEdition,
  scrollToQuestion
} from './modules/quiz.js';
import { initTurma, renderTurmaDashboard, refreshTurmaData } from './modules/turma.js';

let resizeTimer = null;
let cloudSyncTimer = null;

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
  if (elBar) {
    if ('value' in elBar) elBar.value = percent;
    else elBar.style.width = `${percent}%`;
  }
  if (elScore) elScore.textContent = state.score;
  if (elDoneCount) elDoneCount.textContent = completedCount;

  Object.entries(state.completedModules).forEach(([modId, done]) => {
    const btn = document.getElementById(`btn-comp-${modId}`);
    if (btn) {
      btn.setAttribute('aria-pressed', String(Boolean(done)));
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
  const safeView = (viewName === 'turma' && !isTeacherModeActive(state)) ? 'day1' : viewName;
  state.currentView = safeView;

  ['day1', 'day2', 'quiz', 'turma'].forEach(id => {
    const viewEl = document.getElementById(`view-${id}`);
    const navEl = document.getElementById(`nav-${id}`);
    if (viewEl) viewEl.classList.add('hidden');
    if (navEl) {
      navEl.classList.remove('bg-uneb-accent', 'text-white');
      navEl.classList.add('text-slate-300');
      navEl.removeAttribute('aria-current');
    }
  });

  const activeView = document.getElementById(`view-${safeView}`);
  const activeNav = document.getElementById(`nav-${safeView}`);
  if (activeView) activeView.classList.remove('hidden');
  if (activeNav) {
    activeNav.classList.add('bg-uneb-accent', 'text-white');
    activeNav.classList.remove('text-slate-300');
    activeNav.setAttribute('aria-current', 'page');
  }

  if (save) saveState();

  requestAnimationFrame(() => {
    if (safeView === 'day1') {
      renderQuadratic();
    } else if (safeView === 'day2') {
      renderTrigCircle();
      renderFinance();
      calculateStatistics();
    } else if (safeView === 'quiz') {
      renderQuizQuestions();
      startTimer();
    } else if (safeView === 'turma') {
      renderTurmaDashboard();
      refreshTurmaData({ silent: true });
    }
  });
}

function redrawActiveCanvases() {
  const state = getState();
  requestAnimationFrame(() => {
    if (state.currentView === 'day1') {
      renderQuadratic();
    } else if (state.currentView === 'day2') {
      renderTrigCircle();
      renderFinance();
      calculateStatistics();
    }
  });
}

export function applySessionUI() {
  const state = getState();
  const gateEl = document.getElementById('session-gate');
  const shellEl = document.getElementById('app-shell');
  const studentPanel = document.getElementById('student-header-panel');
  const teacherPanel = document.getElementById('teacher-header-panel');
  const previewBanner = document.getElementById('teacher-preview-banner');
  const studentBadge = document.getElementById('student-name-badge');
  const btnShareReport = document.getElementById('btn-student-share-report');
  const navTurma = document.getElementById('nav-turma');
  const btnReset = document.getElementById('btn-reset-progress');
  const btnToggleAnswers = document.getElementById('btn-teacher-toggle-answers');

  const hasSession = state.sessionRole === 'student' || state.sessionRole === 'teacher';
  const isTeacher = isTeacherModeActive(state);
  const isPreviewingStudent = state.sessionRole === 'teacher' && Boolean(state.teacherPreviewAsStudent);

  if (gateEl) gateEl.classList.toggle('hidden', hasSession);
  if (shellEl) shellEl.classList.toggle('hidden', !hasSession);

  if (!hasSession) {
    const inputName = document.getElementById('gate-student-name');
    if (inputName) inputName.value = state.studentName || '';
    const inputClass = document.getElementById('gate-student-class');
    if (inputClass) inputClass.value = state.classCode || 'UNEB-A';
    const errStudent = document.getElementById('gate-student-error');
    if (errStudent) errStudent.classList.add('hidden');
    const errEl = document.getElementById('gate-teacher-error');
    if (errEl) errEl.classList.add('hidden');
    return;
  }

  if (studentPanel) studentPanel.classList.toggle('hidden', isTeacher);
  if (teacherPanel) teacherPanel.classList.toggle('hidden', !isTeacher);
  if (navTurma) navTurma.classList.toggle('hidden', !isTeacher);
  if (btnShareReport) btnShareReport.classList.toggle('hidden', isTeacher || isPreviewingStudent);
  if (previewBanner) previewBanner.classList.toggle('hidden', !isPreviewingStudent);
  if (btnReset) btnReset.classList.toggle('hidden', isPreviewingStudent);

  if (!isTeacher && state.currentView === 'turma') {
    switchView('day1', false);
  }

  if (studentBadge) {
    const cls = state.classCode || 'UNEB-A';
    studentBadge.textContent = isPreviewingStudent
      ? 'Prévia: Estudante'
      : state.studentName
        ? `Olá, ${state.studentName} • ${cls}`
        : `Sessão Estudante • ${cls}`;
  }

  if (btnToggleAnswers) {
    const visible = Boolean(state.teacherShowAnswers);
    btnToggleAnswers.setAttribute('aria-pressed', String(visible));
    btnToggleAnswers.textContent = visible ? 'Gabarito na Lousa: Visível' : 'Gabarito na Lousa: Oculto';
    btnToggleAnswers.className = visible
      ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-400 transition-colors cursor-pointer'
      : 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-colors cursor-pointer';
  }

  document.querySelectorAll('.teacher-note').forEach((el) => {
    el.classList.toggle('hidden', !isTeacher);
  });

  renderQuizQuestions();
  redrawActiveCanvases();
}

function scheduleCloudSync(immediate = false) {
  const st = getState();
  if (st.sessionRole !== 'student' || !st.studentName) return;
  clearTimeout(cloudSyncTimer);
  if (immediate) {
    syncStudentToCloud(st);
    return;
  }
  cloudSyncTimer = setTimeout(() => {
    const latest = getState();
    if (latest.sessionRole === 'student' && latest.studentName) {
      syncStudentToCloud(latest);
    }
  }, 1000);
}

export function enterStudentSession(rawName = '', rawClassCode = 'UNEB-A') {
  const cleanName = normalizeStudentName(rawName);
  const errEl = document.getElementById('gate-student-error');
  if (!cleanName) {
    if (errEl) {
      errEl.textContent = 'Informe seu nome para o professor acompanhar seu desempenho.';
      errEl.classList.remove('hidden');
    }
    return false;
  }
  if (errEl) errEl.classList.add('hidden');

  const cleanClass = normalizeClassCode(rawClassCode);
  setState({
    sessionRole: 'student',
    studentName: cleanName,
    classCode: cleanClass,
    teacherShowAnswers: false,
    teacherPreviewAsStudent: false
  }, 'session');
  applySessionUI();
  switchView(getState().currentView === 'turma' ? 'day1' : (getState().currentView || 'day1'), false);
  scheduleCloudSync(true);
  showToast(`Bem-vindo(a), ${cleanName} (${cleanClass})! Sessão de Estudante iniciada.`);
  return true;
}

export function enterTeacherSession(code) {
  const errEl = document.getElementById('gate-teacher-error');
  if (!validateTeacherCode(code)) {
    if (errEl) {
      errEl.textContent = 'Código inválido. Verifique o código docente com a coordenação.';
      errEl.classList.remove('hidden');
    }
    return false;
  }
  if (errEl) errEl.classList.add('hidden');
  const codeInput = document.getElementById('gate-teacher-code');
  if (codeInput) codeInput.value = '';

  setState({
    sessionRole: 'teacher',
    teacherShowAnswers: false,
    teacherPreviewAsStudent: false
  }, 'session');
  applySessionUI();
  switchView(getState().currentView || 'day1', false);
  showToast('Sessão Docente iniciada. Gabarito na lousa começa oculto.');
  return true;
}

export function switchSessionGate() {
  setState({
    sessionRole: null,
    teacherShowAnswers: false,
    teacherPreviewAsStudent: false
  }, 'session');
  applySessionUI();
}

export function setAppMode(mode, notify = true) {
  const isTeacherReq = mode === 'teacher';
  setState({
    sessionRole: isTeacherReq ? 'teacher' : 'student',
    teacherPreviewAsStudent: false
  }, 'mode');
  applySessionUI();
  if (notify) {
    showToast(isTeacherReq ? 'Sessão Docente ativada.' : 'Modo Estudante ativado: foco no treino autônomo.');
  }
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

async function handleResetStudentProgress() {
  const confirmed = await confirmAction({
    title: 'Resetar todo o progresso?',
    message: 'Todos os módulos concluídos, respostas dos simulados e XP acumulado serão apagados.',
    confirmText: 'Resetar progresso',
    cancelText: 'Cancelar',
    danger: true
  });
  if (!confirmed) return;

  resetStudentProgress();
  syncTimerForCurrentEdition();
  updateMetricUI();
  renderQuizQuestions();
  const resCard = document.getElementById('quiz-result-card');
  if (resCard) resCard.classList.add('hidden');
  showToast('Progresso reiniciado com sucesso.');
}

function setupGlobalListeners() {
  // Welcome Session Gate (Aluno vs Professor)
  const studentForm = document.getElementById('gate-student-form');
  const btnEnterStudent = document.getElementById('btn-enter-student');
  const inputStudentName = document.getElementById('gate-student-name');
  const inputStudentClass = document.getElementById('gate-student-class');
  const submitStudent = (e) => {
    e?.preventDefault();
    enterStudentSession(inputStudentName?.value || '', inputStudentClass?.value || 'UNEB-A');
  };
  if (studentForm) studentForm.addEventListener('submit', submitStudent);
  else if (btnEnterStudent) btnEnterStudent.addEventListener('click', submitStudent);

  // Modal de Envio & Código Offline (Estudante)
  const btnShareReport = document.getElementById('btn-student-share-report');
  const reportDialog = document.getElementById('report-code-dialog');
  const reportOutput = document.getElementById('report-code-output');
  const reportStatus = document.getElementById('report-code-cloud-status');
  const btnCopyReport = document.getElementById('btn-copy-report-code');

  if (btnShareReport && reportDialog) {
    btnShareReport.addEventListener('click', async () => {
      const payload = buildStudentDiagnosticPayload(getState());
      const code = encodeStudentReportCode(payload);
      if (reportOutput) reportOutput.value = code;
      if (reportStatus) {
        reportStatus.textContent = 'Enviando dados para o Painel da Turma na nuvem...';
        reportStatus.className = 'text-xs font-semibold px-3 py-2 rounded-lg bg-blue-50 text-blue-900';
      }
      if (typeof reportDialog.showModal === 'function') reportDialog.showModal();
      else reportDialog.setAttribute('open', 'true');

      const res = await syncStudentToCloud(getState());
      if (reportStatus) {
        if (res.ok) {
          reportStatus.textContent = `Enviado ao vivo para a turma ${payload.class_code}! O professor já vê seu progresso na lousa.`;
          reportStatus.className = 'text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200';
        } else {
          reportStatus.textContent = 'Sem internet para envio automático. Copie o código UNEB1 abaixo e envie ao professor.';
          reportStatus.className = 'text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200';
        }
      }
    });
  }

  if (btnCopyReport && reportOutput) {
    btnCopyReport.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(reportOutput.value);
        showToast('Código UNEB1 copiado! Basta enviar ou colar para o professor.');
      } catch {
        reportOutput.select();
        showToast('Selecione e copie o código manualmente na caixa acima.');
      }
    });
  }

  const teacherForm = document.getElementById('gate-teacher-form');
  const inputTeacherCode = document.getElementById('gate-teacher-code');
  if (teacherForm) {
    teacherForm.addEventListener('submit', (e) => {
      e.preventDefault();
      enterTeacherSession(inputTeacherCode?.value || '');
    });
  }

  // Barra Docente e Troca de Sessão
  const btnToggleAnswers = document.getElementById('btn-teacher-toggle-answers');
  if (btnToggleAnswers) {
    btnToggleAnswers.addEventListener('click', () => {
      const next = !getState().teacherShowAnswers;
      setState({ teacherShowAnswers: next }, 'teacher-answers');
      applySessionUI();
      showToast(next ? 'Gabarito exibido na lousa.' : 'Gabarito ocultado para explicação.');
    });
  }

  const btnPreviewStudent = document.getElementById('btn-teacher-preview-student');
  if (btnPreviewStudent) {
    btnPreviewStudent.addEventListener('click', () => {
      setState({ teacherPreviewAsStudent: true }, 'session');
      applySessionUI();
      showToast('Pré-visualizando tela do aluno (seu estado foi preservado).');
    });
  }

  const btnExitPreview = document.getElementById('btn-exit-student-preview');
  if (btnExitPreview) {
    btnExitPreview.addEventListener('click', () => {
      setState({ teacherPreviewAsStudent: false }, 'session');
      applySessionUI();
      showToast('Retornando à Sessão Docente.');
    });
  }

  document.querySelectorAll('[data-switch-session]').forEach((btn) => {
    btn.addEventListener('click', switchSessionGate);
  });

  // Reset de Progresso
  const btnReset = document.getElementById('btn-reset-progress');
  if (btnReset) btnReset.addEventListener('click', handleResetStudentProgress);

  // Navegação entre abas
  const navDay1 = document.getElementById('nav-day1');
  const navDay2 = document.getElementById('nav-day2');
  const navQuiz = document.getElementById('nav-quiz');
  const navTurma = document.getElementById('nav-turma');
  if (navDay1) navDay1.addEventListener('click', () => switchView('day1'));
  if (navDay2) navDay2.addEventListener('click', () => switchView('day2'));
  if (navQuiz) navQuiz.addEventListener('click', () => switchView('quiz'));
  if (navTurma) navTurma.addEventListener('click', () => switchView('turma'));

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

  // Inscrição reativa para métricas e envio automático para a turma
  subscribe((_, changeKey) => {
    updateMetricUI();
    if (
      changeKey === 'module-practice' ||
      changeKey === 'module-attempt' ||
      changeKey === 'module-completed' ||
      changeKey === 'quiz-answer'
    ) {
      scheduleCloudSync(false);
    } else if (changeKey === 'quiz-submit') {
      scheduleCloudSync(true);
    }
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
  initTurma({
    onOpenModule: (view, modId) => {
      switchView(view);
      requestAnimationFrame(() => {
        document.getElementById(modId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    onOpenQuizQuestion: (editionKey, questionId) => {
      changeQuizEdition(editionKey);
      switchView('quiz');
      requestAnimationFrame(() => {
        scrollToQuestion(questionId);
      });
    }
  });

  const state = getState();
  applySessionUI();
  switchView(state.currentView || 'day1', false);
});

