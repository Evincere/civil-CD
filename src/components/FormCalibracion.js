/**
 * FormCalibracion.js — Panel de calibración fina de coordenadas y tipografía
 * 
 * SRP: gestiona únicamente los controles de calibración del PDF.
 */

import { store } from '../core/state.js';
import { eventBus } from '../core/eventBus.js';
import { DEFAULT_CALIBRACION } from '../config/defaults.js';

const CALIB_INPUTS = [
  'offsetX', 'offsetY', 'fontSizeEncabezado',
  'fontSizeCuerpo', 'lineHeight', 'maxLineWidth'
];

export function FormCalibracion(toast) {
  _syncFromStore();
  _bindInputs();
  _bindRestoreBtn();

  function _syncFromStore() {
    const { calibracion } = store.getState();
    CALIB_INPUTS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = calibracion[id] ?? DEFAULT_CALIBRACION[id];
    });
  }

  function _bindInputs() {
    CALIB_INPUTS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', (e) => {
        store.setState({ calibracion: { [id]: parseFloat(e.target.value) || 0 } });
        eventBus.emit('pdf:schedule-render');
      });
    });
  }

  function _bindRestoreBtn() {
    document.getElementById('btnRestoreCalib')?.addEventListener('click', () => {
      store.setState({ calibracion: { ...DEFAULT_CALIBRACION } });
      _syncFromStore();
      eventBus.emit('pdf:schedule-render');
      toast.info('Calibración restablecida por defecto');
    });
  }

  return { refresh: _syncFromStore };
}
