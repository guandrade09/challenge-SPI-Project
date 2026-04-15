// src/features/monitoramento/monitoramento.jsx
import React, { useState, useEffect } from 'react';
import { CameraView, DetectionPanel, AlertPanel } from './components'; // Caminho relativo correto
import { useMonitoramentoStore } from './store/useMonitoramentoStore';

const DETECTION_CONFIG = [
  { id: 'colete', label: 'Detectar Colete' },
  { id: 'oculus', label: 'Detectar Óculos' },
  { id: 'capacete', label: 'Detectar Capacete' },
];

const MonitoramentoPage = () => {
const { status } = useMonitoramentoStore();

  return (
    // min-h-screen garante que ocupe a altura toda
    // items-center centraliza verticalmente os dois blocos
    <main className="min-h-[85vh] w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center px-6">
      
      {/* LADO ESQUERDO: Câmera */}
      <div className="flex justify-center items-center w-full">
        <CameraView status={status} streamUrl="" />
      </div>

      {/* LADO DIREITO: Painel e Alerta */}
      <div className="flex flex-col gap-8 w-full max-w-md ml-auto">
        <DetectionPanel options={DETECTION_CONFIG} />
        <AlertPanel message="" isCritical={false} />
      </div>

    </main>
  );
};

export default MonitoramentoPage;