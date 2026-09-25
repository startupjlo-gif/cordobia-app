import {
  AgujeroType,
  AlertaCoherencia,
  CuadranteType,
  EleccionCaso,
  Empresa,
  Herramienta,
  HojaRuta,
  HojaRutaAccion,
  IntensidadAgujero,
  NivelFlight,
  RespuestaNivel,
  ResultadoDiagnostico,
  SemaforoColor,
  TareaParticipante
} from '@/types';

// Default Tools Catalog
export const CATALOGO_HERRAMIENTAS: Herramienta[] = [
  {
    id: 'h01',
    nombre: 'Tidio / Manychat',
    categoria: 'Atención y consultas',
    cuadrantes: ['Zombi'],
    niveles: ['N1'],
    tamano_recomendado: ['1–5', '6–20', '21–50'],
    tramo_precio: 'Gratis / Bajo',
    ecosistema: 'Independiente',
    descripcion: 'Chatbots con IA para cualificar clientes y responder dudas 24/7 en WhatsApp y Web.'
  },
  {
    id: 'h02',
    nombre: 'Make / n8n / Zapier',
    categoria: 'Automatización',
    cuadrantes: ['Zombi', 'Grasa'],
    niveles: ['N1', 'N2'],
    tamano_recomendado: ['1–5', '6–20', '21–50', 'Más de 50'],
    tramo_precio: 'Gratis / Bajo',
    ecosistema: 'Independiente',
    descripcion: 'Conecta aplicaciones (email, facturas, CRM, WhatsApp) sin programar nada.'
  },
  {
    id: 'h03',
    nombre: 'Google Drive + Gemini / Copilot en Excel',
    categoria: 'Documentos & Búsqueda',
    cuadrantes: ['Zombi', 'Grasa'],
    niveles: ['N1'],
    tamano_recomendado: ['1–5', '6–20', '21–50', 'Más de 50'],
    tramo_precio: 'Bajo / Medio',
    ecosistema: 'Google',
    descripcion: 'Búsqueda inteligente de información y generación de emails o documentos en un clic.'
  },
  {
    id: 'h04',
    nombre: 'Dext / Rossum',
    categoria: 'Facturación e I.A.',
    cuadrantes: ['Zombi'],
    niveles: ['N1'],
    tamano_recomendado: ['1–5', '6–20', '21–50'],
    tramo_precio: 'Bajo / Medio',
    ecosistema: 'Independiente',
    descripcion: 'Extracción automática de datos de facturas físicas o PDF directos al gestor.'
  },
  {
    id: 'h05',
    nombre: 'HubSpot / Pipedrive / Zoho CRM',
    categoria: 'CRM & Ventas',
    cuadrantes: ['Cuello de botella'],
    niveles: ['N2'],
    tamano_recomendado: ['1–5', '6–20', '21–50', 'Más de 50'],
    tramo_precio: 'Gratis / Bajo / Medio',
    ecosistema: 'Independiente',
    descripcion: 'Seguimiento de presupuestos y gestión de oportunidades comerciales en equipo.'
  },
  {
    id: 'h06',
    nombre: 'Odoo / Holded / Alegra',
    categoria: 'ERP & Operaciones',
    cuadrantes: ['Cuello de botella'],
    niveles: ['N2'],
    tamano_recomendado: ['1–5', '6–20', '21–50'],
    tramo_precio: 'Bajo / Medio',
    ecosistema: 'Independiente',
    descripcion: 'Gestión unificada de ventas, stock, facturación y operaciones en un solo software.'
  },
  {
    id: 'h07',
    nombre: 'Trello / Asana / monday.com',
    categoria: 'Tablero de Coordinación',
    cuadrantes: ['Cuello de botella'],
    niveles: ['N2'],
    tamano_recomendado: ['1–5', '6–20', '21–50'],
    tramo_precio: 'Gratis / Bajo',
    ecosistema: 'Independiente',
    descripcion: 'Visibilidad total del estado de proyectos y tareas operativas entre personas.'
  },
  {
    id: 'h08',
    nombre: 'Looker Studio / Power BI',
    categoria: 'Dashboards y Análisis',
    cuadrantes: ['Oro'],
    niveles: ['N3'],
    tamano_recomendado: ['1–5', '6–20', '21–50', 'Más de 50'],
    tramo_precio: 'Gratis / Medio',
    ecosistema: 'Microsoft',
    descripcion: 'Paneles visuales en tiempo real para tomar decisiones estratégicas basadas en datos.'
  }
];

// Mapping case IDs to Agujero
const CASO_AGUJERO_MAP: Record<string, AgujeroType> = {
  'R1_T': 'Tiempo', 'R1_P': 'Procesos', 'R1_D': 'Datos', 'R1_C': 'Cliente',
  'R2_T': 'Tiempo', 'R2_P': 'Procesos', 'R2_D': 'Datos', 'R2_C': 'Cliente',
  'R3_T': 'Tiempo', 'R3_P': 'Procesos', 'R3_D': 'Datos', 'R3_C': 'Cliente',
};

/**
 * Calculates bucket leak scores (0-100) and identifies the main leak.
 */
export function calcularFugasBalde(
  elecciones: EleccionCaso[],
  intensidades: IntensidadAgujero[]
): { fugas: Record<AgujeroType, number>; agujeroPrincipal: AgujeroType; puntosEleccion: Record<AgujeroType, number> } {
  const puntosEleccion: Record<AgujeroType, number> = {
    Tiempo: 0,
    Procesos: 0,
    Datos: 0,
    Cliente: 0
  };

  elecciones.forEach((e) => {
    const agujero1 = CASO_AGUJERO_MAP[e.case_id_primera];
    const agujero2 = CASO_AGUJERO_MAP[e.case_id_segunda];
    if (agujero1) puntosEleccion[agujero1] += 3;
    if (agujero2) puntosEleccion[agujero2] += 1;
  });

  const intensidadesMap: Record<AgujeroType, number> = {
    Tiempo: 3,
    Procesos: 3,
    Datos: 3,
    Cliente: 3
  };

  intensidades.forEach((i) => {
    intensidadesMap[i.agujero] = i.intensidad;
  });

  const fugas: Record<AgujeroType, number> = {
    Tiempo: 0,
    Procesos: 0,
    Datos: 0,
    Cliente: 0
  };

  const agujeros: AgujeroType[] = ['Tiempo', 'Procesos', 'Datos', 'Cliente'];

  agujeros.forEach((ag) => {
    const pts = puntosEleccion[ag]; // max 9
    const int = intensidadesMap[ag]; // 1 to 5
    // Fuga (0–100) = 0.6 * (puntos / 9 * 100) + 0.4 * ((intensidad - 1) / 4 * 100)
    const fuga = Math.round(0.6 * (pts / 9 * 100) + 0.4 * ((int - 1) / 4 * 100));
    fugas[ag] = Math.min(100, Math.max(0, fuga));
  });

  // Agujero principal: highest fuga. Tiebreak 1: intensity, Tiebreak 2: choice points
  let agujeroPrincipal: AgujeroType = 'Tiempo';
  let maxFuga = -1;

  agujeros.forEach((ag) => {
    if (fugas[ag] > maxFuga) {
      maxFuga = fugas[ag];
      agujeroPrincipal = ag;
    } else if (fugas[ag] === maxFuga) {
      if (intensidadesMap[ag] > intensidadesMap[agujeroPrincipal]) {
        agujeroPrincipal = ag;
      } else if (intensidadesMap[ag] === intensidadesMap[agujeroPrincipal]) {
        if (puntosEleccion[ag] > puntosEleccion[agujeroPrincipal]) {
          agujeroPrincipal = ag;
        }
      }
    }
  });

  return { fugas, agujeroPrincipal, puntosEleccion };
}

/**
 * Classifies a task into Frequency/Value quadrant.
 */
export function clasificarCuadranteTarea(
  frecuencia: TareaParticipante['frecuencia'],
  valor: TareaParticipante['valor']
): CuadranteType {
  const esFrecuenciaAlta = ['Diaria', 'Varias veces por semana', 'Semanal'].includes(frecuencia);
  const esValorAlto = ['El cliente lo nota', 'Perdemos una venta o dinero'].includes(valor);

  if (esValorAlto && esFrecuenciaAlta) return 'Oro';
  if (esValorAlto && !esFrecuenciaAlta) return 'Cuello de botella';
  if (!esValorAlto && esFrecuenciaAlta) return 'Zombi';
  return 'Grasa';
}

/**
 * Calculates priority score for a task.
 * Priority = Level Weight * Quadrant Weight * Hours
 */
export function calcularPrioridadTarea(tarea: TareaParticipante): number {
  const pesoNivelMap: Record<NivelFlight, number> = { N2: 3, N3: 2, N1: 1 };
  const pesoCuadranteMap: Record<CuadranteType, number> = {
    'Cuello de botella': 3,
    'Zombi': 2,
    'Oro': 2,
    'Grasa': 1
  };

  const cuadrante = tarea.cuadrante || clasificarCuadranteTarea(tarea.frecuencia, tarea.valor);
  const pesoNivel = pesoNivelMap[tarea.nivel] || 1;
  const pesoCuadrante = pesoCuadranteMap[cuadrante] || 1;

  return Number((pesoNivel * pesoCuadrante * tarea.horas_semana).toFixed(2));
}

/**
 * Calculates health (0-100) for Flight Levels N1, N2, N3.
 */
export function calcularSaludFlightLevels(respuestas: RespuestaNivel[]): {
  saludN1: number;
  saludN2: number;
  saludN3: number;
  nivelDebil: NivelFlight;
} {
  let ptsN1 = 0;
  let ptsN2 = 0;
  let ptsN3 = 0;

  respuestas.forEach((r) => {
    const pid = r.pregunta_id.toUpperCase();
    if (['F1', 'F2', 'F3'].includes(pid)) ptsN1 += r.puntos;
    if (['F4', 'F5', 'F6'].includes(pid)) ptsN2 += r.puntos;
    if (['F7', 'F8', 'F9'].includes(pid)) ptsN3 += r.puntos;
  });

  const saludN1 = Math.round((ptsN1 / 9) * 100);
  const saludN2 = Math.round((ptsN2 / 9) * 100);
  const saludN3 = Math.round((ptsN3 / 9) * 100);

  // Weakest level: lowest health. Tiebreak order: N2 -> N3 -> N1
  let nivelDebil: NivelFlight = 'N2';
  let minSalud = saludN2;

  if (saludN3 < minSalud) {
    minSalud = saludN3;
    nivelDebil = 'N3';
  }
  if (saludN1 < minSalud) {
    minSalud = saludN1;
    nivelDebil = 'N1';
  }

  return { saludN1, saludN2, saludN3, nivelDebil };
}

/**
 * Evaluates the main traffic light (Semáforo) for the company.
 */
export function evaluarSemaforoPrincipal(
  saludN2: number,
  saludN3: number,
  agujeroPrincipal: AgujeroType,
  tareas: TareaParticipante[]
): SemaforoColor {
  const tieneCuelloN2 = tareas.some(
    (t) => (t.cuadrante || clasificarCuadranteTarea(t.frecuencia, t.valor)) === 'Cuello de botella' && t.nivel === 'N2'
  );

  // 1. Rojo - El tapón (Nivel 2): salud N2 < 50, o al menos una tarea en Cuello de botella con nivel N2.
  if (saludN2 < 50 || tieneCuelloN2) {
    return 'rojo';
  }

  // 2. Amarillo - El punto ciego (Nivel 3): salud N3 < 50, o agujero principal = Datos.
  if (saludN3 < 50 || agujeroPrincipal === 'Datos') {
    return 'amarillo';
  }

  // 3. Verde - El desgaste (Nivel 1): cualquier otro caso.
  return 'verde';
}

/**
 * Evaluates coherence alerts for the facilitator.
 */
export function evaluarAlertasCoherencia(
  agujeroPrincipal: AgujeroType,
  saludN2: number,
  saludN3: number,
  tareas: TareaParticipante[]
): AlertaCoherencia[] {
  const alertas: AlertaCoherencia[] = [];

  // Agujero principal Procesos y salud N2 >= 70
  if (agujeroPrincipal === 'Procesos' && saludN2 >= 70) {
    alertas.push({
      tipo: 'Incoherencia',
      mensaje: 'Dice que su problema principal es Procesos, pero la coordinación en Nivel 2 parece sana (salud ≥ 70%).'
    });
  }

  // Agujero principal Datos y salud N3 >= 70
  if (agujeroPrincipal === 'Datos' && saludN3 >= 70) {
    alertas.push({
      tipo: 'Incoherencia',
      mensaje: 'Dice que le faltan datos, pero la toma de decisiones estratégicas en Nivel 3 muestra buena madurez.'
    });
  }

  // Agujero principal Tiempo y ninguna tarea Zombi o Grasa
  const tieneZombiOGrasa = tareas.some((t) => {
    const q = t.cuadrante || clasificarCuadranteTarea(t.frecuencia, t.valor);
    return q === 'Zombi' || q === 'Grasa';
  });
  if (agujeroPrincipal === 'Tiempo' && !tieneZombiOGrasa) {
    alertas.push({
      tipo: 'Incoherencia',
      mensaje: 'Dice que le falta tiempo, pero no identifica tareas de poco valor (Zombi o Grasa) que se lo consuman.'
    });
  }

  // Agujero principal Cliente y T06 no seleccionada o con valor bajo
  const t06 = tareas.find((t) => t.tarea_id === 'T06' || t.nombre?.includes('Seguimiento de clientes'));
  const t06ValorBajo = t06 && ['No pasa nada', 'Una molestia interna'].includes(t06.valor);
  if (agujeroPrincipal === 'Cliente' && (!t06 || t06ValorBajo)) {
    alertas.push({
      tipo: 'Incoherencia',
      mensaje: 'Dice que su problema es el Cliente, pero no hace seguimiento o le asigna un valor bajo a la tarea T06.'
    });
  }

  // Agujero principal Procesos y salud N2 < 50 (Sólido)
  if (agujeroPrincipal === 'Procesos' && saludN2 < 50) {
    alertas.push({
      tipo: 'Diagnóstico Sólido',
      mensaje: 'Diagnóstico altamente coherente: Procesos como agujero principal alineado con un Nivel 2 crítico.',
      es_solido: true
    });
  }

  return alertas;
}

/**
 * Generates the complete diagnosis result for a participant / company.
 */
export function generarDiagnosticoCompleto(
  empresa: Partial<Empresa>,
  eleccionesCasos: EleccionCaso[],
  intensidades: IntensidadAgujero[],
  tareasInput: TareaParticipante[],
  respuestasNivel: RespuestaNivel[]
): ResultadoDiagnostico {
  // 1. Calculate Bucket Leaks
  const { fugas, agujeroPrincipal } = calcularFugasBalde(eleccionesCasos, intensidades);

  // 2. Classify tasks and calculate priorities
  const tareasProcesadas = tareasInput.map((t) => {
    const cuadrante = clasificarCuadranteTarea(t.frecuencia, t.valor);
    const prioridad = calcularPrioridadTarea({ ...t, cuadrante });
    return { ...t, cuadrante, prioridad };
  });

  // Sort by priority descending
  tareasProcesadas.sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0));

  // 3. Flight Levels Health
  const { saludN1, saludN2, saludN3, nivelDebil } = calcularSaludFlightLevels(respuestasNivel);

  // 4. Semáforo Evaluation
  const semaforo = evaluarSemaforoPrincipal(saludN2, saludN3, agujeroPrincipal, tareasProcesadas);

  // 5. Recoverable Hours
  const horasRecuperables = tareasProcesadas
    .filter((t) => t.cuadrante === 'Zombi' || t.cuadrante === 'Grasa')
    .reduce((sum, t) => sum + (t.horas_semana || 0), 0);

  // 6. Coherence Alerts
  const alertas = evaluarAlertasCoherencia(agujeroPrincipal, saludN2, saludN3, tareasProcesadas);

  // 7. Roadmap 30-60-90
  const tareasZombiGrasa = tareasProcesadas.filter((t) => t.cuadrante === 'Zombi' || t.cuadrante === 'Grasa');
  const tareasCuello = tareasProcesadas.filter((t) => t.cuadrante === 'Cuello de botella');
  const tareasOro = tareasProcesadas.filter((t) => t.cuadrante === 'Oro');

  const ecosistema = empresa.ecosistema || 'Independiente';

  const herram30 = CATALOGO_HERRAMIENTAS.filter(
    (h) => h.cuadrantes.includes('Cuello de botella') || h.niveles.includes('N2')
  ).slice(0, 3);

  const herram60 = CATALOGO_HERRAMIENTAS.filter(
    (h) => h.cuadrantes.includes('Zombi') || h.cuadrantes.includes('Grasa')
  ).slice(0, 3);

  const herram90 = CATALOGO_HERRAMIENTAS.filter(
    (h) => h.cuadrantes.includes('Oro') || h.niveles.includes('N3')
  ).slice(0, 3);

  const hojaRuta: HojaRuta = {
    acciones_30: {
      plazo: '30_dias',
      titulo: semaforo === 'rojo' ? 'Conectar las áreas y sistematizar flujos' : 'Establecer visibilidad operativa',
      color_semaforo: semaforo,
      descripcion: 'Sistematizar el paso de información crítico e implantar tableros de control iniciales.',
      que_hacer: 'Implementar un tablero de coordinación centralizado y estandarizar la entrega de presupuestos.',
      por_que: `Tus respuestas indican un cuello de botella en coordinación (Nivel 2) y una fuga principal en ${agujeroPrincipal}.`,
      tareas_relacionadas: tareasCuello.map((t) => t.nombre || t.nombre_personalizado || 'Tarea N2'),
      herramientas_recomendadas: herram30
    },
    acciones_60: {
      plazo: '60_dias',
      titulo: 'Eliminar y automatizar tareas repetitivas',
      color_semaforo: 'amarillo',
      descripcion: 'Recuperar horas operativas automatizando flujos zombi y reduciendo tareas de poco valor.',
      que_hacer: 'Desplegar integraciones sin código (Make/n8n) para la facturación y respuestas frecuentes.',
      por_que: `Se detectan ${horasRecuperables} horas semanales dedicadas a tareas manuales (Zombi/Grasa).`,
      tareas_relacionadas: tareasZombiGrasa.map((t) => t.nombre || t.nombre_personalizado || 'Tarea Zombi'),
      herramientas_recomendadas: herram60
    },
    acciones_90: {
      plazo: '90_dias',
      titulo: 'Potenciar el modelo de negocio con analítica e IA avanzada',
      color_semaforo: 'verde',
      descripcion: 'Crear paneles de control para dirección e incorporar asistentes con IA.',
      que_hacer: 'Conectar tus datos a un dashboard directivo (Looker/Power BI) e integrar copilotos IA.',
      por_que: `Consolidarás las decisiones estratégicas en Nivel 3 y potenciarás las tareas clave de alto valor (Oro).`,
      tareas_relacionadas: tareasOro.map((t) => t.nombre || t.nombre_personalizado || 'Tarea Oro'),
      herramientas_recomendadas: herram90
    }
  };

  return {
    participante_id: 'test-participant-id',
    empresa_id: 'test-company-id',
    fuga_tiempo: fugas.Tiempo,
    fuga_procesos: fugas.Procesos,
    fuga_datos: fugas.Datos,
    fuga_cliente: fugas.Cliente,
    fugas,
    agujero_principal: agujeroPrincipal,
    salud_n1: saludN1,
    salud_n2: saludN2,
    salud_n3: saludN3,
    nivel_debil: nivelDebil,
    semaforo,
    horas_recuperables: Number(horasRecuperables.toFixed(1)),
    hoja_ruta: hojaRuta,
    alertas,
    version_reglas: '1.0.0'
  };
}
