/**
 * PdfPreview.js — Panel de previsualización del PDF en canvas
 * 
 * SRP: gestiona el canvas de preview, el overlay de carga y los controles de zoom.
 */

import { store } from '../core/state.js';
import { renderPdfToCanvas } from '../services/renderService.js';
import { generatePdf } from '../services/pdfService.js';
import { downloadPdf } from '../services/exportService.js';
import { validateState } from '../core/validator.js';
import { eventBus } from '../core/eventBus.js';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.15;
const RENDER_DEBOUNCE_MS = 350;

export function PdfPreview(toast) {
  const canvas = document.getElementById('pdfCanvas');
  const loadingOverlay = document.getElementById('loadingOverlay');

  let renderTimer = null;

  // Inicialización
  _bindZoomControls();
  _bindDownloadButtons(toast);
  _bindScheduleRenderEvent();
  _scheduleRender(); // Render inicial

  // ── API pública ─────────────────────────────────────────────────────────────

  async function generateAndRender() {
    _setLoading(true);
    try {
      const state = store.getState();
      const pdfBytes = await generatePdf(state);
      store.setState({ pdfBytes });
      await renderPdfToCanvas(pdfBytes, canvas, state.zoom);
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
      store.setState({ zoom: 1.0 });
      _updateZoomDisplay();
      _rerenderCanvas();
    });
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

  function _bindDownloadButtons(toast) {
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
