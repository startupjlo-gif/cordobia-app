'use client';

import React from 'react';
import Image from 'next/image';

interface BrandingBannerProps {
  titulo?: string;
  edicion?: string;
  compact?: boolean;
}

export const BrandingBanner: React.FC<BrandingBannerProps> = ({
  titulo = 'Transformando nuestro modelo de negocio',
  edicion = 'Córdoba IA 2026',
  compact = false
}) => {
  return (
    <header className="w-full bg-[#2A1545] text-white shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: CordobIA Brand Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ED7D31] to-[#CC6808] flex items-center justify-center font-bold text-white text-lg shadow-lg">
            IA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">Cordob<span className="text-[#ED7D31]">IA</span></span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#CCBBEE]/20 text-[#CCBBEE] font-medium border border-[#CCBBEE]/30">
                {edicion}
              </span>
            </div>
            <p className="text-xs text-[#CCBBEE] font-medium">
              {titulo}
            </p>
          </div>
        </div>

        {/* Right: Institutional Co-financing Logos Banner */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#ED7D31] animate-pulse"></span>
            <span className="font-semibold text-white">Programa Xpertia</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">Cofinanciado por el Fondo Social Europeo Plus (FSE+) y Diputación de Córdoba</span>
          </div>
        </div>
      </div>
    </header>
  );
};
