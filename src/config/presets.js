/**
 * presets.js — Plantillas legales predeterminadas
 * 
 * OCP: se agregan nuevas plantillas sin modificar la lógica de la aplicación.
 */

export const DEFAULT_PRESETS = [
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
