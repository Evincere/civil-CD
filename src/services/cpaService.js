/**
 * cpaService.js — Auto-completado de Localidad y Provincia por CPA
 * 
 * Consume la API pública de Normalización de Datos de Argentina:
 * https://apis.datos.gob.ar/georef/api/
 * 
 * SRP: única responsabilidad = resolver datos geográficos por código postal.
 */

const BASE_URL = 'https://api.zippopotam.us/ar';
const RAPIDAPI_KEY = 'e00a80886dmsh050b22b2b645c0ep1a443fjsn7e492c6ba2cb';
const RAPIDAPI_HOST = 'argentina-cpa-codigo-postal-argentino.p.rapidapi.com';
const cache = new Map();
const reverseCache = new Map();

const PROVINCIAS_MAP = {
  "buenos aires": 2, "catamarca": 3, "chaco": 6, "chubut": 7,
  "caba": 1, "ciudad autonoma de buenos aires": 1, "cordoba": 4,
  "corrientes": 5, "entre rios": 8, "formosa": 9, "jujuy": 10,
  "la pampa": 11, "la rioja": 12, "mendoza": 13, "misiones": 14,
  "neuquen": 15, "rio negro": 16, "salta": 17, "san juan": 18,
  "san luis": 19, "santa cruz": 20, "santa fe": 21,
  "santiago del estero": 22, "tierra del fuego": 24, "tucuman": 23
};

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

/**
 * Busca un Código Postal a partir de la localidad y provincia usando RapidAPI.
 * @param {string} localidad 
 * @param {string} provincia 
 * @returns {Promise<string|null>}
 */
export async function resolverLocalidadInversa(localidad, provincia) {
  const locClean = localidad.trim().toLowerCase();
  const provClean = provincia.trim().toLowerCase();
  
  if (locClean.length < 3 || provClean.length < 3) return null;

  const cacheKey = `${locClean}-${provClean}`;
  if (reverseCache.has(cacheKey)) return reverseCache.get(cacheKey);

  const provId = PROVINCIAS_MAP[provClean];
  if (!provId) return null;

  try {
    const url = `https://${RAPIDAPI_HOST}/localidades/search?nombre=${encodeURIComponent(locClean)}`;
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return null;

    const data = await response.json();
    const results = data?.result ?? [];
    
    // Filtrar por la provincia exacta
    const match = results.find(r => r.provincia_id === provId);
    
    if (match && match.old_zip) {
      reverseCache.set(cacheKey, match.old_zip);
      return match.old_zip;
    }
    return null;
  } catch (e) {
    console.warn('[cpaService] No se pudo resolver CPA inverso:', e.message);
    return null;
  }
}
