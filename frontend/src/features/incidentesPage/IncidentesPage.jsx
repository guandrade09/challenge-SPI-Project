import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronLeft, ChevronRight, AlertTriangle, Shield, Activity, MapPin, Filter } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import detectionService from '../../services/detectionService';

const BACKEND = 'http://localhost:3000';
const PAGE_SIZE = 20;

function imgPathToUrl(imgPath) {
  if (!imgPath) return null;
  const normalized = imgPath.replace(/\\/g, '/');
  const idx = normalized.indexOf('/uploads/');
  if (idx === -1) return null;
  return `${BACKEND}${normalized.slice(idx)}`;
}

function formatTs(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
}

function confidenceBadge(conf) {
  const pct = Math.round(parseFloat(conf) * 100);
  const color = pct >= 80 ? 'bg-emerald-500/20 text-emerald-400' : pct >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';
  return <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${color}`}>{pct}%</span>;
}

function sourceBadge(source) {
  if (!source) return null;
  const color = source.includes('epi') ? 'bg-blue-500/20 text-blue-400' : source.includes('ergo') ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400';
  return <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${color}`}>{source}</span>;
}

// Conexões do esqueleto COCO-17 (pares de índices)
const SKELETON_EDGES = [
  [0,1],[0,2],[1,3],[2,4],           // cabeça
  [5,6],                              // ombros
  [5,7],[7,9],[6,8],[8,10],           // braços
  [5,11],[6,12],[11,12],              // tronco
  [11,13],[13,15],[12,14],[14,16],    // pernas
];

const KP_CONF_THRESHOLD = 0.4;

function drawSkeleton(ctx, keypoints, rebaColor) {
  if (!keypoints || keypoints.length < 17) return;

  // Ossos
  ctx.lineWidth = 2;
  SKELETON_EDGES.forEach(([a, b]) => {
    const kpA = keypoints[a];
    const kpB = keypoints[b];
    if (!kpA || !kpB) return;
    if (kpA[2] < KP_CONF_THRESHOLD || kpB[2] < KP_CONF_THRESHOLD) return;
    ctx.strokeStyle = rebaColor + 'cc';
    ctx.beginPath();
    ctx.moveTo(kpA[0], kpA[1]);
    ctx.lineTo(kpB[0], kpB[1]);
    ctx.stroke();
  });

  // Pontos
  keypoints.forEach(([x, y, conf]) => {
    if (conf < KP_CONF_THRESHOLD) return;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rebaColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function IncidentCanvas({ imgUrl, details }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.naturalWidth) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!details) return;

    const fontSize = Math.max(12, canvas.width * 0.018);
    ctx.font = `bold ${fontSize}px monospace`;

    // ── EPI bboxes ──
    (details.epi || []).forEach(({ label, confidence, bbox }) => {
      if (!bbox || bbox.length < 4) return;
      const [x1, y1, x2, y2] = bbox;
      const isAusente = label?.toLowerCase().includes('ausente');
      ctx.strokeStyle = isAusente ? '#ef4444' : '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      ctx.font = `bold ${fontSize}px monospace`;
      const text = `${label} ${Math.round(parseFloat(confidence) * 100)}%`;
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = isAusente ? 'rgba(239,68,68,0.85)' : 'rgba(16,185,129,0.85)';
      ctx.fillRect(x1, y1 - fontSize - 6, tw + 8, fontSize + 6);
      ctx.fillStyle = '#fff';
      ctx.fillText(text, x1 + 4, y1 - 4);
    });

    // ── Esqueleto + bbox de pessoa ──
    (details.ergonomia || []).forEach(({ pessoa_id, reba_score, reba_level, queda, bbox, keypoints }) => {
      const rebaColor = (reba_score ?? 0) >= 7 ? '#ef4444' : (reba_score ?? 0) >= 4 ? '#f59e0b' : '#10b981';

      // bbox da pessoa
      if (bbox && bbox.length === 4) {
        const [x1, y1, x2, y2] = bbox;
        ctx.strokeStyle = rebaColor + '99';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.setLineDash([]);
      }

      // esqueleto
      drawSkeleton(ctx, keypoints, rebaColor);

      // label REBA próximo ao topo da bbox ou ponto 0 (nariz)
      const anchorX = (keypoints?.[0]?.[2] >= KP_CONF_THRESHOLD ? keypoints[0][0] : bbox?.[0]) ?? 8;
      const anchorY = (keypoints?.[0]?.[2] >= KP_CONF_THRESHOLD ? keypoints[0][1] : bbox?.[1]) ?? (8 + (pessoa_id ?? 0) * 30);
      ctx.font = `bold ${fontSize}px monospace`;
      const label = `P${pessoa_id ?? 0} REBA ${reba_score ?? '?'} ${reba_level ?? ''}${queda ? ' ⚠QUEDA' : ''}`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = rebaColor + 'dd';
      ctx.fillRect(anchorX - 2, anchorY - fontSize - 8, tw + 8, fontSize + 6);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, anchorX + 2, anchorY - 4);
    });

    // ── Zona invadida ──
    (details.zona || []).forEach(({ pessoa_id, invadiu }) => {
      if (!invadiu) return;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      ctx.setLineDash([]);
      ctx.font = `bold ${fontSize}px monospace`;
      const text = `⚠ ZONA INVADIDA P${pessoa_id ?? 0}`;
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(249,115,22,0.85)';
      ctx.fillRect(4, canvas.height - fontSize - 10, tw + 8, fontSize + 8);
      ctx.fillStyle = '#fff';
      ctx.fillText(text, 8, canvas.height - 6);
    });
  }, [details]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) draw();
    else img.addEventListener('load', draw);
    return () => img.removeEventListener('load', draw);
  }, [draw, imgUrl]);

  if (!imgUrl) {
    return (
      <div className="w-full h-48 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-500 text-sm">
        Imagem não disponível
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <img
        ref={imgRef}
        src={imgUrl}
        alt="frame do incidente"
        className="w-full rounded-xl object-contain"
        style={{ display: 'block' }}
        onLoad={draw}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded-xl pointer-events-none"
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}

function IncidentModal({ incident, onClose }) {
  if (!incident) return null;
  const imgUrl = imgPathToUrl(incident.img_path);
  const lateralUrl = imgPathToUrl(incident.img_path_lateral);
  const d = incident.details;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#16171d] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-white font-semibold text-lg">{incident.label}</h2>
            <p className="text-neutral-400 text-xs mt-0.5">{formatTs(incident.timestamp)}</p>
          </div>
          <div className="flex items-center gap-2">
            {confidenceBadge(incident.confidence)}
            {sourceBadge(incident.source)}
            <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Imagens com canvas */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">Câmera Frontal</p>
            <IncidentCanvas imgUrl={imgUrl} details={d} />
            {lateralUrl && (
              <>
                <p className="text-xs font-mono uppercase tracking-wider text-neutral-500 mt-4">Câmera Lateral</p>
                <IncidentCanvas imgUrl={lateralUrl} details={d} />
              </>
            )}
          </div>

          {/* Detalhes */}
          <div className="space-y-4">
            {/* EPI */}
            {d?.epi?.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} className="text-blue-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-blue-400">EPI Detectados</span>
                </div>
                <div className="space-y-2">
                  {d.epi.map((epi, i) => {
                    const ausente = epi.label?.toLowerCase().includes('ausente');
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className={ausente ? 'text-red-400' : 'text-emerald-400'}>{epi.label}</span>
                        {confidenceBadge(epi.confidence)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ergonomia */}
            {d?.ergonomia?.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} className="text-purple-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-400">Ergonomia / REBA</span>
                </div>
                <div className="space-y-2">
                  {d.ergonomia.map((p, i) => {
                    const rebaColor = (p.reba_score ?? 0) >= 7 ? 'text-red-400' : (p.reba_score ?? 0) >= 4 ? 'text-yellow-400' : 'text-emerald-400';
                    return (
                      <div key={i} className="text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-300">Pessoa {p.pessoa_id ?? i}</span>
                          <span className={`font-mono font-bold ${rebaColor}`}>REBA {p.reba_score ?? '—'} — {p.reba_level ?? '?'}</span>
                        </div>
                        {p.queda && <div className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={10} /> Queda detectada</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Zona */}
            {d?.zona?.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-orange-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-orange-400">Zona de Risco</span>
                </div>
                <div className="space-y-2">
                  {d.zona.map((z, i) => (
                    <div key={i} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">Pessoa {z.pessoa_id ?? i}</span>
                        <span className={z.invadiu ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                          {z.invadiu ? '⚠ Invadiu zona' : '✓ Fora da zona'}
                        </span>
                      </div>
                      {z.epis_ausentes?.length > 0 && (
                        <p className="text-red-400 text-xs mt-1">EPIs ausentes: {z.epis_ausentes.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!d && (
              <div className="bg-white/5 rounded-xl p-4 text-neutral-500 text-sm text-center">
                Registro antigo — sem detalhes estruturados
              </div>
            )}

            {/* camera_id */}
            {incident.camera_id && (
              <div className="text-xs text-neutral-500 font-mono">
                Câmera: <span className="text-neutral-300">{incident.camera_id}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function IncidentCard({ incident, onClick }) {
  const imgUrl = imgPathToUrl(incident.img_path);
  const hasDetails = !!incident.details;
  const hasZonaAlert = incident.details?.zona?.some((z) => z.invadiu);
  const hasQueda = incident.details?.ergonomia?.some((p) => p.queda);
  const hasEpiAusente = incident.details?.epi?.some((e) => e.label?.toLowerCase().includes('ausente'));

  const borderColor = hasZonaAlert || hasQueda ? 'border-red-500/40' : hasEpiAusente ? 'border-yellow-500/40' : 'border-white/5';

  return (
    <button
      onClick={() => onClick(incident)}
      className={`group text-left w-full bg-[#1c1d26] border ${borderColor} rounded-xl overflow-hidden hover:border-blue-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5`}
    >
      {/* Thumbnail */}
      <div className="relative w-full h-36 bg-neutral-900 overflow-hidden">
        {imgUrl ? (
          <img src={imgUrl} alt="frame" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">Sem imagem</div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {(hasZonaAlert || hasQueda) && <AlertTriangle size={14} className="text-red-400" />}
          {hasDetails && <div className="w-2 h-2 rounded-full bg-emerald-400 mt-0.5" title="Tem detalhes" />}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="text-white text-xs font-medium leading-tight line-clamp-2">{incident.label}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {confidenceBadge(incident.confidence)}
          {sourceBadge(incident.source)}
        </div>
        <p className="text-neutral-500 text-[10px] font-mono">{formatTs(incident.timestamp)}</p>
      </div>
    </button>
  );
}

export default function IncidentesPage() {
  const currentTheme = useUiStore((s) => s.theme);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterAlert, setFilterAlert] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const payload = await detectionService.list();
        const items = (payload?.data || []).slice().reverse();
        setAll(items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sources = [...new Set(all.map((d) => d.source).filter(Boolean))];

  const filtered = all.filter((d) => {
    if (search && !d.label?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSource && d.source !== filterSource) return false;
    if (filterAlert) {
      const hasAlert = d.details?.zona?.some((z) => z.invadiu) ||
        d.details?.ergonomia?.some((p) => p.queda) ||
        d.details?.epi?.some((e) => e.label?.toLowerCase().includes('ausente'));
      if (!hasAlert) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const page_ = Math.min(page, Math.max(0, totalPages - 1));
  const pageItems = filtered.slice(page_ * PAGE_SIZE, (page_ + 1) * PAGE_SIZE);

  const handleSearch = (v) => { setSearch(v); setPage(0); };
  const handleSource = (v) => { setFilterSource(v); setPage(0); };
  const handleAlert = () => { setFilterAlert((p) => !p); setPage(0); };

  return (
    <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl text-[var(--p-text)] uppercase tracking-wider font-semibold">Histórico de Incidentes</h2>
            <p className="text-xs text-neutral-500 mt-1">{filtered.length} registros encontrados</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por label..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1c1d26] border border-white/10 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <select
            value={filterSource}
            onChange={(e) => handleSource(e.target.value)}
            className="px-3 py-2 bg-[#1c1d26] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          >
            <option value="">Todas as fontes</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <button
            onClick={handleAlert}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${filterAlert ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-[#1c1d26] border-white/10 text-neutral-400 hover:text-white'}`}
          >
            <Filter size={14} />
            Só alertas
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="bg-[#1c1d26] rounded-xl h-52 animate-pulse" />
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="text-center py-24 text-neutral-500">Nenhum incidente encontrado.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pageItems.map((incident, i) => (
              <IncidentCard key={`${incident.timestamp}-${i}`} incident={incident} onClick={setSelected} />
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page_ === 0}
              className="p-2 rounded-lg border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-neutral-400 font-mono">
              {page_ + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page_ === totalPages - 1}
              className="p-2 rounded-lg border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {selected && <IncidentModal incident={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
