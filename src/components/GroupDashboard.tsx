'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Empresa, ResultadoDiagnostico } from '@/types';
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
  TrendingUp
} from 'lucide-react';

interface GroupDashboardProps {
  sessionId?: string;
}

export const GroupDashboard: React.FC<GroupDashboardProps> = ({ sessionId }) => {
  const [sectorFiltro, setSectorFiltro] = useState<string>('Todos');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [revelados, setRevelados] = useState<Record<string, boolean>>({
    b1: true,
    b2: true,
    b3: true,
    b4: true,
    b5: true,
    b6: true,
    b7: false,
    b8: true // Detalle por Empresa
  });

  const mockStore = LocalMockStore.getInstance();
  const resultadosArray = Array.from(mockStore.resultados.values());
  const empresasMap = mockStore.empresas;

  // Filtered dataset
  const resultadosFiltrados = resultadosArray.filter((r) => {
    if (sectorFiltro === 'Todos') return true;
    const emp = empresasMap.get(r.empresa_id);
    return emp?.sector === sectorFiltro;
  });

  const numEmpresas = resultadosFiltrados.length;
  const esAnonimoInsuficiente = numEmpresas < 3 && sectorFiltro !== 'Todos';

  // Calculations for Block 2: Balde
  const avgTiempo = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.fuga_tiempo, 0) / numEmpresas) : 0;
  const avgProcesos = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.fuga_procesos, 0) / numEmpresas) : 0;
  const avgDatos = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.fuga_datos, 0) / numEmpresas) : 0;
  const avgCliente = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.fuga_cliente, 0) / numEmpresas) : 0;

  // Calculations for Block 4: Horas
  const totalHoras = resultadosFiltrados.reduce((a, b) => a + b.horas_recuperables, 0);
  const avgHoras = numEmpresas > 0 ? (totalHoras / numEmpresas).toFixed(1) : '0.0';

  // Calculations for Block 5: Flight Levels
  const avgN1 = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.salud_n1, 0) / numEmpresas) : 0;
  const avgN2 = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.salud_n2, 0) / numEmpresas) : 0;
  const avgN3 = numEmpresas > 0 ? Math.round(resultadosFiltrados.reduce((a, b) => a + b.salud_n3, 0) / numEmpresas) : 0;

  // Calculations for Block 6: Semáforo
  const numRojo = resultadosFiltrados.filter((r) => r.semaforo === 'rojo').length;
  const numAmarillo = resultadosFiltrados.filter((r) => r.semaforo === 'amarillo').length;
  const numVerde = resultadosFiltrados.filter((r) => r.semaforo === 'verde').length;

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

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans transition-all ${isFullScreen ? 'p-6' : ''}`}>
      {!isFullScreen && <BrandingBanner />}

      <div className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 flex-1 flex flex-col">
        {/* Controls Bar */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A1545] border border-[#CCBBEE]/30 flex items-center justify-center text-[#ED7D31]">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dashboard del Grupo (Proyectable)</h2>
              <p className="text-xs text-slate-400">Córdoba IA – Grupo 1 · Análisis Consolidado y Detalle de Madurez</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-medium">Sector:</span>
              <select
                value={sectorFiltro}
                onChange={(e) => setSectorFiltro(e.target.value)}
                className="bg-transparent text-xs text-white font-semibold outline-none cursor-pointer"
              >
                <option value="Todos" className="bg-slate-800 text-white">Todos los sectores ({resultadosArray.length})</option>
                <option value="Comercio y Servicios" className="bg-slate-800 text-white">Comercio y Servicios</option>
                <option value="Agroalimentario e Industria" className="bg-slate-800 text-white">Agroalimentario e Industria</option>
                <option value="Servicios Profesionales" className="bg-slate-800 text-white">Servicios Profesionales</option>
                <option value="Administración General" className="bg-slate-800 text-white">Administración General</option>
              </select>
            </div>

            <button
              onClick={toggleFullScreen}
              className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-[#ED7D31]" />}
              <span>{isFullScreen ? 'Salir' : 'Proyector'}</span>
            </button>
          </div>
        </div>

        {esAnonimoInsuficiente ? (
          <div className="bg-amber-900/40 border border-amber-500/50 p-6 rounded-2xl text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-amber-200">Datos insuficientes para mostrar sin identificar a nadie</h3>
            <p className="text-xs text-amber-300/80 max-w-md mx-auto">
              El filtro seleccionado incluye menos de 3 empresas ({numEmpresas}). Se ocultan las gráficas proyectables por privacidad.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 6 Metric Blocks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Bloque 1: Avance */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <Users className="w-4 h-4 text-[#ED7D31]" />
                    <span>1. Avance en Vivo</span>
                  </div>
                  <button onClick={() => toggleRevelar('b1')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    {revelados.b1 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#ED7D31]" />}
                  </button>
                </div>
                {revelados.b1 ? (
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-white">{numEmpresas}</span>
                      <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-1 rounded-full border border-emerald-700/50">
                        100% Completado
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Pasos 1-4 Finalizados</span>
                        <span className="text-white font-bold">{numEmpresas} de {numEmpresas}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-[#ED7D31] h-full rounded-full w-full"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs font-semibold italic">Bloque Bloqueado</div>
                )}
              </div>

              {/* Bloque 2: Balde del Grupo */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <PieChart className="w-4 h-4 text-[#CCBBEE]" />
                    <span>2. El Balde del Grupo (% Fuga)</span>
                  </div>
                  <button onClick={() => toggleRevelar('b2')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    {revelados.b2 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#ED7D31]" />}
                  </button>
                </div>
                {revelados.b2 ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-slate-400 block mb-0.5">Tiempo</span>
                      <span className="text-base font-bold text-[#ED7D31]">{avgTiempo}% fuga</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-slate-400 block mb-0.5">Procesos</span>
                      <span className="text-base font-bold text-red-400">{avgProcesos}% fuga</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-slate-400 block mb-0.5">Datos</span>
                      <span className="text-base font-bold text-amber-400">{avgDatos}% fuga</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-slate-400 block mb-0.5">Cliente</span>
                      <span className="text-base font-bold text-emerald-400">{avgCliente}% fuga</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs font-semibold italic">Bloque Bloqueado</div>
                )}
              </div>

              {/* Bloque 4: Horas Recuperables */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <Clock className="w-4 h-4 text-[#ED7D31]" />
                    <span>4. Horas Recuperables / Sem</span>
                  </div>
                  <button onClick={() => toggleRevelar('b4')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    {revelados.b4 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#ED7D31]" />}
                  </button>
                </div>
                {revelados.b4 ? (
                  <div className="space-y-2 text-center py-2">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ED7D31] to-[#CCBBEE]">
                      {totalHoras} hrs/sem
                    </span>
                    <p className="text-xs text-slate-400">
                      Media de <span className="text-white font-bold">{avgHoras} hrs/semana</span> por empresa consumidas en tareas Zombi/Grasa.
                    </p>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs font-semibold italic">Bloque Bloqueado</div>
                )}
              </div>

              {/* Bloque 5: Flight Levels */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>5. Salud Flight Levels</span>
                  </div>
                  <button onClick={() => toggleRevelar('b5')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    {revelados.b5 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#ED7D31]" />}
                  </button>
                </div>
                {revelados.b5 ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Nivel 1 (Operativo)</span>
                        <span className="font-bold text-blue-400">{avgN1}%</span>
                      </div>
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${avgN1}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Nivel 2 (Coordinación)</span>
                        <span className="font-bold text-red-400">{avgN2}% (Tapón)</span>
                      </div>
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: `${avgN2}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Nivel 3 (Estratégico)</span>
                        <span className="font-bold text-amber-400">{avgN3}%</span>
                      </div>
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${avgN3}%` }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs font-semibold italic">Bloque Bloqueado</div>
                )}
              </div>

              {/* Bloque 6: Semáforo del Grupo */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>6. Semáforo del Grupo</span>
                  </div>
                  <button onClick={() => toggleRevelar('b6')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    {revelados.b6 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#ED7D31]" />}
                  </button>
                </div>
                {revelados.b6 ? (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-red-950/60 border border-red-800/60 p-3 rounded-xl">
                      <span className="text-2xl font-black text-red-400 block">{numRojo}</span>
                      <span className="text-red-200/80 font-medium text-[11px]">Rojo (Tapón)</span>
                    </div>
                    <div className="bg-amber-950/60 border border-amber-800/60 p-3 rounded-xl">
                      <span className="text-2xl font-black text-amber-400 block">{numAmarillo}</span>
                      <span className="text-amber-200/80 font-medium text-[11px]">Amarillo</span>
                    </div>
                    <div className="bg-emerald-950/60 border border-emerald-800/60 p-3 rounded-xl">
                      <span className="text-2xl font-black text-emerald-400 block">{numVerde}</span>
                      <span className="text-emerald-200/80 font-medium text-[11px]">Verde</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs font-semibold italic">Bloque Bloqueado</div>
                )}
              </div>

              {/* Matriz 2x2 Resumen de Cuadrantes */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>3. Matriz Frecuencia / Valor</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-red-950/40 border border-red-800/50 p-2.5 rounded-xl">
                    <span className="font-bold text-red-400 block mb-0.5">Cuello de Botella</span>
                    <span className="text-[11px] text-slate-300">Sistematizar flujo N2</span>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl">
                    <span className="font-bold text-emerald-400 block mb-0.5">Oro (Potencia)</span>
                    <span className="text-[11px] text-slate-300">Potenciar con IA N3</span>
                  </div>
                  <div className="bg-amber-950/40 border border-amber-800/50 p-2.5 rounded-xl">
                    <span className="font-bold text-amber-400 block mb-0.5">Zombi (Automatiza)</span>
                    <span className="text-[11px] text-slate-300">Automatizar sin código</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-700 p-2.5 rounded-xl">
                    <span className="font-bold text-slate-400 block mb-0.5">Grasa (Elimina)</span>
                    <span className="text-[11px] text-slate-300">Eliminar tareas repetitivas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DETALLE POR EMPRESA (TABLE DETALLE FACILITADOR) */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2 font-bold text-white text-base">
                  <Building className="w-5 h-5 text-[#ED7D31]" />
                  <span>Detalle de Diagnóstico por Empresa (Facilitador)</span>
                </div>
                <span className="text-xs text-slate-400">{numEmpresas} empresas analizadas</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Sector / Tamaño</th>
                      <th className="p-3">Semáforo</th>
                      <th className="p-3">Fuga Principal</th>
                      <th className="p-3">Actividades de Mayor Impacto</th>
                      <th className="p-3 text-right">Horas Rec.</th>
                      <th className="p-3 text-center">Informe PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {resultadosFiltrados.map((res) => {
                      const emp = empresasMap.get(res.empresa_id);
                      return (
                        <tr key={res.empresa_id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 font-bold text-white">{emp?.nombre || 'Empresa'}</td>
                          <td className="p-3 text-slate-400">
                            <div>{emp?.sector}</div>
                            <div className="text-[10px] text-slate-500">{emp?.num_empleados} empl. · {emp?.ecosistema}</div>
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
                          <td className="p-3 font-semibold text-slate-200">{res.agujero_principal}</td>
                          <td className="p-3 text-slate-300 max-w-xs">
                            <div className="truncate font-medium text-amber-300">
                              • {res.hoja_ruta?.acciones_30?.titulo}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              • {res.hoja_ruta?.acciones_60?.titulo}
                            </div>
                          </td>
                          <td className="p-3 text-right font-black text-[#ED7D31] text-sm">
                            {res.horas_recuperables}h
                          </td>
                          <td className="p-3 text-center">
                            <Link
                              href={`/admin/report/${res.empresa_id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2A1545] hover:bg-[#371b5c] text-white font-bold text-[11px] shadow transition-all cursor-pointer"
                            >
                              <span>Ver PDF</span>
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

            {/* Bloque 7: Alertas Coherencia */}
            {!isFullScreen && (
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-xs mb-3">
                  <ShieldAlert className="w-4 h-4" />
                  <span>7. Alertas de Coherencia del Motor (Solo Facilitador · No Proyectable)</span>
                </div>
                <div className="space-y-2 text-xs">
                  {resultadosFiltrados.flatMap((r) => r.alertas).map((alerta, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start gap-2 ${
                        alerta.es_solido
                          ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                          : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
                      }`}
                    >
                      <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-900/60 border border-current">
                        {alerta.tipo}
                      </span>
                      <span>{alerta.mensaje}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
