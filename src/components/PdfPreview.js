/**
 * PdfPreview.js — Panel de previsualización del PDF en canvas
 * 
 * SRP: gestiona el canvas de preview, el overlay de carga y los controles de zoom.
 */

import { store } from '../core/state.js';
import { renderPdfToCanvas } from '../services/renderService.js';
import { generatePdf } from '../services/pdfService.js';
import { downloadPdf } from '../services/exportService.js';
import { evaluateTextForLearning } from '../services/templateService.js';
import { validateState } from '../core/validator.js';
import { eventBus } from '../core/eventBus.js';
import { createIcons, icons } from 'lucide';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.15;
const RENDER_DEBOUNCE_MS = 350;

export function PdfPreview(toast, suggestionBanner) {
  const canvas = document.getElementById('pdfCanvas');
  const loadingOverlay = document.getElementById('loadingOverlay');

  let renderTimer = null;

  // Inicialización
  _bindZoomControls();
  _bindDownloadButtons(toast, suggestionBanner);
  _bindScheduleRenderEvent();
  _scheduleRender(); // Render inicial

  // ── API pública ─────────────────────────────────────────────────────────────

  let _isFirstRender = true;

  async function generateAndRender() {
    _setLoading(true);
    try {
      const state = store.getState();
      const pdfBytes = await generatePdf(state);
      store.setState({ pdfBytes });
      await renderPdfToCanvas(pdfBytes, canvas, state.zoom);

      // En el primer render, calcular automáticamente el zoom que
      // hace entrar la página completa en el panel visible.
      if (_isFirstRender) {
        _isFirstRender = false;
        _fitZoomToViewport();
        // Re-renderizar con el nuevo zoom calculado
        const newState = store.getState();
        await renderPdfToCanvas(pdfBytes, canvas, newState.zoom);
      }
    } catch (err) {
      console.error('[PdfPreview] Error generando PDF:', err);
      toast.warning('Error al procesar el PDF');
    } finally {
      _setLoading(false);
    }
  }

  // ── Privados ────────────────────────────────────────────────────────────────

  function _scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(generateAndRender, RENDER_DEBOUNCE_MS);
  }

  function _bindScheduleRenderEvent() {
    eventBus.on('pdf:schedule-render', _scheduleRender);
  }

  function _setLoading(isLoading) {
    if (loadingOverlay) {
      loadingOverlay.style.opacity = isLoading ? '1' : '0';
    }
  }

  function _bindZoomControls() {
    document.getElementById('btnZoomIn')?.addEventListener('click', () => _adjustZoom(ZOOM_STEP));
    document.getElementById('btnZoomOut')?.addEventListener('click', () => _adjustZoom(-ZOOM_STEP));
    document.getElementById('btnZoomFit')?.addEventListener('click', () => {
      _fitZoomToViewport();
      _rerenderCanvas();
    });

    document.getElementById('btnFullscreen')?.addEventListener('click', () => {
      const panel = document.querySelector('.preview-panel');
      const btn = document.getElementById('btnFullscreen');
      if (panel) {
        const isFullscreen = panel.classList.toggle('fullscreen');
        if (btn) {
          btn.title = isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa';
          btn.innerHTML = `<i data-lucide="${isFullscreen ? 'minimize-2' : 'maximize-2'}"></i>`;
          createIcons({ root: btn, icons });
        }
        setTimeout(() => {
          _fitZoomToViewport();
          _rerenderCanvas();
        }, 150);
      }
    });
  }

  /**
   * Calcula el zoom para que la página entera del PDF quepa en el panel
   * visible sin necesidad de hacer scroll, y actualiza el store + display.
   */
  function _fitZoomToViewport() {
    const viewport = document.querySelector('.pdf-viewport');
    if (!viewport || !canvas.width || !canvas.height) return;

    const availableW = viewport.clientWidth  - 48; // 24px padding cada lado
    const availableH = viewport.clientHeight - 48;

    // El canvas ya está renderizado al zoom actual (1.5 × zoom).
    // Necesitamos calcular qué zoom produce dimensiones que entren en el panel.
    const { zoom: currentZoom } = store.getState();
    const pageW = canvas.width  / (currentZoom * 1.5);
    const pageH = canvas.height / (currentZoom * 1.5);

    const fitZoom = Math.min(
      availableW / (pageW * 1.5),
      availableH / (pageH * 1.5),
      ZOOM_MAX
    );

    const clampedZoom = Math.max(ZOOM_MIN, Number(fitZoom.toFixed(2)));
    store.setState({ zoom: clampedZoom });
    _updateZoomDisplay();
  }

  function _adjustZoom(delta) {
    const { zoom } = store.getState();
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + delta));
    store.setState({ zoom: newZoom });
    _updateZoomDisplay();
    _rerenderCanvas();
  }

  function _updateZoomDisplay() {
    const { zoom } = store.getState();
    const el = document.getElementById('zoomLevel');
    if (el) el.textContent = `${Math.round(zoom * 100)}%`;
  }

  async function _rerenderCanvas() {
    const { pdfBytes, zoom } = store.getState();
    if (!pdfBytes?.byteLength) return;
    await renderPdfToCanvas(pdfBytes, canvas, zoom);
  }

  function _bindDownloadButtons(toast, suggestionBanner) {
    const handler = async () => {
      const state = store.getState();

      // Validar antes de descargar
      const { isValid, errors } = validateState(state);
      if (!isValid) {
        const firstError = Object.values(errors)[0];
        toast.warning(`Por favor completá: ${firstError}`);
        return;
      }

      try {
        let { pdfBytes } = state;
        if (!pdfBytes?.byteLength) {
          toast.info('Generando PDF...');
          pdfBytes = await generatePdf(state);
          store.setState({ pdfBytes });
        }
        const fileName = downloadPdf(pdfBytes, state.destinatario.nombre);
        toast.success(`Descargado: ${fileName}`);

        // Evaluación de aprendizaje por IA en segundo plano
        if (state.cuerpo?.texto && suggestionBanner) {
          evaluateTextForLearning(state.cuerpo.texto, state.activeTemplateId).then((suggestion) => {
            if (suggestion) {
              suggestionBanner.show(suggestion, () => {
                eventBus.emit('templates:reload');
              });
            }
          });
        }
      } catch (err) {
        console.error('[PdfPreview] Error descargando PDF:', err);
        toast.warning('Error al descargar el PDF');
      }
    };

    document.getElementById('btnDownloadHeader')?.addEventListener('click', handler);
    document.getElementById('btnDownloadFloating')?.addEventListener('click', handler);
  }

  return { generateAndRender };
}
