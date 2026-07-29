/**
 * ToastManager.js — Sistema de notificaciones Toast
 * 
 * SRP: única responsabilidad = mostrar y ocultar mensajes de feedback al usuario.
 */

import { createIcons, icons } from 'lucide';

const ICONS = {
  success: 'check-circle',
  warning: 'alert-triangle',
  info: 'info'
};

const DURATION_MS = 3500;

/**
 * @param {string} containerId - ID del contenedor de toasts en el DOM
 */
export function ToastManager(containerId = 'toastContainer') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('[ToastManager] Contenedor no encontrado:', containerId);
  }

  return {
    /**
     * Muestra un toast.
     * @param {string} message
     * @param {'success'|'info'|'warning'} type
     */
    show(message, type = 'info') {
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      const iconName = ICONS[type] ?? 'info';
      toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
      container.appendChild(toast);

      // Re-inicializar iconos de lucide en el nuevo toast
      createIcons({ icons });

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-20%)';
        setTimeout(() => toast.remove(), 300);
      }, DURATION_MS);
    },

    success(message) { this.show(message, 'success'); },
    warning(message) { this.show(message, 'warning'); },
    info(message)    { this.show(message, 'info'); }
  };
}
