import dotenv from 'dotenv';
dotenv.config();

const LLM_API_URL = process.env.LLM_API_URL || 'http://localhost:3000/v1/chat/completions';
const LLM_API_KEY = process.env.LLM_API_KEY || 'free-llm-key';
const LLM_MODEL = process.env.LLM_MODEL || 'gemini-1.5-flash';

/**
 * Evalúa si el texto redactado contiene una mejora sustancial respecto a la plantilla original,
 * o si constituye una nueva plantilla legal útil.
 * 
 * @param {string} userText - Texto redactado por el usuario en la Carta Documento
 * @param {object|null} baseTemplate - Plantilla base utilizada (si existía)
 * @returns {Promise<{ hasImprovement: boolean, proposedTitle?: string, proposedBody?: string, variables?: string[], rationale?: string }>}
 */
export async function evaluateTextImprovement(userText, baseTemplate = null) {
  if (!userText || userText.trim().length < 30) {
    return { hasImprovement: false };
  }

  const prompt = `Eres un experto abogado en Derecho Civil argentino especializado en redacción de Cartas Documento oficiales para la Defensoría Civil.
Analiza la siguiente Carta Documento redactada por un defensor:

TEXTO REDACTADO:
"""
${userText}
"""

PLANTILLA BASE ORIGINAL (${baseTemplate ? baseTemplate.title : 'Ninguna'}):
"""
${baseTemplate ? baseTemplate.body_template : 'Ninguna'}
"""

INSTRUCCIONES DE EVALUACIÓN:
1. Determina si el texto redactado incluye una MEJORA SUSTANCIAL (nuevas cláusulas jurídicas útiles, mayor rigor técnico, mejor fundamentación) o si constituye una NUEVA plantilla útil generalizable.
2. Si es solo un cambio de datos particulares (nombres de personas, DNI, montos específicos, fechas particulares), responde únicamente con hasImprovement: false.
3. Si SÍ contiene una mejora o nueva plantilla generalizable:
   a) Remueve todos los datos personales particulares (nombres, montos, fechas, direcciones) sustituyéndolos por variables estándar en mayúsculas dentro de corchetes, por ejemplo: [NOMBRE_RECLAMANTE], [MONTO_DEUDA], [DOMICILIO_INMUEBLE], [FECHA_HECHO].
   b) Asigna un título descriptivo y claro.
   c) Escribe una breve razón (rationale) de 1 oración explicando por qué es una mejora útil.

Responde ÚNICAMENTE con un JSON válido con este formato:
{
  "hasImprovement": true o false,
  "proposedTitle": "Título descriptivo de la plantilla",
  "proposedBody": "Texto de la plantilla anonimizada con [VARIABLES]",
  "variables": ["NOMBRE_RECLAMANTE", "MONTO_DEUDA"],
  "rationale": "Explicación de la mejora jurídica"
}`;

  try {
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn('[LLM Service] Error HTTP en LLM Provider:', response.statusText);
      return _fallbackHeuristicEvaluation(userText, baseTemplate);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    
    // Limpiar respuesta de código markdown si viniera formateado
    const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonString);

    return {
      hasImprovement: Boolean(parsed.hasImprovement),
      proposedTitle: parsed.proposedTitle || 'Nueva Plantilla Sugerida',
      proposedBody: parsed.proposedBody || userText,
      variables: parsed.variables || [],
      rationale: parsed.rationale || 'Se detectaron mejoras en la formulación jurídica.'
    };

  } catch (e) {
    console.warn('[LLM Service] No se pudo conectar al proveedor LLM, aplicando heurística local:', e.message);
    return _fallbackHeuristicEvaluation(userText, baseTemplate);
  }
}

/**
 * Fallback heurístico en caso de que freellmapi no esté respondiendo en desarrollo
 */
function _fallbackHeuristicEvaluation(userText, baseTemplate) {
  if (!userText || userText.trim().length < 40) {
    return { hasImprovement: false };
  }

  const cleanUserText = userText.trim();
  const detectedTitle = _detectLegalTitle(userText);
  const detectedCategoryId = _detectCategoryId(userText);

  let isNewTemplate = false;
  let targetTemplateId = baseTemplate ? baseTemplate.id : null;

  if (baseTemplate) {
    // Si la plantilla base es de una categoría jurídica diferente a la detectada, tratar como NUEVA plantilla
    if (baseTemplate.category_id && detectedCategoryId && baseTemplate.category_id !== detectedCategoryId) {
      isNewTemplate = true;
      targetTemplateId = null;
    } else {
      const cleanBaseText = (baseTemplate.body_template || '').trim();
      if (cleanUserText === cleanBaseText || _calculateSimilarity(cleanUserText, cleanBaseText) > 0.92) {
        return { hasImprovement: false };
      }
    }
  } else {
    isNewTemplate = true;
  }

  const baseTitleClean = baseTemplate && !isNewTemplate ? baseTemplate.title.replace(/\s*\((Versión Refinada|Mejorada)\).*/gi, '').trim() : '';

  return {
    hasImprovement: true,
    isNewTemplate,
    templateId: targetTemplateId,
    categoryId: detectedCategoryId,
    proposedTitle: isNewTemplate ? detectedTitle : baseTitleClean,
    proposedBody: _anonymizeTextHeuristic(userText),
    variables: ['NOMBRE_DESTINATARIO', 'MONTO_DEUDA', 'FECHA_HECHO'],
    rationale: isNewTemplate 
      ? `Se detectó una nueva plantilla en la categoría "${detectedTitle}". Se propone anonimizar y guardar como plantilla oficial.`
      : 'Se identificó una amplificación relevante en las cláusulas redactadas y fundamentación jurídica.'
  };
}

function _detectLegalTitle(text) {
  const t = text.toLowerCase();
  if (t.includes('defensa del consumidor') || t.includes('24.240') || t.includes('telecom') || t.includes('servicio no solicitado')) {
    return 'Reclamo por Defensa del Consumidor (Ley 24.240)';
  }
  if (t.includes('alimentos') || t.includes('cuota') || t.includes('13.944') || t.includes('552')) {
    return 'Intimación por Pago de Cuota Alimentaria';
  }
  if (t.includes('desalojo') || t.includes('locación') || t.includes('alquiler') || t.includes('inmueble')) {
    return 'Intimación de Desocupación por Vencimiento de Contrato';
  }
  if (t.includes('laboral') || t.includes('trabajo') || t.includes('empleador') || t.includes('registración')) {
    return 'Intimación Laboral por Registración';
  }
  return 'Intimación Legal General';
}

function _detectCategoryId(text) {
  const t = text.toLowerCase();
  if (t.includes('defensa del consumidor') || t.includes('24.240') || t.includes('telecom') || t.includes('servicio no solicitado')) {
    return 'cat-consumidor-servicios';
  }
  if (t.includes('alimentos') || t.includes('cuota') || t.includes('13.944') || t.includes('552')) {
    return 'cat-familia-alimentos';
  }
  if (t.includes('desalojo') || t.includes('locación') || t.includes('alquiler') || t.includes('inmueble')) {
    return 'cat-vivienda-desalojo';
  }
  if (t.includes('laboral') || t.includes('trabajo') || t.includes('empleador') || t.includes('registración')) {
    return 'cat-laboral-registración';
  }
  return 'cat-familia-alimentos';
}

function _calculateSimilarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  return (longer.length - _editDistance(longer, shorter)) / parseFloat(longer.length);
}

function _editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

function _anonymizeTextHeuristic(text) {
  return text
    .replace(/\$\s*\d+([\.,]\d+)?/g, '$[MONTO_DEUDA]')
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '[FECHA_HECHO]');
}
