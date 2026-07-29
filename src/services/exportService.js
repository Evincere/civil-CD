/**
 * exportService.js — Descarga del PDF generado como archivo
 * 
 * SRP: única responsabilidad = crear el Blob y disparar la descarga.
 */

/**
 * Descarga los bytes de PDF como archivo en el navegador.
 * @param {Uint8Array} pdfBytes
 * @param {string} nombreDestinatario - Para armar el nombre del archivo
 * @returns {string} Nombre del archivo descargado
 */
export function downloadPdf(pdfBytes, nombreDestinatario = '') {
  if (!pdfBytes?.byteLength) {
    throw new Error('Los bytes del PDF están vacíos o no fueron generados.');
  }

  const blob = new Blob([pdfBytes.slice(0)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const destClean = (nombreDestinatario || 'Carta_Documento')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 30);

  const fileName = `Carta_Documento_${destClean}.pdf`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revocar la URL después de un tiempo prudencial
  setTimeout(() => URL.revokeObjectURL(url), 10_000);

  return fileName;
}

/**
 * Genera un número de referencia de envío único.
 * Formato: CD-YYYYMMDD-XXXX (donde XXXX es un número aleatorio de 4 dígitos)
 * @returns {string}
 */
export function generarNroEnvio() {
  const now = new Date();
  const fecha = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `CD-${fecha}-${rand}`;
}
