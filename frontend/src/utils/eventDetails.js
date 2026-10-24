export function parseDetectionDetails(value) {
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return null; }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

export function analyzeEventLog(message = '') {
  const text = String(message).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  if (/erro|error|falha|failed|exception|critico|critical/.test(text)) {
    return { tipo: 'Falha do sistema', analise: 'O registro relata uma falha. Verifique a mensagem e o serviço envolvido antes de considerar a ocorrência resolvida.' };
  }
  if (/nova deteccao/.test(text)) {
    return { tipo: 'Nova detecção registrada', analise: 'O sistema registrou uma nova detecção. Consulte o evento de detecção correspondente para conferir o frame e validar a ocorrência.' };
  }
  if (/metrica de threads salvas/.test(text)) {
    return { tipo: 'Métricas de threads salvas', analise: 'O registro informa que as métricas de threads foram salvas. Esta mensagem não relata falha nem infração de segurança.' };
  }
  if (/desconect|offline|sem conexao/.test(text)) {
    return { tipo: 'Perda de conexão', analise: 'O registro indica perda de conexão. Confira a disponibilidade da câmera ou do serviço; esta mensagem não confirma a reconexão.' };
  }
  if (/alerta|warning|aviso|ausencia|ausente|sem capacete/.test(text)) {
    return { tipo: 'Alerta registrado', analise: 'A mensagem sinaliza uma condição que exige atenção. Confira o contexto do registro para avaliar a necessidade de intervenção.' };
  }
  if (/conectado|connected|iniciado|iniciada|salvo|salva|sucesso/.test(text)) {
    return { tipo: 'Registro operacional', analise: 'A mensagem informa uma operação realizada pelo sistema, sem indicar falha neste registro.' };
  }
  return { tipo: 'Log de sistema', analise: text.trim() ? 'Registro informativo. A mensagem disponível não permite concluir se há uma falha ou uma ocorrência de segurança.' : 'O registro não contém uma mensagem para análise.' };
}

export function parseEventDate(timestamp) {
  // /logs retorna a data no formato YYYY-MM-DD/HH:mm, em Brasília.
  const normalized = typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2}\/\d{2}:\d{2}$/.test(timestamp)
    ? `${timestamp.replace('/', 'T')}:00-03:00`
    : timestamp;
  const date = normalized ? new Date(normalized) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function formatEventLongDate(value) {
  const date = parseEventDate(value);
  if (!date) return 'Data não disponível';
  const timeZone = 'America/Sao_Paulo';
  const day = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone }).format(date);
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone }).format(date);
  return `${day}, ${time}`;
}

export function getEventDetectionSummary(event) {
  if (event?.origem === 'Log') return event.tipo || 'Log do sistema';
  const details = parseDetectionDetails(event?.detectionDetails || event?.detalhes) || {};
  const label = String(event?.label || event?.tipo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const categories = [];
  if (/epi|capacete|colete|mascara|oculos|auricular|bota|luva|protetor|cinto|respirador/.test(label) || (Array.isArray(details.epi) && details.epi.length)) categories.push('EPI');
  if (/ergonomia|ergonomico|reba|queda/.test(label) || (Array.isArray(details.ergonomia) && details.ergonomia.length)) categories.push('Ergonomia');
  if (/zona|invasao/.test(label) || (Array.isArray(details.zona) && details.zona.some((zone) => zone?.invadiu === true || zone?.invadiu === 1))) categories.push('Zona de Risco');
  return categories.join(' • ') || event?.tipo || 'Detecção registrada';
}
