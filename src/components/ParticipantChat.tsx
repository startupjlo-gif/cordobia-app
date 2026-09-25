'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChipOption,
  EcosistemaType,
  EleccionCaso,
  IntensidadAgujero,
  Mensaje,
  NumEmpleadosType,
  RespuestaNivel,
  SectorType,
  TareaParticipante
} from '@/types';
import {
  CASOS_BASE_BALDE,
  PREGUNTAS_FLIGHT_LEVELS,
  getInitialStateForStep
} from '@/lib/agent-state-machine';
import { generarDiagnosticoCompleto, clasificarCuadranteTarea } from '@/lib/rules-engine';
import { LocalMockStore } from '@/lib/supabase/mock-store';
import { BrandingBanner } from './BrandingBanner';
import { CheckCircle, ArrowRight, Lock, Sparkles, Building2, PauseCircle, PlayCircle } from 'lucide-react';

interface ParticipantChatProps {
  sessionCode?: string;
}

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
  const [nombre, setNombre] = useState<string>('');
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [sector, setSector] = useState<SectorType>('Comercio y Servicios');
  const [numEmpleados, setNumEmpleados] = useState<NumEmpleadosType>('1–5');
  const [cargo, setCargo] = useState<string>('Gerente');
  const [ecosistema, setEcosistema] = useState<EcosistemaType>('Independiente');
  const [herramientasDesuso, setHerramientasDesuso] = useState<string>('');
  const [confirmacionPaso1, setConfirmacionPaso1] = useState<boolean>(false);

  // Etapa 1 State (Selección de Casos de Fuga)
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
    agregarMensajeParticipante('✅ Ficha de empresa confirmada.');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      agregarMensajeAgente(
        `¡Perfecto, ${nombre}! Ficha guardada para ${empresaNombre}.\n\nEtapa 1 (Puntos de Fuga): Te presentaré 4 situaciones cotidianas para evaluar dónde está la mayor fuga de tu empresa.`
      );

      const casosR1 = CASOS_BASE_BALDE.filter((c) => c.ronda === 1);
      agregarMensajeAgente(
        'Ronda 1 de 3: Elige la situación con la que MÁS te identificas:',
        casosR1.map((c) => ({ id: c.case_id, label: c.texto_base, value: c.case_id }))
      );
    }, 600);
  };

  // ETAPA 1: SELECCIÓN DE CASOS (3 RONDAS)
  const handleSeleccionarCaso = (caseId: string, label: string) => {
    agregarMensajeParticipante(`Elegido: "${label}"`);

    if (!primeraEleccionRonda) {
      setPrimeraEleccionRonda(caseId);
      const opcionesRestantes = CASOS_BASE_BALDE.filter(
        (c) => c.ronda === rondaActual && c.case_id !== caseId
      ).map((c) => ({ id: c.case_id, label: c.texto_base, value: c.case_id }));

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        agregarMensajeAgente(
          `Entendido. Y en SEGUNDO lugar, ¿con cuál de estas 3 opciones te identificas también?`,
          opcionesRestantes
        );
      }, 500);
    } else {
      const nuevaEleccion: EleccionCaso = {
        ronda: rondaActual,
        case_id_primera: primeraEleccionRonda,
        case_id_segunda: caseId
      };
      setEleccionesCasos([...eleccionesCasos, nuevaEleccion]);
      setPrimeraEleccionRonda(null);

      if (rondaActual < 3) {
        const siguienteRonda = rondaActual + 1;
        setRondaActual(siguienteRonda);
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const casosSiguiente = CASOS_BASE_BALDE.filter((c) => c.ronda === siguienteRonda);
          agregarMensajeAgente(
            `Ronda ${siguienteRonda} de 3: Elige la situación con la que MÁS te identificas:`,
            casosSiguiente.map((c) => ({ id: c.case_id, label: c.texto_base, value: c.case_id }))
          );
        }, 500);
      } else {
        // FIN DE ETAPA 1 (CASOS DE FUGA COMPLETA) -> PAUSA HASTA INDICACIÓN DEL MENTOR!
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          agregarMensajeAgente(
            `🛑 **¡Etapa 1 Completada!**\n\nHemos identificado los puntos principales de fuga de tu empresa. Por favor, atiende las explicaciones del mentor en la pantalla principal antes de iniciar la Etapa 2.`
          );

          setEsperandoAutorizacionMentor(true);
          setEtapaEnPausaTexto('Etapa 1 Finalizada (Puntos de Fuga)');
          setSiguienteEtapaNombre('Iniciar Etapa 2 (Matriz Frecuencia / Valor)');
        }, 700);
      }
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
          // FIN DE ETAPA 2 -> RESUMEN DE MATRIZ Y PAUSA MENTOR
          const resumenLineas = tareasCopy
            .map((t, idx) => {
              const quad = t.cuadrante || 'Zombi';
              const em = cuadranteInfo[quad]?.emoji || '📌';
              return `${idx + 1}. "${t.nombre}": ${em} **${quad.toUpperCase()}** (${t.horas_semana}h/sem)`;
            })
            .join('\n');

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

        const partId = `part-${Date.now()}`;
        const empId = `emp-${Date.now()}`;

        mockStore.empresas.set(empId, {
          id: empId,
          nombre: empresaNombre,
          sector,
          num_empleados: numEmpleados,
          ecosistema,
          herramientas_desuso: herramientasDesuso
        });

        resultadoFinal.participante_id = partId;
        resultadoFinal.empresa_id = empId;
        mockStore.resultados.set(partId, resultadoFinal);

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Nombre completo *</label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Ana Pérez"
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2A1545] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Nombre de la Empresa *</label>
                      <input
                        type="text"
                        value={empresaNombre}
                        onChange={(e) => setEmpresaNombre(e.target.value)}
                        placeholder="Ej: Panadería El Trigo S.L."
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2A1545] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Sector de Actividad *</label>
                      <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value as SectorType)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2A1545] outline-none bg-white"
                      >
                        <option value="Comercio y Servicios">Comercio y Servicios</option>
                        <option value="Agroalimentario e Industria">Agroalimentario e Industria</option>
                        <option value="Servicios Profesionales">Servicios Profesionales</option>
                        <option value="Administración General">Administración General</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Número de Empleados *</label>
                      <select
                        value={numEmpleados}
                        onChange={(e) => setNumEmpleados(e.target.value as NumEmpleadosType)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2A1545] outline-none bg-white"
                      >
                        <option value="1–5">1–5 empleados</option>
                        <option value="6–20">6–20 empleados</option>
                        <option value="21–50">21–50 empleados</option>
                        <option value="Más de 50">Más de 50 empleados</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Ecosistema Principal</label>
                      <select
                        value={ecosistema}
                        onChange={(e) => setEcosistema(e.target.value as EcosistemaType)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2A1545] outline-none bg-white"
                      >
                        <option value="Google">Google Workspace / Drive</option>
                        <option value="Microsoft">Microsoft 365 / Excel / Copilot</option>
                        <option value="Independiente">Herramientas Independientes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Herramientas en Desuso</label>
                      <input
                        type="text"
                        value={herramientasDesuso}
                        onChange={(e) => setHerramientasDesuso(e.target.value)}
                        placeholder="Ej: CRM o ERP pagado sin usar"
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2A1545] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmarPaso1}
                    disabled={!nombre || !empresaNombre}
                    className={`w-full py-3 rounded-xl font-bold text-white shadow flex items-center justify-center gap-2 ${
                      nombre && empresaNombre
                        ? 'bg-[#2A1545] hover:bg-[#371b5c] cursor-pointer'
                        : 'bg-slate-300 cursor-not-allowed'
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
