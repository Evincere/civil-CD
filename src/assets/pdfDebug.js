/**
 * pdfDebug.js — Script temporal de diagnóstico de coordenadas
 * 
 * Abre en el navegador con: npm run dev → abre /debug-coords.html
 * Dibuja líneas horizontales numeradas cada 10pt para identificar
 * exactamente en qué Y están los campos del template Andreani.
 * 
 * ELIMINAR después de calibrar.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { TEMPLATE_BASE64 } from './templateBase64.js';

export async function generateDebugPdf() {
  const pdfDoc = await PDFDocument.load(TEMPLATE_BASE64);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.getPages()[0];
  const { height } = page.getSize(); // height = 936

  const RED   = rgb(1, 0, 0);
  const BLUE  = rgb(0, 0, 1);
  const GREEN = rgb(0, 0.6, 0);

  // Trazar líneas horizontales cada 10pt y etiquetar el valor de Y
  for (let y = 0; y <= height; y += 10) {
    const displayY = height - y; // lo que escribimos en la etiqueta = offset desde arriba

    const color = (displayY % 100 === 0) ? RED : (displayY % 50 === 0 ? BLUE : GREEN);
    const opacity = (displayY % 50 === 0) ? 0.7 : 0.3;
    const thickness = (displayY % 50 === 0) ? 0.5 : 0.3;

    // Línea horizontal
    page.drawLine({
      start: { x: 0, y },
      end: { x: 612, y },
      color,
      opacity,
      thickness,
    });

    // Etiqueta de Y (solo cada 10pt)
    if (displayY % 10 === 0) {
      page.drawText(`${displayY}`, {
        x: 2, y: y + 1,
        size: 5,
        font,
        color: RED,
        opacity: 0.85,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();

  // Descargar
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'debug-coordenadas.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  return pdfBytes;
}
