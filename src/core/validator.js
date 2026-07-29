/**
 * validator.js — Validación declarativa de los datos del formulario
 * 
 * SRP: única responsabilidad = validar datos y devolver errores.
 * OCP: se agregan nuevas reglas sin modificar la función validate().
 */

/** @typedef {{ field: string, message: string }} ValidationError */

/**
 * Reglas de validación declarativas.
 * Cada regla: { field, label, path, rules: [] }
 */
const VALIDATION_RULES = [
  {
    field: 'remNombre',
    label: 'Nombre del Remitente',
    path: ['remitente', 'nombre'],
    rules: ['required', 'minLength:3']
  },
  {
    field: 'remDomicilio',
    label: 'Domicilio del Remitente',
    path: ['remitente', 'domicilio'],
    rules: ['required']
  },
  {
    field: 'remCPA',
    label: 'C.P.A. del Remitente',
    path: ['remitente', 'cpa'],
    rules: ['required']
  },
  {
    field: 'remLocalidad',
    label: 'Localidad del Remitente',
    path: ['remitente', 'localidad'],
    rules: ['required']
  },
  {
    field: 'destNombre',
    label: 'Nombre del Destinatario',
    path: ['destinatario', 'nombre'],
    rules: ['required', 'minLength:3']
  },
  {
    field: 'destDomicilio',
    label: 'Domicilio del Destinatario',
    path: ['destinatario', 'domicilio'],
    rules: ['required']
  },
  {
    field: 'destCPA',
    label: 'C.P.A. del Destinatario',
    path: ['destinatario', 'cpa'],
    rules: ['required']
  },
  {
    field: 'destLocalidad',
    label: 'Localidad del Destinatario',
    path: ['destinatario', 'localidad'],
    rules: ['required']
  },
  {
    field: 'cuerpoTexto',
    label: 'Texto de la Carta',
    path: ['cuerpo', 'texto'],
    rules: ['required', 'minLength:20']
  }
];

/**
 * Valida el estado completo de la aplicación.
 * @param {object} state - Estado completo del store
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateState(state) {
  const errors = {};

  for (const ruleDef of VALIDATION_RULES) {
    const value = getByPath(state, ruleDef.path);
    const error = applyRules(value, ruleDef.rules, ruleDef.label);
    if (error) {
      errors[ruleDef.field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Valida un único campo por su fieldId.
 * @param {string} fieldId
 * @param {*} value
 * @returns {string|null} Mensaje de error o null si es válido
 */
export function validateField(fieldId, value) {
  const ruleDef = VALIDATION_RULES.find(r => r.field === fieldId);
  if (!ruleDef) return null;
  return applyRules(value, ruleDef.rules, ruleDef.label);
}

// ── Utilidades internas ───────────────────────────────────────────────────────

function getByPath(obj, path) {
  return path.reduce((acc, key) => acc?.[key], obj);
}

function applyRules(value, rules, label) {
  const str = (value ?? '').toString().trim();

  for (const rule of rules) {
    if (rule === 'required' && !str) {
      return `${label} es obligatorio`;
    }
    if (rule.startsWith('minLength:')) {
      const min = parseInt(rule.split(':')[1], 10);
      if (str.length > 0 && str.length < min) {
        return `${label} debe tener al menos ${min} caracteres`;
      }
    }
  }
  return null;
}
