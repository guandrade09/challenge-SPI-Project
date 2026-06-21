import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';

const BACKEND_URL    = 'http://localhost:3000/api/zonas';
const ORQUESTRADOR_URL = 'http://localhost:5050/zona/configurar';
const CAMERA_ID      = 'cam_01';
const CANVAS_W       = 640;
const CANVAS_H       = 480;

export const ZonaConfigModal = ({ onClose }) => {
  const canvasRef  = useRef(null);
  const lastFrame  = useMonitoramentoStore((s) => s.lastFrame);
  const zonaConfig = useMonitoramentoStore((s) => s.zonaConfig);
  const setZonaConfig = useMonitoramentoStore((s) => s.setZonaConfig);

  const [pontos, setPontos]   = useState(zonaConfig?.pontos ?? []);
  const [nome, setNome]       = useState(zonaConfig?.nome ?? 'Área restrita');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]       = useState(null);

  // ── Desenha canvas ──────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Fundo: último frame ou grade escura
    if (lastFrame) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
        drawOverlay(ctx, pontos);
      };
      img.src = lastFrame;
    } else {
      ctx.fillStyle = '#0d0e10';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      drawOverlay(ctx, pontos);
    }
  }, [lastFrame, pontos]);

  useEffect(() => { draw(); }, [draw]);

  const drawOverlay = (ctx, pts) => {
    if (pts.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    if (pts.length >= 3) ctx.closePath();

    ctx.fillStyle = 'rgba(224, 82, 82, 0.18)';
    ctx.fill();
    ctx.strokeStyle = '#e05252';
    ctx.lineWidth = 2;
    ctx.stroke();

    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#ff9900' : '#e05252';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '11px IBM Plex Mono, monospace';
      ctx.fillText(i + 1, p.x + 8, p.y - 6);
    });
  };

  // ── Clique no canvas ────────────────────────────────────────────────────────
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    setPontos((prev) => [...prev, { x, y }]);
    setErro(null);
  };

  const desfazer = () => setPontos((prev) => prev.slice(0, -1));
  const limpar   = () => setPontos([]);

  // ── Salvar ──────────────────────────────────────────────────────────────────
  const salvar = async () => {
    if (pontos.length < 3) {
      setErro('Adicione ao menos 3 pontos para definir a zona.');
      return;
    }
    setSalvando(true);
    setErro(null);

    const payload = { camera_id: CAMERA_ID, nome, pontos };

    try {
      // 1. Persiste no backend Node.js
      const r1 = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r1.ok) throw new Error(`Backend: ${r1.status}`);

      // 2. Aplica imediatamente no orquestrador
      await fetch(ORQUESTRADOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {}); // orquestrador pode estar offline — não bloqueia

      setZonaConfig(payload);
      onClose();
    } catch (err) {
      setErro(`Erro ao salvar: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  // ── Remover zona ────────────────────────────────────────────────────────────
  const remover = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await fetch(`${BACKEND_URL}/${CAMERA_ID}`, { method: 'DELETE' });
      await fetch(ORQUESTRADOR_URL, { method: 'DELETE' }).catch(() => {});
      setZonaConfig(null);
      onClose();
    } catch (err) {
      setErro(`Erro ao remover: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#141518', border: '1px solid #1e2025',
        borderRadius: 12, overflow: 'hidden',
        width: 720, maxWidth: '95vw',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px', borderBottom: '1px solid #1e2025',
        }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 16, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: '#e2e4e8',
          }}>
            Configurar Zona de Risco
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#4a4e5a',
            fontSize: 18, cursor: 'pointer', lineHeight: 1,
          }}>✕</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nome da zona */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#4a4e5a', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
              NOME DA ZONA
            </span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={{
                flex: 1, background: '#0d0e10', border: '1px solid #252830',
                borderRadius: 6, padding: '6px 10px',
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#e2e4e8',
                outline: 'none',
              }}
            />
          </div>

          {/* Instrução */}
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#45484f', margin: 0, letterSpacing: '0.06em' }}>
            CLIQUE NO FRAME PARA ADICIONAR PONTOS DO POLÍGONO ({pontos.length} ponto{pontos.length !== 1 ? 's' : ''})
          </p>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleCanvasClick}
            style={{
              width: '100%', aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
              borderRadius: 8, border: '1px solid #252830',
              cursor: 'crosshair', display: 'block',
            }}
          />

          {erro && (
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#e05252', margin: 0 }}>
              {erro}
            </p>
          )}

          {/* Ações */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={desfazer} disabled={pontos.length === 0} style={btnStyle('#1a1c21', '#4a4e5a')}>
                Desfazer
              </button>
              <button onClick={limpar} disabled={pontos.length === 0} style={btnStyle('#1a1c21', '#4a4e5a')}>
                Limpar
              </button>
              {zonaConfig && (
                <button onClick={remover} disabled={salvando} style={btnStyle('#2a1010', '#e05252')}>
                  Remover zona
                </button>
              )}
            </div>
            <button onClick={salvar} disabled={salvando || pontos.length < 3} style={btnStyle('#1a2a1a', '#3cc87a')}>
              {salvando ? 'Salvando...' : 'Salvar zona'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const btnStyle = (bg, color) => ({
  background: bg, border: `1px solid ${color}`,
  borderRadius: 6, padding: '7px 14px',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11, color, cursor: 'pointer',
  letterSpacing: '0.06em',
});

export default ZonaConfigModal;
