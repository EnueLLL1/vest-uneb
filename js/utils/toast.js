/**
 * FEEDBACK VISUAL RÁPIDO (TOAST)
 */

export function showToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'bg-slate-900/95 text-white border border-slate-700 px-4 py-2.5 rounded-lg text-xs shadow-xl transition-all duration-300 transform translate-y-2 opacity-0 flex items-center gap-2';
  el.innerHTML = `
    <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    <span>${msg}</span>
  `;
  container.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.remove('translate-y-2', 'opacity-0');
  });
  setTimeout(() => {
    el.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => el.remove(), 300);
  }, 3500);
}
