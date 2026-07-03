// src/features/logsPage/components/LogReportModal.jsx
import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { PopupModal } from '../../../../components/shared/PopupModal';

const Section = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', background: 'none', border: 'none',
          cursor: 'pointer', padding: '4px 0',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151' }}>
          {title}
        </span>
        {open ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
      </button>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );
};

const Badge = ({ label, color }) => (
  <span style={{
    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    background: color + '22', color, border: `1px solid ${color}`,
    marginRight: 4,
  }}>
    {label}
  </span>
);

const Bar = ({ label, value, max = 100, cor }) => (
  <div style={{ marginBottom: 6 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
      <span style={{ fontSize: 10, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: cor }}>{value}%</span>
    </div>
    <div style={{ background: '#e5e7eb', borderRadius: 4, height: 6 }}>
      <div style={{ width: `${value}%`, background: cor, borderRadius: 4, height: 6, transition: 'width 0.6s ease' }} />
    </div>
  </div>
);

const gerarPDF = async (data) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const { resumo_executivo, ergonomia, epis, zona, quedas, sistema, classificacao, turno, camera, data_geracao } = data;

  const W = 210;
  const margin = 16;
  let y = 20;

  const linha = () => { doc.setDrawColor(220, 220, 220); doc.line(margin, y, W - margin, y); y += 6; };
  const titulo = (t, size = 13) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(t, margin, y);
    y += size * 0.5 + 2;
  };
  const subtitulo = (t) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(t, margin, y);
    y += 6;
  };
  const texto = (t, indent = 0) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const linhas = doc.splitTextToSize(t, W - margin * 2 - indent);
    doc.text(linhas, margin + indent, y);
    y += linhas.length * 4.5;
  };
  const novaPageSeNecessario = (espaco = 20) => {
    if (y + espaco > 280) { doc.addPage(); y = 20; }
  };

  // ── Cabeçalho ─────────────────────────────────────────────────────────
  doc.setFillColor(20, 21, 24);
  doc.rect(0, 0, W, 32, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO SSMA', margin, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text(`${turno}  ·  ${camera}`, margin, 21);
  doc.text(`Gerado em: ${data_geracao}`, margin, 27);
  y = 42;

  // ── Score geral ────────────────────────────────────────────────────────
  const scoreColor = classificacao?.nivel === 'EXCELENTE' ? [60, 200, 122]
    : classificacao?.nivel === 'BOM' ? [100, 180, 100]
    : classificacao?.nivel === 'REGULAR' ? [212, 160, 23]
    : [224, 82, 82];

  doc.setFillColor(...scoreColor);
  doc.roundedRect(margin, y, 50, 22, 3, 3, 'F');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${classificacao?.score}/100`, margin + 4, y + 13);
  doc.setFontSize(9);
  doc.text(classificacao?.nivel ?? '', margin + 4, y + 19);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const parecer = doc.splitTextToSize(classificacao?.parecer ?? '', W - margin * 2 - 58);
  doc.text(parecer, margin + 56, y + 6);
  y += 30;
  linha();

  // ── Resumo executivo ───────────────────────────────────────────────────
  subtitulo('RESUMO EXECUTIVO');
  texto(resumo_executivo ?? '');
  y += 2; linha();

  // ── Ergonomia ──────────────────────────────────────────────────────────
  novaPageSeNecessario(50);
  subtitulo(`ERGONOMIA — REBA MÉDIO: ${ergonomia?.reba_medio_turno}  |  MÁXIMO: ${ergonomia?.reba_maximo}  |  EVENTOS ALTO: ${ergonomia?.eventos_alto_risco}`);
  texto(`Postura mais frequente: ${ergonomia?.postura_mais_frequente}`);
  ergonomia?.distribuicao?.forEach(d => {
    texto(`${d.nivel}: ${d.percentual}%`, 4);
  });
  y += 2;
  texto('Recomendações:');
  ergonomia?.recomendacoes?.forEach(r => texto(`• ${r}`, 4));
  y += 2; linha();

  // ── EPIs ───────────────────────────────────────────────────────────────
  novaPageSeNecessario(50);
  subtitulo(`EPIs — CONFORMIDADE GERAL: ${epis?.conformidade_geral}%  |  TOTAL ALERTAS: ${epis?.total_alertas}`);
  texto(`EPI crítico: ${epis?.epi_critico}`);
  epis?.por_epi?.forEach(e => {
    texto(`${e.nome}: ${e.conformidade}% conformidade — ${e.alertas} alertas`, 4);
  });
  y += 2;
  texto('Recomendações:');
  epis?.recomendacoes?.forEach(r => texto(`• ${r}`, 4));
  y += 2; linha();

  // ── Zona de risco ──────────────────────────────────────────────────────
  novaPageSeNecessario(40);
  subtitulo(`ZONA DE RISCO — ${zona?.nome}`);
  texto(`Invasões: ${zona?.total_invasoes}  |  Sem EPI: ${zona?.invasoes_sem_epi}  |  Pico: ${zona?.horario_pico}  |  Tempo médio: ${zona?.tempo_medio_invasao_seg}s`);
  texto('Recomendações:');
  zona?.recomendacoes?.forEach(r => texto(`• ${r}`, 4));
  y += 2; linha();

  // ── Quedas ─────────────────────────────────────────────────────────────
  novaPageSeNecessario(25);
  subtitulo(`QUEDAS — Detectadas: ${quedas?.total_detectadas}  |  Confirmadas: ${quedas?.confirmadas}  |  Falsos alarmes: ${quedas?.falsos_alarmes}`);
  if (quedas?.nota) texto(quedas.nota);
  y += 2; linha();

  // ── Sistema ────────────────────────────────────────────────────────────
  novaPageSeNecessario(25);
  subtitulo('PERFORMANCE DO SISTEMA');
  texto(
    `Latência média: ${sistema?.latencia_media_ms}ms  |  Máxima: ${sistema?.latencia_maxima_ms}ms  |  ` +
    `PCK Pose: ${((sistema?.pck_pose_medio ?? 0) * 100).toFixed(0)}%  |  Uptime: ${sistema?.uptime_percentual}%`
  );

  // ── Rodapé ─────────────────────────────────────────────────────────────
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`SPI Challenge — Sistema de Monitoramento de Segurança`, margin, 290);
    doc.text(`Pág. ${i}/${totalPaginas}`, W - margin - 10, 290);
  }

  doc.save(`relatorio_ssma_${data_geracao?.replace(/[/:]/g, '-').replace(/ /g, '_')}.pdf`);
};

export const LogReportModal = ({ isOpen, onClose, data }) => {
  const [gerando, setGerando] = useState(false);

  if (!data) return null;

  const { resumo_executivo, ergonomia, epis, zona, quedas, sistema, classificacao, turno, camera, data_geracao } = data;
  const nivelCor = classificacao?.cor ?? '#6b7280';

  const handleDownload = async () => {
    setGerando(true);
    try {
      await gerarPDF(data);
    } finally {
      setGerando(false);
    }
  };

  return (
    <PopupModal isOpen={isOpen} onClose={onClose} title="Relatório SSMA" icon={FileText}>
      <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>

        {/* Cabeçalho */}
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 14, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}>{turno}</span>
            <Badge label={classificacao?.nivel} color={nivelCor} />
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>{camera} · Gerado em {data_geracao}</div>
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: nivelCor, lineHeight: 1 }}>
              {classificacao?.score}
              <span style={{ fontSize: 14, fontWeight: 400, color: '#9ca3af' }}>/100</span>
            </div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Score SSMA do Turno</div>
          </div>
        </div>

        {/* Parecer */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: '#92400e', lineHeight: 1.6, margin: 0 }}>{classificacao?.parecer}</p>
        </div>

        <Section title="Resumo Executivo" defaultOpen={true}>
          <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.7, margin: 0 }}>{resumo_executivo}</p>
        </Section>

        <Section title={`Ergonomia — REBA Médio: ${ergonomia?.reba_medio_turno}`}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <Badge label={`Máximo: ${ergonomia?.reba_maximo}`} color="#e05252" />
            <Badge label={`${ergonomia?.eventos_alto_risco} eventos ALTO`} color="#e05252" />
          </div>
          {ergonomia?.distribuicao?.map((d) => (
            <Bar key={d.nivel} label={d.nivel} value={d.percentual} cor={d.cor} />
          ))}
          <p style={{ fontSize: 10, color: '#6b7280', margin: '8px 0 4px' }}>
            Postura mais frequente: <strong>{ergonomia?.postura_mais_frequente}</strong>
          </p>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {ergonomia?.recomendacoes?.map((r, i) => (
              <li key={i} style={{ fontSize: 10, color: '#374151', marginBottom: 4 }}>↳ {r}</li>
            ))}
          </ul>
        </Section>

        <Section title={`EPIs — Conformidade Geral: ${epis?.conformidade_geral}%`}>
          <Badge label={`${epis?.total_alertas} alertas`} color="#e05252" />
          <Badge label={`Crítico: ${epis?.epi_critico?.split(' ')[0]}`} color="#d4a017" />
          <div style={{ marginTop: 10 }}>
            {epis?.por_epi?.map((e) => (
              <Bar key={e.nome} label={`${e.nome} — ${e.alertas} alertas`} value={e.conformidade} cor={e.cor} />
            ))}
          </div>
          <ul style={{ margin: '8px 0 0', paddingLeft: 16 }}>
            {epis?.recomendacoes?.map((r, i) => (
              <li key={i} style={{ fontSize: 10, color: '#374151', marginBottom: 4 }}>↳ {r}</li>
            ))}
          </ul>
        </Section>

        <Section title={`Zona de Risco — ${zona?.total_invasoes} invasões`}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <Badge label={`Pico: ${zona?.horario_pico}`} color="#d4a017" />
            <Badge label={`${zona?.invasoes_sem_epi} sem EPI`} color="#e05252" />
            <Badge label={`Média ${zona?.tempo_medio_invasao_seg}s`} color="#6b7280" />
          </div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {zona?.recomendacoes?.map((r, i) => (
              <li key={i} style={{ fontSize: 10, color: '#374151', marginBottom: 4 }}>↳ {r}</li>
            ))}
          </ul>
        </Section>

        <Section title={`Quedas — ${quedas?.total_detectadas} detectada(s)`}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <Badge label={`${quedas?.confirmadas} confirmada(s)`} color={quedas?.confirmadas > 0 ? '#e05252' : '#3cc87a'} />
            <Badge label={`${quedas?.falsos_alarmes} falso(s) alarme(s)`} color="#6b7280" />
          </div>
          {quedas?.nota && <p style={{ fontSize: 10, color: '#6b7280', margin: 0 }}>{quedas.nota}</p>}
        </Section>

        <Section title="Performance do Sistema">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Latência Média', value: `${sistema?.latencia_media_ms}ms` },
              { label: 'Latência Máxima', value: `${sistema?.latencia_maxima_ms}ms` },
              { label: 'PCK Pose Médio', value: `${((sistema?.pck_pose_medio ?? 0) * 100).toFixed(0)}%` },
              { label: 'Uptime', value: `${sistema?.uptime_percentual}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f9fafb', borderRadius: 6, padding: '8px 10px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Botão download */}
        <button
          onClick={handleDownload}
          disabled={gerando}
          style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: gerando ? '#e5e7eb' : '#111827',
            color: gerando ? '#9ca3af' : '#fff',
            fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
            letterSpacing: '0.08em', border: 'none',
            cursor: gerando ? 'not-allowed' : 'pointer',
            marginTop: 8, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, transition: 'background 0.2s',
          }}
        >
          <Download size={14} />
          {gerando ? 'Gerando PDF...' : 'Download PDF'}
        </button>
      </div>
    </PopupModal>
  );
};

export default LogReportModal;