/**
 * storageService.js — Abstracción de localStorage
 * 
 * SRP: única responsabilidad = leer/escribir datos persistidos.
 * DIP: el resto de la app depende de esta interfaz, no de localStorage directamente.
 */

const KEYS = {
  DRAFT: 'carta_doc_draft',
  PRESETS: 'carta_doc_custom_presets'
};

export const storageService = {
  /**
   * Guarda el borrador del formulario.
   * @param {{ remitente, destinatario, cuerpo, calibracion }} data
   */
  saveDraft(data) {
    try {
      localStorage.setItem(KEYS.DRAFT, JSON.stringify(data));
    } catch (e) {
      console.error('[storageService] Error saving draft:', e);
    }
  },

  /**
   * Carga el borrador guardado.
   * @returns {object|null}
   */
  loadDraft() {
    try {
      const raw = localStorage.getItem(KEYS.DRAFT);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('[storageService] Error loading draft:', e);
      return null;
    }
  },

  /**
   * Guarda el array completo de presets (por defecto + custom).
   * @param {Array} presets
   */
  savePresets(presets) {
    try {
      localStorage.setItem(KEYS.PRESETS, JSON.stringify(presets));
    } catch (e) {
      console.error('[storageService] Error saving presets:', e);
    }
  },

  /**
   * Carga los presets guardados.
   * @returns {Array|null}
   */
  loadPresets() {
    try {
      const raw = localStorage.getItem(KEYS.PRESETS);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('[storageService] Error loading presets:', e);
      return null;
    }
  },

  /**
   * Elimina el borrador guardado.
   */
  clearDraft() {
    localStorage.removeItem(KEYS.DRAFT);
  }
};
