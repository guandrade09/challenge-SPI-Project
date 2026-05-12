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

const formatDetection = (d) => {
  const icon = RISK_LABELS.has(d.label) ? '⚠' : '✓';
  return `${icon} ${LABEL_PT[d.label] ?? d.label} — ${(d.confidence * 100).toFixed(0)}%`;
};

export const MonitoramentoPage = () => {
  const { alertaAtivo, limparAlertaAtivo, liveDetections } = useMonitoramentoStore();

  useEffect(() => {
    if (!alertaAtivo) return;
    const timer = setTimeout(limparAlertaAtivo, 10000);
    return () => clearTimeout(timer);
  }, [alertaAtivo]);

  const buildMessage = () => {
    if (alertaAtivo) {
      return `⚠ ${LABEL_PT[alertaAtivo.label] ?? alertaAtivo.label} — confiança: ${(alertaAtivo.confidence * 100).toFixed(0)}%`;
    }
    if (liveDetections.length === 0) {
      return 'Aguardando detecções...';
    }
    const linhas = liveDetections
      .filter(d => LABEL_PT[d.label])
      .map(formatDetection);
    return linhas.length > 0 ? linhas.join('\n') : 'Nenhum EPI no frame.';
  };

  const panelStatus = alertaAtivo
    ? PANEL_STATUS.ALERTA
    : liveDetections.length > 0
      ? PANEL_STATUS.ATENCAO
      : PANEL_STATUS.PRONTO;

  return (
    <div className="page-container">
      <div className="page-content max-w-[1400px]">
        <main className="page-grid-sidebar">
          <CameraView />

          <div className="sidebar-stack">
            <div>
              <p className="page-title">Detecção de EPIs</p>
              <p className="page-subtitle">Selecione os equipamentos a monitorar</p>
            </div>

            <DetectionPanel options={DETECTION_CONFIG} />
            <div className="page-divider" />
            <AlertPanel message={buildMessage()} status={panelStatus} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MonitoramentoPage;
