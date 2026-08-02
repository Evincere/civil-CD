import { createIcons, icons } from 'lucide';

export function ConfirmDialog() {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <div class="confirm-header">
        <i data-lucide="alert-triangle"></i>
        <span class="confirm-title">Confirmar acción</span>
      </div>
      <div class="confirm-body" id="confirmMessage"></div>
      <div class="confirm-actions">
        <button id="btnConfirmCancel" class="btn btn-secondary btn-sm">Cancelar</button>
        <button id="btnConfirmOk" class="btn btn-primary btn-sm">Aceptar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  createIcons({ root: overlay, icons });

  return {
    show(message) {
      return new Promise((resolve) => {
        const msgEl = overlay.querySelector('#confirmMessage');
        const btnCancel = overlay.querySelector('#btnConfirmCancel');
        const btnOk = overlay.querySelector('#btnConfirmOk');

        msgEl.textContent = message;
        overlay.classList.add('active');

        const cleanup = () => {
          overlay.classList.remove('active');
          btnCancel.removeEventListener('click', onCancel);
          btnOk.removeEventListener('click', onOk);
        };

        const onCancel = () => { cleanup(); resolve(false); };
        const onOk = () => { cleanup(); resolve(true); };

        btnCancel.addEventListener('click', onCancel);
        btnOk.addEventListener('click', onOk);
      });
    }
  };
}
