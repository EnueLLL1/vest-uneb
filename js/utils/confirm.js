/**
 * DIÁLOGO NATIVO DE CONFIRMAÇÃO (<dialog>)
 */

export function confirmAction({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false
}) {
  const dialog = document.getElementById('confirm-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') {
    return Promise.resolve(false);
  }

  const titleEl = document.getElementById('confirm-dialog-title');
  const msgEl = document.getElementById('confirm-dialog-message');
  const btnConfirm = document.getElementById('confirm-dialog-confirm');
  const btnCancel = document.getElementById('confirm-dialog-cancel');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (btnCancel) btnCancel.textContent = cancelText;
  if (btnConfirm) {
    btnConfirm.textContent = confirmText;
    btnConfirm.className = danger
      ? 'px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer'
      : 'px-4 py-2 rounded-lg text-xs font-semibold bg-uneb-primary text-white hover:bg-blue-900 transition-colors cursor-pointer';
  }

  dialog.returnValue = '';
  return new Promise(resolve => {
    const onClose = () => {
      const confirmed = dialog.returnValue === 'confirm';
      dialog.returnValue = '';
      resolve(confirmed);
    };
    dialog.addEventListener('close', onClose, { once: true });
    dialog.showModal();
  });
}
