/**
 * cpaService.js — Auto-completado de Localidad y Provincia por CPA
 * 
 * Consume la API pública de Normalización de Datos de Argentina:
 * https://apis.datos.gob.ar/georef/api/
 * 
 * SRP: única responsabilidad = resolver datos geográficos por código postal.
 */

const BASE_URL = 'https://api.zippopotam.us/ar';
const cache = new Map();

/**
 * Busca localidad y provincia a partir de un Código Postal Argentino.
 * @param {string} cpa - Código postal (ej: "C1043", "B7600")
 * @returns {Promise<{ localidad: string, provincia: string }|null>}
 */
export async function resolverCPA(cpa) {
  const cleaned = cpa.trim().toUpperCase();
  if (!cleaned || cleaned.length < 4) return null;

  // Caché en memoria para evitar requests repetidos
  if (cache.has(cleaned)) return cache.get(cleaned);

  try {
    // La API acepta código postal numérico — extraemos dígitos
    const codigoNumerico = cleaned.replace(/\D/g, '');
    if (!codigoNumerico) return null;

    const url = `${BASE_URL}/${codigoNumerico}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });

    if (!response.ok) return null;

    const data = await response.json();
    const places = data?.places ?? [];

    if (places.length === 0) return null;

    const result = {
      localidad: toTitleCase(places[0]['place name']),
      provincia: toTitleCase(places[0]['state'])
    };

    cache.set(cleaned, result);
    return result;

  } catch (e) {
    // Timeout o error de red — fallback silencioso
    console.warn('[cpaService] No se pudo resolver el CPA:', e.message);
    return null;
  }
}

function toTitleCase(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}
