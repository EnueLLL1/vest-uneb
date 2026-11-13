/**
 * @fileoverview Painel da Turma (exclusivo da Sessão Docente):
 * Termômetro dos 6 Eixos, Top erros em Simulados/Desafios, Raio-X por aluno,
 * importação em lote de códigos UNEB1 e atualização automática via Supabase.
 */

import { getState, setState, subscribe, isTeacherModeActive } from '../state.js';
import { normalizeClassCode } from '../utils/session.js';
import {
  fetchClassFromCloud,
  loadLocalTeacherRoster,
  saveLocalTeacherRoster,
  upsertLocalTeacherRecord,
  mergeClassRecords,
  computeClassDiagnostics,
  decodeStudentReportCode,
  buildDemoClassRoster
} from '../utils/classroom.js';
import { showToast } from '../utils/toast.js';
import { confirmAction } from '../utils/confirm.js';

let anonymized = false;
let cloudRecords = [];
let lastSyncMessage = 'Pronto para sincronizar com a nuvem.';
let lastSyncOk = null;
let pollTimer = null;
let navigationCallbacks = null;

function clearEl(el) {
  while (el && el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function getActiveClassCode() {
  const input = document.getElementById('turma-class-input');
  return normalizeClassCode(input?.value || getState().classCode);
}

function renderSyncStatus() {
  const statusEl = document.getElementById('turma-sync-status');
  if (!statusEl) return;
  statusEl.textContent = lastSyncMessage;
  if (lastSyncOk === true) {
    statusEl.className = 'text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg sm:rounded-full max-w-full break-words';
  } else if (lastSyncOk === false) {
    statusEl.className = 'text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg sm:rounded-full max-w-full break-words';
  } else {
    statusEl.className = 'text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg sm:rounded-full max-w-full break-words';
  }
}

function renderSummaryCards(summary) {
  const elCount = document.getElementById('turma-kpi-students');
  const elWeakAxis = document.getElementById('turma-kpi-weakest');
  const elErrors = document.getElementById('turma-kpi-errors');

  if (elCount) elCount.textContent = String(summary.studentCount);

  if (elWeakAxis) {
    const weakest = summary.axesRank.find((a) => a.avgMastery !== null) || null;
    elWeakAxis.textContent = weakest
      ? `Eixo ${weakest.axisNumber}: ${weakest.shortTitle} (${weakest.avgMastery}%)`
      : 'Sem dados suficientes';
  }

  if (elErrors) {
    const totalAllErrors = summary.axesRank.reduce((acc, a) => acc + a.totalErrors, 0);
    elErrors.textContent = String(totalAllErrors);
  }
}

function renderAxesGrid(summary) {
  const grid = document.getElementById('turma-axes-grid');
  if (!grid) return;
  clearEl(grid);

  summary.axesRank.forEach((ax) => {
    const card = document.createElement('div');
    const hasData = ax.avgMastery !== null;
    const isCritical = hasData && ax.avgMastery < 60;
    const isWarning = hasData && ax.avgMastery >= 60 && ax.avgMastery < 80;

    card.className = isCritical
      ? 'p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-2.5 flex flex-col justify-between'
      : isWarning
        ? 'p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2.5 flex flex-col justify-between'
        : hasData
          ? 'p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2.5 flex flex-col justify-between'
          : 'p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 flex flex-col justify-between';

    const topRow = document.createElement('div');
    topRow.className = 'flex items-start justify-between gap-2';

    const titleWrap = document.createElement('div');
    const numSpan = document.createElement('span');
    numSpan.className = 'text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block';
    numSpan.textContent = `Eixo ${ax.axisNumber}`;
    const nameEl = document.createElement('h4');
    nameEl.className = 'text-sm font-bold text-slate-900';
    nameEl.textContent = ax.shortTitle;
    titleWrap.append(numSpan, nameEl);

    const pctBadge = document.createElement('span');
    pctBadge.className = isCritical
      ? 'text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-600 text-white shrink-0'
      : isWarning
        ? 'text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 shrink-0'
        : hasData
          ? 'text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shrink-0'
          : 'text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600 shrink-0';
    pctBadge.textContent = hasData ? `${ax.avgMastery}%` : '—';
    topRow.append(titleWrap, pctBadge);

    const barTrack = document.createElement('div');
    barTrack.className = 'w-full h-2 rounded-full bg-slate-200 overflow-hidden';
    const barFill = document.createElement('div');
    barFill.className = isCritical
      ? 'h-full bg-rose-500 transition-all'
      : isWarning
        ? 'h-full bg-amber-500 transition-all'
        : 'h-full bg-emerald-500 transition-all';
    barFill.style.width = `${hasData ? ax.avgMastery : 0}%`;
    barTrack.appendChild(barFill);

    const metricsP = document.createElement('p');
    metricsP.className = 'text-[11px] text-slate-700 leading-relaxed';
    metricsP.textContent = hasData
      ? `${ax.strugglingCount} aluno(s) com dificuldade • ${ax.totalModuleErrors} erro(s) nos módulos • ${ax.totalQuizErrors} erro(s) no simulado`
      : 'Nenhum aluno enviou respostas neste eixo ainda.';

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer';
    openBtn.textContent = 'Revisar Eixo na Lousa →';
    openBtn.addEventListener('click', () => {
      navigationCallbacks?.onOpenModule?.(ax.view, ax.modId);
    });

    card.append(topRow, barTrack, metricsP, openBtn);
    grid.appendChild(card);
  });
}

function renderTopErrors(summary) {
  const container = document.getElementById('turma-top-errors');
  if (!container) return;
  clearEl(container);

  if (summary.topMissedQuestions.length === 0 && summary.topMissedChallenges.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-xs text-slate-500 italic';
    empty.textContent = 'Nenhum erro registrado ainda nesta turma. Quando os alunos responderem aos desafios ou simulados, os pontos críticos aparecerão aqui.';
    container.appendChild(empty);
    return;
  }

  summary.topMissedQuestions.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2';

    const left = document.createElement('div');
    left.className = 'space-y-0.5 min-w-0';

    const meta = document.createElement('div');
    meta.className = 'flex flex-wrap items-center gap-1.5 text-[11px]';
    const errTag = document.createElement('span');
    errTag.className = 'font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800';
    errTag.textContent = `${item.errorCount} erro(s)`;
    const qTag = document.createElement('span');
    qTag.className = 'font-mono font-semibold text-uneb-primary';
    qTag.textContent = `${item.editionTitle} • ${item.questionId}`;
    const axTag = document.createElement('span');
    axTag.className = 'text-slate-600';
    axTag.textContent = `(${item.axisTitle})`;
    meta.append(errTag, qTag, axTag);

    const preview = document.createElement('p');
    preview.className = 'text-xs text-slate-700 break-words leading-relaxed';
    preview.textContent = item.questionPreview;
    left.append(meta, preview);

    const goBtn = document.createElement('button');
    goBtn.type = 'button';
    goBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-uneb-primary text-white hover:bg-blue-900 transition-colors cursor-pointer shrink-0';
    goBtn.textContent = 'Explicar Questão →';
    goBtn.addEventListener('click', () => {
      navigationCallbacks?.onOpenQuizQuestion?.(item.editionKey, item.questionId);
    });

    row.append(left, goBtn);
    container.appendChild(row);
  });

  summary.topMissedChallenges.forEach((ch) => {
    const row = document.createElement('div');
    row.className = 'p-3 rounded-lg border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2';

    const left = document.createElement('div');
    left.className = 'space-y-0.5';

    const meta = document.createElement('div');
    meta.className = 'flex flex-wrap items-center gap-1.5 text-[11px]';
    const errTag = document.createElement('span');
    errTag.className = 'font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-950';
    errTag.textContent = `${ch.errorCount} tentativa(s) errada(s) • ${ch.studentsCount} aluno(s)`;
    const chTag = document.createElement('span');
    chTag.className = 'font-semibold text-slate-900';
    chTag.textContent = `${ch.axisTitle} • Desafio ${ch.challengeIdx + 1}`;
    meta.append(errTag, chTag);
    left.appendChild(meta);

    const goBtn = document.createElement('button');
    goBtn.type = 'button';
    goBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer shrink-0';
    goBtn.textContent = 'Abrir Módulo →';
    goBtn.addEventListener('click', () => {
      const modView = ['mod-logica', 'mod-numeros', 'mod-algebra'].includes(ch.modId) ? 'day1' : 'day2';
      navigationCallbacks?.onOpenModule?.(modView, ch.modId);
    });

    row.append(left, goBtn);
    container.appendChild(row);
  });
}

function renderStudentsList(summary) {
  const listEl = document.getElementById('turma-students-list');
  if (!listEl) return;
  clearEl(listEl);

  if (summary.students.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'p-6 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-2';
    const p1 = document.createElement('p');
    p1.className = 'text-sm font-semibold text-slate-700';
    p1.textContent = 'Nenhum aluno encontrado para esta turma.';
    const p2 = document.createElement('p');
    p2.className = 'text-xs text-slate-500';
    p2.textContent = 'Peça aos alunos para entrarem com o mesmo Código da Turma, cole códigos UNEB1 abaixo ou clique em "Carregar Turma de Teste (5 Alunos)".';
    empty.append(p1, p2);
    listEl.appendChild(empty);
    return;
  }

  summary.students.forEach((st, idx) => {
    const card = document.createElement('div');
    card.className = 'p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2.5';

    const headerRow = document.createElement('div');
    headerRow.className = 'flex flex-wrap items-center justify-between gap-2';

    const identity = document.createElement('div');
    identity.className = 'flex items-center gap-2';
    const nameEl = document.createElement('h4');
    nameEl.className = 'text-sm font-bold text-slate-900';
    nameEl.textContent = anonymized ? `Estudante #${String(idx + 1).padStart(2, '0')}` : st.studentName;
    const classBadge = document.createElement('span');
    classBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600';
    classBadge.textContent = st.classCode;
    identity.append(nameEl, classBadge);

    const statsRow = document.createElement('div');
    statsRow.className = 'flex flex-wrap items-center gap-2 text-xs font-mono';
    const xpSpan = document.createElement('span');
    xpSpan.className = 'px-2 py-0.5 rounded bg-blue-50 text-uneb-primary font-bold';
    xpSpan.textContent = `${st.score} XP`;
    const modSpan = document.createElement('span');
    modSpan.className = 'px-2 py-0.5 rounded bg-slate-100 text-slate-700';
    modSpan.textContent = `${st.completedModulesCount}/6 eixos`;
    const quizSpan = document.createElement('span');
    quizSpan.className = st.quizAccuracyPct === null
      ? 'px-2 py-0.5 rounded bg-slate-100 text-slate-500'
      : st.quizAccuracyPct >= 70
        ? 'px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold'
        : st.quizAccuracyPct >= 50
          ? 'px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold'
          : 'px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold';
    quizSpan.textContent = st.quizAccuracyPct === null
      ? 'Simulado: —'
      : `Simulado: ${st.totalQuizCorrect}/${st.totalQuizAnswered} (${st.quizAccuracyPct}%)`;

    statsRow.append(xpSpan, modSpan, quizSpan);
    headerRow.append(identity, statsRow);

    const weakWrap = document.createElement('div');
    weakWrap.className = 'flex flex-wrap items-center gap-1.5 pt-1';

    const label = document.createElement('span');
    label.className = 'text-[11px] font-semibold text-slate-600';
    label.textContent = st.weakAxes.length > 0 ? 'Pontos de atenção:' : 'Desempenho equilibrado nos eixos avaliados ✓';
    weakWrap.appendChild(label);

    st.weakAxes.forEach((w) => {
      const badge = document.createElement('span');
      const errs = w.moduleErrors + w.quizErrors;
      badge.className = 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200';
      badge.textContent = `Eixo ${w.axisNumber}: ${w.shortTitle} (${w.mastery ?? 0}% • ${errs} erro${errs === 1 ? '' : 's'})`;
      weakWrap.appendChild(badge);
    });

    card.append(headerRow, weakWrap);
    listEl.appendChild(card);
  });
}

export function renderTurmaDashboard() {
  const classCode = getActiveClassCode();
  const merged = mergeClassRecords(cloudRecords, loadLocalTeacherRoster(), classCode);
  const summary = computeClassDiagnostics(merged);

  renderSyncStatus();
  renderSummaryCards(summary);
  renderAxesGrid(summary);
  renderTopErrors(summary);
  renderStudentsList(summary);
}

export async function refreshTurmaData({ silent = false } = {}) {
  const classCode = getActiveClassCode();
  const res = await fetchClassFromCloud(classCode);
  if (res.ok) {
    cloudRecords = res.records;
    lastSyncOk = true;
    lastSyncMessage = `Conectado (Supabase) • Turma ${classCode} • ${res.records.length} registro(s) na nuvem`;
  } else {
    lastSyncOk = false;
    lastSyncMessage = `Modo Offline (usando cache/códigos locais) • Turma ${classCode}`;
    if (!silent) {
      showToast('Sem conexão com a nuvem no momento. Exibindo dados locais/importados.');
    }
  }
  renderTurmaDashboard();
}

function startOrStopPolling() {
  const state = getState();
  const shouldPoll = isTeacherModeActive(state) && state.currentView === 'turma';
  if (shouldPoll && !pollTimer) {
    refreshTurmaData({ silent: true });
    pollTimer = setInterval(() => {
      const st = getState();
      if (isTeacherModeActive(st) && st.currentView === 'turma') {
        refreshTurmaData({ silent: true });
      }
    }, 12000);
  } else if (!shouldPoll && pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function initTurma(callbacks = {}) {
  navigationCallbacks = callbacks;

  const classInput = document.getElementById('turma-class-input');
  if (classInput) {
    classInput.value = getState().classCode || 'UNEB-A';
    classInput.addEventListener('change', () => {
      const clean = normalizeClassCode(classInput.value);
      classInput.value = clean;
      setState({ classCode: clean }, 'class-code');
      refreshTurmaData();
    });
  }

  const btnRefresh = document.getElementById('btn-turma-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => refreshTurmaData());
  }

  const btnAnon = document.getElementById('btn-turma-anonymize');
  if (btnAnon) {
    btnAnon.addEventListener('click', () => {
      anonymized = !anonymized;
      btnAnon.setAttribute('aria-pressed', String(anonymized));
      btnAnon.textContent = anonymized ? 'Nomes Ocultos na Lousa ✓' : 'Ocultar Nomes na Lousa';
      renderTurmaDashboard();
    });
  }

  const btnSeedDemo = document.getElementById('btn-turma-seed-demo');
  if (btnSeedDemo) {
    btnSeedDemo.addEventListener('click', () => {
      const classCode = getActiveClassCode();
      const demos = buildDemoClassRoster(classCode);
      demos.forEach((rec) => upsertLocalTeacherRecord(rec));
      renderTurmaDashboard();
      showToast(`5 alunos simulados carregados na turma ${classCode} para teste.`);
    });
  }

  const btnClearLocal = document.getElementById('btn-turma-clear-local');
  if (btnClearLocal) {
    btnClearLocal.addEventListener('click', async () => {
      const ok = await confirmAction({
        title: 'Limpar dados locais da turma?',
        message: 'Isso removerá os alunos importados por código e os alunos de teste salvos neste navegador.',
        confirmText: 'Limpar locais',
        cancelText: 'Cancelar',
        danger: true
      });
      if (!ok) return;
      const classCode = getActiveClassCode();
      const remaining = loadLocalTeacherRoster().filter((r) => normalizeClassCode(r.class_code) !== classCode);
      saveLocalTeacherRoster(remaining);
      renderTurmaDashboard();
      showToast(`Registros locais da turma ${classCode} removidos.`);
    });
  }

  const btnImport = document.getElementById('btn-turma-import-code');
  const txtImport = document.getElementById('turma-import-code');
  if (btnImport && txtImport) {
    btnImport.addEventListener('click', () => {
      const raw = txtImport.value || '';
      const tokens = raw.match(/UNEB1:[A-Za-z0-9+/=]+/g) || [];
      let importedCount = 0;

      for (const tok of tokens) {
        const rec = decodeStudentReportCode(tok);
        if (rec) {
          upsertLocalTeacherRecord(rec);
          importedCount++;
        }
      }

      if (importedCount === 0) {
        showToast('Nenhum código UNEB1 válido encontrado no texto.');
        return;
      }

      txtImport.value = '';
      renderTurmaDashboard();
      showToast(`${importedCount} relatório(s) de aluno importado(s) com sucesso!`);
    });
  }

  subscribe((_, changeKey) => {
    if (changeKey === 'session' || changeKey === 'mode' || changeKey === 'view' || changeKey === 'class-code') {
      startOrStopPolling();
    }
  });

  startOrStopPolling();
}
