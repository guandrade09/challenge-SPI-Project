import React from 'react';
import { CameraView, DetectionPanel, AlertPanel } from './components';
import { PANEL_STATUS } from '../../enums/enums';

const DETECTION_CONFIG = [
  { id: 'colete',   label: 'Detectar Colete'   },
  { id: 'oculos',   label: 'Detectar Óculos'   },
  { id: 'capacete', label: 'Detectar Capacete' },
];

export const MonitoramentoPage = () => {
  return (
    <div className="w-full min-h-screen bg-monitoramento p-8">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <main style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: 24,
          alignItems: 'start',
        }}>
          <CameraView />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#e2e4e8',
                margin: 0,
              }}>
                Detecção de EPIs
              </p>
              <p style={{
                fontSize: 12,
                color: '#45484f',
                marginTop: 4,
              }}>
                Selecione os equipamentos a monitorar
              </p>
            </div>

            <DetectionPanel options={DETECTION_CONFIG} />

            <div style={{ height: 1, background: '#1e2025' }} />

            <AlertPanel
              message="Aguardando conexão com o sistema de monitoramento."
              status={PANEL_STATUS.PRONTO}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MonitoramentoPage;