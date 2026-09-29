'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AgujeroType,
  ChipOption,
  EcosistemaType,
  EleccionCaso,
  Empresa,
  IntensidadAgujero,
  Mensaje,
  NumEmpleadosType,
  RespuestaNivel,
  ResultadoDiagnostico,
  SectorType,
  TareaParticipante
} from '@/types';
import {
  CASOS_BASE_BALDE,
  PREGUNTAS_FLIGHT_LEVELS,
  getInitialStateForStep
} from '@/lib/agent-state-machine';
import { generarDiagnosticoCompleto, clasificarCuadranteTarea, calcularFugasBalde } from '@/lib/rules-engine';
import { LocalMockStore } from '@/lib/supabase/mock-store';
import { BrandingBanner } from './BrandingBanner';
import { CheckCircle, ArrowRight, Lock, Sparkles, Building2, PauseCircle, PlayCircle } from 'lucide-react';

interface ParticipantChatProps {
  sessionCode?: string;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_HOJA_RUTA = {
  acciones_30: { plazo: '30_dias' as const, titulo: 'Pendiente Etapa 3', color_semaforo: 'amarillo' as const, descripcion: '', que_hacer: '', por_que: '', tareas_relacionadas: [], herramientas_recomendadas: [] },
  acciones_60: { plazo: '60_dias' as const, titulo: 'Pendiente Etapa 3', color_semaforo: 'amarillo' as const, descripcion: '', que_hacer: '', por_que: '', tareas_relacionadas: [], herramientas_recomendadas: [] },
  acciones_90: { plazo: '90_dias' as const, titulo: 'Pendiente Etapa 3', color_semaforo: 'amarillo' as const, descripcion: '', que_hacer: '', por_que: '', tareas_relacionadas: [], herramientas_recomendadas: [] }
};

export const ParticipantChat: React.FC<ParticipantChatProps> = ({ sessionCode = 'CORDOBIA2026' }) => {
  // Etapa state (1: Ficha & Fugas, 2: Matriz Frecuencia/Valor, 3: Flight Levels)
  const [etapaActual, setEtapaActual] = useState<number>(1);
  const [consentimientoAceptado, setConsentimientoAceptado] = useState<boolean>(false);
  const [pasoIniciado, setPasoIniciado] = useState<boolean>(false);

  // Mentor Pause Control State
  const [esperandoAutorizacionMentor, setEsperandoAutorizacionMentor] = useState<boolean>(false);
  const [etapaEnPausaTexto, setEtapaEnPausaTexto] = useState<string>('');
  const [siguienteEtapaNombre, setSiguienteEtapaNombre] = useState<string>('');

  // Paso 1 Form state
  const [empresaIdState, setEmpresaIdState] = useState<string>('');
  const [participanteIdState, setParticipanteIdState] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [organizacion, setOrganizacion] = useState<string>(
    'Autónomo / Freelance: "Yo lo hago todo: venta, ejecución y papeleo."'
  );
  const [sector, setSector] = useState<SectorType>('Comercio y Servicios');
  const [numEmpleados, setNumEmpleados] = useState<NumEmpleadosType>('1–5');
  const [cargo, setCargo] = useState<string>('Gerente');
  const [ecosistema, setEcosistema] = useState<EcosistemaType>('Independiente');
  const [herramientasDesuso, setHerramientasDesuso] = useState<string>('');
  const [confirmacionPaso1, setConfirmacionPaso1] = useState<boolean>(false);

  // Etapa 1 Multi-step chat state (Paso 2: Filtro Intermedio, Paso 3: Escenario Práctico de Dolor)
  const [pasoEtapa1, setPasoEtapa1] = useState<number>(1);
  const [filtroFriccion, setFiltroFriccion] = useState<string>('');
  const [escenarioDolor, setEscenarioDolor] = useState<string>('');
  const [rondaActual, setRondaActual] = useState<number>(1);
  const [eleccionesCasos, setEleccionesCasos] = useState<EleccionCaso[]>([]);
  const [primeraEleccionRonda, setPrimeraEleccionRonda] = useState<string | null>(null);

  // Etapa 2 State (Matriz Frecuencia / Valor / Horas -> Oro, Zombi, Cuello, Grasa)
  const [tareasSeleccionadas, setTareasSeleccionadas] = useState<TareaParticipante[]>([]);
  const [tareaIndexPreguntas, setTareaIndexPreguntas] = useState<number>(0);
  const [fasePreguntaTarea, setFasePreguntaTarea] = useState<'frecuencia' | 'valor' | 'horas'>('frecuencia');

  // Etapa 3 State (Flight Levels)
  const [preguntaIndexFL, setPreguntaIndexFL] = useState<number>(0);
  const [respuestasFL, setRespuestasFL] = useState<RespuestaNivel[]>([]);
  const [diagnosticoFinalizado, setDiagnosticoFinalizado] = useState<boolean>(false);

  // Chat History Messages
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mockStore = LocalMockStore.getInstance();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, isTyping]);

  const agregarMensajeAgente = (texto: string, opciones?: ChipOption[]) => {
    const nuevoMensaje: Mensaje = {
      id: `m-${Date.now()}-${Math.random()}`,
      participante_id: 'part-current',
      rol: 'agente',
      texto,
      paso: etapaActual,
      opciones_chips: opciones
    };
    setMensajes((prev) => [...prev, nuevoMensaje]);
  };

  const agregarMensajeParticipante = (texto: string) => {
    const nuevoMensaje: Mensaje = {
      id: `m-${Date.now()}-${Math.random()}`,
      participante_id: 'part-current',
      rol: 'participante',
      texto,
      paso: etapaActual
    };
    setMensajes((prev) => [...prev, nuevoMensaje]);
  };

  const handleEmpezar = () => {
    if (!consentimientoAceptado) return;
    setPasoIniciado(true);
    setEtapaActual(1);
    const init = getInitialStateForStep(1);
    agregarMensajeAgente(init.agenteMensaje);
  };

  const handleConfirmarPaso1 = () => {
    setConfirmacionPaso1(true);
    setPasoEtapa1(2);
    agregarMensajeParticipante('✅ Ficha de empresa confirmada.');

    const newEmpId = empresaIdState || generateUUID();
    const newPartId = participanteIdState || generateUUID();
    setEmpresaIdState(newEmpId);
    setParticipanteIdState(newPartId);

    // Map organizacion to numEmpleados
    let numEmpMapped: NumEmpleadosType = '1–5';
    if (organizacion.startsWith('Pequeño equipo')) numEmpMapped = '6–20';
    else if (organizacion.startsWith('Empresa pyme')) numEmpMapped = '21–50';
    setNumEmpleados(numEmpMapped);

    const empObj: Empresa = {
      id: newEmpId,
      nombre: empresaNombre,
      sector,
      num_empleados: numEmpMapped,
      ecosistema,
      herramientas_desuso: herramientasDesuso,
      organizacion
    };

    mockStore.empresas.set(newEmpId, empObj);
    mockStore.saveToLocalStorage();

    try {
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_empresa',
          empresa: empObj
        })
      }).catch((err) => console.warn('API save_empresa error:', err));
    } catch (e) {
      console.warn('API save_empresa exception:', e);
    }

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      agregarMensajeAgente(
        `¡Perfecto, ${nombre}! Ficha guardada para ${empresaNombre}.\n\nEtapa 1 - Paso 2: El Filtro Intermedio (Grado de Fricción Operativa)\n\n«Si tuvieras que ser honesto con la forma en que gestionáis el día a día hoy, ¿cuál es tu punto de partida?»`,
        [
          {
            id: 'friccion_1',
            label: 'La información está en libretas, chats personales, llamadas y la memoria de las personas.',
            value: 'libretas'
          },
          {
            id: 'friccion_2',
            label: 'Usamos herramientas (Excel, programa de facturación, correo), pero nada se conecta entre sí y hay que pasar datos a mano.',
            value: 'herramientas_desconectadas'
          },
          {
            id: 'friccion_3',
            label: 'Tenemos software (CRM, ERP, TPV), pero requiere demasiado tiempo manual para alimentar los sistemas o no le sacamos provecho.',
            value: 'software_manual'
          },
          {
            id: 'friccion_4',
            label: 'Estoy montando o reestructurando el modelo y quiero elegir bien las herramientas desde el principio.',
            value: 'reestructurando'
          }
        ]
      );
    }, 600);
  };

  // ETAPA 1: PASO 2 (FILTRO INTERMEDIO) Y PASO 3 (ESCENARIO PRÁCTICO DE DOLOR)
  const handleSeleccionarCaso = (value: string, label: string) => {
    agregarMensajeParticipante(`"${label}"`);

    if (pasoEtapa1 === 2) {
      // Completed Paso 2 (Filtro Intermedio), proceed to Paso 3 (Escenario Práctico de Dolor)
      setFiltroFriccion(value);
      setPasoEtapa1(3);

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        agregarMensajeAgente(
          `Entendido. Registramos tu punto de partida tecnológico y operativo.\n\nEtapa 1 - Paso 3: El Escenario Práctico de Dolor (El Diagnóstico Final)\n\n«Pensando en tu operativa habitual, ¿cuál es el verdadero 'cuello de botella' que te impide crecer o vivir más tranquilo?»`,
          [
            {
              id: 'dolor_tiempo',
              label: 'El papeleo y las tareas repetitivas (picar albaranes, hacer facturas a mano, responder las mismas dudas por WhatsApp).',
              value: 'TIEMPO'
            },
            {
              id: 'dolor_procesos',
              label: 'La \'dueño-dependencia\' o \'persona-dependencia\': si el responsable no está o no decide, la tarea se frena o se cometen errores.',
              value: 'PROCESOS'
            },
            {
              id: 'dolor_datos',
              label: 'Ir a ciegas con la rentabilidad: vendemos, pero no sé con certeza qué producto, servicio o cliente me deja dinero real tras costes.',
              value: 'DATOS'
            },
            {
              id: 'dolor_cliente',
              label: 'La pérdida de oportunidades: no llevar un seguimiento de presupuestos, no fidelizar al cliente que ya compró o tratar a todos por igual.',
              value: 'CLIENTE'
            }
          ]
        );
      }, 500);
    } else {
      // Completed Paso 3 (Escenario Práctico de Dolor) -> Finalize Etapa 1
      setEscenarioDolor(label);

      const agujeroPrincipalMap: Record<string, AgujeroType> = {
        'TIEMPO': 'Tiempo',
        'PROCESOS': 'Procesos',
        'DATOS': 'Datos',
        'CLIENTE': 'Cliente'
      };
      const agujeroPrincipal = agujeroPrincipalMap[value] || 'Tiempo';

      let baseFriccion = 50;
      if (filtroFriccion === 'libretas') baseFriccion = 65;
      else if (filtroFriccion === 'herramientas_desconectadas') baseFriccion = 55;
      else if (filtroFriccion === 'software_manual') baseFriccion = 45;
      else if (filtroFriccion === 'reestructurando') baseFriccion = 35;

      const fugas: Record<AgujeroType, number> = {
        Tiempo: agujeroPrincipal === 'Tiempo' ? 85 : Math.max(20, baseFriccion),
        Procesos: agujeroPrincipal === 'Procesos' ? 85 : Math.max(20, baseFriccion),
        Datos: agujeroPrincipal === 'Datos' ? 85 : Math.max(20, baseFriccion),
        Cliente: agujeroPrincipal === 'Cliente' ? 85 : Math.max(20, baseFriccion)
      };

      const empId = empresaIdState || generateUUID();
      const partId = participanteIdState || generateUUID();
      if (!empresaIdState) setEmpresaIdState(empId);
      if (!participanteIdState) setParticipanteIdState(partId);

      const empObj: Empresa = {
        id: empId,
        nombre: empresaNombre,
        sector,
        num_empleados: numEmpleados,
        ecosistema,
        herramientas_desuso: herramientasDesuso,
        organizacion
      };

      const resEtapa1: ResultadoDiagnostico = {
        participante_id: partId,
        empresa_id: empId,
        fuga_tiempo: fugas.Tiempo,
        fuga_procesos: fugas.Procesos,
        fuga_datos: fugas.Datos,
        fuga_cliente: fugas.Cliente,
        agujero_principal: agujeroPrincipal,
        salud_n1: 0,
        salud_n2: 0,
        salud_n3: 0,
        nivel_debil: 'N1',
        semaforo: 'amarillo',
        horas_recuperables: 0,
        hoja_ruta: DEFAULT_HOJA_RUTA,
        alertas: [],
        fugas: fugas,
        version_reglas: '1.0.0',
        etapa_completada: 1
      };

      mockStore.empresas.set(empId, empObj);
      mockStore.resultados.set(partId, resEtapa1);
      mockStore.saveToLocalStorage();
      mockStore.syncToSupabase(empObj, resEtapa1);

      try {
        fetch('/api/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_resultado',
            empresa: empObj,
            resultado: resEtapa1
          })
        }).catch((err) => console.warn('API save_resultado Etapa 1 error:', err));
      } catch (e) {
        console.warn('API save_resultado Etapa 1 exception:', e);
      }

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        agregarMensajeAgente(
          `🛑 **¡Etapa 1 Completada!**\n\nHemos registrado los puntos principales de fuga de tu empresa (Principal: **${agujeroPrincipal.toUpperCase()}**). Por favor, atiende las explicaciones del mentor en la pantalla principal antes de iniciar la Etapa 2.`
        );

        setEsperandoAutorizacionMentor(true);
        setEtapaEnPausaTexto('Etapa 1 Finalizada (Puntos de Fuga)');
        setSiguienteEtapaNombre('Iniciar Etapa 2 (Matriz Frecuencia / Valor)');
      }, 700);
    }
  };

  // CONTINUACIÓN A ETAPA 2 (MATRIZ FRECUENCIA / VALOR / HORAS)
  const handleContinuarEtapa2 = () => {
    setEsperandoAutorizacionMentor(false);
    setEtapaActual(2);
    agregarMensajeParticipante('▶️ Iniciando Etapa 2 (Matriz Frecuencia y Valor)');

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      agregarMensajeAgente(
        'Etapa 2 (Matriz Frecuencia y Valor):\n\nEvaluaremos 3 escenarios operacionales habituales en tu día a día mediante su **FRECUENCIA** y **VALOR GENERADO** para clasificarlos en los 4 cuadrantes: **Oro**, **Cuello de Botella**, **Zombi** o **Grasa**.'
      );

      const tareasIniciales: TareaParticipante[] = [
        {
          tarea_id: 'T01',
          nombre: 'Atención de consultas frecuentes de clientes (WhatsApp / Email)',
          area: 'Atención al cliente',
          nivel: 'N1',
          frecuencia: 'Diaria',
          valor: 'El cliente lo nota',
          horas_semana: 7.5
        },
        {
          tarea_id: 'T03',
          nombre: 'Gestión manual de facturas, recibos y contabilidad',
          area: 'Facturación',
          nivel: 'N1',
          frecuencia: 'Varias veces por semana',
          valor: 'Una molestia interna',
          horas_semana: 4.0
        },
        {
          tarea_id: 'T06',
          nombre: 'Seguimiento de presupuestos y propuestas a clientes',
          area: 'Ventas',
          nivel: 'N2',
          frecuencia: 'Diaria',
          valor: 'Perdemos una venta o dinero',
          horas_semana: 5.0
        }
      ];
      setTareasSeleccionadas(tareasIniciales);
      setTareaIndexPreguntas(0);
      setFasePreguntaTarea('frecuencia');

      agregarMensajeAgente(
        `📌 **Escenario 1 de 3**: "${tareasIniciales[0].nombre}"\n\n¿Con qué FRECUENCIA sucede o se realiza este escenario en tu empresa?`,
        [
          { id: 'f_diaria', label: 'Diaria / Varias veces al día (Alta Frecuencia)', value: 'Diaria' },
          { id: 'f_varias', label: 'Varias veces por semana (Alta Frecuencia)', value: 'Varias veces por semana' },
          { id: 'f_semanal', label: 'Semanal (Alta Frecuencia)', value: 'Semanal' },
          { id: 'f_mensual', label: 'Mensual (Baja Frecuencia)', value: 'Mensual' },
          { id: 'f_ocasional', label: 'Ocasional (Baja Frecuencia)', value: 'Ocasional' }
        ]
      );
    }, 700);
  };

  // PREGUNTAS DE ETAPA 2 (FRECUENCIA -> VALOR -> HORAS POR TAREA -> CLASIFICACIÓN CUADRANTE)
  const handleRespuestaTareaPaso3 = (valorChoice: string) => {
    agregarMensajeParticipante(valorChoice);
    const tareasCopy = [...tareasSeleccionadas];
    const tareaActual = tareasCopy[tareaIndexPreguntas];

    if (fasePreguntaTarea === 'frecuencia') {
      tareaActual.frecuencia = valorChoice as any;
      setFasePreguntaTarea('valor');

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        agregarMensajeAgente(
          `📌 Para "${tareaActual.nombre}":\n\n¿Qué VALOR O IMPACTO genera si este escenario se retrasa o sale mal?`,
          [
            { id: 'v1', label: 'Perdemos una venta o dinero (Alto Impacto)', value: 'Perdemos una venta o dinero' },
            { id: 'v2', label: 'El cliente lo nota directamente (Alto Impacto)', value: 'El cliente lo nota' },
            { id: 'v3', label: 'Una molestia interna (Bajo Impacto)', value: 'Una molestia interna' },
            { id: 'v4', label: 'No pasa nada / Impacto mínimo (Bajo Impacto)', value: 'No pasa nada' }
          ]
        );
      }, 500);
    } else if (fasePreguntaTarea === 'valor') {
      tareaActual.valor = valorChoice as any;
      setFasePreguntaTarea('horas');

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        agregarMensajeAgente(
          `📌 Estimación de carga para "${tareaActual.nombre}":\n\n¿Cuántas HORAS semanales aproximadamente le dedica el equipo a esta tarea en total?`,
          [
            { id: 'h1', label: 'Menos de 2 horas / semana', value: '1.0' },
            { id: 'h2', label: '2 a 4 horas / semana', value: '3.0' },
            { id: 'h3', label: '5 a 8 horas / semana', value: '6.5' },
            { id: 'h4', label: 'Más de 8 horas / semana', value: '10.0' }
          ]
        );
      }, 500);
    } else if (fasePreguntaTarea === 'horas') {
      tareaActual.horas_semana = parseFloat(valorChoice) || 2.0;
      const cuadranteResultante = clasificarCuadranteTarea(tareaActual.frecuencia, tareaActual.valor);
      tareaActual.cuadrante = cuadranteResultante;
      tareasCopy[tareaIndexPreguntas] = tareaActual;
      setTareasSeleccionadas(tareasCopy);

      const cuadranteInfo: Record<string, { emoji: string; title: string; desc: string }> = {
        'Oro': {
          emoji: '🏆',
          title: 'ORO (Alta Frecuencia + Alto Valor)',
          desc: 'Actividad clave de alto impacto continuo. Ideal para potenciar y acelerar con IA.'
        },
        'Cuello de botella': {
          emoji: '⚠️',
          title: 'CUELLO DE BOTELLA (Baja Frecuencia + Alto Valor)',
          desc: 'Genera impacto crítico cuando falla. Requiere estandarización y proceso claro.'
        },
        'Zombi': {
          emoji: '🧟',
          title: 'ZOMBI (Alta Frecuencia + Bajo Valor)',
          desc: 'Tarea repetitiva que consume tiempo sin aportar valor directo. Candidata clave a automatizar.'
        },
        'Grasa': {
          emoji: '🗑️',
          title: 'GRASA (Baja Frecuencia + Bajo Valor)',
          desc: 'Actividad residual de poco valor. Candidata a eliminar, delegar o simplificar.'
        }
      };

      const info = cuadranteInfo[cuadranteResultante] || cuadranteInfo['Zombi'];

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        agregarMensajeAgente(
          `🎯 **Clasificación Escenario ${tareaIndexPreguntas + 1}**: "${tareaActual.nombre}"\n\n${info.emoji} **${info.title}**\n💡 *${info.desc}*\n⏱️ Carga estimada: ${tareaActual.horas_semana} h/semana.`
        );

        if (tareaIndexPreguntas < tareasCopy.length - 1) {
          const siguienteIndex = tareaIndexPreguntas + 1;
          setTareaIndexPreguntas(siguienteIndex);
          setFasePreguntaTarea('frecuencia');
          const siguienteTarea = tareasCopy[siguienteIndex];

          setTimeout(() => {
            agregarMensajeAgente(
              `📌 **Escenario ${siguienteIndex + 1} de 3**: "${siguienteTarea.nombre}"\n\n¿Con qué FRECUENCIA sucede o se realiza en tu empresa?`,
              [
                { id: 'f_diaria', label: 'Diaria / Varias veces al día (Alta Frecuencia)', value: 'Diaria' },
                { id: 'f_varias', label: 'Varias veces por semana (Alta Frecuencia)', value: 'Varias veces por semana' },
                { id: 'f_semanal', label: 'Semanal (Alta Frecuencia)', value: 'Semanal' },
                { id: 'f_mensual', label: 'Mensual (Baja Frecuencia)', value: 'Mensual' },
                { id: 'f_ocasional', label: 'Ocasional (Baja Frecuencia)', value: 'Ocasional' }
              ]
            );
          }, 600);
        } else {
          // FIN DE ETAPA 2 -> GUARDAR MATRIZ Y HORAS INCREMENTALMENTE Y PAUSA MENTOR
          const resumenLineas = tareasCopy
            .map((t, idx) => {
              const quad = t.cuadrante || 'Zombi';
              const em = cuadranteInfo[quad]?.emoji || '📌';
              return `${idx + 1}. "${t.nombre}": ${em} **${quad.toUpperCase()}** (${t.horas_semana}h/sem)`;
            })
            .join('\n');

          const intensidadesDefault: IntensidadAgujero[] = [
            { agujero: 'Tiempo', intensidad: 4 },
            { agujero: 'Procesos', intensidad: 4 },
            { agujero: 'Datos', intensidad: 3 },
            { agujero: 'Cliente', intensidad: 2 }
          ];

          const { fugas, agujeroPrincipal } = calcularFugasBalde(eleccionesCasos, intensidadesDefault);
          const horasRec = tareasCopy.reduce((acc, t) => acc + (t.horas_semana || 0), 0);

          const empId = empresaIdState || generateUUID();
          const partId = participanteIdState || generateUUID();

          const empObj: Empresa = {
            id: empId,
            nombre: empresaNombre,
            sector,
            num_empleados: numEmpleados,
            ecosistema,
            herramientas_desuso: herramientasDesuso
          };

          const resEtapa2: ResultadoDiagnostico = {
            participante_id: partId,
            empresa_id: empId,
            fuga_tiempo: fugas.Tiempo,
            fuga_procesos: fugas.Procesos,
            fuga_datos: fugas.Datos,
            fuga_cliente: fugas.Cliente,
            agujero_principal: agujeroPrincipal,
            salud_n1: 0,
            salud_n2: 0,
            salud_n3: 0,
            nivel_debil: 'N1',
            semaforo: 'amarillo',
            horas_recuperables: Math.round(horasRec * 10) / 10,
            hoja_ruta: DEFAULT_HOJA_RUTA,
            alertas: [],
            fugas: fugas,
            version_reglas: '1.0.0',
            etapa_completada: 2
          };

          mockStore.empresas.set(empId, empObj);
          mockStore.resultados.set(partId, resEtapa2);
          mockStore.tareasParticipante.set(partId, tareasCopy);
          mockStore.saveToLocalStorage();
          mockStore.syncToSupabase(empObj, resEtapa2);

          try {
            fetch('/api/store', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'save_resultado',
                empresa: empObj,
                resultado: resEtapa2,
                tareas: tareasCopy
              })
            }).catch((err) => console.warn('API save_resultado Etapa 2 error:', err));
          } catch (e) {
            console.warn('API save_resultado Etapa 2 exception:', e);
          }

          setTimeout(() => {
            agregarMensajeAgente(
              `📊 **Matriz de Actividades de Tu Empresa (Etapa 2)**:\n\n${resumenLineas}\n\n🛑 **¡Etapa 2 Completada!**\nAtiende las explicaciones de tu mentor en la pantalla principal antes de iniciar la Etapa 3.`
            );

            setEsperandoAutorizacionMentor(true);
            setEtapaEnPausaTexto('Etapa 2 Finalizada (Matriz Frecuencia / Valor)');
            setSiguienteEtapaNombre('Iniciar Etapa 3 (Flight Levels)');
          }, 800);
        }
      }, 500);
    }
  };

  // CONTINUACIÓN A ETAPA 3 (FLIGHT LEVELS)
  const handleContinuarEtapa3 = () => {
    setEsperandoAutorizacionMentor(false);
    setEtapaActual(3);
    agregarMensajeParticipante('▶️ Iniciando Etapa 3 (Flight Levels)');

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      agregarMensajeAgente(
        'Etapa 3: Evaluación Flight Levels (Salud Organizativa N1, N2, N3).\n\nResponderemos 9 preguntas rápidas de opción múltiple.'
      );
      const preg1 = PREGUNTAS_FLIGHT_LEVELS[0];
      agregarMensajeAgente(
        `Pregunta 1/9 (${preg1.nivel} - ${preg1.actividad}):\n${preg1.pregunta}`,
        preg1.opciones.map((o) => ({ id: o.id, label: o.label, value: o.value }))
      );
    }, 700);
  };

  const handleRespuestaFlightLevel = (puntosValue: number, label: string) => {
    agregarMensajeParticipante(label);
    const pregActual = PREGUNTAS_FLIGHT_LEVELS[preguntaIndexFL];

    const nuevaRespuesta: RespuestaNivel = {
      pregunta_id: pregActual.id,
      opcion_elegida: puntosValue,
      puntos: puntosValue
    };
    const nuevasRespuestas = [...respuestasFL, nuevaRespuesta];
    setRespuestasFL(nuevasRespuestas);

    if (preguntaIndexFL < PREGUNTAS_FLIGHT_LEVELS.length - 1) {
      const sigIndex = preguntaIndexFL + 1;
      setPreguntaIndexFL(sigIndex);
      const sigPreg = PREGUNTAS_FLIGHT_LEVELS[sigIndex];

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        agregarMensajeAgente(
          `Pregunta ${sigIndex + 1}/9 (${sigPreg.nivel} - ${sigPreg.actividad}):\n${sigPreg.pregunta}`,
          sigPreg.opciones.map((o) => ({ id: o.id, label: o.label, value: o.value }))
        );
      }, 500);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setDiagnosticoFinalizado(true);

        // Calculate 100% deterministic results
        const intensidadesDefault: IntensidadAgujero[] = [
          { agujero: 'Tiempo', intensidad: 4 },
          { agujero: 'Procesos', intensidad: 4 },
          { agujero: 'Datos', intensidad: 3 },
          { agujero: 'Cliente', intensidad: 2 }
        ];

        const resultadoFinal = generarDiagnosticoCompleto(
          { nombre: empresaNombre, sector, num_empleados: numEmpleados, ecosistema, herramientas_desuso: herramientasDesuso },
          eleccionesCasos,
          intensidadesDefault,
          tareasSeleccionadas,
          nuevasRespuestas
        );

        const partId = participanteIdState || generateUUID();
        const empId = empresaIdState || generateUUID();
        if (!participanteIdState) setParticipanteIdState(partId);
        if (!empresaIdState) setEmpresaIdState(empId);

        const empObj: Empresa = {
          id: empId,
          nombre: empresaNombre,
          sector,
          num_empleados: numEmpleados,
          ecosistema,
          herramientas_desuso: herramientasDesuso
        };

        mockStore.empresas.set(empId, empObj);

        resultadoFinal.participante_id = partId;
        resultadoFinal.empresa_id = empId;
        resultadoFinal.etapa_completada = 3;
        mockStore.resultados.set(partId, resultadoFinal);
        mockStore.saveToLocalStorage();
        mockStore.syncToSupabase(empObj, resultadoFinal);

        // Send payload to backend API for live cross-device sync across the internet
        try {
          fetch('/api/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save_resultado',
              empresa: empObj,
              resultado: resultadoFinal,
              tareas: tareasSeleccionadas
            })
          }).catch(err => console.warn('API store POST error:', err));
        } catch (e) {
          console.warn('API store exception:', e);
        }

        agregarMensajeAgente(
          `🎉 **¡Diagnóstico Finalizado con Éxito para ${empresaNombre}!**\n\nHemos completado la medición de salud organizativa. Tu facilitador proyectará el resumen del grupo y te entregará el informe detallado en PDF.`
        );
      }, 800);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <BrandingBanner />

      <div className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col">
        {!pasoIniciado ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 my-auto space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#2A1545] text-white flex items-center justify-center font-bold text-xl shadow-md">
                <Sparkles className="w-6 h-6 text-[#ED7D31]" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-[#2A1545]">
                  Transformando nuestro modelo de negocio
                </h1>
                <p className="text-xs text-slate-500 font-medium">Programa Córdoba IA 2026</p>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              Bienvenido al diagnóstico dinámico guiado por tu mentor. Evaluaremos tus situaciones cotidianas de negocio, actividades operativas y salud organizativa por etapas.
            </p>

            <div className="bg-[#CCBBEE]/20 border border-[#CCBBEE]/40 rounded-xl p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentimientoAceptado}
                  onChange={(e) => setConsentimientoAceptado(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#ED7D31] rounded border-slate-300 focus:ring-[#ED7D31]"
                />
                <span className="text-xs text-slate-700 font-medium leading-normal">
                  Acepto el tratamiento de datos para el diagnóstico de transformación digital según la política RGPD del taller.
                </span>
              </label>
            </div>

            <button
              onClick={handleEmpezar}
              disabled={!consentimientoAceptado}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                consentimientoAceptado
                  ? 'bg-gradient-to-r from-[#2A1545] to-[#43236b] hover:from-[#371b5c] hover:to-[#2A1545] cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Empezar Diagnóstico</span>
              <ArrowRight className="w-5 h-5 text-[#ED7D31]" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header Progress Bar */}
            <div className="bg-[#2A1545] px-6 py-3 border-b border-white/10 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#ED7D31] animate-pulse"></span>
                <span>Etapa {etapaActual} de 3</span>
              </div>
              <div className="w-36 bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#ED7D31] to-[#CCBBEE] h-full transition-all duration-500"
                  style={{ width: `${(etapaActual / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
              {mensajes.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.rol === 'participante' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] md:max-w-[80%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                      m.rol === 'participante'
                        ? 'bg-[#2A1545] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line font-normal">{m.texto}</p>

                    {m.opciones_chips && !esperandoAutorizacionMentor && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                        {m.opciones_chips.map((chip) => (
                          <button
                            key={chip.id}
                            onClick={() => {
                              if (etapaActual === 1) {
                                handleSeleccionarCaso(String(chip.value), chip.label);
                              } else if (etapaActual === 2) {
                                handleRespuestaTareaPaso3(String(chip.value));
                              } else if (etapaActual === 3) {
                                handleRespuestaFlightLevel(Number(chip.value), chip.label);
                              }
                            }}
                            className="w-full text-left px-4 py-3 min-h-[44px] rounded-xl bg-slate-50 hover:bg-[#CCBBEE]/30 active:bg-[#CCBBEE]/50 border border-slate-200 hover:border-[#2A1545] text-slate-700 hover:text-[#2A1545] font-medium transition-all text-xs flex items-center justify-between group cursor-pointer"
                          >
                            <span>{chip.label}</span>
                            <ArrowRight className="w-4 h-4 text-[#ED7D31] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* PAUSE CARD WITH PARTICIPANT CONTINUATION BUTTON */}
              {esperandoAutorizacionMentor && (
                <div className="bg-[#2A1545] text-white border-2 border-[#ED7D31] rounded-2xl p-5 shadow-2xl space-y-4 my-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#CCBBEE]">
                    <PauseCircle className="w-6 h-6 text-[#ED7D31] animate-bounce" />
                    <span>⏸️ {etapaEnPausaTexto}</span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    Atiende las explicaciones de tu mentor en la pantalla principal. Cuando el mentor indique en voz alta *"¡Podéis continuar!"*, pulsa el botón inferior.
                  </p>

                  <button
                    onClick={etapaActual === 1 ? handleContinuarEtapa2 : handleContinuarEtapa3}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#ED7D31] to-[#CC6808] hover:from-[#CC6808] hover:to-[#ED7D31] text-white font-extrabold text-xs shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wider"
                  >
                    <PlayCircle className="w-5 h-5 text-white" />
                    <span>{siguienteEtapaNombre}</span>
                  </button>
                </div>
              )}

              {/* Paso 1 Form */}
              {etapaActual === 1 && !confirmacionPaso1 && mensajes.length > 0 && (
                <div className="bg-white rounded-xl p-4 md:p-6 border border-[#CCBBEE] shadow-md space-y-4 my-2">
                  <div className="flex items-center gap-2 font-bold text-[#2A1545] text-sm">
                    <Building2 className="w-4 h-4 text-[#ED7D31]" />
                    <span>Ficha de Empresa y Participante</span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Nombre completo del participante *</label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Ana Pérez"
                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2A1545] outline-none text-xs md:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Nombre de la Empresa *</label>
                      <input
                        type="text"
                        value={empresaNombre}
                        onChange={(e) => setEmpresaNombre(e.target.value)}
                        placeholder="Ej: Panadería El Trigo S.L."
                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2A1545] outline-none text-xs md:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">
                        ¿Cómo está organizado tu negocio o proyecto hoy? *
                      </label>
                      <select
                        value={organizacion}
                        onChange={(e) => setOrganizacion(e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2A1545] outline-none bg-white font-medium text-xs leading-snug"
                      >
                        <option value='Autónomo / Freelance: "Yo lo hago todo: venta, ejecución y papeleo."'>
                          Autónomo / Freelance: "Yo lo hago todo: venta, ejecución y papeleo."
                        </option>
                        <option value='Pequeño equipo (2 a 15 personas): "Hay equipo, pero la toma de decisiones y el control pasan por mí."'>
                          Pequeño equipo (2 a 15 personas): "Hay equipo, pero la toma de decisiones y el control pasan por mí."
                        </option>
                        <option value='Empresa pyme (+15 personas): "Hay departamentos o áreas diferenciadas."'>
                          Empresa pyme (+15 personas): "Hay departamentos o áreas diferenciadas."
                        </option>
                        <option value='Idea / Proyecto en fase de despegue: "Aún no opero al 100%, pero quiero nacer bien estructurado."'>
                          Idea / Proyecto en fase de despegue: "Aún no opero al 100%, pero quiero nacer bien estructurado."
                        </option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmarPaso1}
                    disabled={!nombre || !empresaNombre}
                    className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                      nombre && empresaNombre
                        ? 'bg-[#2A1545] hover:bg-[#371b5c] cursor-pointer'
                        : 'bg-slate-300 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-[#ED7D31]" />
                    <span>Confirmar Datos e Iniciar Etapa 1</span>
                  </button>
                </div>
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none flex items-center gap-2 text-slate-400 text-xs">
                    <Sparkles className="w-4 h-4 text-[#ED7D31] animate-spin" />
                    <span>El asistente está procesando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {diagnosticoFinalizado
                  ? 'Diagnóstico completado. El análisis es exclusivo para el facilitador.'
                  : 'Los datos son confidenciales y se procesan según las reglas del taller.'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
