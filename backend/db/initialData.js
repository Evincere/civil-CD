export const INITIAL_CATEGORIES = [
  { id: 'cat-familia', name: 'Familia', parent_id: null },
  { id: 'cat-familia-alimentos', name: 'Alimentos y Cuotas', parent_id: 'cat-familia' },
  { id: 'cat-familia-cuidado', name: 'Cuidado Personal y Régimen de Comunicación', parent_id: 'cat-familia' },
  
  { id: 'cat-vivienda', name: 'Vivienda y Alquileres', parent_id: null },
  { id: 'cat-vivienda-desalojo', name: 'Intimación de Desalojo / Restitución', parent_id: 'cat-vivienda' },
  { id: 'cat-vivienda-reparaciones', name: 'Reclamación de Reparaciones Urgentes', parent_id: 'cat-vivienda' },

  { id: 'cat-laboral', name: 'Derecho Laboral', parent_id: null },
  { id: 'cat-laboral-registración', name: 'Intimación de Registración (Trabajo en Negro)', parent_id: 'cat-laboral' },
  
  { id: 'cat-consumidor', name: 'Defensa del Consumidor', parent_id: null },
  { id: 'cat-consumidor-servicios', name: 'Incumplimiento de Servicio / Facturación Indebida', parent_id: 'cat-consumidor' }
];

export const INITIAL_TEMPLATES = [
  {
    id: 'tpl-alimentos-1',
    category_id: 'cat-familia-alimentos',
    title: 'Intimación por Pago de Cuota Alimentaria',
    body_template: 'En mi carácter de representante legal de [NOMBRE_REPRESENTADO], intimo a Ud. para que en el plazo perentorio de 48 horas haga efectivo el pago de la suma de $[MONTO_DEUDA] en concepto de cuotas alimentarias adeudadas correspondientes a los meses de [MESES_ADEUDADOS]. Caso contrario se iniciarán las acciones judiciales pertinentes con más sus intereses y costas.',
    variables: ['NOMBRE_REPRESENTADO', 'MONTO_DEUDA', 'MESES_ADEUDADOS'],
    usage_count: 1,
    version: 1,
    updated_at: new Date().toISOString()
  },
  {
    id: 'tpl-desalojo-1',
    category_id: 'cat-vivienda-desalojo',
    title: 'Intimación de Desocupación por Vencimiento de Contrato',
    body_template: 'Habiendo vencido el plazo estipulado en el contrato de locación sobre el inmueble sito en [DOMICILIO_INMUEBLE] con fecha [FECHA_VENCIMIENTO], intimo a Ud. para que en el plazo de 10 días proceda a la desocupación total y entrega de la propiedad libre de ocupantes. Bajo apercibimiento de promover juicio de desalojo.',
    variables: ['DOMICILIO_INMUEBLE', 'FECHA_VENCIMIENTO'],
    usage_count: 1,
    version: 1,
    updated_at: new Date().toISOString()
  }
];
