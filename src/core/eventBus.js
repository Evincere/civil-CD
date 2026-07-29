/**
 * eventBus.js — Pub/Sub desacoplado (Observer pattern)
 * Permite que componentes se comuniquen sin referencias directas entre sí.
 */

const listeners = {};

export const eventBus = {
  /**
   * Suscribirse a un evento.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} unsubscribe fn
   */
  on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    // Retorna función de cleanup
    return () => this.off(event, callback);
  },

  /**
   * Desuscribirse de un evento.
   */
  off(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  },

  /**
   * Emitir un evento con datos opcionales.
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    if (!listeners[event]) return;
    listeners[event].forEach(cb => cb(data));
  }
};
