import React, { useEffect } from 'react';
import { CameraView, DetectionPanel, AlertPanel } from './components';
import { PANEL_STATUS } from '../../enums/enums';
import { useMonitoramentoStore } from '../../store/useMonitoramentoStore';

const DETECTION_CONFIG = [
  { id: 'colete',   label: 'Detectar Colete'   },
  { id: 'oculos',   label: 'Detectar Óculos'   },
  { id: 'capacete', label: 'Detectar Capacete' },
  { id: 'mascara',  label: 'Detectar Máscara'  },
];

const LABEL_PT = {
  'Hardhat':        'Capacete',
  'Safety Vest':    'Colete',
  'Goggles':        'Óculos',
  'Mask':           'Máscara',
  'NO-Hardhat':     'Sem Capacete',
  'NO-Safety Vest': 'Sem Colete',
  'NO-Goggles':     'Sem Óculos',
  'NO-Mask':        'Sem Máscara',
};

const RISK_LABELS = new Set(['NO-Hardhat', 'NO-Safety Vest', 'NO-Goggles', 'NO-Mask', 'NO-Gloves']);

export const MonitoramentoPage = () => {
  const { alertaAtivo, limparAlertaAtivo, liveDetections } = useMonitoramentoStore();

  useEffect(() => {
    if (!alertaAtivo) return;
    const timer = setTimeout(limparAlertaAtivo, 10000);
    return () => clearTimeout(timer);
  }, [alertaAtivo]);

  // Monta mensagem do painel com detecções ao vivo
  const buildMessage = () => {
    if (alertaAtivo) {
      return `⚠ ${LABEL_PT[alertaAtivo.label] ?? alertaAtivo.label} — confiança: ${(alertaAtivo.confidence * 100).toFixed(0)}%`;
    }

    if (liveDetections.length === 0) {
      return 'Aguardando detecções...';
    }

    const linhas = liveDetections
      .filter(d => LABEL_PT[d.label])
      .map(d => {
        const icon = RISK_LABELS.has(d.label) ? '⚠' : '✓';
        return `${icon} ${LABEL_PT[d.label]} — ${(d.confidence * 100).toFixed(0)}%`;
      });

    return linhas.length > 0 ? linhas.join('\n') : 'Nenhum EPI no frame.';
  };

  const panelStatus = alertaAtivo
    ? PANEL_STATUS.ALERTA
    : liveDetections.length > 0
      ? PANEL_STATUS.ATENCAO  // amarelo = detectando
      : PANEL_STATUS.PRONTO;

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
              <p style={{ fontSize: 12, color: '#45484f', marginTop: 4 }}>
                Selecione os equipamentos a monitorar
              </p>
            </div>

            <DetectionPanel options={DETECTION_CONFIG} />

            <div style={{ height: 1, background: '#1e2025' }} />

            <AlertPanel
              message={buildMessage()}
              status={panelStatus}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MonitoramentoPage;