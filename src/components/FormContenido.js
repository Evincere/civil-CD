/**
 * FormContenido.js — Editor de texto, plantillas y datos de emisión
 * 
 * SRP: gestiona el texto de la carta, presets y el número de envío.
 */

import { store } from '../core/state.js';
import { storageService } from '../services/storageService.js';
import { generarNroEnvio } from '../services/exportService.js';
import { eventBus } from '../core/eventBus.js';
import { DEFAULT_PRESETS } from '../config/presets.js';
import { fetchTemplateTree, evaluateTextForLearning } from '../services/templateService.js';
import { formatFechaLugar } from '../core/dateUtils.js';

export function FormContenido(toast, confirmDialog, suggestionBanner) {
  // Cargar presets desde storage (con fallback a los predeterminados)
  let presets = storageService.loadPresets() ?? structuredClone(DEFAULT_PRESETS);

  // Sincronizar estado inicial al DOM
  _syncFromStore();
  _loadBackendTemplates().then(renderPresetPills);
  _bindCharCounter();
  _bindNroEnvio();
  _bindInputs();
  _bindSaveTemplateUI();
  _bindAnalyzeAIUI(suggestionBanner);
  _bindResetPresets();

  eventBus.on('templates:reload', async () => {
    await _loadBackendTemplates();
    renderPresetPills();
  });

  eventBus.on('remitente:localidad-changed', (localidad) => {
    const newAutoFecha = formatFechaLugar(localidad);
    _setField('fechaEmision', newAutoFecha);
    store.setState({ cuerpo: { fecha: newAutoFecha } });
    eventBus.emit('pdf:schedule-render');
  });

  function renderPresetPills() {
    const container = document.getElementById('presetContainer');
    if (!container) return;
    container.innerHTML = '';

    const { activePresetId } = store.getState();

    presets.forEach(preset => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = [
        'preset-pill',
        preset.isCustom ? 'custom' : '',
        preset.id === activePresetId ? 'active' : ''
      ].filter(Boolean).join(' ');

      btn.innerHTML = `<span>${preset.label}</span>`;
      if (preset.isCustom) {
        btn.innerHTML += `<span class="preset-pill-delete" data-delete="${preset.id}" title="Eliminar plantilla">&times;</span>`;
      }

      btn.addEventListener('click', async (e) => {
        if (e.target.closest('.preset-pill-delete')) {
          e.stopPropagation();
          await _deletePreset(preset.id);
          return;
        }
        _loadPreset(preset);
      });

      container.appendChild(btn);
    });
  }

  async function _loadBackendTemplates() {
    const data = await fetchTemplateTree();
    if (data && data.allTemplates) {
      const backendPresets = data.allTemplates.map(t => ({
        id: t.id,
        label: t.title,
        isCustom: false,
        texto: t.body_template
      }));
      // Combinar plantillas del backend con las guardadas por el usuario localmente
      const localCustoms = presets.filter(p => p.isCustom);
      presets = [...backendPresets, ...localCustoms];
    }
  }

  function _syncFromStore() {
    const { cuerpo, remitente } = store.getState();
    _setField('nroEnvio', cuerpo.nroEnvio);
    _setField('cuerpoTexto', cuerpo.texto);
    _setField('firmante', cuerpo.firmante);

    const autoFecha = formatFechaLugar(remitente?.localidad || '');
    const finalFecha = cuerpo.fecha || autoFecha;
    _setField('fechaEmision', finalFecha);

    if (!cuerpo.fecha) {
      store.setState({ cuerpo: { fecha: finalFecha } });
    }
  }

  function _setField(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
  }

  function _bindInputs() {
    [
      ['cuerpoTexto', 'texto'],
      ['fechaEmision', 'fecha'],
      ['firmante', 'firmante']
    ].forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', (e) => {
        store.setState({ cuerpo: { [key]: e.target.value } });
        if (id === 'cuerpoTexto') {
          _updateCharCounter();
          // Resetear el preset activo si el usuario escribe su propio texto
          const { activePresetId } = store.getState();
          if (activePresetId) {
            store.setState({ activePresetId: null });
            renderPresetPills();
          }
        }
        eventBus.emit('pdf:schedule-render');
      });
    });
  }

  function _bindCharCounter() {
    _updateCharCounter();
  }

  function _updateCharCounter() {
    const counter = document.getElementById('charCounter');
    const textarea = document.getElementById('cuerpoTexto');
    if (counter && textarea) {
      counter.textContent = `${textarea.value.length} caracteres`;
    }
  }

  function _bindNroEnvio() {
    const el = document.getElementById('nroEnvio');
    const btnGenerar = document.getElementById('btnGenerarNroEnvio');

    el?.addEventListener('input', (e) => {
      store.setState({ cuerpo: { nroEnvio: e.target.value } });
      eventBus.emit('pdf:schedule-render');
    });

    btnGenerar?.addEventListener('click', () => {
      const nro = generarNroEnvio();
      if (el) el.value = nro;
      store.setState({ cuerpo: { nroEnvio: nro } });
      eventBus.emit('pdf:schedule-render');
      toast.info(`N° de envío generado: ${nro}`);
    });
  }

  function _loadPreset(preset) {
    store.setState({ activePresetId: preset.id, cuerpo: { texto: preset.texto } });
    const textarea = document.getElementById('cuerpoTexto');
    if (textarea) textarea.value = preset.texto;
    _updateCharCounter();
    renderPresetPills();
    eventBus.emit('pdf:schedule-render');
    toast.info(`Plantilla "${preset.label}" cargada`);
  }

  async function _deletePreset(id) {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;

    const confirmed = await confirmDialog.show(`¿Desea eliminar la plantilla personalizada "${preset.label}"?`);
    if (confirmed) {
      presets = presets.filter(p => p.id !== id);
      const { activePresetId } = store.getState();
      if (activePresetId === id) {
        store.setState({ activePresetId: presets[0]?.id ?? '' });
      }
      storageService.savePresets(presets);
      renderPresetPills();
      toast.info(`Plantilla "${preset.label}" eliminada`);
    }
  }

  function _bindSaveTemplateUI() {
    const saveCard = document.getElementById('saveTemplateCard');
    const btnOpen = document.getElementById('btnOpenSaveTemplate');
    const btnConfirm = document.getElementById('btnConfirmSaveTemplate');
    const btnCancel = document.getElementById('btnCancelSaveTemplate');
    const nameInput = document.getElementById('newTemplateName');

    btnOpen?.addEventListener('click', () => {
      const { cuerpo } = store.getState();
      if (!cuerpo.texto.trim()) {
        toast.warning('Escriba un texto antes de guardarlo como plantilla');
        return;
      }
      const isVisible = saveCard.style.display !== 'none';
      saveCard.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) nameInput?.focus();
    });

    btnCancel?.addEventListener('click', () => {
      saveCard.style.display = 'none';
      if (nameInput) nameInput.value = '';
    });

    btnConfirm?.addEventListener('click', () => {
      const title = nameInput?.value.trim();
      if (!title) { toast.warning('Ingrese un nombre para la plantilla'); return; }

      const { cuerpo } = store.getState();
      const newPreset = {
        id: `custom_${Date.now()}`,
        label: title,
        isCustom: true,
        texto: cuerpo.texto
      };

      presets.push(newPreset);
      store.setState({ activePresetId: newPreset.id });
      storageService.savePresets(presets);

      if (nameInput) nameInput.value = '';
      saveCard.style.display = 'none';

      renderPresetPills();
      toast.success(`¡Plantilla "${title}" guardada exitosamente!`);
    });
  }

  function _bindAnalyzeAIUI(suggestionBanner) {
    const btnAnalyze = document.getElementById('btnAnalyzeAI');
    btnAnalyze?.addEventListener('click', async () => {
      const { cuerpo, activePresetId } = store.getState();
      const texto = cuerpo?.texto || '';

      if (!texto.trim() || texto.trim().length < 30) {
        toast.warning('Escriba un texto suficiente antes de solicitar el análisis por IA');
        return;
      }

      const originalHtml = btnAnalyze.innerHTML;
      btnAnalyze.disabled = true;
      btnAnalyze.innerHTML = '<span>Analizando...</span>';

      toast.info('Analizando redacción jurídica con IA...');
      const suggestion = await evaluateTextForLearning(texto, activePresetId);

      btnAnalyze.disabled = false;
      btnAnalyze.innerHTML = originalHtml;

      if (suggestion && suggestionBanner) {
        suggestionBanner.show(suggestion, () => {
          eventBus.emit('templates:reload');
        });
      } else {
        toast.info('No se detectaron nuevas cláusulas o el texto ya coincide con la plantilla.');
      }
    });
  }

  function _bindResetPresets() {
    document.getElementById('btnResetPresets')?.addEventListener('click', async () => {
      const confirmed = await confirmDialog.show('¿Desea borrar todas las plantillas guardadas?');
      if (!confirmed) return;

      presets = structuredClone(DEFAULT_PRESETS);
      const firstPreset = presets[0];
      
      if (firstPreset) {
        store.setState({ activePresetId: firstPreset.id, cuerpo: { texto: firstPreset.texto } });
        const textarea = document.getElementById('cuerpoTexto');
        if (textarea) textarea.value = firstPreset.texto;
      } else {
        store.setState({ activePresetId: null, cuerpo: { texto: '' } });
        const textarea = document.getElementById('cuerpoTexto');
        if (textarea) textarea.value = '';
      }

      storageService.savePresets(presets);
      _updateCharCounter();
      renderPresetPills();
      eventBus.emit('pdf:schedule-render');
      toast.info('Plantillas borradas exitosamente');
    });
  }

  return { renderPresetPills };
}
