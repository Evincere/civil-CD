import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_CATEGORIES, INITIAL_TEMPLATES } from './initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

let dbData = {
  categories: [],
  templates: [],
  suggestions: []
};

export function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    dbData = {
      categories: INITIAL_CATEGORIES,
      templates: INITIAL_TEMPLATES,
      suggestions: []
    };
    saveDb();
  } else {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      dbData = JSON.parse(content);
    } catch (e) {
      console.error('[DB] Error leyendo db.json, reiniciando:', e);
      dbData = {
        categories: INITIAL_CATEGORIES,
        templates: INITIAL_TEMPLATES,
        suggestions: []
      };
      saveDb();
    }
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] Error guardando db.json:', e);
  }
}

// ── Métodos de Categorías ──────────────────────────────────────────────────
export function getCategories() {
  return dbData.categories;
}

// ── Métodos de Plantillas ──────────────────────────────────────────────────
export function getTemplates() {
  return dbData.templates;
}

export function getTemplateById(id) {
  return dbData.templates.find(t => t.id === id);
}

export function addOrUpdateTemplate(template) {
  const existingIdx = dbData.templates.findIndex(t => t.id === template.id);
  if (existingIdx >= 0) {
    dbData.templates[existingIdx] = {
      ...dbData.templates[existingIdx],
      ...template,
      updated_at: new Date().toISOString()
    };
  } else {
    dbData.templates.push({
      ...template,
      id: template.id || `tpl-${Date.now()}`,
      usage_count: template.usage_count || 1,
      version: template.version || 1,
      updated_at: new Date().toISOString()
    });
  }
  saveDb();
  return template;
}

// ── Métodos de Sugerencias de Mejora ────────────────────────────────────────
export function addSuggestion(suggestion) {
  const newSuggestion = {
    id: `sug-${Date.now()}`,
    template_id: suggestion.template_id,
    proposed_title: suggestion.proposed_title,
    proposed_body: suggestion.proposed_body,
    variables: suggestion.variables || [],
    rationale: suggestion.rationale,
    category_id: suggestion.category_id,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  dbData.suggestions.push(newSuggestion);
  saveDb();
  return newSuggestion;
}

export function getSuggestionById(id) {
  return dbData.suggestions.find(s => s.id === id);
}

export function updateSuggestionStatus(id, status) {
  const sug = dbData.suggestions.find(s => s.id === id);
  if (sug) {
    sug.status = status;
    saveDb();
  }
  return sug;
}
