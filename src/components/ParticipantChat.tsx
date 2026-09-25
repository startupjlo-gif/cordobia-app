'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AgujeroType,
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
  CASOS_RESUMEN_TEXT,
  PREGUNTAS_FLIGHT_LEVELS,
  getInitialStateForStep
} from '@/lib/agent-state-machine';
import { generarDiagnosticoCompleto } from '@/lib/rules-engine';
import { LocalMockStore } from '@/lib/supabase/mock-store';
import { BrandingBanner } from './BrandingBanner';
import { CheckCircle, ArrowRight, Lock, Sparkles, Building2, Radio } from 'lucide-react';

interface ParticipantChatProps {
  sessionCode?: string;
}

export const ParticipantChat: React.FC<ParticipantChatProps> = ({ sessionCode = 'CORDOBIA2026' }) => {
  // Participant State
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [consentimientoAceptado, setConsentimientoAceptado] = useState<boolean>(false);
  const [pasoIniciado, setPasoIniciado] = useState<boolean>(false);

  // Mentor Pause States
  const [esperandoAutorizacionMentor, setEsperandoAutorizacionMentor] = useState<boolean>(false);
  const [etapaEnPausaTexto, setEtapaEnPausaTexto] = useState<string>('');
  const [etapaAutorizadaMentor, setEtapaAutorizadaMentor] = useState<number>(1);

  // Paso 1 Form state
  const [nombre, setNombre] = useState<string>('');
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [sector, setSector] = useState<SectorType>('Comercio y Servicios');
  const [numEmpleados, setNumEmpleados] = useState<NumEmpleadosType>('1–5');
  const [cargo, setCargo] = useState<string>('Gerente');
  const [ecosistema, setEcosistema] = useState<EcosistemaType>('Independiente');
  const [herramientasDesuso, setHerramientasDesuso] = useState<string>('');
  const [confirmacionPaso1, setConfirmacionPaso1] = useState<boolean>(false);

  // Paso 2 State (Fugas)
  const [rondaActual, setRondaActual] = useState<number>(1);
  const [eleccionesCasos, setEleccionesCasos] = useState<EleccionCaso[]>([]);
  const [primeraEleccionRonda, setPrimeraEleccionRonda] = useState<string | null>(null);
  const [intensidades, setIntensidades] = useState<IntensidadAgujero[]>([]);
  const [agujeroIntensidadIndex, setAgujeroIntensidadIndex] = useState<number>(0);

  // Paso 3 State (Matriz Tareas)
  const [tareasSeleccionadas, setTareasSeleccionadas] = useState<TareaParticipante[]>([]);
  const [tareaIndexPreguntas, setTareaIndexPreguntas] = useState<number>(0);
  const [fasePreguntaTarea, setFasePreguntaTarea] = useState<'frecuencia' | 'valor' | 'horas'>('frecuencia');

  // Paso 4 State (Flight Levels)
  const [preguntaIndexFL, setPreguntaIndexFL] = useState<number>(0);
  const [respuestasFL, setRespuestasFL] = useState<RespuestaNivel[]>([]);
  const [diagnosticoFinalizado, setDiagnosticoFinalizado] = useState<boolean>(false);

  // Chat History Messages
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mockStore = LocalMockStore.getInstance();

  // REALTIME LISTEN TO FACILITATOR STAGE AUTHORIZATION BROADCAST
  useEffect(() => {
    const unsubscribe = mockStore.onEtapaCambiada((nuevaEtapa) => {
      setEtapaAutorizadaMentor(nuevaEtapa);

      if (nuevaEtapa === 2 && esperandoAutorizacionMentor && pasoActual === 2) {
        setEsperandoAutorizacionMentor(false);
        agregarMensajeAgente('📡 **¡El mentor ha autorizado avanzar a la Etapa 2!** Continuando con la Matriz Frecuencia y Valor...');
        iniciarEtapa2Matriz();
      } else if (nuevaEtapa === 3 && esperandoAutorizacionMentor && pasoActual === 3) {
        setEsperandoAutorizacionMentor(false);
        agregarMensajeAgente('📡 **¡El mentor ha autorizado avanzar a la Etapa 3!** Continuando a Flight Levels...');
        iniciarEtapa3FlightLevels();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [esperandoAutorizacionMentor, pasoActual]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, isTyping]);

  const agregarMensajeAgente = (texto: string, opciones?: ChipOption[]) => {
    const nuevoMensaje: Mensaje = {
      id: `m-${Date.now()}-${Math.random()}`,
      participante_id: 'part-current',
      rol: 'agente',
      texto,
      paso: pasoActual,
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
      paso: pasoActual
    };
    setMensajes((prev) => [...prev, nuevoMensaje]);
  };

  const handleEmpezar = () => {
    if (!consentimientoAceptado) return;
    setPasoIniciado(true);
    setPasoActual(1);
    const init = getInitialStateForStep(1);
    agregarMensajeAgente(init.agenteMensaje);
  };

  const handleConfirmarPaso1 = () => {
    setConfirmacionPaso1(true);
    agregarMensajeParticipante('✅ Ficha de empresa confirmada.');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setPasoActual(2);
      agregarMensajeAgente(
        `¡Perfecto, ${nombre}! Ficha guardada para ${empresaNombre}.\n\nEtapa 1: Analizaremos dónde se produce la mayor fuga de tiempo o recursos. Te presentaré 4 situaciones cotidianas.`
      );

      const casosR1 = CASOS_BASE_BALDE.filter((c) => c.ronda === 1);
      agregarMensajeAgente(
        'Ronda 1 de 3: Elige la situación con la que MÁS te identificas:',
        casosR1.map((c) => ({ id: c.case_id, label: c.texto_base, value: c.case_id }))
      );
    }, 600);
  };

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
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const agujeros: AgujeroType[] = ['Tiempo', 'Procesos', 'Datos', 'Cliente'];
          const resumen0 = CASOS_RESUMEN_TEXT[agujeros[0]];
          agregarMensajeAgente(
            `¡Muy bien! Tras revisar estas situaciones, ¿con qué FRECUENCIA se presenta este tipo de escenario en tu empresa?\n\n👉 *"${resumen0}"*`,
            [
              { id: 'i1', label: '1 - Nunca', value: 1 },
              { id: 'i2', label: '2 - Rara vez', value: 2 },
              { id: 'i3', label: '3 - A veces', value: 3 },
              { id: 'i4', label: '4 - A menudo', value: 4 },
              { id: 'i5', label: '5 - Constantemente', value: 5 }
            ]
          );
        }, 600);
      }
    }
  };

  const handleSeleccionarIntensidad = (valor: number, label: string) => {
    agregarMensajeParticipante(`Frecuencia: ${label}`);
    const agujeros: AgujeroType[] = ['Tiempo', 'Procesos', 'Datos', 'Cliente'];
    const agujeroActual = agujeros[agujeroIntensidadIndex];

    const nuevasIntensidades = [...intensidades, { agujero: agujeroActual, intensidad: valor }];
    setIntensidades(nuevasIntensidades);

    if (agujeroIntensidadIndex < 3) {
      const siguienteIndex = agujeroIntensidadIndex + 1;
      setAgujeroIntensidadIndex(siguienteIndex);
      const siguienteAgujero = agujeros[siguienteIndex];
      const resumenSig = CASOS_RESUMEN_TEXT[siguienteAgujero];

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        agregarMensajeAgente(
          `¿Y con qué frecuencia ocurre este otro escenario en tu empresa?\n\n👉 *"${resumenSig}"*`,
          [
            { id: 'i1', label: '1 - Nunca', value: 1 },
            { id: 'i2', label: '2 - Rara vez', value: 2 },
            { id: 'i3', label: '3 - A veces', value: 3 },
            { id: 'i4', label: '4 - A menudo', value: 4 },
            { id: 'i5', label: '5 - Constantemente', value: 5 }
          ]
        );
      }, 500);
    } else {
      // END OF ETAPA 1 -> PAUSE & WAIT ONLY FOR MENTOR BROADCAST (NO BYPASS BUTTON FOR PARTICIPANT!)
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        agregarMensajeAgente(
          `🛑 **Excelente, hasta aquí hemos analizado el principal punto de fuga de tu empresa.**\n\nTu dispositivo ha quedado en PAUSA. Esperando a que tu mentor autorice el paso a la Etapa 2 desde el panel principal...`
        );

        setEsperandoAutorizacionMentor(true);
        setEtapaEnPausaTexto('Pausa Etapa 1 - Esperando Autorización del Mentor para Etapa 2');

        // Check if mentor already authorized
        if (mockStore.sesion.etapa_autorizada >= 2) {
          setTimeout(() => {
            setEsperandoAutorizacionMentor(false);
            iniciarEtapa2Matriz();
          }, 1000);
        }
      }, 700);
    }
  };

  const iniciarEtapa2Matriz = () => {
    setPasoActual(3);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      agregarMensajeAgente(
        'Etapa 2: Matriz Frecuencia y Valor. Evaluaremos tus tareas operativas habituales para clasificarlas en los cuadrantes (Oro, Zombi, Cuello de botella, Grasa).'
      );

      const tareasIniciales: TareaParticipante[] = [
        {
          tarea_id: 'T01',
          nombre: 'Responder consultas frecuentes de clientes (WhatsApp/email)',
          area: 'Atención al cliente',
          nivel: 'N1',
          frecuencia: 'Diaria',
          valor: 'El cliente lo nota',
          horas_semana: 7.5
        },
        {
          tarea_id: 'T03',
          nombre: 'Registrar y conciliar facturas',
          area: 'Facturación',
          nivel: 'N1',
          frecuencia: 'Varias veces por semana',
          valor: 'Una molestia interna',
          horas_semana: 4.0
        },
        {
          tarea_id: 'T06',
          nombre: 'Seguimiento de clientes y presupuestos enviados',
          area: 'Ventas',
          nivel: 'N2',
          frecuencia: 'Diaria',
          valor: 'Perdemos una venta o dinero',
          horas_semana: 5.0
        }
      ];
      setTareasSeleccionadas(tareasIniciales);

      agregarMensajeAgente(
        `Evaluando tarea: **"${tareasIniciales[0].nombre}"**.\n\n¿Con qué FRECUENCIA se realiza?`,
        [
          { id: 'f_diaria', label: 'Diaria', value: 'Diaria' },
          { id: 'f_varias', label: 'Varias veces por semana', value: 'Varias veces por semana' },
          { id: 'f_semanal', label: 'Semanal', value: 'Semanal' },
          { id: 'f_mensual', label: 'Mensual', value: 'Mensual' },
          { id: 'f_ocasional', label: 'Ocasional', value: 'Ocasional' }
        ]
      );
    }, 700);
  };

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
          `Si la tarea **"${tareaActual.nombre}"** se retrasa o sale mal un día, ¿qué impacto genera?`,
          [
            { id: 'v1', label: 'No pasa nada', value: 'No pasa nada' },
            { id: 'v2', label: 'Una molestia interna', value: 'Una molestia interna' },
            { id: 'v3', label: 'El cliente lo nota', value: 'El cliente lo nota' },
            { id: 'v4', label: 'Perdemos una venta o dinero', value: 'Perdemos una venta o dinero' }
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
          `¿Cuántas HORAS semanales aproximadamente insume esa tarea en tu empresa?`,
          [
            { id: 'h1', label: 'Menos de 1h', value: '0.5' },
            { id: 'h2', label: '1 – 3h', value: '2.0' },
            { id: 'h3', label: '3 – 5h', value: '4.0' },
            { id: 'h4', label: '5 – 10h', value: '7.5' },
            { id: 'h5', label: 'Más de 10h', value: '12.0' }
          ]
        );
      }, 500);
    } else if (fasePreguntaTarea === 'horas') {
      tareaActual.horas_semana = parseFloat(valorChoice) || 2.0;

      if (tareaIndexPreguntas < tareasSeleccionadas.length - 1) {
        const siguienteIndex = tareaIndexPreguntas + 1;
        setTareaIndexPreguntas(siguienteIndex);
        setFasePreguntaTarea('frecuencia');
        const siguienteTarea = tareasSeleccionadas[siguienteIndex];

        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          agregarMensajeAgente(
            `Evaluando tarea: **"${siguienteTarea.nombre}"**.\n\n¿Con qué FRECUENCIA se realiza?`,
            [
              { id: 'f_diaria', label: 'Diaria', value: 'Diaria' },
              { id: 'f_varias', label: 'Varias veces por semana', value: 'Varias veces por semana' },
              { id: 'f_semanal', label: 'Semanal', value: 'Semanal' },
              { id: 'f_mensual', label: 'Mensual', value: 'Mensual' },
              { id: 'f_ocasional', label: 'Ocasional', value: 'Ocasional' }
            ]
          );
        }, 500);
      } else {
        // END OF ETAPA 2 -> PAUSE & WAIT ONLY FOR MENTOR BROADCAST!
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          agregarMensajeAgente(
            `🛑 **Excelente, hemos analizado y clasificado tus actividades operativas en la matriz.**\n\nTu dispositivo está en PAUSA. Esperando a que el mentor autorice el paso a Flight Levels desde el panel principal...`
          );

          setEsperandoAutorizacionMentor(true);
          setEtapaEnPausaTexto('Pausa Etapa 2 - Esperando Autorización del Mentor para Etapa 3');

          if (mockStore.sesion.etapa_autorizada >= 3) {
            setTimeout(() => {
              setEsperandoAutorizacionMentor(false);
              iniciarEtapa3FlightLevels();
            }, 1000);
          }
        }, 700);
      }
    }
  };

  const iniciarEtapa3FlightLevels = () => {
    setPasoActual(4);
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

        const resultadoFinal = generarDiagnosticoCompleto(
          { nombre: empresaNombre, sector, num_empleados: numEmpleados, ecosistema, herramientas_desuso: herramientasDesuso },
          eleccionesCasos,
          intensidades,
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
              Bienvenido al diagnóstico dinámico controlado por tu mentor. Evaluaremos tus situaciones cotidianas, actividades operativas y salud organizativa por etapas sincronizadas.
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
            {/* Header progress bar */}
            <div className="bg-[#2A1545] px-6 py-3 border-b border-white/10 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#ED7D31] animate-pulse"></span>
                <span>Etapa {pasoActual} de 4</span>
              </div>
              <div className="w-36 bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#ED7D31] to-[#CCBBEE] h-full transition-all duration-500"
                  style={{ width: `${(pasoActual / 4) * 100}%` }}
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
                              if (pasoActual === 2) {
                                if (m.texto.includes('FRECUENCIA se presenta') || m.texto.includes('frecuencia ocurre')) {
                                  handleSeleccionarIntensidad(Number(chip.value), chip.label);
                                } else {
                                  handleSeleccionarCaso(String(chip.value), chip.label);
                                }
                              } else if (pasoActual === 3) {
                                handleRespuestaTareaPaso3(String(chip.value));
                              } else if (pasoActual === 4) {
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

              {/* STRICT MENTOR REALTIME PAUSE CARD - NO PARTICIPANT BYPASS BUTTON! */}
              {esperandoAutorizacionMentor && (
                <div className="bg-amber-900/90 text-white border-2 border-amber-400 rounded-2xl p-5 shadow-2xl space-y-3 animate-pulse">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-200">
                    <Radio className="w-5 h-5 text-[#ED7D31] animate-spin" />
                    <span>{etapaEnPausaTexto}</span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                    🔒 **Dispositivo en Pausa Controlada.** En este momento tu mentor está explicando las tendencias en la pantalla principal. Cuando el mentor pulse *"Autorizar"* en su panel, tu pantalla avanzará automáticamente.
                  </p>
                </div>
              )}

              {/* Paso 1 Form */}
              {pasoActual === 1 && !confirmacionPaso1 && mensajes.length > 0 && (
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
