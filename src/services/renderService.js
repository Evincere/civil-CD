/**
 * renderService.js — Renderizado de PDF sobre canvas HTML5 (pdfjs-dist)
 * 
 * SRP: única responsabilidad = mostrar bytes de PDF en un canvas del DOM.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configurar el worker con la URL que Vite genera automáticamente
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

let _currentPdfDoc = null;

/**
 * Renderiza los bytes de un PDF en el canvas especificado.
 * @param {Uint8Array} pdfBytes
 * @param {HTMLCanvasElement} canvas
 * @param {number} zoom - Factor de escala (1.0 = 100%)
 * @returns {Promise<void>}
 */
export async function renderPdfToCanvas(pdfBytes, canvas, zoom = 1.0) {
  if (!pdfBytes?.byteLength) return;

  // Clonar el buffer para evitar que pdfjs lo detache
  const dataCopy = pdfBytes.slice(0);
  const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
  _currentPdfDoc = await loadingTask.promise;

  const page = await _currentPdfDoc.getPage(1);
  const scale = 1.5 * zoom;
  const viewport = page.getViewport({ scale });

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport
  }).promise;
}

/**
 * Destruye el documento PDF en memoria (cleanup).
 */
export function destroyPdfDoc() {
  if (_currentPdfDoc) {
    _currentPdfDoc.destroy();
    _currentPdfDoc = null;
  }
}
