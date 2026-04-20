// src/features/monitoramento/monitoramento.jsx
import React from 'react';
import { CameraView, DetectionPanel, AlertPanel } from './components'; 
import { PANEL_STATUS } from '../../enums/enums';

const DETECTION_CONFIG = [
  { id: 'colete', label: 'DETECTAR COLETE' },
  { id: 'oculus', label: 'DETECTAR ÓCULOS' },
  { id: 'capacete', label: 'DETECTAR CAPACETE' },
];

export const MonitoramentoPage = () => {

  return (
    <div className="w-full bg-gradient-to-tr from-neutral-500 to-neutral-950 min-h-screen">
      
      {/* Container de conteúdo com largura máxima e padding, centralizado */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex items-center justify-center">
        
        {/* cols-1 (mobile) -> cols-2 (desktop) */}
        <main className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12 items-center justify-items-center">
          
          {/* COLUNA ESQUERDA: Câmera */}
          <div className="w-full flex justify-end items-center relative z-10">
            <CameraView 
              status={status}
              streamUrl="" 
            />
          </div>

          {/* COLUNA DIREITA: Controles e Alerta */}
          <div className="w-full flex flex-col gap-10 items-center md:items-start ml-0 md:ml-auto">
            
            {/*Painel de Detecção*/}
            <div className="w-full flex justify-center md:justify-center">
               <DetectionPanel options={DETECTION_CONFIG} />
            </div>

            {/*Painel de Alerta*/}
            <div className="w-full flex justify-center md:justify-center">
              {/* FUTURAMENTE RECEBIMENTO DE MENSAGEM E STATUS DO MONITORAMENTO*/}
              <AlertPanel 
                message="MENSAGEM VINDA DA API (pov: n tem api ainda) " 
                status={PANEL_STATUS.PRONTO} 
              />
            </div>
            
          </div>

        </main>
      </div>
    </div>
  );
};

export default MonitoramentoPage;