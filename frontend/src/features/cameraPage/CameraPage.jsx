import React, { useState } from 'react';
import { CameraView, DetectionPanel, AlertPanel } from './components';
import { ZonaConfigModal } from './components/ZonaConfigModal';
import { PANEL_STATUS } from '../../enums/enums';
import { useMonitoramentoStore } from '../../store/useMonitoramentoStore';
import { useUiStore } from '../../store/useUiStore';
import { BasePanelModal } from '../../components/shared/BasePanelModal';

const DETECTION_CONFIG = [
  { id: 'auricular', label: 'Detectar Auricular'     },
  { id: 'botas',     label: 'Detectar Botas'         },
  { id: 'capacete',  label: 'Detectar Capacete'      },
  { id: 'colete',    label: 'Detectar Colete'        },
  { id: 'mascara',   label: 'Detectar Máscara'       },
  { id: 'oculos',    label: 'Detectar Óculos'        },
  { id: 'ergonomia', label: 'Detectar Ergonomia'     },
  { id: 'zona',      label: 'Detectar Zona de Risco' },
];

// Tradução das classes do modelo para exibição no painel
const LABEL_PT = {
  'AURICULAR - AUSENTE': 'Sem Auricular',
  'AURICULAR - CERTO':   'Auricular OK',
  'AURICULAR - ERRADO':  'Auricular Incorreto',
  'BOTAS - AUSENTE':     'Sem Botas',
  'BOTAS - CERTO':       'Botas OK',
  'CAPACETE - AUSENTE':  'Sem Capacete',
  'CAPACETE - CERTO':    'Capacete OK',
  'CAPACETE - ERRADO':   'Capacete Incorreto',
  'COLETE - AUSENTE':    'Sem Colete',
  'COLETE - CERTO':      'Colete OK',
  'MASCARA - AUSENTE':   'Sem Máscara',
  'MASCARA - CERTO':     'Máscara OK',
  'MASCARA - ERRADO':    'Máscara Incorreta',
  'OCULOS - AUSENTE':    'Sem Óculos',
  'OCULOS - CERTO':      'Óculos OK',
  'OCULOS - ERRADO':     'Óculos Incorreto',
  'PESSOA':              'Pessoa',
  'zona_perigo':         'Invasão de Zona de Risco',
};

// Classes que representam risco (AUSENTE ou ERRADO)
const RISK_LABELS = new Set([
  'AURICULAR - AUSENTE', 'AURICULAR - ERRADO',
  'BOTAS - AUSENTE',
  'CAPACETE - AUSENTE',  'CAPACETE - ERRADO',
  'COLETE - AUSENTE',
  'MASCARA - AUSENTE',   'MASCARA - ERRADO',
  'OCULOS - AUSENTE',    'OCULOS - ERRADO',
]);

// Mapeia label do modelo → chave do toggle
const LABEL_TO_TOGGLE = {
  'AURICULAR - AUSENTE': 'auricular',
  'AURICULAR - CERTO':   'auricular',
  'AURICULAR - ERRADO':  'auricular',
  'BOTAS - AUSENTE':     'botas',
  'BOTAS - CERTO':       'botas',
  'CAPACETE - AUSENTE':  'capacete',
  'CAPACETE - CERTO':    'capacete',
  'CAPACETE - ERRADO':   'capacete',
  'COLETE - AUSENTE':    'colete',
  'COLETE - CERTO':      'colete',
  'MASCARA - AUSENTE':   'mascara',
  'MASCARA - CERTO':     'mascara',
  'MASCARA - ERRADO':    'mascara',
  'OCULOS - AUSENTE':    'oculos',
  'OCULOS - CERTO':      'oculos',
  'OCULOS - ERRADO':     'oculos',
  // PESSOA e zona não têm toggle próprio — sempre visíveis se exibidos
};

const VERDICT_TO_STATUS = {
  MONITORANDO:     PANEL_STATUS.PRONTO,
  ALERTA:          PANEL_STATUS.ATENCAO,
  ALERTA_CRITICO:  PANEL_STATUS.ALERTA_CRITICO,
  ALERTA_MULTIPLO: PANEL_STATUS.ALERTA_MULTIPLO,
};

const SOURCE_PT = { epi: 'EPI', ergonomia: 'Ergonomia', zona: 'Zona de Risco' };

const fmt = (v, decimais = 1) => (v != null ? v.toFixed(decimais) : '--');

const latColor = (ms) => {
  if (ms == null) return '#4a4e5a';
  if (ms < 100)   return '#3cc87a';
  if (ms < 200)   return '#d4a017';
  return '#e05252';
};

const pckColor = (v) => {
  if (v == null) return '#4a4e5a';
  if (v >= 0.80) return '#3cc87a';
  if (v >= 0.60) return '#d4a017';
  return '#e05252';
};

const MetricRow = ({ label, value, unit, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#4a4e5a', letterSpacing: '0.06em' }}>
      {label}
    </span>
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color, fontWeight: 600 }}>
      {value}{unit}
    </span>
  </div>
);

export const CameraPage = () => {
  const currentTheme = useUiStore((s) => s.theme);
  const [zonaModalAberto, setZonaModalAberto] = useState(false);

  const { alertaAtivo, liveDetections, verdict, metrics, detections, zonaConfig } =
    useMonitoramentoStore();

  const activeReasons = () => {
    if (!verdict || verdict.status === 'MONITORANDO') return [];

    const zonaEpisObrigatorios = zonaConfig?.epis_obrigatorios ?? [];
    const emZonaComEpis = detections.zona && zonaEpisObrigatorios.length > 0;

    return (verdict.reasons ?? []).filter((r) => {
      if (r.startsWith('ergonomia_reba_')) return detections.ergonomia;
      if (r === 'zona_perigo') return detections.zona;
      if (r.startsWith('zona_epi_ausente_')) return detections.zona;
      const toggleKey = LABEL_TO_TOGGLE[r];
      if (toggleKey) {
        if (emZonaComEpis) return zonaEpisObrigatorios.includes(toggleKey);
        return detections[toggleKey];
      }
      return false;
    });
  };

  const buildMessage = () => {
    const reasons = activeReasons();

    if (alertaAtivo && reasons.length === 0) {
      return `⚠ ${LABEL_PT[alertaAtivo.label] ?? alertaAtivo.label} — confiança: ${(alertaAtivo.confidence * 100).toFixed(0)}%`;
    }

    if (reasons.length > 0) {
      const linhas = reasons.map((r) => {
        if (r.startsWith('ergonomia_reba_')) {
          const parts = r.split('_');
          const level = parts[2]?.toUpperCase();
          const score = parts[3];
          return `⚠ Ergonomia REBA ${level} · score ${score}`;
        }
        if (r.startsWith('zona_epi_ausente_')) {
          const epiId = r.replace('zona_epi_ausente_', '');
          const epiLabel = { capacete: 'Capacete', colete: 'Colete', oculos: 'Óculos', mascara: 'Máscara', auricular: 'Auricular', botas: 'Botas' }[epiId] ?? epiId;
          return `⚠ ${epiLabel} obrigatório nesta zona`;
        }
        return `⚠ ${LABEL_PT[r] ?? r}`;
      });
      if (verdict?.confidence) linhas.push(`Confiança: ${(verdict.confidence * 100).toFixed(0)}%`);
      return linhas.join('\n');
    }

    const activeLive = liveDetections.filter((d) => {
      const toggleKey = LABEL_TO_TOGGLE[d.label];
      return RISK_LABELS.has(d.label) && (!toggleKey || detections[toggleKey]);
    });

    if (activeLive.length === 0) return 'Aguardando detecções...';

    return activeLive.map((d) => {
      return `⚠ ${LABEL_PT[d.label]} — ${(d.confidence * 100).toFixed(0)}%`;
    }).join('\n');
  };

  const panelStatus = (() => {
    const reasons = activeReasons();
    if (reasons.length > 0 && verdict) return VERDICT_TO_STATUS[verdict.status] ?? PANEL_STATUS.ATENCAO;
    if (alertaAtivo) return PANEL_STATUS.ALERTA;
    const hasActiveLive = liveDetections.some((d) => {
      const toggleKey = LABEL_TO_TOGGLE[d.label];
      return RISK_LABELS.has(d.label) && (!toggleKey || detections[toggleKey]);
    });
    if (hasActiveLive) return PANEL_STATUS.ATENCAO;
    return PANEL_STATUS.PRONTO;
  })();

  const activeReasonsList = activeReasons();
  const hasActiveEpi = activeReasonsList.some((r) => LABEL_TO_TOGGLE[r]);

  const activeSources = verdict?.sources?.filter((s) => {
    if (s === 'epi')       return hasActiveEpi;
    if (s === 'ergonomia') return detections.ergonomia;
    if (s === 'zona')      return detections.zona;
    return false;
  }) ?? [];

  const isDark = currentTheme === 'dark';

  return (
    <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300 text-theme-title ${isDark ? 'dark' : 'light'}`}>
      {zonaModalAberto && <ZonaConfigModal onClose={() => setZonaModalAberto(false)} />}

      <div className="mx-auto p-6 max-w-[1400px]">
        <main className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          <BasePanelModal
            title="Câmera ao Vivo"
            allowFullScreen={true}
            theme={currentTheme}
            className="shadow-sm overflow-hidden"
          >
            {({ isMaximized }) => <CameraView isMaximized={isMaximized} />}
          </BasePanelModal>

          <div className="flex flex-col gap-6 w-full p-6 rounded-xl bg-theme-section border border-theme-divider shadow-sm transition-colors duration-300">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h2
                  className="text-2xl font-bold tracking-wider font-mono uppercase text-neutral-400 light:text-neutral-500 panel-text-sub"
                  style={{ fontFamily: "'Barlow Condensed', 'Barlow', sans-serif" }}
                >
                  DETECÇÃO DE EPIS
                </h2>
                <p className="text-xs font-mono tracking-wide text-neutral-400 light:text-neutral-500 panel-text-sub">
                  Selecione os equipamentos a monitorar em tempo real.
                </p>
              </div>
              <button
                onClick={() => setZonaModalAberto(true)}
                title={zonaConfig ? `Zona: ${zonaConfig.nome}` : 'Nenhuma zona configurada'}
                style={{
                  background: zonaConfig ? '#1a2010' : '#1a1c21',
                  border: `1px solid ${zonaConfig ? '#3cc87a' : '#252830'}`,
                  borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10, letterSpacing: '0.08em',
                  color: zonaConfig ? '#3cc87a' : '#4a4e5a',
                  whiteSpace: 'nowrap',
                }}>
                {zonaConfig ? '⬡ Zona ativa' : '⬡ Config. zona'}
              </button>
            </div>

            <div className="w-full">
              <DetectionPanel options={DETECTION_CONFIG} theme={currentTheme} />
            </div>

            {activeSources.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {activeSources.map((s) => (
                  <span key={s} style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 4,
                    border: '1px solid #e05252', color: '#e05252',
                  }}>
                    {SOURCE_PT[s] ?? s}
                  </span>
                ))}
              </div>
            )}

            <div className="h-px w-full border-b border-theme-divider" />

            <div className="w-full">
              <AlertPanel message={buildMessage()} status={panelStatus} theme={currentTheme} />
            </div>

            <div className="h-px w-full border-b border-theme-divider" />

            <div style={{ borderRadius: 8, border: '1px solid #1e2025', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', background: '#141518', borderBottom: '1px solid #1e2025' }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 500,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4a4e5a',
                }}>
                  MÉTRICAS
                </span>
              </div>
              <div style={{ background: '#0d0e10', padding: '10px 14px' }}>
                <MetricRow label="LATÊNCIA TOTAL"  value={fmt(metrics?.latencia_total_ms)} unit=" ms" color={latColor(metrics?.latencia_total_ms)} />
                <MetricRow label="LATÊNCIA EPI"    value={fmt(metrics?.latencia_epi_ms)}   unit=" ms" color={latColor(metrics?.latencia_epi_ms)} />
                <MetricRow label="LATÊNCIA POSE"   value={fmt(metrics?.latencia_pose_ms)}  unit=" ms" color={latColor(metrics?.latencia_pose_ms)} />
                <div style={{ height: 1, background: '#1e2025', margin: '6px 0' }} />
                <MetricRow
                  label="PCK POSE"
                  value={metrics?.pck_pose != null ? (metrics.pck_pose * 100).toFixed(0) : '--'}
                  unit={metrics?.pck_pose != null ? '%' : ''}
                  color={pckColor(metrics?.pck_pose)}
                />
                <MetricRow
                  label="CONF. MÉDIA EPI"
                  value={metrics?.conf_media_epi != null ? (metrics.conf_media_epi * 100).toFixed(0) : '--'}
                  unit={metrics?.conf_media_epi != null ? '%' : ''}
                  color={pckColor(metrics?.conf_media_epi)}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CameraPage;
