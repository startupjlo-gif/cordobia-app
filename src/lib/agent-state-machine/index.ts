import { Caso, ChipOption, NivelFlight } from '@/types';

export interface QuestionState {
  step: number;
  preguntaId: string;
  agenteMensaje: string;
  chipOptions?: ChipOption[];
  inputType?: 'chips' | 'text' | 'confirmation_card' | 'multi_select_tasks';
  isMultiSelect?: boolean;
}

export const PREGUNTAS_FLIGHT_LEVELS = [
  {
    id: 'F1',
    nivel: 'N1' as NivelFlight,
    actividad: 'Visibilidad',
    pregunta: 'Si mañana falta tu persona clave de ventas (o atención al cliente), ¿dónde está lo que prometió a sus clientes?',
    opciones: [
      { id: 'f1_0', label: 'En su cabeza o su WhatsApp', value: 0 },
      { id: 'f1_1', label: 'En su Excel o cuaderno', value: 1 },
      { id: 'f1_2', label: 'En una herramienta compartida pero incompleta', value: 2 },
      { id: 'f1_3', label: 'En un sistema compartido y al día', value: 3 },
    ]
  },
  {
    id: 'F2',
    nivel: 'N1' as NivelFlight,
    actividad: 'Coordinación',
    pregunta: '¿Cómo sabe cada persona qué tiene que hacer hoy?',
    opciones: [
      { id: 'f2_0', label: 'Se lo digo yo o lo improvisa', value: 0 },
      { id: 'f2_1', label: 'Cada uno lo lleva en su cabeza o libreta', value: 1 },
      { id: 'f2_2', label: 'Lista compartida, a veces desactualizada', value: 2 },
      { id: 'f2_3', label: 'Tablero compartido que todos actualizan', value: 3 },
    ]
  },
  {
    id: 'F3',
    nivel: 'N1' as NivelFlight,
    actividad: 'Medición',
    pregunta: '¿Sabéis cuánto tiempo os llevan las tareas repetitivas?',
    opciones: [
      { id: 'f3_0', label: 'Ni idea', value: 0 },
      { id: 'f3_1', label: 'Por intuición', value: 1 },
      { id: 'f3_2', label: 'Lo medimos alguna vez', value: 2 },
      { id: 'f3_3', label: 'Lo medimos habitualmente', value: 3 },
    ]
  },
  {
    id: 'F4',
    nivel: 'N2' as NivelFlight,
    actividad: 'Visibilidad',
    pregunta: '¿Puedes ver en un solo lugar en qué punto está cada pedido, desde que se vende hasta que se cobra?',
    opciones: [
      { id: 'f4_0', label: 'No, hay que preguntar a cada persona', value: 0 },
      { id: 'f4_1', label: 'Hay que mirar en varios sitios', value: 1 },
      { id: 'f4_2', label: 'En un lugar, pero no siempre actualizado', value: 2 },
      { id: 'f4_3', label: 'Sí, en tiempo real', value: 3 },
    ]
  },
  {
    id: 'F5',
    nivel: 'N2' as NivelFlight,
    actividad: 'Coordinación',
    pregunta: 'Cuando se cierra una venta, ¿cómo se entera quien tiene que prepararla o fabricarla?',
    opciones: [
      { id: 'f5_0', label: 'De palabra o cuando alguien se acuerda', value: 0 },
      { id: 'f5_1', label: 'Por WhatsApp o email', value: 1 },
      { id: 'f5_2', label: 'Por una hoja compartida', value: 2 },
      { id: 'f5_3', label: 'El pedido pasa solo por el sistema', value: 3 },
    ]
  },
  {
    id: 'F6',
    nivel: 'N2' as NivelFlight,
    actividad: 'Medición',
    pregunta: '¿Sabes cuántos días pasan desde que el cliente dice sí hasta que cobras?',
    opciones: [
      { id: 'f6_0', label: 'No', value: 0 },
      { id: 'f6_1', label: 'Aproximadamente', value: 1 },
      { id: 'f6_2', label: 'Sí, lo calculo de vez en cuando', value: 2 },
      { id: 'f6_3', label: 'Lo veo siempre en un indicador', value: 3 },
    ]
  },
  {
    id: 'F7',
    nivel: 'N3' as NivelFlight,
    actividad: 'Visibilidad',
    pregunta: '¿Cuántos proyectos de mejora o iniciativas nuevas tenéis abiertos a la vez?',
    opciones: [
      { id: 'f7_0', label: 'No lo sé o muchos sin terminar', value: 0 },
      { id: 'f7_1', label: 'Más de 5', value: 1 },
      { id: 'f7_2', label: 'Entre 3 y 5', value: 2 },
      { id: 'f7_3', label: '1 o 2, con prioridad clara', value: 3 },
    ]
  },
  {
    id: 'F8',
    nivel: 'N3' as NivelFlight,
    actividad: 'Coordinación',
    pregunta: '¿Cada cuánto revisáis en equipo si se cumplen los objetivos del negocio?',
    opciones: [
      { id: 'f8_0', label: 'Nunca', value: 0 },
      { id: 'f8_1', label: 'Una vez al año', value: 1 },
      { id: 'f8_2', label: 'Cada trimestre', value: 2 },
      { id: 'f8_3', label: 'Cada mes o más a menudo', value: 3 },
    ]
  },
  {
    id: 'F9',
    nivel: 'N3' as NivelFlight,
    actividad: 'Medición',
    pregunta: '¿Con qué información decidiste tu última inversión o contratación importante?',
    opciones: [
      { id: 'f9_0', label: 'Intuición', value: 0 },
      { id: 'f9_1', label: 'Lo que dijo el gestor al cierre', value: 1 },
      { id: 'f9_2', label: 'Un informe mensual', value: 2 },
      { id: 'f9_3', label: 'Un panel actualizado', value: 3 },
    ]
  }
];

export const CASOS_BASE_BALDE: Caso[] = [
  { case_id: 'R1_T', ronda: 1, agujero: 'Tiempo', texto_base: 'Termino el día habiendo contestado 40 WhatsApps y pasado facturas a Excel, pero sin haber vendido nada nuevo.' },
  { case_id: 'R1_P', ronda: 1, agujero: 'Procesos', texto_base: 'Cuando me voy de vacaciones me llaman cada día porque sin mí nadie sabe cómo seguir.' },
  { case_id: 'R1_D', ronda: 1, agujero: 'Datos', texto_base: 'Vendo más que el año pasado, pero no sé si gano más; me entero cuando cierra el gestor.' },
  { case_id: 'R1_C', ronda: 1, agujero: 'Cliente', texto_base: 'Trato igual al que me compra cada semana que al que vino una vez, y no sé quién está dejando de comprar.' },
  { case_id: 'R2_T', ronda: 2, agujero: 'Tiempo', texto_base: 'Paso horas copiando datos de un sitio a otro: del email al Excel, del Excel a la factura.' },
  { case_id: 'R2_P', ronda: 2, agujero: 'Procesos', texto_base: 'Cada persona hace las cosas a su manera; si entra alguien nuevo tarda meses en aprender porque nada está escrito.' },
  { case_id: 'R2_D', ronda: 2, agujero: 'Datos', texto_base: 'Para saber cuánto stock tengo o cuánto he facturado este mes tengo que preguntar o hacer cuentas a mano.' },
  { case_id: 'R2_C', ronda: 2, agujero: 'Cliente', texto_base: 'Los presupuestos que enviamos se quedan sin seguimiento; no sé cuántos se pierden por no volver a llamar.' },
  { case_id: 'R3_T', ronda: 3, agujero: 'Tiempo', texto_base: 'Mi mejor gente pasa el día en tareas administrativas en lugar de atender clientes.' },
  { case_id: 'R3_P', ronda: 3, agujero: 'Procesos', texto_base: 'Los errores se repiten: pedidos mal preparados, información que se pierde entre departamentos.' },
  { case_id: 'R3_D', ronda: 3, agujero: 'Datos', texto_base: 'Tomo decisiones importantes, como contratar o invertir, por intuición porque los números llegan tarde.' },
  { case_id: 'R3_C', ronda: 3, agujero: 'Cliente', texto_base: 'No sé qué clientes me dejan más margen ni cuáles han dejado de comprarme.' }
];

// Resúmenes transparentes de los casos para preguntar por su intensidad sin revelar variables
export const CASOS_RESUMEN_TEXT: Record<string, string> = {
  Tiempo: 'Tareas manuales y administrativas que consumen el día (copiar datos, contestar WhatsApps, papeleo)',
  Procesos: 'Dependencia personal extrema y falta de procedimientos escritos o estandarizados',
  Datos: 'Falta de visibilidad sobre números reales, márgenes, ganancias o stock en tiempo real',
  Cliente: 'Falta de seguimiento a presupuestos, oportunidades comerciales y comportamiento de clientes'
};

export function getInitialStateForStep(step: number): QuestionState {
  if (step === 1) {
    return {
      step: 1,
      preguntaId: 'P1_NOMBRE_EMPRESA',
      agenteMensaje: '¡Hola! Soy tu asistente para este diagnóstico de transformación digital. Para comenzar, ¿cómo te llamas y a qué se dedica tu empresa?',
      inputType: 'text'
    };
  }
  if (step === 2) {
    return {
      step: 2,
      preguntaId: 'P2_RONDA1_PRIMERA',
      agenteMensaje: 'Paso 2: A continuación te presento 4 situaciones reales de negocio. Elige la situación con la que MÁS te identificas en tu día a día:',
      inputType: 'chips',
      chipOptions: CASOS_BASE_BALDE.filter(c => c.ronda === 1).map(c => ({
        id: c.case_id,
        label: c.texto_base,
        value: c.case_id
      }))
    };
  }
  if (step === 3) {
    return {
      step: 3,
      preguntaId: 'P3_SELECCION_TAREAS',
      agenteMensaje: 'Paso 3: Matriz Frecuencia / Valor. Selecciona de esta lista las tareas operativas habituales que se realizan en tu empresa:',
      inputType: 'multi_select_tasks',
      isMultiSelect: true
    };
  }
  return {
    step: 4,
    preguntaId: 'F1',
    agenteMensaje: `Paso 4: Evaluación Flight Levels (Salud Organizativa). 1ª pregunta:\n\n${PREGUNTAS_FLIGHT_LEVELS[0].pregunta}`,
    inputType: 'chips',
    chipOptions: PREGUNTAS_FLIGHT_LEVELS[0].opciones.map(o => ({
      id: o.id,
      label: o.label,
      value: o.value
    }))
  };
}
