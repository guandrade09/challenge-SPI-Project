// src/layouts/Footer.jsx
import React from 'react';
import { GitBranchIcon, HardDrive, Globe } from 'lucide-react';
import bannerBaixo from '../assets/Codexis/banner_cima.jpeg';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-[#0a0f1d]/60 backdrop-blur-md text-slate-400 text-xs py-4 px-4 sm:px-6 z-10 relative mt-auto overflow-hidden">
      {/* Imagem de Fundo (Banner) */}
      <img 
        src={bannerBaixo} 
        alt="Background Footer" 
        className="absolute inset-0 w-full h-full object-cover object-bottom opacity-15 pointer-events-none z-0"
      />

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        
        {/* Sobre o Projeto */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <span className="font-semibold text-slate-200 tracking-wide">Codexis AI</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <p className="text-slate-400">
            Plataforma para monitoramento e detecção de anomalias com IA.
          </p>
        </div>

        {/* Links Externos */}
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/guandrade09/challenge-SPI-Project"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
          >
            <GitBranchIcon className="w-4 h-4" />
            <span>GitHub</span>
          </a>

          <a
            href="https://hub.docker.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
          >
            <HardDrive className="w-4 h-4" />
            <span>Docker</span>
          </a>

          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Vercel</span>
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;