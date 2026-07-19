import React, { useEffect } from 'react';
import { CameraView, DetectionPanel, AlertPanel } from './components';
import { PANEL_STATUS } from '../../enums/enums';
import { useMonitoramentoStore } from '../../store/useMonitoramentoStore';
import { useUiStore } from '../../store/useUiStore';
import { BasePanelModal } from '../../components/shared/BasePanelModal'; // Importado o painel base

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

export const CameraPage = () => {
  const currentTheme = useUiStore((s) => s.theme);
  const { alertaAtivo, limparAlertaAtivo, liveDetections } = useMonitoramentoStore();

  useEffect(() => {
    if (!alertaAtivo) return;
    const timer = setTimeout(limparAlertaAtivo, 10000);
    return () => clearTimeout(timer);
  }, [alertaAtivo, limparAlertaAtivo]);

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

  const isDark = currentTheme === 'dark';

  return (
    <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300 text-theme-title ${isDark ? 'dark' : 'light'}`}>
      <div className="mx-auto p-6 max-w-[1400px]">
        <main className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          
          {/* Feed de Monitoramento Central - ENVOLVIDO COM O SEU BASE PANEL */}
          <BasePanelModal
            title="Câmera ao Vivo"
            allowFullScreen={true}
            theme={currentTheme}
            className="shadow-sm overflow-hidden"
          >
            {/* Usamos o padrão de função (Render Prop) que ajustamos para passar o 
              estado 'isMaximized' direto para o visor da câmera se adaptar ao tamanho.
            */}
            {({ isMaximized }) => <CameraView isMaximized={isMaximized} />}
          </BasePanelModal>

          {/* Painel de Controle e Logs Lateral */}
          <div className="flex flex-col gap-6 w-full p-6 rounded-xl bg-theme-section border border-theme-divider shadow-sm transition-colors duration-300">
            <div className="flex flex-col gap-1">
              <h2 
                className="text-2xl font-bold tracking-wider font-mono uppercase text-neutral-400 light:text-neutral-500 panel-text-sub"
                style={{ 
                  fontFamily: "'Barlow Condensed', 'Barlow', sans-serif",
                }}
              >
                DETECÇÃO DE EPIS
              </h2>
              <p className="text-xs font-mono tracking-wide text-neutral-400 light:text-neutral-500 panel-text-sub">
                Selecione os equipamentos a monitorar em tempo real.
              </p>
            </div>

            <div className="w-full">
              <DetectionPanel options={DETECTION_CONFIG} theme={currentTheme} />
            </div>
            
            <div className="h-px w-full border-b border-theme-divider" />
            
            <div className="w-full">
              <AlertPanel message={buildMessage()} status={panelStatus} theme={currentTheme} />
            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default CameraPage;