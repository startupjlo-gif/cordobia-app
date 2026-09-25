'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BrandingBanner } from '@/components/BrandingBanner';
import { ArrowRight, QrCode, ShieldCheck, Sparkles, Building, Presentation } from 'lucide-react';

export default function Home() {
  const [codigoSesion, setCodigoSesion] = useState<string>('CORDOBIA2026');

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      <BrandingBanner />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col justify-center items-center text-center my-auto space-y-8">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#CCBBEE]/20 border border-[#CCBBEE]/30 text-[#CCBBEE] text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-[#ED7D31]" />
            <span>Taller Presencial de Transformación Digital</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Diagnóstico Asistido por IA para Pymes <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ED7D31] to-[#CCBBEE]">Córdoba IA</span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Plataforma dinámica para talleres presenciales del programa Xpertia. Los participantes completan el diagnóstico conversacional desde su dispositivo móvil y el facilitador analiza la madurez grupal en vivo.
          </p>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full text-left">
          {/* Card 1: Participante */}
          <div className="bg-slate-800/90 border border-slate-700 hover:border-[#CCBBEE] rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ED7D31] to-[#CC6808] text-white flex items-center justify-center font-bold text-xl shadow-md">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Acceso Participantes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingresa con el código de sesión otorgado por tu facilitador para iniciar tu diagnóstico conversacional en 4 sencillos pasos.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={codigoSesion}
                onChange={(e) => setCodigoSesion(e.target.value.toUpperCase())}
                placeholder="Código de Sesión (ej: CORDOBIA2026)"
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm tracking-wider text-center focus:ring-2 focus:ring-[#ED7D31] outline-none"
              />
              <Link
                href={`/s/${codigoSesion.toLowerCase()}`}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2A1545] to-[#43236b] hover:from-[#371b5c] hover:to-[#2A1545] text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Entrar al Diagnóstico</span>
                <ArrowRight className="w-4 h-4 text-[#ED7D31]" />
              </Link>
            </div>
          </div>

          {/* Card 2: Facilitador */}
          <div className="bg-slate-800/90 border border-slate-700 hover:border-[#ED7D31] rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#2A1545] border border-[#CCBBEE]/30 text-[#CCBBEE] flex items-center justify-center font-bold text-xl shadow-md">
                <Presentation className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Panel Facilitador</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acceso exclusivo para proyectar el dashboard en tiempo real, revisar alertas de coherencia y generar los informes PDF individuales por empresa.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/admin/dashboard/CORDOBIA2026"
                className="w-full py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Presentation className="w-4 h-4 text-[#ED7D31]" />
                <span>Dashboard Proyectable Grupo</span>
              </Link>

              <Link
                href="/admin/report/emp-1"
                className="w-full py-2.5 rounded-xl bg-transparent border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Building className="w-4 h-4" />
                <span>Ver Informe Individual (PDF A4)</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Actuación cofinanciada por el Fondo Social Europeo Plus (FSE+) y la Diputación de Córdoba · Edición Córdoba IA 2026
      </footer>
    </div>
  );
}
