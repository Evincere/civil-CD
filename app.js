import { TEMPLATE_BASE64 } from './templateBase64.js';

// Predefined Legal Presets
const DEFAULT_PRESETS = [
  {
    id: 'intimacion',
    label: 'Intimación de Pago',
    isCustom: false,
    texto: `INTIMO a Ud. en su carácter de deudor/a a que en el plazo perentorio e improrrogable de 48 (cuarenta y ocho) horas de recibida la presente, proceda a cancelar la suma total adeudada de $ _________________ (pesos ___________________________), en concepto de capital e intereses devengados hasta la fecha.

El pago deberá efectuarse mediante transferencia bancaria a la cuenta de mi titularidad CBU _____________________________, enviando el comprobante correspondiente.

Bajo apercibimiento de iniciar sin más trámite las acciones judiciales por cobro ejecutivo, más el reclamo de daños, perjuicios y costas a su exclusivo cargo.

Queda Ud. debidamente notificado/a.`
  },
  {
    id: 'laboral',
    label: 'Reclamo Laboral',
    isCustom: false,
    texto: `INTIMO a Ud. en su carácter de empleador/a a que en el plazo de 48 (cuarenta y ocho) horas aclare mi situación laboral, registrando debidamente la relación de trabajo con mi fecha real de ingreso (___/___/____), verdadera categoría laboral de ______________ y remuneración real de $ __________.

Asimismo, reclamo el pago de los haberes adeudados correspondientes a los meses de ________________.

Todo ello bajo apercibimiento de considerarme injuriado/a y despedido/a por su exclusiva culpa (Art. 242 LCT) e iniciar las acciones legales laborales correspondientes.

Queda Ud. formalmente notificado/a.`
  },
  {
    id: 'alquiler',
    label: 'Rescisión Alquiler',
    isCustom: false,
    texto: `NOTIFICO a Ud. en mi carácter de locatario/a del inmueble ubicado en la calle _________________________________________, que hago uso de la facultad de rescisión anticipada del contrato de locación vigente, conforme a lo establecido en la normativa legal aplicable.

Solicito se sirva fijar día y hora dentro del plazo de 5 (cinco) días para la realización del inventario de entrega, recepción de las llaves del inmueble y liquidación de los gastos pendientes.

Se deja constancia de que el inmueble se entregará en el mismo buen estado de conservación en que fue recibido.

Queda Ud. debidamente notificado/a.`
  },
  {
    id: 'desalojo',
    label: 'Intimación Desalojo',
    isCustom: false,
    texto: `INTIMO a Ud. en su carácter de locatario/ocupante del inmueble sito en _________________________________________, a que en el plazo perentorio de 10 (diez) días corridos a partir de la recepción de la presente, proceda a la total desocupación y restitución de la propiedad libre de ocupantes y efectos personales.

La presente intimación se efectúa atento al vencimiento del plazo contractual estipulado / falta de pago de los cánones locativos.

Bajo apercibimiento de promover la acción judicial de desalojo por cobro de alquileres, más daños y perjuicios y costas procesales.

Queda Ud. notificado/a a todos los efectos legales.`
  }
];

function loadStoredPresets() {
  try {
    const saved = localStorage.getItem('carta_doc_custom_presets');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading presets:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_PRESETS));
}

function savePresetsToStorage(presets) {
  try {
    localStorage.setItem('carta_doc_custom_presets', JSON.stringify(presets));
  } catch (e) {
    console.error('Error saving presets:', e);
  }
}

// Application State
const state = {
  presets: loadStoredPresets(),
  activePresetId: 'intimacion',
  remitente: {
    nombre: 'Juan Carlos Pérez',
    domicilio: 'Av. Corrientes 1234, 4° B',
    cpa: 'C1043AAV',
    localidad: 'CABA',
    provincia: 'Buenos Aires'
  },
  destinatario: {
    nombre: 'Empresa Constructora Argentina S.A.',
    domicilio: 'San Martín 567, Piso 2',
    cpa: 'B7600AAA',
    localidad: 'Mar del Plata',
    provincia: 'Buenos Aires'
  },
  cuerpo: {
    texto: '',
    fecha: 'CABA, 28 de Julio de 2026',
    firmante: 'Juan Carlos Pérez - DNI 28.456.789'
  },
  calibracion: {
    offsetX: 0,
    offsetY: 0,
    fontSizeEncabezado: 9,
    fontSizeCuerpo: 9.5,
    lineHeight: 13,
    maxLineWidth: 510
  },
  pdfBytes: null,
  zoom: 1.0
};

// Set initial body text from active preset if empty
const initPreset = state.presets.find(p => p.id === state.activePresetId) || state.presets[0];
if (initPreset) {
  state.cuerpo.texto = initPreset.texto;
}

// Global variables for PDF rendering
let pdfDoc = null;
let currentPdfBlobUrl = null;
let renderTimeout = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initTabs();
  bindFormInputs();
  renderPresetPills();
  bindSaveTemplateUI();
  bindCalibControls();
  bindActions();
  loadSavedDraft();
  
  // Initial PDF Generation & Render
  generateAndRenderPdf();
});

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Navigation Tabs
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const targetPane = document.getElementById(tab.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

// Bind Form Inputs to State
function bindFormInputs() {
  const inputsMap = {
    'remNombre': ['remitente', 'nombre'],
    'remDomicilio': ['remitente', 'domicilio'],
    'remCPA': ['remitente', 'cpa'],
    'remLocalidad': ['remitente', 'localidad'],
    'remProvincia': ['remitente', 'provincia'],

    'destNombre': ['destinatario', 'nombre'],
    'destDomicilio': ['destinatario', 'domicilio'],
    'destCPA': ['destinatario', 'cpa'],
    'destLocalidad': ['destinatario', 'localidad'],
    'destProvincia': ['destinatario', 'provincia'],

    'cuerpoTexto': ['cuerpo', 'texto'],
    'fechaEmision': ['cuerpo', 'fecha'],
    'firmante': ['cuerpo', 'firmante']
  };

  // Set initial form values from state
  Object.keys(inputsMap).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const [category, key] = inputsMap[id];
    el.value = state[category][key] || '';

    el.addEventListener('input', (e) => {
      state[category][key] = e.target.value;
      if (id === 'cuerpoTexto') updateCharCounter();
      scheduleRender();
    });
  });

  updateCharCounter();
}

function updateCharCounter() {
  const counter = document.getElementById('charCounter');
  if (counter) {
    const len = state.cuerpo.texto.length;
    counter.textContent = `${len} caracteres`;
  }
}

// Dynamic Preset Pills Rendering & Event Handling
function renderPresetPills() {
  const container = document.getElementById('presetContainer');
  if (!container) return;
  container.innerHTML = '';

  state.presets.forEach(preset => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `preset-pill ${preset.isCustom ? 'custom' : ''} ${preset.id === state.activePresetId ? 'active' : ''}`;
    
    let innerHtml = `<span>${preset.label}</span>`;
    if (preset.isCustom) {
      innerHtml += `<span class="preset-pill-delete" data-delete="${preset.id}" title="Eliminar plantilla">&times;</span>`;
    }
    btn.innerHTML = innerHtml;

    // Load preset text on click
    btn.addEventListener('click', (e) => {
      if (e.target.classList.contains('preset-pill-delete') || e.target.closest('.preset-pill-delete')) {
        e.stopPropagation();
        deletePreset(preset.id);
        return;
      }
      
      state.activePresetId = preset.id;
      state.cuerpo.texto = preset.texto;
      const textarea = document.getElementById('cuerpoTexto');
      if (textarea) textarea.value = preset.texto;
      
      updateCharCounter();
      renderPresetPills();
      scheduleRender();
      showToast(`Plantilla "${preset.label}" cargada`, 'info');
    });

    container.appendChild(btn);
  });
}

function deletePreset(id) {
  const preset = state.presets.find(p => p.id === id);
  if (!preset) return;

  if (confirm(`¿Desea eliminar la plantilla personalizada "${preset.label}"?`)) {
    state.presets = state.presets.filter(p => p.id !== id);
    if (state.activePresetId === id) {
      state.activePresetId = state.presets[0]?.id || '';
    }
    savePresetsToStorage(state.presets);
    renderPresetPills();
    showToast(`Plantilla "${preset.label}" eliminada`, 'info');
  }
}

function bindSaveTemplateUI() {
  const saveCard = document.getElementById('saveTemplateCard');
  const btnOpen = document.getElementById('btnOpenSaveTemplate');
  const btnConfirm = document.getElementById('btnConfirmSaveTemplate');
  const btnCancel = document.getElementById('btnCancelSaveTemplate');
  const btnResetPresets = document.getElementById('btnResetPresets');
  const nameInput = document.getElementById('newTemplateName');

  btnOpen?.addEventListener('click', () => {
    if (!state.cuerpo.texto.trim()) {
      showToast('Escriba un texto antes de guardarlo como plantilla', 'warning');
      return;
    }
    saveCard.style.display = saveCard.style.display === 'none' ? 'flex' : 'none';
    if (saveCard.style.display === 'flex') {
      nameInput.focus();
    }
  });

  btnCancel?.addEventListener('click', () => {
    saveCard.style.display = 'none';
    if (nameInput) nameInput.value = '';
  });

  btnConfirm?.addEventListener('click', () => {
    const title = nameInput ? nameInput.value.trim() : '';
    if (!title) {
      showToast('Ingrese un nombre para la plantilla', 'warning');
      return;
    }

    const newId = `custom_${Date.now()}`;
    const newPreset = {
      id: newId,
      label: title,
      isCustom: true,
      texto: state.cuerpo.texto
    };

    state.presets.push(newPreset);
    state.activePresetId = newId;
    savePresetsToStorage(state.presets);

    if (nameInput) nameInput.value = '';
    saveCard.style.display = 'none';

    renderPresetPills();
    showToast(`¡Plantilla "${title}" guardada exitosamente!`, 'success');
  });

  btnResetPresets?.addEventListener('click', () => {
    if (confirm('¿Desea restablecer las plantillas predeterminadas de fábrica?')) {
      state.presets = JSON.parse(JSON.stringify(DEFAULT_PRESETS));
      state.activePresetId = 'intimacion';
      state.cuerpo.texto = DEFAULT_PRESETS[0].texto;
      
      const textarea = document.getElementById('cuerpoTexto');
      if (textarea) textarea.value = state.cuerpo.texto;

      savePresetsToStorage(state.presets);
      renderPresetPills();
      updateCharCounter();
      scheduleRender();
      showToast('Plantillas restablecidas por defecto', 'info');
    }
  });
}

// Bind Calibration Controls
function bindCalibControls() {
  const calibInputs = [
    'offsetX', 'offsetY', 'fontSizeEncabezado', 
    'fontSizeCuerpo', 'lineHeight', 'maxLineWidth'
  ];

  calibInputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = state.calibracion[id];
    el.addEventListener('input', (e) => {
      state.calibracion[id] = parseFloat(e.target.value) || 0;
      scheduleRender();
    });
  });

  document.getElementById('btnRestoreCalib')?.addEventListener('click', () => {
    state.calibracion = {
      offsetX: 0,
      offsetY: 0,
      fontSizeEncabezado: 9,
      fontSizeCuerpo: 9.5,
      lineHeight: 13,
      maxLineWidth: 510
    };
    calibInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = state.calibracion[id];
    });
    scheduleRender();
    showToast('Calibración restablecida por defecto', 'info');
  });
}

// Bind Actions
function bindActions() {
  // Reset Form
  document.getElementById('btnReset')?.addEventListener('click', () => {
    if (confirm('¿Desea restablecer todos los campos del formulario?')) {
      state.remitente = { nombre: '', domicilio: '', cpa: '', localidad: '', provincia: '' };
      state.destinatario = { nombre: '', domicilio: '', cpa: '', localidad: '', provincia: '' };
      state.cuerpo = { texto: '', fecha: '', firmante: '' };
      
      bindFormInputs();
      scheduleRender();
      showToast('Formulario vaciado', 'info');
    }
  });

  // Save Draft
  document.getElementById('btnSaveDraft')?.addEventListener('click', () => {
    localStorage.setItem('carta_doc_draft', JSON.stringify({
      remitente: state.remitente,
      destinatario: state.destinatario,
      cuerpo: state.cuerpo,
      calibracion: state.calibracion
    }));
    showToast('Borrador guardado en el navegador', 'success');
  });

  // Download PDF Buttons
  document.getElementById('btnDownloadHeader')?.addEventListener('click', downloadPdf);
  document.getElementById('btnDownloadFloating')?.addEventListener('click', downloadPdf);

  // Zoom Controls
  document.getElementById('btnZoomIn')?.addEventListener('click', () => adjustZoom(0.15));
  document.getElementById('btnZoomOut')?.addEventListener('click', () => adjustZoom(-0.15));
  document.getElementById('btnZoomFit')?.addEventListener('click', () => {
    state.zoom = 1.0;
    updateZoomDisplay();
    renderCanvas();
  });
}

function adjustZoom(delta) {
  state.zoom = Math.min(Math.max(0.5, state.zoom + delta), 2.5);
  updateZoomDisplay();
  renderCanvas();
}

function updateZoomDisplay() {
  const el = document.getElementById('zoomLevel');
  if (el) el.textContent = `${Math.round(state.zoom * 100)}%`;
}

function loadSavedDraft() {
  try {
    const saved = localStorage.getItem('carta_doc_draft');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.remitente) state.remitente = parsed.remitente;
      if (parsed.destinatario) state.destinatario = parsed.destinatario;
      if (parsed.cuerpo) state.cuerpo = parsed.cuerpo;
      if (parsed.calibracion) state.calibracion = parsed.calibracion;
      bindFormInputs();
      bindCalibControls();
    }
  } catch (err) {
    console.error('Error loading draft:', err);
  }
}

// Debounced PDF Render trigger
function scheduleRender() {
  if (renderTimeout) clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => {
    generateAndRenderPdf();
  }, 300);
}

// Primary PDF Superimposition Generator using pdf-lib
async function generateAndRenderPdf() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) loadingOverlay.style.opacity = '1';

  try {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

    // Load PDF template from base64
    const pdfDoc = await PDFDocument.load(TEMPLATE_BASE64);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    const calib = state.calibracion;
    const offX = calib.offsetX;
    const offY = calib.offsetY;
    const fsHead = calib.fontSizeEncabezado;
    const fsBody = calib.fontSizeCuerpo;
    const lh = calib.lineHeight;

    // Color definitions
    const textColor = rgb(0.08, 0.08, 0.12);

    // ==========================================
    // 1. BLOQUE SUPERIOR - REMITENTE (Sección 1)
    // ==========================================
    const rX = 70 + offX;
    let rY = height - 90 + offY;

    // Remitente Nombre
    firstPage.drawText(state.remitente.nombre, { x: rX, y: rY, size: fsHead, font: fontBold, color: textColor });
    // Domicilio
    rY -= 28;
    firstPage.drawText(state.remitente.domicilio, { x: rX, y: rY, size: fsHead, font: font, color: textColor });
    // CPA / Localidad / Provincia
    rY -= 27;
    firstPage.drawText(state.remitente.cpa, { x: rX, y: rY, size: fsHead, font: fontBold, color: textColor });
    firstPage.drawText(state.remitente.localidad, { x: rX + 70, y: rY, size: fsHead, font: font, color: textColor });
    firstPage.drawText(state.remitente.provincia, { x: rX + 210, y: rY, size: fsHead, font: font, color: textColor });

    // ==========================================
    // 2. BLOQUE SUPERIOR - DESTINATARIO (Sección 1)
    // ==========================================
    const dX = 335 + offX;
    let dY = height - 90 + offY;

    // Destinatario Nombre
    firstPage.drawText(state.destinatario.nombre, { x: dX, y: dY, size: fsHead, font: fontBold, color: textColor });
    // Domicilio
    dY -= 28;
    firstPage.drawText(state.destinatario.domicilio, { x: dX, y: dY, size: fsHead, font: font, color: textColor });
    // CPA / Localidad / Provincia
    dY -= 27;
    firstPage.drawText(state.destinatario.cpa, { x: dX, y: dY, size: fsHead, font: fontBold, color: textColor });
    firstPage.drawText(state.destinatario.localidad, { x: dX + 70, y: dY, size: fsHead, font: font, color: textColor });
    firstPage.drawText(state.destinatario.provincia, { x: dX + 210, y: dY, size: fsHead, font: font, color: textColor });


    // ==========================================
    // 3. BLOQUE MEDIO - REPETICIÓN REMITENTE Y DESTINATARIO (Sección 2)
    // ==========================================
    const r2X = 70 + offX;
    let r2Y = height - 322 + offY;

    firstPage.drawText(state.remitente.nombre, { x: r2X, y: r2Y, size: fsHead, font: fontBold, color: textColor });
    r2Y -= 28;
    firstPage.drawText(state.remitente.domicilio, { x: r2X, y: r2Y, size: fsHead, font: font, color: textColor });
    r2Y -= 27;
    firstPage.drawText(state.remitente.cpa, { x: r2X, y: r2Y, size: fsHead, font: fontBold, color: textColor });
    firstPage.drawText(state.remitente.localidad, { x: r2X + 70, y: r2Y, size: fsHead, font: font, color: textColor });
    firstPage.drawText(state.remitente.provincia, { x: r2X + 210, y: r2Y, size: fsHead, font: font, color: textColor });

    const d2X = 335 + offX;
    let d2Y = height - 322 + offY;

    firstPage.drawText(state.destinatario.nombre, { x: d2X, y: d2Y, size: fsHead, font: fontBold, color: textColor });
    d2Y -= 28;
    firstPage.drawText(state.destinatario.domicilio, { x: d2X, y: d2Y, size: fsHead, font: font, color: textColor });
    d2Y -= 27;
    firstPage.drawText(state.destinatario.cpa, { x: d2X, y: d2Y, size: fsHead, font: fontBold, color: textColor });
    firstPage.drawText(state.destinatario.localidad, { x: d2X + 70, y: d2Y, size: fsHead, font: font, color: textColor });
    firstPage.drawText(state.destinatario.provincia, { x: d2X + 210, y: d2Y, size: fsHead, font: font, color: textColor });


    // ==========================================
    // 4. BLOQUE INFERIOR - CUERPO DE LA CARTA
    // ==========================================
    const bodyX = 42 + offX;
    let bodyY = height - 425 + offY;
    const maxW = calib.maxLineWidth;

    // Draw Place and Date at the top of the body
    if (state.cuerpo.fecha) {
      firstPage.drawText(state.cuerpo.fecha, {
        x: bodyX,
        y: bodyY,
        size: fsBody,
        font: fontBold,
        color: textColor
      });
      bodyY -= (lh * 1.5);
    }

    // Auto-wrap body text logic
    const paragraphs = state.cuerpo.texto.split('\n');

    for (const para of paragraphs) {
      if (para.trim() === '') {
        bodyY -= lh;
        continue;
      }

      const words = para.split(' ');
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
        const textWidth = font.widthOfTextAtSize(testLine, fsBody);

        if (textWidth > maxW && currentLine !== '') {
          firstPage.drawText(currentLine, { x: bodyX, y: bodyY, size: fsBody, font: font, color: textColor });
          bodyY -= lh;
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine !== '') {
        firstPage.drawText(currentLine, { x: bodyX, y: bodyY, size: fsBody, font: font, color: textColor });
        bodyY -= lh;
      }
    }

    // Draw Signer / Clarification at bottom of body
    if (state.cuerpo.firmante) {
      bodyY -= lh;
      firstPage.drawText(`Firma / Aclaración: ${state.cuerpo.firmante}`, {
        x: bodyX,
        y: bodyY,
        size: fsBody,
        font: fontBold,
        color: textColor
      });
    }

    // Save modified PDF bytes
    state.pdfBytes = await pdfDoc.save();

    // Render Canvas Preview
    await renderCanvas();

  } catch (err) {
    console.error('Error generating PDF:', err);
    showToast('Error al procesar el PDF', 'warning');
  } finally {
    if (loadingOverlay) loadingOverlay.style.opacity = '0';
  }
}

// Render PDF bytes onto HTML5 Canvas via PDF.js
async function renderCanvas() {
  if (!state.pdfBytes || !state.pdfBytes.byteLength || !window.pdfjsLib) return;

  try {
    // Configure PDF.js worker with local worker file to avoid cross-origin CORS restriction
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';

    // IMPORTANT: Pass a cloned slice of pdfBytes to prevent PDF.js Web Worker from detaching ArrayBuffer
    const dataCopy = state.pdfBytes.slice(0);
    const loadingTask = window.pdfjsLib.getDocument({ data: dataCopy });
    pdfDoc = await loadingTask.promise;

    const page = await pdfDoc.getPage(1);
    
    const viewportScale = 1.5 * state.zoom;
    const viewport = page.getViewport({ scale: viewportScale });

    const canvas = document.getElementById('pdfCanvas');
    const context = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;

  } catch (err) {
    console.error('Error rendering canvas:', err);
  }
}

// Download PDF file
async function downloadPdf() {
  if (!state.pdfBytes || state.pdfBytes.byteLength === 0) {
    showToast('Generando PDF...', 'info');
    await generateAndRenderPdf();
  }

  if (!state.pdfBytes || state.pdfBytes.byteLength === 0) {
    showToast('Error: El PDF está vacío', 'warning');
    return;
  }

  // Pass a cloned slice to Blob to ensure non-detached ArrayBuffer
  const blob = new Blob([state.pdfBytes.slice(0)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const destClean = (state.destinatario.nombre || 'Carta_Documento')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 30);
    
  const fileName = `Carta_Documento_${destClean}.pdf`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
  showToast(`Descargado: ${fileName} (${(blob.size / 1024).toFixed(1)} KB)`, 'success');
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'warning') iconName = 'alert-triangle';

  toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
  container.appendChild(toast);
  initIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-20%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
