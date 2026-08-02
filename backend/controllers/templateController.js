import * as db from '../db/database.js';
import { evaluateTextImprovement } from '../services/llmService.js';

/**
 * Retorna el árbol de categorías con sus plantillas anidadas
 */
export function getTemplateTree(req, res) {
  try {
    const categories = db.getCategories();
    const templates = db.getTemplates();

    // Construir estructura en árbol
    const tree = categories
      .filter(c => c.parent_id === null)
      .map(parent => ({
        ...parent,
        subcategories: categories
          .filter(sub => sub.parent_id === parent.id)
          .map(sub => ({
            ...sub,
            templates: templates.filter(t => t.category_id === sub.id)
          })),
        templates: templates.filter(t => t.category_id === parent.id)
      }));

    return res.json({ success: true, tree, allTemplates: templates });
  } catch (e) {
    console.error('[Controller] Error al obtener árbol de plantillas:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}

/**
 * Evalúa el texto redactado en busca de mejoras y crea una sugerencia si corresponde
 */
export async function evaluateText(req, res) {
  try {
    const { text, activeTemplateId } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'El campo text es requerido' });
    }

    const baseTemplate = activeTemplateId ? db.getTemplateById(activeTemplateId) : null;
    const evaluation = await evaluateTextImprovement(text, baseTemplate);

    if (!evaluation.hasImprovement) {
      return res.json({ success: true, hasImprovement: false });
    }

    // Crear sugerencia de mejora pendiente de aprobación
    const suggestion = db.addSuggestion({
      template_id: activeTemplateId || null,
      category_id: baseTemplate ? baseTemplate.category_id : 'cat-familia-alimentos',
      proposed_title: evaluation.proposedTitle,
      proposed_body: evaluation.proposedBody,
      variables: evaluation.variables,
      rationale: evaluation.rationale
    });

    return res.json({
      success: true,
      hasImprovement: true,
      suggestion
    });

  } catch (e) {
    console.error('[Controller] Error al evaluar texto:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}

/**
 * Acepta una sugerencia de mejora y actualiza la plantilla maestra en la BD
 */
export function acceptSuggestion(req, res) {
  try {
    const { id } = req.params;
    const suggestion = db.getSuggestionById(id);

    if (!suggestion) {
      return res.status(404).json({ success: false, error: 'Sugerencia no encontrada' });
    }

    // Si estaba vinculada a una plantilla existente, la actualizamos
    let updatedTemplate;
    if (suggestion.template_id) {
      const base = db.getTemplateById(suggestion.template_id);
      const cleanTitle = (suggestion.proposed_title || base?.title || 'Plantilla Legal')
        .replace(/\s*\((Versión Refinada|Mejorada)\).*/gi, '')
        .trim();

      updatedTemplate = db.addOrUpdateTemplate({
        id: suggestion.template_id,
        category_id: suggestion.category_id || base?.category_id || 'cat-familia-alimentos',
        title: cleanTitle,
        body_template: suggestion.proposed_body,
        variables: suggestion.variables,
        version: (base?.version || 1) + 1,
        usage_count: (base?.usage_count || 1) + 1
      });
    } else {
      // Crear nueva plantilla maestra
      const cleanTitle = (suggestion.proposed_title || 'Nueva Plantilla Legal')
        .replace(/\s*\((Versión Refinada|Mejorada)\).*/gi, '')
        .trim();

      updatedTemplate = db.addOrUpdateTemplate({
        id: `tpl-${Date.now()}`,
        category_id: suggestion.category_id || 'cat-familia-alimentos',
        title: cleanTitle,
        body_template: suggestion.proposed_body,
        variables: suggestion.variables,
        version: 1,
        usage_count: 1
      });
    }

    db.updateSuggestionStatus(id, 'accepted');

    return res.json({
      success: true,
      message: 'Plantilla maestra actualizada exitosamente',
      template: updatedTemplate
    });

  } catch (e) {
    console.error('[Controller] Error al aceptar sugerencia:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}

/**
 * Rechaza una sugerencia de mejora
 */
export function rejectSuggestion(req, res) {
  try {
    const { id } = req.params;
    const suggestion = db.updateSuggestionStatus(id, 'rejected');

    if (!suggestion) {
      return res.status(404).json({ success: false, error: 'Sugerencia no encontrada' });
    }

    return res.json({ success: true, message: 'Sugerencia descartada' });
  } catch (e) {
    console.error('[Controller] Error al rechazar sugerencia:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
