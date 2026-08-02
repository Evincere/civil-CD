/**
 * templateService.js — Servicio del Frontend para interactuar con la API del Backend de Plantillas
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

export async function fetchTemplateTree() {
  try {
    const res = await fetch(`${API_BASE_URL}/templates/tree`, {
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data : null;
  } catch (e) {
    console.warn('[templateService] Backend no disponible, usando fallback local:', e.message);
    return null;
  }
}

export async function evaluateTextForLearning(text, activeTemplateId) {
  try {
    const res = await fetch(`${API_BASE_URL}/templates/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, activeTemplateId }),
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success && data.hasImprovement ? data.suggestion : null;
  } catch (e) {
    console.warn('[templateService] No se pudo evaluar el texto para aprendizaje:', e.message);
    return null;
  }
}

export async function acceptSuggestion(suggestionId) {
  try {
    const res = await fetch(`${API_BASE_URL}/templates/suggestions/${suggestionId}/accept`, {
      method: 'POST'
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success;
  } catch (e) {
    console.error('[templateService] Error al aceptar sugerencia:', e);
    return false;
  }
}

export async function rejectSuggestion(suggestionId) {
  try {
    const res = await fetch(`${API_BASE_URL}/templates/suggestions/${suggestionId}/reject`, {
      method: 'POST'
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success;
  } catch (e) {
    console.error('[templateService] Error al rechazar sugerencia:', e);
    return false;
  }
}
