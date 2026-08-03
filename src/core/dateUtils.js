/**
 * dateUtils.js — Helper para formatear automáticamente la fecha y lugar del remitente
 */

export function formatFechaLugar(localidad = '') {
  const now = new Date();
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dia = String(now.getDate()).padStart(2, '0');
  const mes = meses[now.getMonth()];
  const anio = now.getFullYear();
  const fechaStr = `${dia} de ${mes} de ${anio}`;

  if (localidad && localidad.trim()) {
    const locClean = localidad.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return `${locClean}, ${fechaStr}`;
  }
  return fechaStr;
}
