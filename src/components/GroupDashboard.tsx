'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LocalMockStore } from '@/lib/supabase/mock-store';
import { BrandingBanner } from './BrandingBanner';
import {
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Users,
  AlertTriangle,
  Layers,
  Clock,
  PieChart,
  ShieldAlert,
  Building,
  ExternalLink,
  Zap,
  Play,
  CheckCircle,
  Radio,
  Filter,
  X,
  TrendingUp,
  DollarSign,
  Cpu,
  BarChart3,
  Award,
  AlertCircle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { CuadranteType, AgujeroType, TareaParticipante } from '@/types';

interface GroupDashboardProps {
  sessionId?: string;
}

export const GroupDashboard: React.FC<GroupDashboardProps> = ({ sessionId }) => {
  const [empresaFiltroId, setEmpresaFiltroId] = useState<string>('TODAS');
  const [sectorFiltro, setSectorFiltro] = useState<string>('Todos');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [etapaAutorizada, setEtapaAutorizada] = useState<number>(1);
  const [cuadranteDetalleModal, setCuadranteDetalleModal] = useState<CuadranteType | null>(null);

  const [revelados, setRevelados] = useState<Record<string, boolean>>({
    b1: true,
    b2: true,
    b3: true,
    b4: true,
    b5: true,
    b6: true,
    b7: true,
    b8: true
  });

  const mockStore = LocalMockStore.getInstance();
  const [dataVersion, setDataVersion] = useState<number>(0);

  useEffect(() => {
    setEtapaAutorizada(mockStore.sesion.etapa_autorizada || 1);

    const refreshData = () => {
      setDataVersion((v) => v + 1);
    };

    const unsubData = mockStore.onDataChanged(refreshData);
    window.addEventListener('storage', refreshData);
    window.addEventListener('cordobia_data_updated', refreshData);

    return () => {
      unsubData();
      window.removeEventListener('storage', refreshData);
      window.removeEventListener('cordobia_data_updated', refreshData);
    };
  }, []);

  const resultadosArray = Array.from(mockStore.resultados.values());
  const empresasArray = Array.from(mockStore.empresas.values());
  const empresasMap = mockStore.empresas;
  const tareasParticipanteMap = mockStore.tareasParticipante;

  const handleAutorizarEtapa = (nuevaEtapa: number) => {
    mockStore.autorizarEtapaFacilitador(nuevaEtapa);
    setEtapaAutorizada(nuevaEtapa);
  };

  // Filtering Logic
  const resultadosFiltrados = resultadosArray.filter((r) => {
    if (empresaFiltroId !== 'TODAS' && r.empresa_id !== empresaFiltroId) return false;
    if (sectorFiltro !== 'Todos') {
      const emp = empresasMap.get(r.empresa_id);
      if (emp?.sector !== sectorFiltro) return false;
    }
    return true;
  });

  const numEmpresas = resultadosFiltrados.length;
  const esAnonimoInsuficiente = numEmpresas < 3 && empresaFiltroId === 'TODAS' && sectorFiltro !== 'Todos';

  // Metrics Calculations
  const avgTiempo = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.fuga_tiempo, 0) / numEmpresas) : 0;
  const avgProcesos = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.fuga_procesos, 0) / numEmpresas) : 0;
  const avgDatos = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.fuga_datos, 0) / numEmpresas) : 0;
  const avgCliente = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.fuga_cliente, 0) / numEmpresas) : 0;

  const totalHoras = resultadosFiltrados.reduce((a, b) => a + b.horas_recuperables, 0);
  const avgHoras = numEmpresas > 0 ? (totalHoras / numEmpresas).toFixed(1) : '0.0';
  const estimadoEconomicoAnual = Math.round(totalHoras * 52 * 25); // 25€/h average wage cost

  const avgN1 = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.salud_n1, 0) / numEmpresas) : 0;
  const avgN2 = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.salud_n2, 0) / numEmpresas) : 0;
  const avgN3 = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.salud_n3, 0) / numEmpresas) : 0;

  const numRojo = resultadosFiltrados.filter((r) => r.semaforo === 'rojo').length;
  const numAmarillo = resultadosFiltrados.filter((r) => r.semaforo === 'amarillo').length;
  const numVerde = resultadosFiltrados.filter((r) => r.semaforo === 'verde').length;

  // Ecosystem breakdown
  const numGoogle = empresasArray.filter(e => e.ecosistema === 'Google').length;
  const numMicrosoft = empresasArray.filter(e => e.ecosistema === 'Microsoft').length;
  const numIndependiente = empresasArray.filter(e => e.ecosistema === 'Independiente').length;

  // Quadrant Tasks Aggregation across participants
  const todasLasTareas: { tarea: TareaParticipante; empresaNombre: string }[] = [];
  resultadosFiltrados.forEach((res) => {
    const emp = empresasMap.get(res.empresa_id);
    const tareasPart = tareasParticipanteMap.get(res.participante_id) || [];
    tareasPart.forEach((t) => {
      todasLasTareas.push({ tarea: t, empresaNombre: emp?.nombre || 'Empresa' });
    });
  });

  const tareasPorCuadrante: Record<CuadranteType, typeof todasLasTareas> = {
    'Oro': todasLasTareas.filter(t => t.tarea.cuadrante === 'Oro'),
    'Cuello de botella': todasLasTareas.filter(t => t.tarea.cuadrante === 'Cuello de botella'),
    'Zombi': todasLasTareas.filter(t => t.tarea.cuadrante === 'Zombi'),
    'Grasa': todasLasTareas.filter(t => t.tarea.cuadrante === 'Grasa'),
  };

  const toggleRevelar = (bloqueKey: string) => {
    setRevelados((prev) => ({ ...prev, [bloqueKey]: !prev[bloqueKey] }));
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const handleReiniciarTaller = () => {
    if (confirm('⚠️ ¿Estás seguro de que deseas BORRAR TODOS LOS DATOS de empresas y participantes para dejar la sesión 100% limpia antes del taller?')) {
      mockStore.resetStore(false);
      window.location.reload();
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-all ${isFullScreen ? 'p-4' : ''}`}>
      {!isFullScreen && <BrandingBanner />}

      <div className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 flex-1 flex flex-col">
        {/* FACILITATOR MASTER CONTROL TOOLBAR */}
        <div className="bg-gradient-to-r from-[#2A1545] via-[#3c1c63] to-[#43236b] border-2 border-[#CCBBEE]/40 rounded-2xl p-4 md:p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white font-bold text-base md:text-lg">
              <div className="w-9 h-9 rounded-xl bg-[#ED7D31] text-white flex items-center justify-center font-black shadow">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2>Panel Maestro de Control del Facilitador</h2>
                <p className="text-xs text-[#CCBBEE] font-normal">Sincronización en tiempo real con los dispositivos móviles del taller</p>
              </div>
            </div>
            <span className="text-xs bg-[#ED7D31] text-white font-bold px-3 py-1 rounded-full shadow">
              Etapa Actual Autorizada: {etapaAutorizada} de 3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => handleAutorizarEtapa(1)}
              className={`p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                etapaAutorizada === 1
                  ? 'bg-[#ED7D31] text-white border-white shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span>Etapa 1: Puntos de Fuga</span>
            </button>

            <button
              onClick={() => handleAutorizarEtapa(2)}
              className={`p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                etapaAutorizada === 2
                  ? 'bg-[#ED7D31] text-white border-white shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
              }`}
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>🔓 Autorizar Etapa 2 (Matriz Frecuencia / Valor)</span>
            </button>

            <button
              onClick={() => handleAutorizarEtapa(3)}
              className={`p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                etapaAutorizada === 3
                  ? 'bg-[#ED7D31] text-white border-white shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
              }`}
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>🔓 Autorizar Etapa 3 (Flight Levels)</span>
            </button>
          </div>
        </div>

        {/* MASTER FILTER & SCREEN CONTROLS BAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A1545] border border-[#CCBBEE]/30 flex items-center justify-center text-[#ED7D31] font-bold">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Dashboard de Resultados Consolidados</h2>
              <p className="text-xs text-slate-400">Córdoba IA · Proyección para Mentoría e Informes Individuales</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* COMPANY MASTER SELECTOR FILTER */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-[#CCBBEE]/40">
              <Building className="w-4 h-4 text-[#ED7D31]" />
              <span className="text-xs text-slate-400 font-semibold">Empresa:</span>
              <select
                value={empresaFiltroId}
                onChange={(e) => setEmpresaFiltroId(e.target.value)}
                className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
              >
                <option value="TODAS" className="bg-slate-900 text-white">🌟 Toda la Cohorte (Consolidado)</option>
                {empresasArray.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                    🏢 {emp.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* SECTOR FILTER */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <Filter className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400 font-semibold">Sector:</span>
              <select
                value={sectorFiltro}
                onChange={(e) => setSectorFiltro(e.target.value)}
                className="bg-transparent text-xs text-white font-semibold outline-none cursor-pointer"
              >
                <option value="Todos" className="bg-slate-900 text-white">Todos los sectores</option>
                <option value="Comercio y Servicios" className="bg-slate-900 text-white">Comercio y Servicios</option>
                <option value="Agroalimentario e Industria" className="bg-slate-900 text-white">Agroalimentario e Industria</option>
                <option value="Servicios Profesionales" className="bg-slate-900 text-white">Servicios Profesionales</option>
                <option value="Administración General" className="bg-slate-900 text-white">Administración General</option>
              </select>
            </div>

            {/* RESET DATA BUTTON */}
            <button
              onClick={handleReiniciarTaller}
              className="p-2.5 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-300 transition-all flex items-center gap-1.5 text-xs font-bold shadow border border-red-800/60 cursor-pointer"
              title="Borrar datos y dejar la sesión limpia para el taller"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Limpiar Datos</span>
            </button>

            {/* FULLSCREEN PROJECTOR TOGGLE */}
            <button
              onClick={toggleFullScreen}
              className="p-2.5 rounded-xl bg-[#2A1545] hover:bg-[#371b5c] text-white transition-all flex items-center gap-2 text-xs font-bold shadow border border-[#CCBBEE]/30 cursor-pointer"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-[#ED7D31]" />}
              <span>{isFullScreen ? 'Salir de Modo Proyector' : 'Modo Proyector'}</span>
            </button>
          </div>
        </div>

        {esAnonimoInsuficiente ? (
          <div className="bg-amber-950/60 border border-amber-500/50 p-6 rounded-2xl text-center space-y-2 my-4">
            <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-amber-200">Protección de Anonimato (&lt;3 Empresas)</h3>
            <p className="text-xs text-amber-300/80 max-w-md mx-auto">
              El filtro por sector seleccionado incluye solo {numEmpresas} empresas. Selecciona &quot;Todos los sectores&quot; o una empresa individual para visualizar los análisis completos.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* TOP KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Empresas Analizadas</span>
                  <span className="text-2xl font-black text-white">{numEmpresas}</span>
                </div>
                <Users className="w-8 h-8 text-[#ED7D31] opacity-80" />
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Horas Recuperables / Sem</span>
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ED7D31] to-[#CCBBEE]">
                    {totalHoras} hrs
                  </span>
                </div>
                <Clock className="w-8 h-8 text-[#CCBBEE] opacity-80" />
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Impacto Económico Est.</span>
                  <span className="text-2xl font-black text-emerald-400">{estimadoEconomicoAnual.toLocaleString()} €/año</span>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-400 opacity-80" />
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Tapón Organizativo</span>
                  <span className="text-xl font-bold text-red-400">Nivel 2 (Coordinación)</span>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400 opacity-80" />
              </div>
            </div>

            {/* MAIN CHART ROW 1: LEAK RADAR/DISTRIBUTION & CONSOLIDATED 2X2 MATRIX */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GRAPH 1: DISTRIBUCIÓN DE FUGAS (RADAR & BAR DISTRIBUTION) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-extrabold text-white text-base">
                    <BarChart3 className="w-5 h-5 text-[#ED7D31]" />
                    <span>1. Distribución Consolidada de Fugas (% Agujeros del Balde)</span>
                  </div>
                  <button onClick={() => toggleRevelar('b2')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    {revelados.b2 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#ED7D31]" />}
                  </button>
                </div>

                {revelados.b2 ? (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-slate-400">
                      Promedio de pérdida operacional por áreas críticas de fuga en la cohorte seleccionada:
                    </p>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-bold text-slate-300 mb-1">
                          <span className="flex items-center gap-2">⏱️ Tiempo (Tareas repetitivas)</span>
                          <span className="text-[#ED7D31] font-black">{avgTiempo}% fuga</span>
                        </div>
                        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                          <div className="bg-gradient-to-r from-[#ED7D31] to-orange-400 h-full rounded-full transition-all duration-700" style={{ width: `${avgTiempo}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-slate-300 mb-1">
                          <span className="flex items-center gap-2">🔄 Procesos (Coordinación y entrega)</span>
                          <span className="text-red-400 font-black">{avgProcesos}% fuga</span>
                        </div>
                        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                          <div className="bg-gradient-to-r from-red-500 to-rose-400 h-full rounded-full transition-all duration-700" style={{ width: `${avgProcesos}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-slate-300 mb-1">
                          <span className="flex items-center gap-2">📊 Datos (Información para decidir)</span>
                          <span className="text-amber-400 font-black">{avgDatos}% fuga</span>
                        </div>
                        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-700" style={{ width: `${avgDatos}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-slate-300 mb-1">
                          <span className="flex items-center gap-2">👥 Cliente (Seguimiento comercial)</span>
                          <span className="text-emerald-400 font-black">{avgCliente}% fuga</span>
                        </div>
                        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700" style={{ width: `${avgCliente}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#ED7D31] shrink-0" />
                      <span>
                        **Diagnóstico de Cohorte**: La fuga mayoritaria se encuentra en **{avgProcesos >= avgTiempo ? 'Procesos' : 'Tiempo'}**, indicando falta de estandarización en la entrega de presupuestos y tareas repetitivas.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs font-semibold italic">Bloque ocultado temporalmente para presentación</div>
                )}
              </div>

              {/* GRAPH 2: MATRIZ CONSOLIDADA 2X2 (ORO, CUELLO, ZOMBI, GRASA) WITH INTERACTIVE CLICK */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-extrabold text-white text-base">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span>2. Matriz de Cuadrantes Consolidada (2x2 Interactivas)</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Pulsa un cuadrante para ver detalle</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  {/* CUELLO DE BOTELLA */}
                  <div
                    onClick={() => setCuadranteDetalleModal('Cuello de botella')}
                    className="bg-gradient-to-br from-red-950/60 to-red-900/30 border-2 border-red-700/60 hover:border-red-500 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-lg group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-extrabold text-red-300 text-sm flex items-center gap-1">
                        ⚠️ CUELLO DE BOTELLA
                      </span>
                      <span className="text-2xl font-black text-red-400">{tareasPorCuadrante['Cuello de botella'].length}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">Baja Frecuencia + Alto Valor (Sistematizar flujo N2)</p>
                    <div className="mt-3 text-[10px] text-red-300 font-bold underline group-hover:text-white">
                      Ver {tareasPorCuadrante['Cuello de botella'].length} tareas atascadas →
                    </div>
                  </div>

                  {/* ORO */}
                  <div
                    onClick={() => setCuadranteDetalleModal('Oro')}
                    className="bg-gradient-to-br from-emerald-950/60 to-emerald-900/30 border-2 border-emerald-700/60 hover:border-emerald-500 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-lg group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-extrabold text-emerald-300 text-sm flex items-center gap-1">
                        🏆 ORO (POTENCIA)
                      </span>
                      <span className="text-2xl font-black text-emerald-400">{tareasPorCuadrante['Oro'].length}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">Alta Frecuencia + Alto Valor (Acelerar con IA N3)</p>
                    <div className="mt-3 text-[10px] text-emerald-300 font-bold underline group-hover:text-white">
                      Ver {tareasPorCuadrante['Oro'].length} tareas estratégicas →
                    </div>
                  </div>

                  {/* ZOMBI */}
                  <div
                    onClick={() => setCuadranteDetalleModal('Zombi')}
                    className="bg-gradient-to-br from-amber-950/60 to-amber-900/30 border-2 border-amber-700/60 hover:border-amber-500 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-lg group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-extrabold text-amber-300 text-sm flex items-center gap-1">
                        🧟 ZOMBI (AUTOMATIZA)
                      </span>
                      <span className="text-2xl font-black text-amber-400">{tareasPorCuadrante['Zombi'].length}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">Alta Frecuencia + Bajo Valor (Automatizar sin código)</p>
                    <div className="mt-3 text-[10px] text-amber-300 font-bold underline group-hover:text-white">
                      Ver {tareasPorCuadrante['Zombi'].length} tareas repetitivas →
                    </div>
                  </div>

                  {/* GRASA */}
                  <div
                    onClick={() => setCuadranteDetalleModal('Grasa')}
                    className="bg-gradient-to-br from-slate-900 to-slate-800/80 border-2 border-slate-700 hover:border-slate-500 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-lg group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-extrabold text-slate-300 text-sm flex items-center gap-1">
                        🗑️ GRASA (ELIMINA)
                      </span>
                      <span className="text-2xl font-black text-slate-400">{tareasPorCuadrante['Grasa'].length}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">Baja Frecuencia + Bajo Valor (Eliminar o simplificar)</p>
                    <div className="mt-3 text-[10px] text-slate-400 font-bold underline group-hover:text-white">
                      Ver tareas residuales →
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN CHART ROW 2: FLIGHT LEVELS HEALTH & PRIORITIZATION TRAFFIC LIGHT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GRAPH 3: FLIGHT LEVELS DEEP-DIVE (N1, N2, N3) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-extrabold text-white text-base">
                    <Layers className="w-5 h-5 text-blue-400" />
                    <span>3. Salud Organizativa por Niveles Flight Levels</span>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 font-bold mb-1">
                      <span>Nivel 1: Operativo (Visibilidad y Tareas Individuales)</span>
                      <span className="text-blue-400 font-black">{avgN1}% Salud</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${avgN1}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 font-bold mb-1">
                      <span>Nivel 2: Coordinación (Flujo entre áreas y pedidos)</span>
                      <span className="text-red-400 font-black">{avgN2}% Salud (TAPÓN COHORTE)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${avgN2}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 font-bold mb-1">
                      <span>Nivel 3: Estratégico (Toma de decisiones y dirección)</span>
                      <span className="text-amber-400 font-black">{avgN3}% Salud</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${avgN3}%` }}></div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/60 text-[11px] text-blue-200">
                    💡 **Conclusión Flight Levels**: El nivel de **Coordinación Nivel 2** presenta la menor salud ({avgN2}%), indicando que las personas trabajan aisladas en silos y la información de pedidos no fluye automáticamente.
                  </div>
                </div>
              </div>

              {/* GRAPH 4: SEMÁFORO DE PRIORIZACIÓN Y HOJA DE RUTA 30-60-90 DÍAS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-extrabold text-white text-base">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span>4. Semáforo de Priorización Operativa</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="bg-red-950/60 border border-red-800/60 p-3 rounded-xl">
                    <span className="text-2xl font-black text-red-400 block">{numRojo}</span>
                    <span className="text-red-200/80 font-bold text-[11px]">Rojo (Tapón N2)</span>
                  </div>
                  <div className="bg-amber-950/60 border border-amber-800/60 p-3 rounded-xl">
                    <span className="text-2xl font-black text-amber-400 block">{numAmarillo}</span>
                    <span className="text-amber-200/80 font-bold text-[11px]">Amarillo (Ciego N3)</span>
                  </div>
                  <div className="bg-emerald-950/60 border border-emerald-800/60 p-3 rounded-xl">
                    <span className="text-2xl font-black text-emerald-400 block">{numVerde}</span>
                    <span className="text-emerald-200/80 font-bold text-[11px]">Verde (Desgaste N1)</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-red-950/30 border-l-4 border-red-500 rounded-r-xl">
                    <span className="font-bold text-red-300 block">Prioridad 1 (Primeros 30 Días)</span>
                    <span className="text-slate-300 text-[11px]">
                      Sistematizar el paso de presupuestos a operaciones (Solucionar el Tapón N2).
                    </span>
                  </div>
                  <div className="p-3 bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl">
                    <span className="font-bold text-amber-300 block">Prioridad 2 (60 Días)</span>
                    <span className="text-slate-300 text-[11px]">
                      Desplegar automatizaciones Make/n8n para recuperar {totalHoras} hrs/sem en tareas Zombi.
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-950/30 border-l-4 border-emerald-500 rounded-r-xl">
                    <span className="font-bold text-emerald-300 block">Prioridad 3 (90 Días)</span>
                    <span className="text-slate-300 text-[11px]">
                      Crear el panel de control directivo N3 e integrar Copilot/Gemini en las tareas Oro.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PROPOSED HIGH-IMPACT EXTRA CHART ROW 3: ECOSISTEMA TECNOLÓGICO Y ELEFANTES BLANCOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ECOSISTEMA & ELEFANTES BLANCOS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 font-extrabold text-white text-base border-b border-slate-800 pb-3">
                  <Cpu className="w-5 h-5 text-[#CCBBEE]" />
                  <span>5. Mapa de Ecosistema Tecnológico &amp; Elefantes Blancos</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-blue-950/50 border border-blue-800/50 p-3 rounded-xl">
                    <span className="text-lg font-black text-blue-400 block">{numGoogle}</span>
                    <span className="text-slate-300 text-[11px]">Google Workspace</span>
                  </div>
                  <div className="bg-violet-950/50 border border-violet-800/50 p-3 rounded-xl">
                    <span className="text-lg font-black text-violet-400 block">{numMicrosoft}</span>
                    <span className="text-slate-300 text-[11px]">Microsoft 365</span>
                  </div>
                  <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl">
                    <span className="text-lg font-black text-slate-300 block">{numIndependiente}</span>
                    <span className="text-slate-300 text-[11px]">Independiente</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <span className="font-bold text-[#ED7D31] text-[11px] block">🐘 Elefantes Blancos Detectados (Software Pagado en Desuso):</span>
                  <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-1">
                    {empresasArray.filter(e => e.herramientas_desuso).map((e, idx) => (
                      <li key={idx}>
                        <strong className="text-white">{e.nombre}:</strong> {e.herramientas_desuso}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* COHERENCIA Y COACHING HOOKS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 font-extrabold text-white text-base border-b border-slate-800 pb-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <span>6. Alertas de Coherencia y Puntos de Coaching en Vivo</span>
                </div>

                <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
                  {resultadosFiltrados.flatMap((r) => r.alertas).map((alerta, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                        alerta.es_solido
                          ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                          : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
                      }`}
                    >
                      <span className="font-extrabold uppercase text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-current shrink-0">
                        {alerta.tipo}
                      </span>
                      <span className="leading-snug text-[11px]">{alerta.mensaje}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DETALLE POR EMPRESA TABLE WITH LINK TO PDF REPORT */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-extrabold text-white text-base">
                  <Building className="w-5 h-5 text-[#ED7D31]" />
                  <span>Detalle Individual de Resultados por Empresa</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{numEmpresas} empresas listadas</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Sector / Ecosistema</th>
                      <th className="p-3">Semáforo</th>
                      <th className="p-3">Fuga Principal</th>
                      <th className="p-3">Nivel Débil</th>
                      <th className="p-3 text-right">Horas Rec.</th>
                      <th className="p-3 text-center">Informe PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {resultadosFiltrados.map((res) => {
                      const emp = empresasMap.get(res.empresa_id);
                      return (
                        <tr key={res.empresa_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-extrabold text-white">{emp?.nombre || 'Empresa'}</td>
                          <td className="p-3 text-slate-400">
                            <div className="font-semibold text-slate-200">{emp?.sector}</div>
                            <div className="text-[10px] text-slate-500">{emp?.num_empleados} emp. · {emp?.ecosistema}</div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                res.semaforo === 'rojo'
                                  ? 'bg-red-950 text-red-400 border border-red-800'
                                  : res.semaforo === 'amarillo'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}
                            >
                              {res.semaforo}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-[#ED7D31]">{res.agujero_principal}</td>
                          <td className="p-3 font-semibold text-slate-300">{res.nivel_debil}</td>
                          <td className="p-3 text-right font-black text-white text-sm">
                            {res.horas_recuperables}h/sem
                          </td>
                          <td className="p-3 text-center">
                            <Link
                              href={`/admin/report/${res.empresa_id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2A1545] hover:bg-[#371b5c] text-white font-extrabold text-[11px] shadow border border-[#CCBBEE]/40 transition-all cursor-pointer"
                            >
                              <span>Ver / Editar PDF</span>
                              <ExternalLink className="w-3 h-3 text-[#ED7D31]" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QUADRANT DETAIL MODAL */}
      {cuadranteDetalleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-[#CCBBEE]/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-extrabold text-lg">
                <Award className="w-6 h-6 text-[#ED7D31]" />
                <span>Detalle de Tareas en Cuadrante: {cuadranteDetalleModal.toUpperCase()}</span>
              </div>
              <button
                onClick={() => setCuadranteDetalleModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Listado de tareas detectadas en este cuadrante entre todas las empresas participantes:
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
              {tareasPorCuadrante[cuadranteDetalleModal].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>📌 {item.tarea.nombre || item.tarea.nombre_personalizado}</span>
                    <span className="text-[#ED7D31] font-black">{item.tarea.horas_semana} hrs/sem</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>🏢 Empresa: {item.empresaNombre}</span>
                    <span>Frecuencia: {item.tarea.frecuencia} | Impacto: {item.tarea.valor}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setCuadranteDetalleModal(null)}
                className="px-5 py-2.5 rounded-xl bg-[#2A1545] text-white font-bold text-xs shadow hover:bg-[#371b5c] cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
