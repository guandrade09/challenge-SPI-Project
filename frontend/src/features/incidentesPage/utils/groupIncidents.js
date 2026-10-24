// O backend grava UM incidente confirmado como UMA LINHA POR CAUSA (ver createDetection): todas
// as linhas compartilham timestamp e arquivos de imagem, e cada uma traz o label normalizado
// ("CAPACETE", "ERGONOMIA", "Zona de Risco") com flags (epi_ausente, reba_nivel).
// Linha = causa; incidente = conjunto de linhas com o mesmo img_path. A página de Incidentes
// mostra 1 cartão por incidente, então as linhas são reagrupadas aqui.

const isTrue = (v) => v === true || v === 1 || v === '1';
const isFalse = (v) => v === false || v === 0 || v === '0';

// Devolve ao label o sufixo que a normalização removeu, para a exibição ("Sem Capacete").
// O orquestrador só confirma rótulos de risco (AUSENTE ou ERRADO): epi_ausente=1 → AUSENTE,
// epi_ausente=0 → ERRADO. epi_ausente nulo (ergonomia, zona, linhas antigas) fica como está.
function displayLabel(row) {
  const label = row?.label ?? '';
  if (!label) return label;
  if (isTrue(row.epi_ausente)) return `${label} - AUSENTE`;
  if (isFalse(row.epi_ausente)) return `${label} - ERRADO`;
  return label;
}

// Chave do incidente. As linhas de um mesmo incidente compartilham img_path, timestamp e camera_id
// (o service calcula o timestamp uma vez por POST). Usar só o img_path juntaria incidentes
// DIFERENTES que caíssem no mesmo milissegundo (o arquivo é `frame_<Date.now()>.jpg` dentro da
// pasta do segundo); com timestamp + câmera isso deixa de acontecer.
export function incidentKey(row) {
  const when = `${row?.timestamp ?? ''}|${row?.camera_id ?? ''}`;
  if (row?.img_path) return `img:${row.img_path}|${when}`;
  return `row:${when}|${row?.label ?? ''}`;
}

/**
 * Agrupa as linhas de detecção por incidente, preservando a ordem da primeira ocorrência.
 * O incidente resultante é a primeira linha do grupo, com `label` composto ("A, B") — o formato
 * que o cartão, o modal e a busca já sabem tratar.
 */
export function groupIncidentRows(rows) {
  const groups = new Map();
  for (const row of rows ?? []) {
    const key = incidentKey(row);
    const label = displayLabel(row);
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { incident: row, labels: label ? [label] : [] });
    } else if (label && !group.labels.includes(label)) {
      group.labels.push(label);
    }
  }
  return [...groups.values()].map(({ incident, labels }) => ({
    ...incident,
    label: labels.length ? labels.join(', ') : incident.label,
  }));
}
