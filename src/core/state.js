/**
 * state.js — Store reactivo centralizado
 * 
 * Único punto de verdad de la aplicación. Expone:
 *  - getState(): snapshot inmutable del estado actual
 *  - setState(patch): actualiza estado y emite 'state:changed'
 *  - subscribe(cb): escucha cada cambio de estado
 * 
 * SRP: única responsabilidad = gestionar y notificar cambios de estado.
 * OCP: extensible agregando nuevas claves sin modificar la lógica interna.
 */

import { eventBus } from './eventBus.js';
import { DEFAULT_STATE } from '../config/defaults.js';

// Estado interno privado — nunca se expone la referencia directa
let _state = structuredClone(DEFAULT_STATE);

export const store = {
  /**
   * Devuelve una copia profunda del estado actual (inmutabilidad).
   * @returns {object}
   */
  getState() {
    return structuredClone(_state);
  },

  /**
   * Actualiza el estado con un patch profundo y notifica suscriptores.
   * Soporta rutas anidadas: setState({ remitente: { nombre: 'Juan' } })
   * @param {object} patch
   */
  setState(patch) {
    _state = deepMerge(_state, patch);
    eventBus.emit('state:changed', structuredClone(_state));
  },

  /**
   * Reemplaza completamente una clave de primer nivel.
   * Útil para restablecer secciones enteras.
   * @param {string} key
   * @param {*} value
   */
  setKey(key, value) {
    _state = { ..._state, [key]: structuredClone(value) };
    eventBus.emit('state:changed', structuredClone(_state));
  },

  /**
   * Suscribe un callback a cualquier cambio de estado.
   * @param {Function} cb - recibe el nuevo estado completo
   * @returns {Function} unsubscribe
   */
  subscribe(cb) {
    return eventBus.on('state:changed', cb);
  }
};

// ── Utilidad interna ──────────────────────────────────────────────────────────

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      key in target &&
      typeof target[key] === 'object'
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
