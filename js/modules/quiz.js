/**
 * MOTOR DO SIMULADO & PROVAS OFICIAIS UNEB
 * Cronômetro, renderização segura de alternativas, navegação e relatório pedagógico.
 */

import {
  getState,
  saveState,
  getCurrentQuizData,
  getAnswersForCurrentEdition,
  isCurrentQuizSubmitted,
  isTeacherModeActive,
  subscribe,
  setState
} from '../state.js';
import { showToast } from '../utils/toast.js';
import { confirmAction } from '../utils/confirm.js';

let timerSeconds = 60 * 60;
let timerInterval = null;
let timerRunning = true;
let currentQuestionIndex = 0;
let quizDisplayMode = 'focused'; // 'focused' (1 questão por vez) | 'full' (lista completa)
const teacherQuestionOverrides = new Map();

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function updateTimerDisplay() {
  const min = Math.floor(timerSeconds / 60);
  const sec = timerSeconds % 60;
  const el = document.getElementById('quiz-timer');
  if (el) {
    el.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
}

export function syncTimerForCurrentEdition() {
  const quizData = getCurrentQuizData();
  const isSubmitted = isCurrentQuizSubmitted();
  const btnTimer = document.getElementById('btn-toggle-timer');

  if (isSubmitted) {
    timerSeconds = 0;
    timerRunning = false;
    if (btnTimer) {
      btnTimer.textContent = 'Finalizado';
      btnTimer.disabled = true;
      btnTimer.setAttribute('aria-pressed', 'false');
    }
  } else {
    timerSeconds = (quizData.timeMinutes || 60) * 60;
    timerRunning = true;
    if (btnTimer) {
      btnTimer.textContent = 'Pausar';
      btnTimer.disabled = false;
      btnTimer.setAttribute('aria-pressed', 'false');
    }
  }
  updateTimerDisplay();
}

export function startTimer() {
  if (timerInterval) return;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    const state = getState();
    if (!timerRunning || state.currentView !== 'quiz') return;
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (!isCurrentQuizSubmitted()) {
        showToast('Tempo limite esgotado! Entregando prova automaticamente.');
        submitQuiz({ skipConfirm: true });
      }
      return;
    }
    timerSeconds--;
    updateTimerDisplay();
  }, 1000);
}

export function toggleQuizTimer() {
  if (isCurrentQuizSubmitted() || timerSeconds <= 0) return;
  timerRunning = !timerRunning;
  const btn = document.getElementById('btn-toggle-timer');
  if (btn) {
    btn.textContent = timerRunning ? 'Pausar' : 'Retomar';
    btn.setAttribute('aria-pressed', String(!timerRunning));
  }
}

export function setQuizQuestionIndex(idx) {
  const totalCount = getCurrentQuizData().questions.length;
  const maxIdx = Math.max(0, totalCount - 1);
  currentQuestionIndex = Math.min(maxIdx, Math.max(0, Number(idx) || 0));
  renderQuizQuestions();
}

export function toggleQuizDisplayMode() {
  quizDisplayMode = quizDisplayMode === 'focused' ? 'full' : 'focused';
  renderQuizQuestions();
}

export function scrollToQuestion(qId) {
  const questions = getCurrentQuizData().questions;
  const targetIdx = questions.findIndex((q) => q.id === qId);
  if (targetIdx >= 0) {
    currentQuestionIndex = targetIdx;
    if (quizDisplayMode === 'focused') {
      renderQuizQuestions();
    }
  }
  const card = document.getElementById(`quiz-card-${qId}`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

export function scrollQuizToTop() {
  const panel = document.getElementById('quiz-nav-panel');
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function syncQuizModeButtons(mode) {
  const btnSimulado = document.getElementById('btn-mode-simulado');
  const btnEstudo = document.getElementById('btn-mode-estudo');
  const isSimulado = mode !== 'estudo';

  if (btnSimulado) {
    btnSimulado.className = isSimulado
      ? 'px-3 py-1 rounded font-semibold text-uneb-primary bg-white shadow-sm transition-all'
      : 'px-3 py-1 rounded font-medium text-slate-600 hover:text-slate-900 transition-all';
    btnSimulado.setAttribute('aria-pressed', String(isSimulado));
  }
  if (btnEstudo) {
    btnEstudo.className = !isSimulado
      ? 'px-3 py-1 rounded font-semibold text-uneb-primary bg-white shadow-sm transition-all'
      : 'px-3 py-1 rounded font-medium text-slate-600 hover:text-slate-900 transition-all';
    btnEstudo.setAttribute('aria-pressed', String(!isSimulado));
  }
}

export function changeQuizEdition(editionKey) {
  const state = getState();
  state.selectedEdition = editionKey;
  currentQuestionIndex = 0;
  const quizData = getCurrentQuizData();

  syncTimerForCurrentEdition();
  if (!isCurrentQuizSubmitted() && !timerInterval && state.currentView === 'quiz') {
    startTimer();
  }

  const titleEl = document.getElementById('quiz-edition-title');
  const descEl = document.getElementById('quiz-edition-desc');
  if (titleEl) titleEl.textContent = quizData.title;
  if (descEl) descEl.textContent = quizData.description;

  const sel = document.getElementById('quiz-edition-select');
  if (sel && sel.value !== editionKey) sel.value = editionKey;

  saveState();
  renderQuizQuestions();
  showToast(`Prova carregada: ${quizData.title}`);
}

export function setQuizMode(mode) {
  const state = getState();
  state.quizMode = mode;
  syncQuizModeButtons(mode);

  if (mode === 'simulado') {
    showToast('Modo Prova ativado: respostas salvas e gabarito ao finalizar.');
  } else {
    showToast('Modo Estudo ativado: resolução e feedback imediatos ao marcar.');
  }

  saveState();
  renderQuizQuestions();
}

export function renderQuizQuestions() {
  const container = document.getElementById('quiz-questions-container');
  const navGrid = document.getElementById('quiz-nav-grid');
  const progressText = document.getElementById('quiz-progress-text');
  const statusPill = document.getElementById('quiz-status-pill');
  const submitBox = document.getElementById('quiz-submit-box');
  if (!container) return;

  container.innerHTML = '';
  if (navGrid) navGrid.innerHTML = '';

  const state = getState();
  const quizData = getCurrentQuizData();
  const currentAnswers = getAnswersForCurrentEdition();
  const isTeacher = isTeacherModeActive(state);
  const isSubmitted = isCurrentQuizSubmitted();
  const isStudyMode = state.quizMode === 'estudo';

  const sel = document.getElementById('quiz-edition-select');
  if (sel && sel.value !== quizData.id) sel.value = quizData.id;
  const titleEl = document.getElementById('quiz-edition-title');
  const descEl = document.getElementById('quiz-edition-desc');
  if (titleEl) titleEl.textContent = quizData.title;
  if (descEl) descEl.textContent = quizData.description;

  const answeredKeys = Object.keys(currentAnswers);
  const answeredCount = answeredKeys.length;
  const totalCount = quizData.questions.length;
  const maxIdx = Math.max(0, totalCount - 1);
  if (currentQuestionIndex > maxIdx) currentQuestionIndex = maxIdx;
  if (currentQuestionIndex < 0) currentQuestionIndex = 0;
  const isFocused = quizDisplayMode === 'focused';

  const focusedCounter = document.getElementById('quiz-focused-counter');
  if (focusedCounter) {
    focusedCounter.textContent = `${totalCount > 0 ? currentQuestionIndex + 1 : 0} / ${totalCount}`;
  }

  const btnToggleMode = document.getElementById('btn-quiz-toggle-mode');
  if (btnToggleMode) {
    btnToggleMode.setAttribute('aria-pressed', String(isFocused));
    btnToggleMode.textContent = isFocused ? 'Ver Lista Completa' : 'Modo Focado (1 a 1)';
  }

  const focusedControls = document.getElementById('quiz-focused-controls');
  if (focusedControls) {
    focusedControls.classList.toggle('hidden', !isFocused || totalCount === 0);
  }

  const hintPopover = document.getElementById('quiz-hint-popover');
  if (hintPopover) {
    hintPopover.classList.add('hidden');
    hintPopover.textContent = '';
  }

  const btnPrev = document.getElementById('btn-quiz-prev');
  const btnNext = document.getElementById('btn-quiz-next');
  if (btnPrev) {
    btnPrev.disabled = currentQuestionIndex <= 0;
  }
  if (btnNext) {
    btnNext.textContent = currentQuestionIndex >= maxIdx ? 'Ir para Entrega ↑' : 'Próxima →';
  }

  syncQuizModeButtons(state.quizMode);

  const navQuizBadge = document.getElementById('nav-quiz-badge');
  if (navQuizBadge) {
    navQuizBadge.textContent = `${totalCount} ${totalCount === 1 ? 'Questão' : 'Questões'}`;
  }

  if (progressText) {
    progressText.textContent = `${answeredCount}/${totalCount} Respondidas`;
  }

  if (statusPill) {
    if (isTeacher) {
      statusPill.textContent = state.teacherShowAnswers ? 'Lousa: Gabarito Visível' : 'Sessão Docente';
      statusPill.className = 'text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300';
    } else if (isSubmitted) {
      statusPill.textContent = 'Prova Entregue';
      statusPill.className = 'text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
    } else if (isStudyMode) {
      statusPill.textContent = 'Modo Estudo';
      statusPill.className = 'text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200';
    } else {
      statusPill.textContent = 'Em Andamento';
      statusPill.className = 'text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200';
    }
  }

  if (submitBox) {
    if (!isSubmitted && !isTeacher && !isStudyMode) {
      submitBox.classList.remove('hidden');
    } else {
      submitBox.classList.add('hidden');
    }
  }

  quizData.questions.forEach((q, idx) => {
    const isAnswered = currentAnswers[q.id] !== undefined;
    const selectedOpt = currentAnswers[q.id];
    const isCorrect = isAnswered && (q.isCancelled || selectedOpt === q.correct);
    const overrideKey = `${quizData.id}:${q.id}`;
    const showTeacherBoard = isTeacher && (
      teacherQuestionOverrides.has(overrideKey)
        ? teacherQuestionOverrides.get(overrideKey)
        : Boolean(state.teacherShowAnswers)
    );

    // Botão na grade de navegação rápida
    if (navGrid) {
      const navBtn = document.createElement('button');
      navBtn.type = 'button';
      navBtn.setAttribute('data-nav-qid', q.id);
      navBtn.setAttribute('aria-label', `Questão ${idx + 1}`);
      navBtn.title = `Questão ${idx + 1} (${q.axis})${q.isCancelled ? ' - Anulada' : ''}`;

      let navBtnClass = 'w-8 h-8 rounded text-xs font-mono font-bold transition-all flex items-center justify-center border ';
      if (isTeacher || isSubmitted || isStudyMode) {
        if (isAnswered) {
          navBtnClass += isCorrect
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
            : 'bg-rose-500 text-white border-rose-500 shadow-sm';
        } else {
          navBtnClass += 'bg-slate-100 text-slate-600 border-slate-300 hover:border-slate-400';
        }
      } else {
        if (isAnswered) {
          navBtnClass += 'bg-uneb-primary text-white border-uneb-primary shadow-sm';
        } else {
          navBtnClass += 'bg-white text-slate-700 border-slate-300 hover:border-uneb-primary hover:text-uneb-primary';
        }
      }
      if (isFocused && idx === currentQuestionIndex) {
        navBtnClass += ' ring-2 ring-offset-1 ring-indigo-500';
      }
      navBtn.className = navBtnClass;
      navBtn.textContent = idx + 1;
      navGrid.appendChild(navBtn);
    }

    // Card da questão
    const qCard = document.createElement('div');
    qCard.className = `card-quizlet bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm scroll-mt-48 sm:scroll-mt-40${isFocused && idx !== currentQuestionIndex ? ' hidden' : ''}`;
    qCard.id = `quiz-card-${q.id}`;

    let optionsHtml = '';
    q.options.forEach((opt, oIdx) => {
      let btnClass = 'w-full text-left p-3 rounded-lg border text-xs sm:text-sm transition-all flex items-start gap-2.5 ';
      const showAnswerFeedback = isSubmitted || isStudyMode;

      if (isTeacher) {
        if (showTeacherBoard && (q.isCancelled || oIdx === q.correct)) {
          btnClass += 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-2 ring-emerald-400';
        } else {
          btnClass += 'bg-white border-slate-200 text-slate-800';
        }
      } else if (showAnswerFeedback && isAnswered) {
        if (q.isCancelled) {
          btnClass += (oIdx === selectedOpt)
            ? 'bg-amber-50 border-amber-500 text-amber-950 font-semibold ring-1 ring-amber-400'
            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
        } else if (oIdx === q.correct) {
          btnClass += 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-400';
        } else if (oIdx === selectedOpt) {
          btnClass += 'bg-rose-50 border-rose-400 text-rose-950 font-semibold ring-1 ring-rose-300';
        } else {
          btnClass += 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
        }
      } else if (!showAnswerFeedback && isAnswered) {
        if (oIdx === selectedOpt) {
          btnClass += 'bg-blue-50 border-uneb-primary text-uneb-primary font-bold ring-2 ring-blue-300';
        } else {
          btnClass += 'bg-white border-slate-200 text-slate-700 hover:border-slate-300';
        }
      } else {
        btnClass += 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 bg-white text-slate-800';
      }

      const disabledAttr = (isTeacher || isSubmitted || (isStudyMode && isAnswered) || timerSeconds <= 0) ? 'disabled' : '';
      let badgeTeacher = '';
      if (showTeacherBoard) {
        if (q.isCancelled) {
          badgeTeacher = '<span class="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-amber-600 text-white font-mono uppercase font-bold shrink-0">Anulada</span>';
        } else if (oIdx === q.correct) {
          badgeTeacher = '<span class="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-emerald-600 text-white font-mono uppercase font-bold shrink-0">Gabarito</span>';
        }
      }

      const optPrefix = opt.match(/^(0[1-5]\))/);
      const optLabel = optPrefix ? optPrefix[1] : `${String.fromCharCode(65 + oIdx)})`;
      const optRawText = optPrefix ? opt.replace(/^(0[1-5]\))\s*/, '') : opt;
      const safeOptText = escapeHtml(optRawText);

      optionsHtml += `
        <button type="button" data-q-id="${q.id}" data-opt-idx="${oIdx}" ${disabledAttr} class="${btnClass}">
          <span class="font-mono font-bold text-slate-500 shrink-0 text-xs mt-0.5">${optLabel}</span>
          <span class="flex-1">${safeOptText}</span>
          ${badgeTeacher}
        </button>
      `;
    });

    const showResolution = showTeacherBoard || isSubmitted || (isStudyMode && isAnswered);
    const teacherCardBtnHtml = isTeacher
      ? `<button type="button" data-teacher-q-toggle="${q.id}" class="text-[11px] font-semibold px-2.5 py-1 rounded border transition-colors cursor-pointer ${showTeacherBoard ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}">${showTeacherBoard ? 'Ocultar Resolução' : 'Mostrar Resolução'}</button>`
      : '';

    let figureHtml = '';
    if (q.figureImg) {
      figureHtml = `
        <div class="my-4 p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
          <img src="${escapeHtml(q.figureImg)}" alt="${escapeHtml(q.figureCaption || 'Figura de apoio')}" loading="lazy" decoding="async" class="max-w-full h-auto rounded-lg shadow-sm max-h-72 object-contain" />
          ${q.figureCaption ? `<p class="mt-2.5 text-[11px] font-mono text-slate-600 text-center italic">${escapeHtml(q.figureCaption)}</p>` : ''}
        </div>
      `;
    }

    const badgeCancelled = q.isCancelled
      ? '<span class="ml-2 px-2 py-0.5 rounded text-[10px] bg-amber-500 text-white font-mono uppercase font-bold tracking-wide">Anulada pela Banca (Ponto Concedido)</span>'
      : '';

    qCard.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold uppercase text-uneb-primary">${escapeHtml(q.axis)}</span>
          ${badgeCancelled}
        </div>
        <div class="flex items-center gap-2">
          ${teacherCardBtnHtml}
          <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-semibold">Questão ${idx + 1} de ${totalCount}</span>
        </div>
      </div>
      <h4 class="font-serif font-bold text-slate-900 text-sm sm:text-base mb-3 leading-relaxed whitespace-pre-line">${escapeHtml(q.question)}</h4>
      ${figureHtml}
      <div class="space-y-2.5">
        ${optionsHtml}
      </div>
      ${showResolution ? `
        <div class="mt-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
          <strong class="text-slate-900 block mb-1">Resolução Comentada Oficial:</strong>
          ${escapeHtml(q.explanation)}
        </div>
      ` : ''}
    `;
    container.appendChild(qCard);
  });

  checkQuizCompletion();
}

export function answerQuizQuestion(qId, selectedIdx) {
  if (timerSeconds <= 0) return;
  const state = getState();
  const currentAnswers = getAnswersForCurrentEdition();
  const isStudyMode = state.quizMode === 'estudo';

  if (isStudyMode && currentAnswers[qId] !== undefined) return;
  if (isCurrentQuizSubmitted()) return;

  currentAnswers[qId] = selectedIdx;

  const quizData = getCurrentQuizData();
  const q = quizData.questions.find(item => item.id === qId);

  if (isStudyMode) {
    if (q && q.isCancelled) {
      showToast(`Questão ${qId}: Anulada pela Banca (+25 XP concedidos)`);
    } else if (q && selectedIdx === q.correct) {
      showToast(`Questão ${qId}: Resposta Correta! (+25 XP)`);
    } else {
      showToast(`Questão ${qId}: Resposta Incorreta. Veja a resolução comentada.`);
    }
  }

  setState(null, 'quiz-answer');
  renderQuizQuestions();
}

export async function submitQuiz({ skipConfirm = false } = {}) {
  if (isCurrentQuizSubmitted()) return;

  const state = getState();
  const quizData = getCurrentQuizData();
  const currentAnswers = getAnswersForCurrentEdition();
  const totalCount = quizData.questions.length;
  const answeredCount = Object.keys(currentAnswers).length;

  if (!skipConfirm && timerSeconds > 0 && answeredCount < totalCount) {
    const confirmed = await confirmAction({
      title: 'Entregar simulado agora?',
      message: `Você respondeu ${answeredCount} de ${totalCount} questões. Deseja realmente finalizar e entregar a prova?`,
      confirmText: 'Entregar prova',
      cancelText: 'Continuar respondendo'
    });
    if (!confirmed) return;
  }

  if (!state.quizSubmittedByEdition) state.quizSubmittedByEdition = {};
  state.quizSubmittedByEdition[state.selectedEdition] = true;

  timerRunning = false;
  const btnTimer = document.getElementById('btn-toggle-timer');
  if (btnTimer) {
    btnTimer.textContent = 'Finalizado';
    btnTimer.disabled = true;
    btnTimer.setAttribute('aria-pressed', 'false');
  }

  setState(null, 'quiz-submit');
  renderQuizQuestions();

  const resCard = document.getElementById('quiz-result-card');
  if (resCard) {
    resCard.classList.remove('hidden');
    resCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  showToast('Prova entregue com sucesso! Veja seu relatório detalhado abaixo.');
}

export function checkQuizCompletion() {
  const state = getState();
  const quizData = getCurrentQuizData();
  const currentAnswers = getAnswersForCurrentEdition();
  const isSubmitted = isCurrentQuizSubmitted();
  const isStudyMode = state.quizMode === 'estudo';

  const resCard = document.getElementById('quiz-result-card');
  const resSummary = document.getElementById('quiz-result-summary');
  const recContainer = document.getElementById('quiz-recommendations');
  const resBadge = document.getElementById('quiz-result-badge');

  if (!isSubmitted && !isStudyMode) {
    if (resCard) resCard.classList.add('hidden');
    return;
  }

  const totalCount = quizData.questions.length;
  let correctCount = 0;
  let incorrectAxes = [];

  quizData.questions.forEach(q => {
    const isAnswered = currentAnswers[q.id] !== undefined;
    const isCorrect = isAnswered && (q.isCancelled || currentAnswers[q.id] === q.correct);
    if (isAnswered) {
      if (isCorrect) {
        correctCount++;
      } else {
        incorrectAxes.push(q.axis);
      }
    }
  });

  const pct = Math.round((correctCount / totalCount) * 100);

  if (resCard && (isSubmitted || Object.keys(currentAnswers).length === totalCount)) {
    resCard.classList.remove('hidden');

    if (resSummary) {
      const state = getState();
      const studentPrefix = state.studentName
        ? `Desempenho de <strong>${escapeHtml(state.studentName)}</strong>: acertou `
        : 'Você acertou ';
      resSummary.innerHTML = `
        ${studentPrefix}<strong>${correctCount} de ${totalCount} questões</strong> (${pct}% de aproveitamento) nesta edição oficial da UNEB.
      `;
    }

    if (resBadge) {
      if (pct >= 70) {
        resBadge.textContent = 'Aproveitamento Excelente (Zona de Classificação)';
        resBadge.className = 'px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto';
      } else if (pct >= 50) {
        resBadge.textContent = 'Aproveitamento Regular (Atenção aos Eixos Críticos)';
        resBadge.className = 'px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-100 text-amber-800 self-start sm:self-auto';
      } else {
        resBadge.textContent = 'Abaixo do Ponto de Corte (Revisão Urgente Necessária)';
        resBadge.className = 'px-2.5 py-1 rounded text-xs font-mono font-bold bg-rose-100 text-rose-800 self-start sm:self-auto';
      }
    }

    if (recContainer) {
      if (incorrectAxes.length === 0 && correctCount === totalCount) {
        recContainer.innerHTML = '<strong>Parabéns!</strong> Você gabaritou a prova com 100% de precisão nos padrões da banca da UNEB.';
      } else {
        const uniqueAxes = [...new Set(incorrectAxes)];
        recContainer.innerHTML = `
          <strong>Diagnóstico Pedagógico por Eixo Temático:</strong><br>
          Atenção redobrada e revisão recomendada nos seguintes conteúdos:
          <ul class="list-disc list-inside mt-1.5 space-y-0.5">
            ${uniqueAxes.map(ax => `<li>${escapeHtml(ax)}</li>`).join('')}
          </ul>
        `;
      }
    }
  }
}

export function restartQuiz() {
  const state = getState();
  const key = state.selectedEdition || 'uneb_2025';
  if (!state.quizAnswersByEdition) state.quizAnswersByEdition = {};
  state.quizAnswersByEdition[key] = {};
  if (state.quizSubmittedByEdition) {
    state.quizSubmittedByEdition[key] = false;
  }

  const quizData = getCurrentQuizData();
  currentQuestionIndex = 0;
  syncTimerForCurrentEdition();

  setState(null, 'quiz-restart');
  renderQuizQuestions();

  const resCard = document.getElementById('quiz-result-card');
  if (resCard) resCard.classList.add('hidden');

  if (!timerInterval && state.currentView === 'quiz') {
    startTimer();
  }
  showToast(`Prova ${quizData.title} reiniciada para nova tentativa.`);
}

export function initQuiz() {
  // Delegação de eventos no contêiner de alternativas
  const questionsContainer = document.getElementById('quiz-questions-container');
  if (questionsContainer) {
    questionsContainer.addEventListener('click', (e) => {
      const teacherToggleBtn = e.target.closest('button[data-teacher-q-toggle]');
      if (teacherToggleBtn) {
        const qId = parseInt(teacherToggleBtn.getAttribute('data-teacher-q-toggle'), 10);
        const state = getState();
        const quizData = getCurrentQuizData();
        const overrideKey = `${quizData.id}:${qId}`;
        const curShown = teacherQuestionOverrides.has(overrideKey)
          ? teacherQuestionOverrides.get(overrideKey)
          : Boolean(state.teacherShowAnswers);
        teacherQuestionOverrides.set(overrideKey, !curShown);
        renderQuizQuestions();
        return;
      }

      const btn = e.target.closest('button[data-q-id][data-opt-idx]');
      if (!btn || btn.disabled) return;
      const qId = parseInt(btn.getAttribute('data-q-id'), 10);
      const optIdx = parseInt(btn.getAttribute('data-opt-idx'), 10);
      answerQuizQuestion(qId, optIdx);
    });
  }

  subscribe((_, changeKey) => {
    if (changeKey === 'teacher-answers' || changeKey === 'session' || changeKey === 'mode') {
      teacherQuestionOverrides.clear();
      renderQuizQuestions();
    }
  });

  // Delegação de eventos no painel de navegação rápida
  const navGrid = document.getElementById('quiz-nav-grid');
  if (navGrid) {
    navGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-nav-qid]');
      if (!btn) return;
      const qId = parseInt(btn.getAttribute('data-nav-qid'), 10);
      scrollToQuestion(qId);
    });
  }

  // Controles do simulado
  const selEdition = document.getElementById('quiz-edition-select');
  if (selEdition) {
    selEdition.addEventListener('change', (e) => changeQuizEdition(e.target.value));
  }

  const btnSimulado = document.getElementById('btn-mode-simulado');
  const btnEstudo = document.getElementById('btn-mode-estudo');
  if (btnSimulado) btnSimulado.addEventListener('click', () => setQuizMode('simulado'));
  if (btnEstudo) btnEstudo.addEventListener('click', () => setQuizMode('estudo'));

  const btnTimer = document.getElementById('btn-toggle-timer');
  if (btnTimer) btnTimer.addEventListener('click', toggleQuizTimer);

  const btnSubmit = document.getElementById('btn-submit-quiz');
  if (btnSubmit) btnSubmit.addEventListener('click', () => submitQuiz());

  const btnRestart = document.getElementById('btn-restart-quiz');
  if (btnRestart) btnRestart.addEventListener('click', restartQuiz);

  const btnScrollTop = document.getElementById('btn-quiz-scroll-top');
  if (btnScrollTop) btnScrollTop.addEventListener('click', scrollQuizToTop);

  const btnToggleMode = document.getElementById('btn-quiz-toggle-mode');
  if (btnToggleMode) {
    btnToggleMode.addEventListener('click', toggleQuizDisplayMode);
  }

  const btnQuizPrev = document.getElementById('btn-quiz-prev');
  if (btnQuizPrev) {
    btnQuizPrev.addEventListener('click', () => {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuizQuestions();
      }
    });
  }

  const btnQuizNext = document.getElementById('btn-quiz-next');
  if (btnQuizNext) {
    btnQuizNext.addEventListener('click', () => {
      const totalCount = getCurrentQuizData().questions.length;
      if (currentQuestionIndex < totalCount - 1) {
        currentQuestionIndex++;
        renderQuizQuestions();
      } else {
        const submitBox = document.getElementById('quiz-submit-box');
        const targetEl = (submitBox && !submitBox.classList.contains('hidden'))
          ? submitBox
          : document.getElementById('quiz-nav-panel');
        targetEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  const btnQuizHint = document.getElementById('btn-quiz-hint');
  if (btnQuizHint) {
    btnQuizHint.addEventListener('click', () => {
      const hintPopover = document.getElementById('quiz-hint-popover');
      if (!hintPopover) return;
      const wasHidden = hintPopover.classList.contains('hidden');
      if (wasHidden) {
        const questions = getCurrentQuizData().questions;
        const currentQ = questions[currentQuestionIndex];
        if (currentQ) {
          hintPopover.textContent = `Eixo: ${currentQ.axis} • Dica: Identifique os dados-chave do enunciado antes de testar as alternativas.`;
        }
        hintPopover.classList.remove('hidden');
      } else {
        hintPopover.classList.add('hidden');
      }
    });
  }

  syncTimerForCurrentEdition();
  renderQuizQuestions();
}

