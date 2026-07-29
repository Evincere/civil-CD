/**
 * main.js — Punto de entrada de la aplicación
 * 
 * Responsabilidad: composición y bootstrapping de componentes.
 * No contiene lógica de negocio — delega todo a los servicios y componentes.
 */

import { createIcons, icons } from 'lucide';
import { store } from './core/state.js';
import { storageService } from './services/storageService.js';
import { DEFAULT_PRESETS } from './config/presets.js';

import { TabNavigator }    from './components/TabNavigator.js';
import { ToastManager }    from './components/ToastManager.js';
import { FormPartes }      from './components/FormPartes.js';
import { FormContenido }   from './components/FormContenido.js';
import { FormCalibracion } from './components/FormCalibracion.js';
import { PdfPreview }      from './components/PdfPreview.js';
import { eventBus }        from './core/eventBus.js';

// ── Estilos ───────────────────────────────────────────────────────────────────
import './styles/main.css';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar iconos Lucide
  createIcons({ icons });

  // 2. Instanciar el sistema de notificaciones (singleton de UI)
  const toast = ToastManager('toastContainer');

  // 3. Cargar borrador guardado en localStorage (si existe)
  _loadDraft();

  // 4. Cargar preset activo al texto del cuerpo (si el texto está vacío)
  _initPresetText();

  // 5. Componer la UI
  TabNavigator();
  FormPartes();
  const formContenido = FormContenido(toast);
  FormCalibracion(toast);
  const preview = PdfPreview(toast);

  // 6. Botones globales del header
  _bindGlobalActions(toast, formContenido, preview);
});

// ── Helpers de bootstrapping ──────────────────────────────────────────────────

function _loadDraft() {
  const draft = storageService.loadDraft();
  if (!draft) return;

  const patch = {};
  if (draft.remitente)   patch.remitente   = draft.remitente;
  if (draft.destinatario) patch.destinatario = draft.destinatario;
  if (draft.cuerpo)      patch.cuerpo      = draft.cuerpo;
  if (draft.calibracion) patch.calibracion = draft.calibracion;

  store.setState(patch);
}

function _initPresetText() {
  const state = store.getState();
  if (state.cuerpo.texto.trim()) return; // Ya hay texto — no pisar

  const presets = storageService.loadPresets() ?? DEFAULT_PRESETS;
  const activePreset = presets.find(p => p.id === state.activePresetId) ?? presets[0];
  if (activePreset) {
    store.setState({ cuerpo: { texto: activePreset.texto } });
  }
}

function _bindGlobalActions(toast, formContenido, preview) {
  // Limpiar formulario
  document.getElementById('btnReset')?.addEventListener('click', () => {
    if (!confirm('¿Desea restablecer todos los campos del formulario?')) return;

    store.setState({
      remitente:   { nombre: '', domicilio: '', cpa: '', localidad: '', provincia: '' },
      destinatario: { nombre: '', domicilio: '', cpa: '', localidad: '', provincia: '' },
      cuerpo:      { nroEnvio: '', texto: '', fecha: '', firmante: '' }
    });

    // Re-sincronizar todos los inputs del DOM
    _syncAllInputs();
    eventBus.emit('pdf:schedule-render');
    toast.info('Formulario vaciado');
  });

  // Guardar borrador
  document.getElementById('btnSaveDraft')?.addEventListener('click', () => {
    const { remitente, destinatario, cuerpo, calibracion } = store.getState();
    storageService.saveDraft({ remitente, destinatario, cuerpo, calibracion });
    toast.success('Borrador guardado en el navegador');
  });
}

function _syncAllInputs() {
  const state = store.getState();
  const allInputs = {
    remNombre: state.remitente.nombre,
    remDomicilio: state.remitente.domicilio,
    remCPA: state.remitente.cpa,
    remLocalidad: state.remitente.localidad,
    remProvincia: state.remitente.provincia,
    destNombre: state.destinatario.nombre,
    destDomicilio: state.destinatario.domicilio,
    destCPA: state.destinatario.cpa,
    destLocalidad: state.destinatario.localidad,
    destProvincia: state.destinatario.provincia,
    nroEnvio: state.cuerpo.nroEnvio,
    cuerpoTexto: state.cuerpo.texto,
    fechaEmision: state.cuerpo.fecha,
    firmante: state.cuerpo.firmante,
  };

  Object.entries(allInputs).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
  });
}
