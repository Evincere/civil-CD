/**
 * defaults.js — Estado inicial y constantes de calibración por defecto.
 * 
 * SRP: única fuente de verdad para valores iniciales.
 * Centralizar aquí facilita el testing y el reset.
 */

export const DEFAULT_CALIBRACION = {
  offsetX: 0,
  offsetY: 0,
  fontSizeEncabezado: 9,
  fontSizeCuerpo: 9.5,
  lineHeight: 13,
  maxLineWidth: 510
};

export const DEFAULT_STATE = {
  remitente: {
    nombre: '',
    domicilio: '',
    cpa: '',
    localidad: '',
    provincia: ''
  },
  destinatario: {
    nombre: '',
    domicilio: '',
    cpa: '',
    localidad: '',
    provincia: ''
  },
  cuerpo: {
    nroEnvio: '',
    texto: '',
    fecha: '',
    firmante: ''
  },
  calibracion: { ...DEFAULT_CALIBRACION },
  pdfBytes: null,
  zoom: 1.0,
  activePresetId: 'intimacion'
};
