/**
 * EIXO 5: MATEMÁTICA FINANCEIRA (SIMPLES VS. COMPOSTO)
 * Fórmulas puras de juros e renderização comparativa Canvas 2D.
 */

import { setupCanvasResolution } from '../utils/canvas.js';
import { getState, saveState } from '../state.js';

export function calcJuros(capital, taxaPercent, tempo) {
  const c = Math.max(1, capital || 1000);
  const i = Math.max(0.001, (taxaPercent || 10) / 100);
  const t = Math.max(1, tempo || 6);

  const montanteSimples = c * (1 + (i * t));
  const montanteComposto = c * Math.pow(1 + i, t);
  const diff = montanteComposto - montanteSimples;

  return { c, i, t, montanteSimples, montanteComposto, diff };
}

export function renderFinance() {
  const elC = document.getElementById('fin-capital');
  const elI = document.getElementById('fin-taxa');
  const elT = document.getElementById('fin-tempo');
  if (!elC || !elI || !elT) return;

  const rawC = parseFloat(elC.value);
  const rawI = parseFloat(elI.value);
  const rawT = parseInt(elT.value, 10);

  const { c, i, t, montanteSimples, montanteComposto, diff } = calcJuros(rawC, rawI, rawT);

  const labelRate = document.getElementById('label-fin-rate');
  const labelTime = document.getElementById('label-fin-time');
  const resSimple = document.getElementById('fin-res-simple');
  const resComp = document.getElementById('fin-res-comp');
  const resDiff = document.getElementById('fin-res-diff');

  if (labelRate) labelRate.textContent = `${(i * 100).toFixed(1)}% ao período`;
  if (labelTime) labelTime.textContent = `${t} período${t > 1 ? 's' : ''}`;
  if (resSimple) resSimple.textContent = `R$ ${montanteSimples.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (resComp) resComp.textContent = `R$ ${montanteComposto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (resDiff) resDiff.textContent = `R$ ${diff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const canvas = document.getElementById('canvas-finance');
  const res = setupCanvasResolution(canvas);
  if (!res) return;
  const { ctx, width: w, height: h } = res;

  ctx.clearRect(0, 0, w, h);

  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const plotW = Math.max(10, w - padLeft - padRight);
  const plotH = Math.max(10, h - padTop - padBottom);

  const minVal = c * 0.9;
  const maxVal = Math.max(minVal + 10, montanteComposto * 1.08);
  const range = Math.max(1, maxVal - minVal);

  function getX(period) {
    return padLeft + (period / t) * plotW;
  }
  function getY(val) {
    return padTop + plotH - ((val - minVal) / range) * plotH;
  }

  // Grade e Eixos
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  const stepT = t > 10 ? 2 : 1;
  for (let p = 0; p <= t; p += stepT) {
    const x = getX(p);
    ctx.beginPath();
    ctx.moveTo(x, padTop);
    ctx.lineTo(x, padTop + plotH);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText(`t=${p}`, x - 8, h - 10);
  }

  // Linha Juros Simples
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let p = 0; p <= t; p++) {
    const v = c * (1 + (i * p));
    const x = getX(p);
    const y = getY(v);
    if (p === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Linha Juros Compostos
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let p = 0; p <= t; p++) {
    const v = c * Math.pow(1 + i, p);
    const x = getX(p);
    const y = getY(v);
    if (p === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const state = getState();
  state.params.finCapital = c;
  state.params.finTaxa = i * 100;
  state.params.finTempo = t;
  saveState();
}

export function initFinancas() {
  const elC = document.getElementById('fin-capital');
  const elI = document.getElementById('fin-taxa');
  const elT = document.getElementById('fin-tempo');

  if (elC) elC.addEventListener('input', renderFinance);
  if (elI) elI.addEventListener('input', renderFinance);
  if (elT) elT.addEventListener('input', renderFinance);

  renderFinance();
}
