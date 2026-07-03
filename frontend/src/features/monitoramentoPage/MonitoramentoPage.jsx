import React, { useEffect, useState } from 'react';
import { CameraView, DetectionPanel, AlertPanel } from './components';
import { ZonaConfigModal } from './components/ZonaConfigModal';
import { PANEL_STATUS } from '../../enums/enums';
import { useMonitoramentoStore } from '../../store/useMonitoramentoStore';

const DETECTION_CONFIG = [
  { id: 'auricular', label: 'Detectar Auricular'    },
  { id: 'botas',     label: 'Detectar Botas'        },
  { id: 'capacete',  label: 'Detectar Capacete'     },
  { id: 'colete',    label: 'Detectar Colete'       },
  { id: 'mascara',   label: 'Detectar Máscara'      },
  { id: 'oculos',    label: 'Detectar Óculos'       },
  { id: 'ergonomia', label: 'Detectar Ergonomia'    },
  { id: 'zona',      label: 'Detectar Zona de Risco'},
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

// ── Helpers de métricas ───────────────────────────────────────────────────────
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

const fmt = (v, decimais = 1) => (v != null ? v.toFixed(decimais) : '--');

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

export const MonitoramentoPage = () => {
  const [zonaModalAberto, setZonaModalAberto] = useState(false);

  const { alertaAtivo, limparAlertaAtivo, liveDetections, verdict, metrics, detections, zonaConfig } =
    useMonitoramentoStore();

  useEffect(() => {
    if (!alertaAtivo) return;
    const timer = setTimeout(limparAlertaAtivo, 10000);
    return () => clearTimeout(timer);
  }, [alertaAtivo]);

  const activeReasons = () => {
    if (!verdict || verdict.status === 'MONITORANDO') return [];

    // Se há zona ativa com EPIs obrigatórios, só mostra alertas EPI dessa lista
    const zonaEpisObrigatorios = zonaConfig?.epis_obrigatorios ?? [];
    const emZonaComEpis = detections.zona && zonaEpisObrigatorios.length > 0;

    return (verdict.reasons ?? []).filter((r) => {
      // Razões REBA
      if (r.startsWith('ergonomia_reba_')) return detections.ergonomia;
      // Zona perigo
      if (r === 'zona_perigo') return detections.zona;
      // EPI faltando na zona — sempre mostra se zona ativa
      if (r.startsWith('zona_epi_ausente_')) return detections.zona;
      // EPI normal — se zona com EPIs obrigatórios estiver ativa,
      // só mostra se esse EPI for obrigatório naquela zona
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

    // Mostra apenas detecções de risco (AUSENTE/ERRADO) no painel
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
    // Só conta como ativo se for risco real (AUSENTE/ERRADO)
    const hasActiveLive = liveDetections.some((d) => {
      const toggleKey = LABEL_TO_TOGGLE[d.label];
      return RISK_LABELS.has(d.label) && (!toggleKey || detections[toggleKey]);
    });
    if (hasActiveLive) return PANEL_STATUS.ATENCAO;
    return PANEL_STATUS.PRONTO;
  })();

  // Fonte EPI só aparece se pelo menos uma reason de EPI passou pelo filtro de toggle
  const activeReasonsList = activeReasons();
  const hasActiveEpi = activeReasonsList.some((r) => LABEL_TO_TOGGLE[r]);

  const activeSources = verdict?.sources?.filter((s) => {
    if (s === 'epi')       return hasActiveEpi;
    if (s === 'ergonomia') return detections.ergonomia;
    if (s === 'zona')      return detections.zona;
    return false;
  }) ?? [];

  return (
    <>
    {zonaModalAberto && <ZonaConfigModal onClose={() => setZonaModalAberto(false)} />}
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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 20, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: '#e2e4e8', margin: 0,
                }}>
                  Monitoramento
                </p>
                <p style={{ fontSize: 12, color: '#45484f', marginTop: 4 }}>
                  Selecione o que monitorar
                </p>
              </div>
              <button
                onClick={() => setZonaModalAberto(true)}
                title={zonaConfig ? `Zona: ${zonaConfig.nome}` : 'Nenhuma zona configurada'}
                style={{
                  marginTop: 4,
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

            <DetectionPanel options={DETECTION_CONFIG} />

            <div style={{ height: 1, background: '#1e2025' }} />

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

            <AlertPanel message={buildMessage()} status={panelStatus} />

            <div style={{ height: 1, background: '#1e2025' }} />

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
    </>
  );
};

export default MonitoramentoPage;