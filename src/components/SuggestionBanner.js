import { acceptSuggestion, rejectSuggestion } from '../services/templateService.js';
import { createIcons, icons } from 'lucide';

export function SuggestionBanner(toast) {
  const container = document.createElement('div');
  container.className = 'suggestion-banner-overlay';
  container.innerHTML = `
    <div class="suggestion-card">
      <div class="suggestion-header">
        <div class="suggestion-title-group">
          <i data-lucide="sparkles" class="icon-sparkles"></i>
          <span class="suggestion-title">Mejora de Plantilla Detectada por IA</span>
        </div>
        <button class="suggestion-close" id="btnSuggestionClose">&times;</button>
      </div>

      <div class="suggestion-body">
        <p id="suggestionText" class="suggestion-desc"></p>
        
        <div class="suggestion-preview-box">
          <strong id="suggestionProposedTitle"></strong>
          <pre id="suggestionProposedBody" class="suggestion-code-preview"></pre>
        </div>
      </div>

      <div class="suggestion-actions">
        <button id="btnSuggestionReject" class="btn btn-secondary btn-sm">Descartar</button>
        <button id="btnSuggestionAccept" class="btn btn-primary btn-sm btn-sparkle">
          <i data-lucide="check-circle-2"></i> Aceptar Mejora Maestra
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(container);
  createIcons({ root: container, icons });

  let currentSuggestionId = null;
  let onAcceptCallback = null;

  const btnAccept = container.querySelector('#btnSuggestionAccept');
  const btnReject = container.querySelector('#btnSuggestionReject');
  const btnClose = container.querySelector('#btnSuggestionClose');

  const hide = () => {
    container.classList.remove('active');
    currentSuggestionId = null;
  };

  btnReject.addEventListener('click', async () => {
    if (currentSuggestionId) {
      await rejectSuggestion(currentSuggestionId);
      toast.info('Sugerencia descartada');
    }
    hide();
  });

  btnClose.addEventListener('click', hide);

  btnAccept.addEventListener('click', async () => {
    if (currentSuggestionId) {
      btnAccept.disabled = true;
      btnAccept.textContent = 'Actualizando...';
      
      const success = await acceptSuggestion(currentSuggestionId);
      if (success) {
        toast.success('¡Plantilla maestra actualizada exitosamente!');
        if (onAcceptCallback) onAcceptCallback();
      } else {
        toast.error('No se pudo actualizar la plantilla');
      }
      btnAccept.disabled = false;
    }
    hide();
  });

  return {
    show(suggestion, callback) {
      currentSuggestionId = suggestion.id;
      onAcceptCallback = callback;

      const txtEl = container.querySelector('#suggestionText');
      const titleEl = container.querySelector('#suggestionProposedTitle');
      const bodyEl = container.querySelector('#suggestionProposedBody');

      txtEl.textContent = suggestion.rationale || 'La IA identificó una mejora relevante en las cláusulas redactadas.';
      titleEl.textContent = suggestion.proposed_title;
      bodyEl.textContent = suggestion.proposed_body;

      container.classList.add('active');
    }
  };
}
