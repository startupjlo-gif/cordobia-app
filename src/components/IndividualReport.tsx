'use client';

import React, { useState } from 'react';
import { Empresa, ResultadoDiagnostico } from '@/types';
import { LocalMockStore } from '@/lib/supabase/mock-store';
import { generarResumenEjecutivoIA } from '@/lib/ai/gemini';
import { BrandingBanner } from './BrandingBanner';
import {
  Printer,
  Edit3,
  Check,
  Sparkles,
  Download,
  AlertTriangle,
  Clock,
  Layers,
  Wrench,
  Building2,
  Calendar,
  UserCheck
} from 'lucide-react';

interface IndividualReportProps {
  empresaId?: string;
}

export const IndividualReport: React.FC<IndividualReportProps> = ({ empresaId = 'emp-1' }) => {
  const mockStore = LocalMockStore.getInstance();
  const empresa = mockStore.empresas.get(empresaId) || mockStore.empresas.values().next().value;
  const resultado = mockStore.resultados.get(`part-1`) || mockStore.resultados.values().next().value;

  const [editandoSummary, setEditandoSummary] = useState<boolean>(false);
  const [resumenTexto, setResumenTexto] = useState<string>(
    `La empresa ${empresa?.nombre || 'Panadería Artesanal'} (${empresa?.sector}) presenta un diagnóstico clasificado en semáforo ${resultado?.semaforo?.toUpperCase()}. Se evidencia un foco prioritario en el área de ${resultado?.agujero_principal}, con un Nivel 2 de Coordinación al ${resultado?.salud_n2}%. Se recomienda abordar la hoja de ruta a 30 días para sistematizar el paso de información e implantar tableros de coordinación.`
  );
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  const handleRegenerarIA = async () => {
    setIsGeneratingAI(true);
    const nuevoTexto = await generarResumenEjecutivoIA(
      empresa?.nombre || 'Empresa',
      empresa?.sector || 'Comercio',
      resultado?.agujero_principal || 'Procesos',
      resultado?.semaforo || 'rojo',
      resultado?.salud_n1 || 50,
      resultado?.salud_n2 || 40,
      resultado?.salud_n3 || 60
    );
    setResumenTexto(nuevoTexto);
    setIsGeneratingAI(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const getSemaforoBadge = (color?: string) => {
    if (color === 'rojo') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-800 font-bold text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
          <span>ROJO – El Tapón (Nivel 2)</span>
        </div>
      );
    }
    if (color === 'amarillo') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-bold text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>AMARILLO – El Punto Ciego (Nivel 3)</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        <span>VERDE – El Desgaste (Nivel 1)</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-4 md:p-8">
      {/* Top Action Toolbar (Hidden during Print) */}
      <div className="no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#2A1545]">Diagnóstico de Transformación Digital por Empresa</h2>
          <p className="text-xs text-slate-500">Documento maquetado A4 listo para imprimir o descargar en PDF</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerarIA}
            disabled={isGeneratingAI}
            className="px-3 py-2 rounded-xl bg-[#CCBBEE]/30 hover:bg-[#CCBBEE]/50 text-[#2A1545] font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 text-[#ED7D31] ${isGeneratingAI ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAI ? 'Generando...' : 'Re-generar Texto IA'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#2A1545] hover:bg-[#371b5c] text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#ED7D31]" />
            <span>Imprimir / Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* A4 REPORT CONTAINER */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* PAGE 1: RESUMEN EJECUTIVO & GRÁFICOS */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-6 min-h-[1050px] flex flex-col justify-between">
          <div>
            {/* Header Banner */}
            <div className="border-b-2 border-[#2A1545] pb-4 mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[#2A1545]">Cordob<span className="text-[#ED7D31]">IA</span></span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#2A1545] text-white">2026</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Informe de Diagnóstico de Transformación Digital
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 font-medium">
                <p className="font-bold text-slate-800">{empresa?.nombre}</p>
                <p>Sector: {empresa?.sector}</p>
                <p>Fecha: {new Date().toLocaleDateString('es-ES')}</p>
              </div>
            </div>

            {/* Company Metadata Row */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-6">
              <div>
                <span className="text-slate-400 block font-medium">Empresa</span>
                <span className="font-bold text-slate-800">{empresa?.nombre}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Tamaño</span>
                <span className="font-bold text-slate-800">{empresa?.num_empleados} empleados</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Ecosistema</span>
                <span className="font-bold text-[#034D9D]">{empresa?.ecosistema}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Diagnóstico</span>
                {getSemaforoBadge(resultado?.semaforo)}
              </div>
            </div>

            {/* Executive Summary Box (Editable) */}
            <div className="bg-[#2A1545]/5 border border-[#2A1545]/20 p-4 rounded-xl space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2A1545] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#ED7D31]" />
                  <span>Resumen Ejecutivo Diagnóstico</span>
                </h3>
                <button
                  onClick={() => setEditandoSummary(!editandoSummary)}
                  className="no-print text-[11px] text-[#2A1545] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {editandoSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>{editandoSummary ? 'Guardar' : 'Editar Texto'}</span>
                </button>
              </div>

              {editandoSummary ? (
                <textarea
                  value={resumenTexto}
                  onChange={(e) => setResumenTexto(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#2A1545]/30 text-xs text-slate-800 focus:outline-none bg-white font-medium leading-relaxed"
                  rows={4}
                />
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{resumenTexto}</p>
              )}
            </div>

            {/* 2-Column Visual Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Balde de Fuga Chart */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-[#2A1545] border-b pb-2">Agujeros del Balde (% Fuga)</h4>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Tiempo</span>
                      <span className="font-bold text-[#ED7D31]">{resultado?.fuga_tiempo}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#ED7D31] h-full rounded-full" style={{ width: `${resultado?.fuga_tiempo}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Procesos</span>
                      <span className="font-bold text-red-600">{resultado?.fuga_procesos}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${resultado?.fuga_procesos}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Datos</span>
                      <span className="font-bold text-amber-600">{resultado?.fuga_datos}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${resultado?.fuga_datos}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Cliente</span>
                      <span className="font-bold text-emerald-600">{resultado?.fuga_cliente}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${resultado?.fuga_cliente}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Levels Health */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-[#2A1545] border-b pb-2">Salud por Nivel (Flight Levels)</h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Nivel 1 (Operativo)</span>
                      <span className="font-bold text-blue-600">{resultado?.salud_n1}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${resultado?.salud_n1}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Nivel 2 (Coordinación)</span>
                      <span className="font-bold text-red-600">{resultado?.salud_n2}% (Crítico)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${resultado?.salud_n2}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Nivel 3 (Estratégico)</span>
                      <span className="font-bold text-amber-600">{resultado?.salud_n3}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${resultado?.salud_n3}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Co-financing Footer Page 1 */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Cofinanciado por el Fondo Social Europeo Plus (FSE+) y Diputación de Córdoba</span>
            <span>Página 1 de 2</span>
          </div>
        </div>

        {/* PAGE 2: HOJA DE RUTA 30-60-90 & HERRAMIENTAS RECOMENDADAS */}
        <div className="print-page-break bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-6 min-h-[1050px] flex flex-col justify-between">
          <div>
            <div className="border-b-2 border-[#2A1545] pb-3 mb-6 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#2A1545]">Hoja de Ruta de Transformación Digital 30-60-90 Días</h3>
              <span className="text-xs text-slate-400 font-medium">{empresa?.nombre}</span>
            </div>

            {/* Total Recoverable Hours Card */}
            <div className="bg-[#ED7D31]/10 border border-[#ED7D31]/30 p-4 rounded-xl flex items-center justify-between mb-6">
              <div>
                <span className="text-xs text-[#CC6808] font-bold uppercase tracking-wider block">Horas Semanales Recuperables</span>
                <p className="text-xs text-slate-600">Suma de horas dedicadas a tareas repetitivas (Zombi / Grasa)</p>
              </div>
              <span className="text-2xl font-black text-[#ED7D31]">{resultado?.horas_recuperables} hrs/sem</span>
            </div>

            {/* 30-60-90 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 30 Días */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <span className="font-bold text-red-600 uppercase text-[11px]">30 Días (Prioridad Alta)</span>
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">{resultado?.hoja_ruta?.acciones_30?.titulo}</h4>
                  <p className="text-slate-600 text-[11px] mb-2">{resultado?.hoja_ruta?.acciones_30?.que_hacer}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Herramientas Recomendadas:</span>
                  <div className="space-y-1">
                    {resultado?.hoja_ruta?.acciones_30?.herramientas_recomendadas?.map((h) => (
                      <div key={h.id} className="bg-white p-1.5 rounded border border-slate-200 text-[11px] font-semibold text-slate-700">
                        {h.nombre}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 60 Días */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <span className="font-bold text-amber-600 uppercase text-[11px]">60 Días (Automatización)</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">{resultado?.hoja_ruta?.acciones_60?.titulo}</h4>
                  <p className="text-slate-600 text-[11px] mb-2">{resultado?.hoja_ruta?.acciones_60?.que_hacer}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Herramientas Recomendadas:</span>
                  <div className="space-y-1">
                    {resultado?.hoja_ruta?.acciones_60?.herramientas_recomendadas?.map((h) => (
                      <div key={h.id} className="bg-white p-1.5 rounded border border-slate-200 text-[11px] font-semibold text-slate-700">
                        {h.nombre}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 90 Días */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <span className="font-bold text-emerald-600 uppercase text-[11px]">90 Días (Estrategia & IA)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">{resultado?.hoja_ruta?.acciones_90?.titulo}</h4>
                  <p className="text-slate-600 text-[11px] mb-2">{resultado?.hoja_ruta?.acciones_90?.que_hacer}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Herramientas Recomendadas:</span>
                  <div className="space-y-1">
                    {resultado?.hoja_ruta?.acciones_90?.herramientas_recomendadas?.map((h) => (
                      <div key={h.id} className="bg-white p-1.5 rounded border border-slate-200 text-[11px] font-semibold text-slate-700">
                        {h.nombre}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Culture Principles Closing Box */}
            <div className="bg-[#2A1545] text-white p-4 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-[#CCBBEE] uppercase text-[11px]">Principios de Cultura Digital CordobIA</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-200">
                <div>• <span className="font-bold text-white">Beta Permanente:</span> Probar, iterar y ajustar soluciones en ciclos cortos.</div>
                <div>• <span className="font-bold text-white">Confianza con Datos:</span> Sustituir intuición por indicadores reales.</div>
                <div>• <span className="font-bold text-white">Fin del "Siempre así":</span> Cuestionar procesos antiguos sin valor.</div>
              </div>
            </div>
          </div>

          {/* Institutional Co-financing Footer Page 2 */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Cofinanciado por el Fondo Social Europeo Plus (FSE+) y Diputación de Córdoba</span>
            <span>Página 2 de 2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
