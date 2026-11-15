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

  // Métricas do Header
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
  const elHeaderXp = document.getElementById('header-xp-badge');
  if (elHeaderXp) elHeaderXp.textContent = `${state.score} XP`;

  // Métricas do Hub do Estudante (Pilar 3: Minha Progressão e Pilar 1: Status)
  const elHubPercent = document.getElementById('hub-metric-percent');
  const elHubBar = document.getElementById('hub-metric-progress-bar');
  const elHubModules = document.getElementById('hub-metric-modules');
  const elHubXp = document.getElementById('hub-metric-xp');
  const elHubStatus = document.getElementById('hub-aula-status');
  const btnHubContinue = document.getElementById('btn-hub-continue-class');

  if (elHubPercent) elHubPercent.textContent = `${percent}%`;
  if (elHubBar) {
    if ('value' in elHubBar) elHubBar.value = percent;
    else elHubBar.style.width = `${percent}%`;
  }
  if (elHubModules) elHubModules.textContent = completedCount;
  if (elHubXp) elHubXp.textContent = state.score;

  const MODULE_NAMES = {
    'mod-logica': 'Eixo 1: Lógica Matemática',
    'mod-numeros': 'Eixo 2: Sequências & Contagem',
    'mod-algebra': 'Eixo 3: Álgebra & Parábola',
    'mod-trig': 'Eixo 4: Trigonometria',
    'mod-financas': 'Eixo 5: Matemática Financeira',
    'mod-estatistica': 'Eixo 6: Estatística & Sturges'
  };
  const nextModId = Object.keys(MODULE_NAMES).find(id => !state.completedModules[id]) || 'mod-logica';
  const isAllComplete = completedCount === totalModules;

  if (elHubStatus) {
    elHubStatus.textContent = isAllComplete
      ? 'Status da Aula: Concluído ✓ • Todos os 6 módulos finalizados!'
      : `Status da Aula: Em andamento • Módulo atual: ${MODULE_NAMES[nextModId]}`;
  }
  if (btnHubContinue) {
    btnHubContinue.setAttribute('data-target-module', nextModId);
    btnHubContinue.setAttribute('data-axis', nextModId);
    btnHubContinue.setAttribute('data-hub-goto', MODULE_DAYS[nextModId]);
  }

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

const ALL_MODULE_IDS = [
  'mod-logica',
  'mod-numeros',
  'mod-algebra',
  'mod-trig',
  'mod-financas',
  'mod-estatistica'
];

const MODULE_DAYS = {
  'mod-logica': 'day1',
  'mod-numeros': 'day1',
  'mod-algebra': 'day1',
  'mod-trig': 'day2',
  'mod-financas': 'day2',
  'mod-estatistica': 'day2'
};

function normalizeSearchText(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function clearAulasQuickFilterInputs() {
  document.querySelectorAll('[data-aulas-quick-filter]').forEach((input) => {
    input.value = '';
  });
}

function updateAxisChipStyles(activeChipId) {
  document.querySelectorAll('[data-axis-chip]').forEach((btn) => {
    const chipId = btn.getAttribute('data-axis-chip');
    const isActive = activeChipId !== null && chipId === activeChipId;
    btn.setAttribute('aria-pressed', String(isActive));
    btn.classList.toggle('btn-pill-primary', isActive);
    btn.classList.toggle('font-bold', isActive);
    btn.classList.toggle('btn-pill-secondary', !isActive);
    btn.classList.toggle('font-semibold', !isActive);
  });
}

function getModuleSearchText(modId) {
  const modEl = document.getElementById(modId);
  if (!modEl) return '';
  const headerText = modEl.firstElementChild?.textContent || '';
  const conceptText = modEl.querySelector('[data-stage="conceito"]')?.textContent || '';
  const chipText = document.querySelector(`[data-axis-chip="${modId}"]`)?.textContent || '';
  return normalizeSearchText(`${headerText} ${conceptText} ${chipText}`);
}

function applyAulasQuickFilter(rawQuery, sourceInput = null) {
  document.querySelectorAll('[data-aulas-quick-filter]').forEach((input) => {
    if (input !== sourceInput) input.value = rawQuery;
  });

  const query = normalizeSearchText(rawQuery);
  if (!query) {
    filterDayModulesByAxis('all');
    return;
  }

  const matchedIds = ALL_MODULE_IDS.filter((id) => getModuleSearchText(id).includes(query));
  const activeDay = getState().currentView === 'day2' ? 'day2' : 'day1';
  const activeMatches = matchedIds.filter((id) => MODULE_DAYS[id] === activeDay);
  const otherDay = activeDay === 'day1' ? 'day2' : 'day1';
  const otherMatches = matchedIds.filter((id) => MODULE_DAYS[id] === otherDay);

  let visibleIds = activeMatches;
  if (activeMatches.length === 0 && otherMatches.length > 0) {
    visibleIds = otherMatches;
    const wasFocused = sourceInput && document.activeElement === sourceInput;
    switchView(otherDay);
    if (wasFocused) {
      const targetInput = document.getElementById(otherDay === 'day2' ? 'aulas-quick-filter-day2' : 'aulas-quick-filter');
      if (targetInput) {
        targetInput.focus();
        const end = targetInput.value.length;
        targetInput.setSelectionRange?.(end, end);
      }
    }
  }

  const visibleSet = new Set(visibleIds);
  ALL_MODULE_IDS.forEach((id) => {
    const modEl = document.getElementById(id);
    if (modEl) {
      modEl.classList.toggle('hidden', !visibleSet.has(id));
    }
  });

  updateAxisChipStyles(visibleIds.length === 1 ? visibleIds[0] : null);
  pauseHiddenVideos();
  redrawActiveCanvases();
}

export function filterDayModulesByAxis(activeModId = 'all') {
  const showAll = !activeModId || activeModId === 'all';
  updateAxisChipStyles(showAll ? 'all' : activeModId);

  ALL_MODULE_IDS.forEach((id) => {
    const modEl = document.getElementById(id);
    if (modEl) {
      modEl.classList.toggle('hidden', !showAll && id !== activeModId);
    }
  });

  pauseHiddenVideos();
  redrawActiveCanvases();
}

export function navigateToModule(modId) {
  const MODULE_MAP = {
    'mod-1': 'mod-logica',
    'mod-2': 'mod-numeros',
    'mod-3': 'mod-algebra',
    'mod-4': 'mod-trig',
    'mod-5': 'mod-financas',
    'mod-6': 'mod-estatistica',
    'mod-logica': 'mod-logica',
    'mod-numeros': 'mod-numeros',
    'mod-algebra': 'mod-algebra',
    'mod-trig': 'mod-trig',
    'mod-financas': 'mod-financas',
    'mod-estatistica': 'mod-estatistica'
  };
  const actualModId = MODULE_MAP[modId] || modId;
  const dayView = MODULE_DAYS[actualModId] || 'day1';
  clearAulasQuickFilterInputs();
  filterDayModulesByAxis(actualModId);
  switchView(dayView);
  requestAnimationFrame(() => {
    const el = document.getElementById(actualModId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

export function initStudent() {
  switchView('home');
}

function hidePopoverEl(popover) {
  if (popover && typeof popover.hidePopover === 'function' && popover.matches(':popover-open')) {
    popover.hidePopover();
  }
}

function wireHeaderPopover(triggerId, popoverId) {
  const trigger = document.getElementById(triggerId);
  const popover = document.getElementById(popoverId);
  if (!trigger || !popover) return () => {};

  const positionFallback = () => {
    if (window.CSS?.supports?.('position-area', 'block-end')) return;
    const triggerRect = trigger.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    const gap = 8;
    let top = triggerRect.bottom + gap;
    if (top + popRect.height > window.innerHeight - gap) {
      top = Math.max(gap, triggerRect.top - popRect.height - gap);
    }
    const left = Math.max(gap, Math.min(triggerRect.right - popRect.width, window.innerWidth - popRect.width - gap));
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.right = 'auto';
  };

  popover.addEventListener('toggle', (event) => {
    const isOpen = event.newState === 'open';
    trigger.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) positionFallback();
  });

  return () => hidePopoverEl(popover);
}

function closeStudentUtilMenu() {
  hidePopoverEl(document.getElementById('student-profile-popover'));
  hidePopoverEl(document.getElementById('teacher-more-popover'));
}

export function switchView(viewName, save = true) {
  const state = getState();
  let targetView = viewName;
  if (targetView === 'aulas') targetView = 'day1';
  if (targetView === 'simulado') targetView = 'quiz';

  const safeView = (targetView === 'turma' && !isTeacherModeActive(state)) ? 'home' : targetView;
  state.currentView = safeView;

  ['home', 'day1', 'day2', 'quiz', 'turma'].forEach(id => {
    const viewEl = document.getElementById(`view-${id}`);
    const navEl = document.getElementById(`nav-${id}`);
    if (viewEl) viewEl.classList.add('hidden');
    if (navEl) {
      navEl.removeAttribute('aria-current');
    }
  });

  const activeView = document.getElementById(`view-${safeView}`);
  const activeNav = document.getElementById(`nav-${safeView}`);
  if (activeView) activeView.classList.remove('hidden');
  if (activeNav) {
    activeNav.setAttribute('aria-current', 'page');
  }

  const btnTeacherTurma = document.getElementById('btn-teacher-turma');
  if (btnTeacherTurma) {
    if (safeView === 'turma') btnTeacherTurma.setAttribute('aria-current', 'page');
    else btnTeacherTurma.removeAttribute('aria-current');
  }

  pauseHiddenVideos();
  closeStudentUtilMenu();

  // Sincroniza a barra inferior móvel (Mobile Bottom Nav)
  const mobileNavMap = {
    home: 'mobile-nav-home',
    day1: 'mobile-nav-aulas',
    day2: 'mobile-nav-aulas',
    quiz: 'mobile-nav-quiz'
  };
  document.querySelectorAll('#mobile-bottom-nav button').forEach(tab => {
    tab.classList.remove('text-iris-bolt');
    tab.classList.add('text-slate-500');
    tab.setAttribute('aria-selected', 'false');
  });
  const activeMobileTabId = mobileNavMap[safeView];
  if (activeMobileTabId) {
    const activeTab = document.getElementById(activeMobileTabId);
    if (activeTab) {
      activeTab.classList.remove('text-slate-500');
      activeTab.classList.add('text-iris-bolt');
      activeTab.setAttribute('aria-selected', 'true');
    }
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

function pauseOtherVideos(activeVideo) {
  document.querySelectorAll('video').forEach((other) => {
    if (other !== activeVideo && !other.paused) {
      other.pause();
    }
  });
}

function pauseHiddenVideos() {
  document.querySelectorAll('video').forEach((video) => {
    if (!video.paused && video.closest('.hidden')) {
      video.pause();
    }
  });
}

function syncVideoAudioButton(video) {
  if (!video || !video.id) return;
  const btn = document.querySelector(`[data-video-unmute="${video.id}"]`);
  if (!btn) return;
  const isUnmuted = !video.muted && video.volume > 0;
  const labelEl = btn.querySelector('[data-video-unmute-label]');
  if (labelEl) {
    labelEl.textContent = isUnmuted
      ? 'Silenciar áudio da explicação'
      : 'Ativar áudio da explicação';
  }
  btn.classList.toggle('bg-uneb-primary', isUnmuted);
  btn.classList.toggle('hover:bg-blue-900', isUnmuted);
  btn.classList.toggle('text-white', isUnmuted);
  btn.classList.toggle('border-blue-400', isUnmuted);
  btn.classList.toggle('bg-slate-900', !isUnmuted);
  btn.classList.toggle('hover:bg-slate-800', !isUnmuted);
  btn.classList.toggle('text-slate-100', !isUnmuted);
  btn.classList.toggle('border-slate-700', !isUnmuted);
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
  const popoverClassEl = document.getElementById('popover-student-class');
  const btnShareReport = document.getElementById('btn-student-share-report');
  const btnMobileShareProxy = document.getElementById('btn-mobile-share-proxy');
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
  if (navTurma) navTurma.classList.add('hidden');
  if (btnShareReport) btnShareReport.classList.toggle('hidden', isTeacher || isPreviewingStudent);
  if (btnMobileShareProxy) btnMobileShareProxy.classList.toggle('hidden', isTeacher || isPreviewingStudent);
  if (previewBanner) previewBanner.classList.toggle('hidden', !isPreviewingStudent);
  if (btnReset) btnReset.classList.toggle('hidden', isPreviewingStudent);

  if (!isTeacher && state.currentView === 'turma') {
    switchView('home', false);
  }

  const cls = state.classCode || 'UNEB-A';
  if (studentBadge) {
    studentBadge.textContent = isPreviewingStudent
      ? 'Prévia: Aluno'
      : state.studentName || `Turma ${cls}`;
  }
  if (popoverClassEl) {
    popoverClassEl.textContent = isPreviewingStudent
      ? 'Prévia de Aluno ativa'
      : `Turma ${cls}`;
  }

  if (btnToggleAnswers) {
    const visible = Boolean(state.teacherShowAnswers);
    const fullLabel = visible ? 'Gabarito na Lousa: Visível' : 'Gabarito na Lousa: Oculto';
    const compactLabel = visible ? 'Gabarito: Visível' : 'Gabarito: Oculto';
    btnToggleAnswers.setAttribute('aria-pressed', String(visible));
    btnToggleAnswers.setAttribute('aria-label', fullLabel);
    btnToggleAnswers.classList.toggle('is-answers-visible', visible);
    const labelEl = btnToggleAnswers.querySelector('[data-answers-label]');
    if (labelEl) {
      labelEl.textContent = compactLabel;
    } else {
      btnToggleAnswers.textContent = compactLabel;
    }
    const iconClosed = btnToggleAnswers.querySelector('[data-answers-icon="closed"]');
    const iconOpen = btnToggleAnswers.querySelector('[data-answers-icon="open"]');
    if (iconClosed) iconClosed.classList.toggle('hidden', visible);
    if (iconOpen) iconOpen.classList.toggle('hidden', !visible);
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
  switchView('home', false);
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

  const closeStudentPopover = wireHeaderPopover('btn-student-profile', 'student-profile-popover');
  const closeTeacherPopover = wireHeaderPopover('btn-teacher-more', 'teacher-more-popover');

  const btnMobileShareProxy = document.getElementById('btn-mobile-share-proxy');
  const btnShareDesktop = document.getElementById('btn-student-share-report');
  if (btnMobileShareProxy && btnShareDesktop) {
    btnMobileShareProxy.addEventListener('click', () => {
      closeStudentPopover();
      btnShareDesktop.click();
    });
  }

  const btnPreviewStudent = document.getElementById('btn-teacher-preview-student');
  if (btnPreviewStudent) {
    btnPreviewStudent.addEventListener('click', () => {
      closeTeacherPopover();
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
    btn.addEventListener('click', () => {
      closeStudentPopover();
      closeTeacherPopover();
      switchSessionGate();
    });
  });

  // Reset de Progresso
  const btnReset = document.getElementById('btn-reset-progress');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      closeStudentPopover();
      handleResetStudentProgress();
    });
  }

  // Navegação entre abas (Desktop e Botão Docente)
  const navHome = document.getElementById('nav-home');
  const navDay1 = document.getElementById('nav-day1');
  const navDay2 = document.getElementById('nav-day2');
  const navQuiz = document.getElementById('nav-quiz');
  const navTurma = document.getElementById('nav-turma');
  const btnTeacherTurma = document.getElementById('btn-teacher-turma');
  if (navHome) navHome.addEventListener('click', () => switchView('home'));
  if (navDay1) navDay1.addEventListener('click', () => {
    clearAulasQuickFilterInputs();
    filterDayModulesByAxis('all');
    switchView('day1');
  });
  if (navDay2) navDay2.addEventListener('click', () => {
    clearAulasQuickFilterInputs();
    filterDayModulesByAxis('all');
    switchView('day2');
  });
  if (navQuiz) navQuiz.addEventListener('click', () => switchView('quiz'));
  if (navTurma) navTurma.addEventListener('click', () => switchView('turma'));
  if (btnTeacherTurma) btnTeacherTurma.addEventListener('click', () => switchView('turma'));

  // Busca rápida nas Aulas (Dia 1 e Dia 2 sincronizados)
  document.querySelectorAll('[data-aulas-quick-filter]').forEach((inputEl) => {
    inputEl.addEventListener('input', () => {
      applyAulasQuickFilter(inputEl.value, inputEl);
    });
  });

  // Chips horizontais de seleção rápida de Eixos Temáticos nas Aulas
  document.querySelectorAll('[data-axis-chip]').forEach((chipBtn) => {
    chipBtn.addEventListener('click', () => {
      const chip = chipBtn.getAttribute('data-axis-chip');
      if (!chip || chip === 'all') {
        clearAulasQuickFilterInputs();
        filterDayModulesByAxis('all');
      } else {
        navigateToModule(chip);
      }
    });
  });

  // Navegação Thumb-Zone (Mobile Bottom Nav)
  document.querySelectorAll('#mobile-bottom-nav [data-target-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target-view');
      if (target) switchView(target);
    });
  });

  // Ações do Hub do Estudante (Pilar 1 e Pilar 2)
  const btnHubContinue = document.getElementById('btn-hub-continue-class');
  if (btnHubContinue) {
    btnHubContinue.addEventListener('click', () => {
      const mod = btnHubContinue.getAttribute('data-target-module') || 'mod-logica';
      navigateToModule(mod);
    });
  }

  const btnHubStartQuiz = document.getElementById('btn-hub-start-quiz');
  if (btnHubStartQuiz) {
    btnHubStartQuiz.addEventListener('click', () => switchView('quiz'));
  }

  document.querySelectorAll('#hub-quadro-aula [data-target-module]:not(#btn-hub-continue-class), #hub-quadro-aula [data-axis]:not(#btn-hub-continue-class)').forEach(btn => {
    btn.addEventListener('click', () => {
      const mod = btn.getAttribute('data-target-module') || btn.getAttribute('data-axis');
      if (mod) navigateToModule(mod);
    });
  });

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

  // Players de vídeo conceituais (Estágio 1): ativação de áudio e exclusividade de playback
  document.querySelectorAll('[data-video-unmute]').forEach((btn) => {
    const targetId = btn.getAttribute('data-video-unmute');
    const video = targetId ? document.getElementById(targetId) : null;
    if (!video) return;
    syncVideoAudioButton(video);
    btn.addEventListener('click', () => {
      const willUnmute = video.muted || video.volume === 0;
      if (willUnmute) {
        pauseOtherVideos(video);
        if (video.volume === 0) video.volume = 1;
        video.muted = false;
        if (video.paused) {
          video.play().catch(() => {});
        }
      } else {
        video.muted = true;
      }
      syncVideoAudioButton(video);
    });
  });

  document.querySelectorAll('video').forEach((video) => {
    video.addEventListener('volumechange', () => {
      syncVideoAudioButton(video);
    });
    video.addEventListener('play', () => {
      pauseOtherVideos(video);
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('[data-stage-tab], [data-advance-stage]')) {
      queueMicrotask(pauseHiddenVideos);
    }
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
  const initialView = state.currentView || (state.sessionRole === 'student' ? 'home' : 'day1');
  switchView(initialView, false);
});

