// src/features/monitoramento/monitoramento.jsx
import React from 'react';
import { CameraView, DetectionPanel, AlertPanel } from './components'; 
import { useMonitoramentoStore } from './store/useMonitoramentoStore';

const DETECTION_CONFIG = [
  { id: 'colete', label: 'DETECTAR COLETE' },
  { id: 'oculus', label: 'DETECTAR ÓCULOS' },
  { id: 'capacete', label: 'DETECTAR CAPACETE' },
];

const MonitoramentoPage = () => {
  const { status } = useMonitoramentoStore();

  return (
    // 1. CONTAINER PRINCIPAL: Centraliza o Grid na tela. 
    // Removido py-4, mb-10 duplicados do App.jsx
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 min-h-[85vh] flex items-center justify-center">
      
      {/* 2. GRID DE LAYOUT: Define as duas colunas */}
      {/* cols-1 (mobile, um abaixo do outro) -> cols-2 (desktop, lado a lado) */}
      <main className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12 items-center justify-items-center">
        
        {/* COLUNA ESQUERDA: Câmera */}
        {/* Usamos flex justify-end para alinhar a câmera com o meio do layout, vinda da esquerda */}
        <div className="w-full flex justify-end items-center relative z-10">
          <CameraView 
            status={status}
            streamUrl="" 
          />
        </div>

        {/* COLUNA DIREITA: Controles e Alerta */}
        {/* Usamos items-start para alinhar os painéis com a borda esquerda da coluna deles (meio da tela) */}
        <div className="w-full flex flex-col gap-10 items-center md:items-start ml-0 md:ml-auto">
          
          {/* Alinhamento do Painel de Detecção */}
          <div className="w-full flex justify-center md:justify-start">
             <DetectionPanel options={DETECTION_CONFIG} />
          </div>

          {/* Alinhamento do Painel de Alerta */}
          <div className="w-full flex justify-center md:justify-start">
            <AlertPanel message="Q coisinha chata de codar ein" isCritical={true} />
          </div>
          
        </div>

      </main>
    </div>
  );
};

export default MonitoramentoPage;