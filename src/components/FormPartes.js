/**
 * FormPartes.js — Formulario de Remitente y Destinatario
 * 
 * SRP: gestiona los campos de ambas partes, incluyendo auto-completado por CPA.
 * DIP: depende del store (abstracción) y del cpaService (abstracción).
 */

import { store } from '../core/state.js';
import { validateField } from '../core/validator.js';
import { resolverCPA, resolverLocalidadInversa } from '../services/cpaService.js';
import { eventBus } from '../core/eventBus.js';

// Mapa de campos del formulario → path en el estado
const INPUTS_MAP = {
  remNombre:    ['remitente', 'nombre'],
  remDomicilio: ['remitente', 'domicilio'],
  remCPA:       ['remitente', 'cpa'],
  remLocalidad: ['remitente', 'localidad'],
  remProvincia: ['remitente', 'provincia'],

  destNombre:    ['destinatario', 'nombre'],
  destDomicilio: ['destinatario', 'domicilio'],
  destCPA:       ['destinatario', 'cpa'],
  destLocalidad: ['destinatario', 'localidad'],
  destProvincia: ['destinatario', 'provincia'],
};

// Campos CPA → campos dependientes a auto-completar
const CPA_DEPENDENTS = {
  remCPA:  { localidad: 'remLocalidad', provincia: 'remProvincia' },
  destCPA: { localidad: 'destLocalidad', provincia: 'destProvincia' },
};

export function FormPartes() {
  // Sincronizar valores iniciales del store al DOM
  _syncFromStore();

  // Vincular eventos de inputs
  Object.entries(INPUTS_MAP).forEach(([id, [category, key]]) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('input', (e) => {
      const value = e.target.value;
      store.setState({ [category]: { [key]: value } });
      _showFieldError(id, validateField(id, value));
      eventBus.emit('pdf:schedule-render');
    });

    el.addEventListener('blur', (e) => {
      _showFieldError(id, validateField(id, e.target.value));
    });
  });

  // Auto-completado por CPA
  Object.entries(CPA_DEPENDENTS).forEach(([cpaFieldId, deps]) => {
    const cpaEl = document.getElementById(cpaFieldId);
    if (!cpaEl) return;

    let debounceTimer = null;

    cpaEl.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const cpaValue = cpaEl.value;

      debounceTimer = setTimeout(async () => {
        const locEl = document.getElementById(deps.localidad);
        const provEl = document.getElementById(deps.provincia);

        if (cpaValue.length === 0) {
          // Si borra el CPA, limpiamos la localidad y provincia vinculadas
          if (locEl) {
            locEl.value = '';
            const [cat, k] = INPUTS_MAP[deps.localidad];
            store.setState({ [cat]: { [k]: '' } });
          }
          if (provEl) {
            provEl.value = '';
            const [cat, k] = INPUTS_MAP[deps.provincia];
            store.setState({ [cat]: { [k]: '' } });
          }
          eventBus.emit('pdf:schedule-render');
          return;
        }

        if (cpaValue.length < 4) return;

        // Mostrar indicador de carga
        if (locEl) { locEl.placeholder = 'Buscando...'; locEl.disabled = true; }
        if (provEl) { provEl.placeholder = 'Buscando...'; provEl.disabled = true; }

        const result = await resolverCPA(cpaValue);

        if (locEl) { locEl.disabled = false; locEl.placeholder = 'Localidad'; }
        if (provEl) { provEl.disabled = false; provEl.placeholder = 'Provincia'; }

        if (result) {
          if (locEl) {
            locEl.value = result.localidad;
            const [cat, k] = INPUTS_MAP[deps.localidad];
            store.setState({ [cat]: { [k]: result.localidad } });
          }
          if (provEl) {
            provEl.value = result.provincia;
            const [cat, k] = INPUTS_MAP[deps.provincia];
            store.setState({ [cat]: { [k]: result.provincia } });
          }
          eventBus.emit('pdf:schedule-render');
        }
      }, 700);
    });
  });

  // Auto-completado inverso (Localidad + Provincia -> CPA)
  Object.entries(CPA_DEPENDENTS).forEach(([cpaFieldId, deps]) => {
    const locEl = document.getElementById(deps.localidad);
    const provEl = document.getElementById(deps.provincia);
    const cpaEl = document.getElementById(cpaFieldId);

    if (!locEl || !provEl || !cpaEl) return;

    let reverseTimer = null;

    const triggerReverseLookup = () => {
      clearTimeout(reverseTimer);
      reverseTimer = setTimeout(async () => {
        const loc = locEl.value;
        const prov = provEl.value;
        
        // Solo autocompletar si el CPA está vacío y tenemos ambos datos
        if (loc.length >= 3 && prov.length >= 3 && !cpaEl.value) {
          const originalPlaceholder = cpaEl.placeholder;
          cpaEl.placeholder = 'Buscando...';
          const cpaResult = await resolverLocalidadInversa(loc, prov);
          cpaEl.placeholder = originalPlaceholder;
          
          if (cpaResult && !cpaEl.value) {
            cpaEl.value = cpaResult;
            const [cat, k] = INPUTS_MAP[cpaFieldId];
            store.setState({ [cat]: { [k]: cpaResult } });
            eventBus.emit('pdf:schedule-render');
          }
        }
      }, 1000); // Darle un poco más de tiempo para que termine de tipear
    };

    locEl.addEventListener('input', triggerReverseLookup);
    provEl.addEventListener('input', triggerReverseLookup);
  });

  /**
   * Restablece los campos del formulario al estado actual del store.
   */
  function refresh() {
    _syncFromStore();
  }

  return { refresh };
}

// ── Helpers privados ──────────────────────────────────────────────────────────

function _syncFromStore() {
  const state = store.getState();
  Object.entries(INPUTS_MAP).forEach(([id, [category, key]]) => {
    const el = document.getElementById(id);
    if (el) el.value = state[category]?.[key] ?? '';
  });
}

function _showFieldError(fieldId, errorMessage) {
  const el = document.getElementById(fieldId);
  if (!el) return;

  // Buscar o crear el elemento de error debajo del campo
  const wrapper = el.closest('.form-group');
  if (!wrapper) return;

  let errorEl = wrapper.querySelector('.field-error');

  if (errorMessage) {
    el.classList.add('input-error');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'field-error';
      wrapper.appendChild(errorEl);
    }
    errorEl.textContent = errorMessage;
  } else {
    el.classList.remove('input-error');
    errorEl?.remove();
  }
}
