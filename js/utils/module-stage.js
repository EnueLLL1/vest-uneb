/**
 * @fileoverview Controlador compartilhado de 3 etapas (Conceito Visual -> Laboratório Vivo -> Prática Rápida)
 * para todos os 6 Eixos de aprendizagem. Evita duplicação de fluxo e sincroniza Sessão Aluno/Professor.
 */

import { getState, subscribe, completeModuleChallenge, recordModuleAttempt, isTeacherModeActive } from '../state.js';
import { showToast } from './toast.js';

const STAGE_LABELS = [
  { id: 'conceito', title: '1. Conceito Visual' },
  { id: 'laboratorio', title: '2. Laboratório Vivo' },
  { id: 'pratica', title: '3. Prática Rápida' }
];

function clearEl(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * Monta e gerencia as 3 etapas de um módulo (`#mod-...`).
 * Espera dentro da `<section>`:
 *  - `[data-stage-bar]`
 *  - `[data-stage="conceito"]`
 *  - `[data-workbench]` (com opcionais `[data-lab-extra]` e `[data-lab-footer]`)
 *  - `[data-stage="pratica"]`
 */
export function setupModuleStage({
  modId,
  sectionId = modId,
  challenges = [],
  evaluateChallenge,
  getLabContext,
  onApplySolution,
  onShowWorkbench,
  onShowConcept
}) {
  const section = document.getElementById(sectionId);
  if (!section) return null;

  const stageBar = section.querySelector('[data-stage-bar]');
  const conceptPanel = section.querySelector('[data-stage="conceito"]');
  const workbench = section.querySelector('[data-workbench]');
  const labExtras = section.querySelectorAll('[data-lab-extra]');
  const labFooters = section.querySelectorAll('[data-lab-footer]');
  const practicePanel = section.querySelector('[data-stage="pratica"]');

  let activeStage = 'conceito';
  let activeChallengeIdx = 0;
  let selectedOptions = challenges.map(() => null);
  let attemptsByChallenge = challenges.map(() => 0);
  let feedbackByChallenge = challenges.map(() => null); // { ok: boolean, message: string, hint?: string }
  let localRevealByChallenge = challenges.map(() => false);

  function setStage(nextStage) {
    if (!STAGE_LABELS.some((s) => s.id === nextStage)) return;
    activeStage = nextStage;
    renderAll();
  }

  function renderStageBar() {
    if (!stageBar) return;
    clearEl(stageBar);

    const state = getState();
    const solvedSet = new Set(state.modulePractice?.[modId] || []);
    const solvedCount = solvedSet.size;

    const list = document.createElement('div');
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', 'Etapas do eixo de aprendizagem');
    list.className = 'flex flex-nowrap overflow-x-auto gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200';

    const tabs = [];

    STAGE_LABELS.forEach((stage, idx) => {
      const isSelected = activeStage === stage.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(isSelected));
      btn.setAttribute('data-stage-tab', stage.id);
      btn.tabIndex = isSelected ? 0 : -1;
      btn.className = isSelected
        ? 'flex-1 shrink-0 min-w-max px-3 py-2 rounded-lg text-xs font-bold bg-white text-uneb-primary shadow-sm border border-slate-200 border-b-2 border-b-uneb-primary transition-all cursor-pointer flex items-center justify-center gap-1.5'
        : 'flex-1 shrink-0 min-w-max px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent transition-all cursor-pointer flex items-center justify-center gap-1.5';

      const labelSpan = document.createElement('span');
      labelSpan.textContent = stage.title;
      btn.appendChild(labelSpan);

      if (stage.id === 'pratica' && challenges.length > 0) {
        const badge = document.createElement('span');
        const allDone = solvedCount >= challenges.length;
        badge.className = allDone
          ? 'text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700'
          : 'text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700';
        badge.textContent = allDone ? `${solvedCount}/${challenges.length} ✓` : `${solvedCount}/${challenges.length}`;
        btn.appendChild(badge);
      }

      btn.addEventListener('click', () => setStage(stage.id));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const nextIdx = (idx + dir + STAGE_LABELS.length) % STAGE_LABELS.length;
          setStage(STAGE_LABELS[nextIdx].id);
          tabs[nextIdx]?.focus();
        }
      });

      tabs.push(btn);
      list.appendChild(btn);
    });

    stageBar.appendChild(list);
  }

  function renderPanelVisibility() {
    const activeChallenge = challenges[activeChallengeIdx];
    const showWorkbenchInPractice = activeStage === 'pratica' && activeChallenge?.type === 'lab';
    const showWorkbench = activeStage === 'laboratorio' || showWorkbenchInPractice;

    if (conceptPanel) {
      conceptPanel.classList.toggle('hidden', activeStage !== 'conceito');
    }
    if (workbench) {
      workbench.classList.toggle('hidden', !showWorkbench);
    }
    labExtras.forEach((el) => {
      el.classList.toggle('hidden', activeStage !== 'laboratorio');
    });
    labFooters.forEach((el) => {
      el.classList.toggle('hidden', activeStage !== 'laboratorio');
    });
    if (practicePanel) {
      practicePanel.classList.toggle('hidden', activeStage !== 'pratica');
    }

    if (activeStage === 'conceito' && typeof onShowConcept === 'function') {
      requestAnimationFrame(() => onShowConcept());
    }
    if (showWorkbench && typeof onShowWorkbench === 'function') {
      requestAnimationFrame(() => onShowWorkbench());
    }
  }

  function renderPractice() {
    if (!practicePanel || challenges.length === 0) return;
    clearEl(practicePanel);

    const state = getState();
    const isTeacher = isTeacherModeActive(state);
    const solvedSet = new Set(state.modulePractice?.[modId] || []);
    const challenge = challenges[activeChallengeIdx] || challenges[0];
    const isSolved = solvedSet.has(activeChallengeIdx);
    const showGabarito = isTeacher && (Boolean(state.teacherShowAnswers) || localRevealByChallenge[activeChallengeIdx]);

    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-4 mt-2';

    // 1. Challenge selector header bar
    const topBar = document.createElement('div');
    topBar.className = 'flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100';

    const pillsWrap = document.createElement('div');
    pillsWrap.className = 'flex flex-wrap gap-1.5';

    challenges.forEach((ch, idx) => {
      const done = solvedSet.has(idx);
      const isCurrent = idx === activeChallengeIdx;
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.setAttribute('aria-pressed', String(isCurrent));
      pill.setAttribute('data-challenge-pill', String(idx));
      pill.className = isCurrent
        ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-uneb-primary text-white shadow-sm cursor-pointer transition-colors'
        : done
          ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors'
          : 'px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors';
      pill.textContent = done ? `Desafio ${idx + 1} ✓` : `Desafio ${idx + 1}`;
      pill.addEventListener('click', () => {
        activeChallengeIdx = idx;
        renderAll();
      });
      pillsWrap.appendChild(pill);
    });

    const summaryText = document.createElement('span');
    summaryText.className = solvedSet.size >= challenges.length
      ? 'text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full'
      : 'text-xs font-medium text-slate-500';
    summaryText.textContent = solvedSet.size >= challenges.length
      ? 'Prática 100% concluída (+50 XP) ✓'
      : `Resolvidos: ${solvedSet.size} de ${challenges.length}`;

    topBar.append(pillsWrap, summaryText);
    wrapper.appendChild(topBar);

    // 2. Challenge Card
    const card = document.createElement('div');
    card.className = 'bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3';

    const badgeRow = document.createElement('div');
    badgeRow.className = 'flex flex-wrap items-center justify-between gap-2';

    const kindBadge = document.createElement('span');
    kindBadge.className = challenge.type === 'lab'
      ? 'text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800'
      : 'text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800';
    kindBadge.textContent = challenge.type === 'lab' ? 'Missão no Simulador' : 'Questão Contextualizada UNEB';
    badgeRow.appendChild(kindBadge);

    if (isSolved) {
      const doneTag = document.createElement('span');
      doneTag.className = 'text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full';
      doneTag.textContent = 'Concluído ✓';
      badgeRow.appendChild(doneTag);
    }
    card.appendChild(badgeRow);

    const promptHeading = document.createElement('h4');
    promptHeading.className = 'text-sm sm:text-base font-semibold text-slate-900 leading-snug';
    promptHeading.textContent = challenge.prompt;
    card.appendChild(promptHeading);

    if (challenge.type === 'lab') {
      const guide = document.createElement('p');
      guide.className = 'text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2';
      guide.textContent = 'Use os controles do simulador exibido acima para configurar exatamente a situação pedida e depois valide abaixo.';
      card.appendChild(guide);
    } else if (Array.isArray(challenge.options)) {
      const optsGrid = document.createElement('div');
      optsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1';
      const letters = ['A', 'B', 'C', 'D', 'E'];

      challenge.options.forEach((optText, optIdx) => {
        const isPicked = selectedOptions[activeChallengeIdx] === optIdx;
        const isCorrectAnswer = showGabarito && optIdx === challenge.correctIndex;

        const optBtn = document.createElement('button');
        optBtn.type = 'button';
        optBtn.setAttribute('aria-pressed', String(isPicked));
        optBtn.setAttribute('data-mc-option', String(optIdx));

        let cls = 'text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm border transition-all cursor-pointer flex items-start gap-2.5 ';
        if (isCorrectAnswer) {
          cls += 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold ring-2 ring-emerald-200';
        } else if (isPicked) {
          cls += 'bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold shadow-sm';
        } else {
          cls += 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-slate-50';
        }
        optBtn.className = cls;

        const letterSpan = document.createElement('span');
        letterSpan.className = isCorrectAnswer
          ? 'w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5'
          : isPicked
            ? 'w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5'
            : 'w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5';
        letterSpan.textContent = letters[optIdx] || String(optIdx + 1);

        const bodySpan = document.createElement('span');
        bodySpan.textContent = optText;

        optBtn.append(letterSpan, bodySpan);
        optBtn.addEventListener('click', () => {
          selectedOptions[activeChallengeIdx] = optIdx;
          renderPractice();
        });
        optsGrid.appendChild(optBtn);
      });
      card.appendChild(optsGrid);
    }

    // 3. Action Buttons Row
    const actionsRow = document.createElement('div');
    actionsRow.className = 'flex flex-wrap items-center gap-2 pt-1';

    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.setAttribute('data-check-challenge', 'true');
    checkBtn.className = 'px-4 py-2 rounded-lg text-xs font-bold bg-uneb-primary text-white hover:bg-blue-900 transition-colors cursor-pointer';
    checkBtn.textContent = challenge.type === 'lab' ? 'Verificar no Simulador' : 'Verificar Resposta';
    checkBtn.addEventListener('click', () => {
      if (challenge.type === 'mc' && selectedOptions[activeChallengeIdx] === null) {
        feedbackByChallenge[activeChallengeIdx] = {
          ok: false,
          message: 'Selecione uma alternativa antes de verificar.'
        };
        renderPractice();
        return;
      }

      const ctx = challenge.type === 'lab'
        ? (typeof getLabContext === 'function' ? getLabContext() : {})
        : { selectedOption: selectedOptions[activeChallengeIdx] };

      const ok = Boolean(evaluateChallenge?.(activeChallengeIdx, ctx));
      if (ok) {
        const justFinishedModule = completeModuleChallenge(modId, activeChallengeIdx, challenges.length);
        feedbackByChallenge[activeChallengeIdx] = {
          ok: true,
          message: challenge.successMessage || 'Correto! Excelente raciocínio.'
        };
        if (justFinishedModule && solvedSet.size < challenges.length) {
          showToast('Todos os desafios concluídos! Módulo marcado (+50 XP).');
        }
      } else {
        attemptsByChallenge[activeChallengeIdx] += 1;
        recordModuleAttempt(modId, activeChallengeIdx, false, challenges.length);
        const hintList = Array.isArray(challenge.hints) ? challenge.hints : [];
        const hintIdx = Math.min(attemptsByChallenge[activeChallengeIdx] - 1, Math.max(0, hintList.length - 1));
        feedbackByChallenge[activeChallengeIdx] = {
          ok: false,
          message: 'Ainda não bateu com o objetivo do desafio. Confira a dica abaixo:',
          hint: hintList[hintIdx] || 'Revise o conceito na Etapa 1 e teste novamente.'
        };
      }
      renderStageBar();
      renderPractice();
    });
    actionsRow.appendChild(checkBtn);

    // Next Challenge button when solved and there is another challenge
    if (isSolved && activeChallengeIdx < challenges.length - 1) {
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer';
      nextBtn.textContent = 'Próximo desafio →';
      nextBtn.addEventListener('click', () => {
        activeChallengeIdx += 1;
        renderAll();
      });
      actionsRow.appendChild(nextBtn);
    }

    // Teacher-only Classroom Projection Controls
    if (isTeacher) {
      if (challenge.type === 'lab' && typeof onApplySolution === 'function') {
        const demoBtn = document.createElement('button');
        demoBtn.type = 'button';
        demoBtn.setAttribute('data-teacher-demo', 'true');
        demoBtn.className = 'px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer';
        demoBtn.textContent = 'Demonstrar Caso no Simulador';
        demoBtn.addEventListener('click', () => {
          onApplySolution(activeChallengeIdx);
          if (typeof onShowWorkbench === 'function') {
            requestAnimationFrame(() => onShowWorkbench());
          }
          showToast('Configuração modelo aplicada no simulador para explicação em aula.');
        });
        actionsRow.appendChild(demoBtn);
      }

      if (!state.teacherShowAnswers) {
        const revealBtn = document.createElement('button');
        revealBtn.type = 'button';
        revealBtn.setAttribute('data-teacher-reveal-local', 'true');
        revealBtn.className = 'px-3 py-2 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer';
        revealBtn.textContent = localRevealByChallenge[activeChallengeIdx]
          ? 'Ocultar Gabarito neste desafio'
          : 'Mostrar Gabarito neste desafio';
        revealBtn.addEventListener('click', () => {
          localRevealByChallenge[activeChallengeIdx] = !localRevealByChallenge[activeChallengeIdx];
          renderPractice();
        });
        actionsRow.appendChild(revealBtn);
      }
    }

    card.appendChild(actionsRow);

    // 4. Student Feedback Banner
    const fb = feedbackByChallenge[activeChallengeIdx];
    if (fb) {
      const fbBox = document.createElement('div');
      fbBox.className = fb.ok
        ? 'p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1'
        : 'p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1';

      const msgP = document.createElement('p');
      msgP.className = 'font-semibold';
      msgP.textContent = fb.message;
      fbBox.appendChild(msgP);

      if (fb.hint) {
        const hintP = document.createElement('p');
        hintP.className = 'text-amber-900 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 mt-1';
        hintP.textContent = `Dica ${attemptsByChallenge[activeChallengeIdx]}: ${fb.hint}`;
        fbBox.appendChild(hintP);
      }
      card.appendChild(fbBox);
    }

    // 5. Teacher Board Gabarito / Commentary Box (ONLY when teacher session & showAnswers active)
    if (showGabarito) {
      const gabaritoBox = document.createElement('div');
      gabaritoBox.setAttribute('data-teacher-gabarito', 'true');
      gabaritoBox.className = 'p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1';

      const gTitle = document.createElement('div');
      gTitle.className = 'font-bold text-amber-900 uppercase tracking-wide text-[11px]';
      gTitle.textContent = 'Gabarito & Comentário Docente';

      const gText = document.createElement('p');
      gText.textContent = challenge.teacherExplanation || challenge.successMessage || '';

      gabaritoBox.append(gTitle, gText);
      card.appendChild(gabaritoBox);
    }

    wrapper.appendChild(card);
    practicePanel.appendChild(wrapper);
  }

  function renderAll() {
    renderStageBar();
    renderPanelVisibility();
    if (activeStage === 'pratica') {
      renderPractice();
    }
  }

  // Wire static advance-stage buttons placed inside HTML stages
  section.querySelectorAll('[data-advance-stage]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-advance-stage');
      if (target) setStage(target);
    });
  });

  // React to global state changes (sessionRole, previewAsStudent, showAnswers, reset, view switch)
  subscribe((_, changeKey) => {
    if (changeKey === 'reset') {
      selectedOptions = challenges.map(() => null);
      attemptsByChallenge = challenges.map(() => 0);
      feedbackByChallenge = challenges.map(() => null);
      localRevealByChallenge = challenges.map(() => false);
    }
    if (changeKey === 'session' || changeKey === 'mode' || changeKey === 'teacher-answers') {
      localRevealByChallenge = challenges.map(() => false);
    }
    renderAll();
  });

  renderAll();

  return {
    setStage,
    getActiveStage: () => activeStage,
    refresh: renderAll
  };
}
