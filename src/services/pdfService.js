/**
 * pdfService.js — Generación de PDF mediante superposición vectorial (pdf-lib)
 * 
 * SRP: única responsabilidad = tomar el estado y devolver bytes de PDF modificado.
 * Puro I/O: no toca el DOM, no tiene efectos secundarios.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { TEMPLATE_BASE64 } from '../assets/templateBase64.js';

/**
 * Genera el PDF con los datos del estado superpuestos sobre la plantilla Andreani.
 * @param {object} state - Estado completo de la aplicación
 * @returns {Promise<Uint8Array>} Bytes del PDF generado
 */
export async function generatePdf(state) {
  const pdfDoc = await PDFDocument.load(TEMPLATE_BASE64);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { height } = firstPage.getSize();

  const { calibracion, remitente, destinatario, cuerpo } = state;
  const { offsetX: offX, offsetY: offY, fontSizeEncabezado: fsHead,
          fontSizeCuerpo: fsBody, lineHeight: lh, maxLineWidth: maxW } = calibracion;

  const textColor = rgb(0.08, 0.08, 0.12);

  // ── Bloque 1: Remitente Superior ──────────────────────────────────────
  // Offset corregido: el campo "nombre" del template está en height-62.
  // Con height-90 el texto caía en la fila "Domicilio" del formulario.
  _drawParty(firstPage, remitente,    70 + offX, height - 62 + offY, fsHead, font, fontBold, textColor);

  // ── Bloque 2: Destinatario Superior ──────────────────────────────────
  _drawParty(firstPage, destinatario, 335 + offX, height - 62 + offY, fsHead, font, fontBold, textColor);

  // ── Bloque 3: Remitente Medio ─────────────────────────────────────────
  // La sección 2 (coupon del remitente) está posicionada correctamente en height-322.
  _drawParty(firstPage, remitente,    70 + offX, height - 322 + offY, fsHead, font, fontBold, textColor);

  // ── Bloque 4: Destinatario Medio ──────────────────────────────────────
  _drawParty(firstPage, destinatario, 335 + offX, height - 322 + offY, fsHead, font, fontBold, textColor);

  // ── Bloque 5: Cuerpo de la Carta ──────────────────────────────────────────
  let bodyY = height - 425 + offY;
  const bodyX = 42 + offX;

  // Número de envío
  if (cuerpo.nroEnvio) {
    firstPage.drawText(`N° Envío: ${cuerpo.nroEnvio}`, {
      x: bodyX, y: bodyY, size: fsBody, font: fontBold, color: textColor
    });
    bodyY -= lh * 1.5;
  }

  // Lugar y fecha
  if (cuerpo.fecha) {
    firstPage.drawText(cuerpo.fecha, {
      x: bodyX, y: bodyY, size: fsBody, font: fontBold, color: textColor
    });
    bodyY -= lh * 1.5;
  }

  // Cuerpo con word-wrap
  bodyY = _drawWrappedText(firstPage, cuerpo.texto, bodyX, bodyY, maxW, fsBody, font, lh, textColor);

  // Firmante
  if (cuerpo.firmante) {
    bodyY -= lh;
    firstPage.drawText(`Firma / Aclaración: ${cuerpo.firmante}`, {
      x: bodyX, y: bodyY, size: fsBody, font: fontBold, color: textColor
    });
  }

  return pdfDoc.save();
}

// ── Helpers privados ──────────────────────────────────────────────────────────

function _drawParty(page, party, x, startY, fontSize, font, fontBold, color) {
  let y = startY;
  page.drawText(party.nombre || '', { x, y, size: fontSize, font: fontBold, color });
  y -= 28;
  page.drawText(party.domicilio || '', { x, y, size: fontSize, font, color });
  y -= 27;
  page.drawText(party.cpa || '', { x, y, size: fontSize, font: fontBold, color });
  page.drawText(party.localidad || '', { x: x + 70, y, size: fontSize, font, color });
  page.drawText(party.provincia || '', { x: x + 210, y, size: fontSize, font, color });
}

function _drawWrappedText(page, text, x, startY, maxWidth, fontSize, font, lineHeight, color) {
  let y = startY;
  const paragraphs = (text || '').split('\n');

  for (const para of paragraphs) {
    if (para.trim() === '') {
      y -= lineHeight;
      continue;
    }

    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > maxWidth && currentLine !== '') {
        page.drawText(currentLine, { x, y, size: fontSize, font, color });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, { x, y, size: fontSize, font, color });
      y -= lineHeight;
    }
  }

  return y;
}
