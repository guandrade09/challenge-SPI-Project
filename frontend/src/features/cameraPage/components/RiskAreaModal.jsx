import React, { useEffect, useRef, useState } from 'react';
import { Save, Target, Trash2, LogOut, Maximize2 } from 'lucide-react';
import { PopupModal } from '../../../components/shared/PopupModal';
import { cameraSocketManager } from '../../../services/websocket/CameraSocketManager';
import api from '../../../services/api';
import { useCameraStreamStore } from '../../../store/useCameraStreamStore';
import { useCameraPresetsStore } from '../../../store/useCameraPresetsStore';
import { normalizeRiskAreas, replaceRiskArea, riskAreasFromZone, RISK_AREA_SLOTS } from '../../../utils/riskAreas';
import { RiskAreasOverlay } from './RiskAreasOverlay';
import { CameraControlButton } from './CameraControlButton';

export function RiskAreaModal({ camera, theme, onClose }) {
  const cameraId = camera.id, setor = camera.setor || '', source = camera.papel || 'frontal';
  const frame = useCameraStreamStore((s) => s.getFrame(cameraId, setor, source));
  const frameWidth = useCameraStreamStore((s) => s.getFrameMeta(cameraId, setor, source)?.width);
  const frameHeight = useCameraStreamStore((s) => s.getFrameMeta(cameraId, setor, source)?.height);
  const connected = useCameraStreamStore((s) => s.connected);
  const setRiskAreas = useCameraPresetsStore((s) => s.setRiskAreasForCamera);
  const showZones = useCameraPresetsStore((s) => s.presets[cameraId]?.showRiskAreas !== false);
  const setZonesVisible = useCameraPresetsStore((s) => s.setRiskAreasVisibleForCamera);
  const [areas, setAreas] = useState(() => {
    const preset = useCameraPresetsStore.getState().presets[cameraId];
    return normalizeRiskAreas(preset?.riskAreas ?? preset?.riskArea);
  });
  const [selectedId, setSelectedId] = useState(1);
  const [name, setName] = useState('Área 1');
  const [box, setBox] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState('Selecione um delimitador abaixo para começar.');
  const editorRef = useRef(null);
  const close = () => { if (!saving) onClose(); };

  useEffect(() => {
    cameraSocketManager.subscribe();
    return () => cameraSocketManager.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get(`/zonas/cam_${cameraId}`).catch((err) => {
      if (err.response?.status === 404) return { data: { areas: [] } };
      throw err;
    }).then(({ data }) => {
      if (cancelled) return;
      const meta = useCameraStreamStore.getState().getFrameMeta(cameraId, setor, source);
      const saved = riskAreasFromZone(data, meta?.width, meta?.height);
      if (!data.areas && data.pontos?.length && !saved.length) throw new Error('Aguarde o vídeo para carregar a área existente.');
      setAreas(saved); setRiskAreas(cameraId, saved);
      setName(saved.find((a) => a.id === 1)?.nome || 'Área 1');
      setBox(saved.find((a) => a.id === 1)?.box || null);
      setLoadFailed(false);
    }).catch((err) => {
      if (!cancelled) { setLoadFailed(true); setError(err.message || 'Não foi possível carregar as áreas.'); }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cameraId, setor, source, setRiskAreas, reload]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event) => { if (event.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', escape);
    };
  }, [onClose, saving]);

  const select = (id) => {
    setZonesVisible(cameraId, true);
    const area = areas.find((item) => item.id === id);
    setSelectedId(id); setName(area?.nome || `Área ${id}`); setBox(area?.box || null);
    setEditing(true); setError(''); setNotice('Marque o canto inicial e o canto final na imagem.');
  };
  const save = async () => {
    setError('');
    try {
      const next = replaceRiskArea(areas, selectedId, name, box);
      setSaving(true);
      await cameraSocketManager.sendRequest({ type: 'set_risk_area', cameraId, setor, source, riskAreas: next });
      setAreas(next); setRiskAreas(cameraId, next); setEditing(false);
      setNotice(box ? `${name.trim()} salva. Selecione outro delimitador para adicionar uma área.` : 'Área removida. Os outros delimitadores foram mantidos.');
    } catch (err) { setError(err.message || 'Não foi possível salvar a área.'); }
    finally { setSaving(false); }
  };
  const visible = areas.filter((area) => area.id !== selectedId);
  if (box) visible.push({ id: selectedId, nome: name || `Área ${selectedId}`, box });
  const canDraw = !!frame && frameWidth > 0 && frameHeight > 0 && !loading && !loadFailed && !saving;
  return <PopupModal isOpen onClose={close} title={`Delimitar áreas • ${camera.nome || `Câmera ${cameraId}`}`}
    icon={Target} theme={theme} fullscreen bodyClassName="p-3 sm:p-4 flex flex-col">
    <section ref={editorRef} className="flex h-full min-h-0 flex-col gap-3 bg-[var(--p-bg)] text-[var(--p-text)]">
      <div className="relative min-h-[160px] flex-1 overflow-hidden rounded-xl border border-[var(--p-border)] bg-black">
        {frame ? <img src={frame} alt={`Stream ${camera.nome || cameraId}`} className="h-full w-full object-contain select-none" draggable={false} />
          : <div className="flex h-full items-center justify-center text-sm text-white">Sem sinal. Conecte a câmera para desenhar.</div>}
        {frame && showZones && <RiskAreasOverlay key={`${selectedId}:${editing}`} areas={visible} frameWidth={frameWidth} frameHeight={frameHeight}
          selectedId={selectedId} editable={editing && canDraw} onDraw={setBox} fit="contain" />}
        <div role="toolbar" aria-label="Controles do editor" className="absolute right-3 top-3 z-30 flex items-center gap-1">
        <CameraControlButton icon={Target} onClick={() => setZonesVisible(cameraId, !showZones)} pressed={showZones}
          label={showZones ? 'Ocultar zona' : 'Exibir zona'} />
        <CameraControlButton icon={Maximize2} label="Tela cheia do editor" onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen?.();
            else editorRef.current?.requestFullscreen?.().catch(() => setError('Não foi possível ativar a tela cheia.'));
          }} />
        </div>
      </div>
      <div className="shrink-0 rounded-xl border border-[var(--p-border)] bg-[var(--p-header-bg)] p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2 text-xs">
          <span className="font-bold">Delimitadores de risco</span><span>{areas.length}/4 áreas salvas</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Escolha um dos quatro delimitadores">
          {RISK_AREA_SLOTS.map((slot) => {
            const area = areas.find((item) => item.id === slot.id);
            return <button type="button" key={slot.id} disabled={!canDraw} aria-pressed={selectedId === slot.id}
              onClick={() => select(slot.id)} className="min-w-0 rounded-lg border px-3 py-2 text-left disabled:opacity-50"
              style={{ borderColor: slot.color, backgroundColor: selectedId === slot.id ? `${slot.color}22` : 'transparent' }}>
              <span className="block text-xs font-bold" style={{ color: slot.color }}>Delimitador {slot.id}</span>
              <span className="block truncate text-sm">{area?.nome || 'Adicionar área'}</span>
            </button>;
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="min-w-[180px] flex-1 text-xs font-medium">Nome da área
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} disabled={!editing || saving}
              className="mt-1 block w-full rounded-lg border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm" placeholder={`Área ${selectedId}`} />
          </label>
          <button type="button" onClick={() => { setBox(null); setNotice('Área limpa. Clique em Salvar para confirmar a remoção.'); }}
            disabled={!editing || saving} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-400 disabled:opacity-50"><Trash2 size={16} /> Limpar área</button>
          <button type="button" onClick={save} disabled={!editing || !canDraw || !connected || (!box && !areas.some((a) => a.id === selectedId))}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-400 disabled:opacity-50"><Save size={16} /> {saving ? 'Salvando…' : 'Salvar'}</button>
          <button type="button" onClick={close} disabled={saving} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--p-border)] px-3 py-2 text-sm"><LogOut size={16} /> Sair do popup</button>
        </div>
        <p className="mt-2 text-xs text-[var(--p-subtext)]" role="status">{loading ? 'Carregando áreas salvas…' : notice}</p>
        {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
        {loadFailed && <button type="button" onClick={() => { setError(''); setLoading(true); setReload((n) => n + 1); }}
          className="mt-2 text-sm underline">Tentar carregar novamente</button>}
      </div>
    </section>
  </PopupModal>;
}
