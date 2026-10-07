import { streamService } from '../../../services/streamService';
import { drawIncidentOverlays } from './drawIncidentOverlays';

const encoder = new TextEncoder();
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ZIP sem compressão: imagens JPEG/PNG já são comprimidas e não exigem dependência adicional.
export function createZip(files) {
  if (!files.length) throw new Error('Não há imagens para exportar.');
  if (files.length > 65535) throw new Error('Quantidade de arquivos acima do limite do ZIP.');
  const parts = [];
  const directory = [];
  let offset = 0;
  let directorySize = 0;
  for (const { name, bytes } of files) {
    const nameBytes = encoder.encode(name);
    if (nameBytes.length > 65535 || bytes.length > 0xffffffff) throw new Error('Arquivo acima do limite do ZIP.');
    const crc = crc32(bytes);
    const local = new Uint8Array(30 + nameBytes.length);
    const header = new DataView(local.buffer);
    header.setUint32(0, 0x04034b50, true);
    header.setUint16(4, 20, true);
    header.setUint16(6, 0x0800, true);
    header.setUint16(10, 0, true);
    header.setUint16(12, 33, true);
    header.setUint32(14, crc, true);
    header.setUint32(18, bytes.length, true);
    header.setUint32(22, bytes.length, true);
    header.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    parts.push(local, bytes);

    const central = new Uint8Array(46 + nameBytes.length);
    const record = new DataView(central.buffer);
    record.setUint32(0, 0x02014b50, true);
    record.setUint16(4, 20, true);
    record.setUint16(6, 20, true);
    record.setUint16(8, 0x0800, true);
    record.setUint16(14, 33, true);
    record.setUint32(16, crc, true);
    record.setUint32(20, bytes.length, true);
    record.setUint32(24, bytes.length, true);
    record.setUint16(28, nameBytes.length, true);
    record.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    directory.push(central);
    directorySize += central.length;
    offset += local.length + bytes.length;
    if (offset > 0xffffffff) throw new Error('ZIP acima de 4 GB; exporte menos incidentes por vez.');
  }
  if (offset + directorySize > 0xffffffff) throw new Error('ZIP acima de 4 GB; exporte menos incidentes por vez.');
  const end = new Uint8Array(22);
  const footer = new DataView(end.buffer);
  footer.setUint32(0, 0x06054b50, true);
  footer.setUint16(8, files.length, true);
  footer.setUint16(10, files.length, true);
  footer.setUint32(12, directorySize, true);
  footer.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end], { type: 'application/zip' });
}

function extension(blob, path) {
  if (blob.type.includes('png')) return 'png';
  if (blob.type.includes('webp')) return 'webp';
  if (blob.type.includes('jpeg') || blob.type.includes('jpg')) return 'jpg';
  const fromPath = String(path).split('?')[0].match(/\.(png|webp|jpe?g)$/i)?.[1]?.toLowerCase();
  return fromPath === 'jpeg' ? 'jpg' : fromPath || 'jpg';
}

async function fetchFrame(path) {
  const response = await fetch(streamService.imagePathToUrl(path));
  if (!response.ok) throw new Error(`Não foi possível carregar um frame (HTTP ${response.status}).`);
  return response.blob();
}

async function annotatedFrame(blob, details, source, hasLateralFrame) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível.');
    ctx.drawImage(image, 0, 0);
    drawIncidentOverlays(ctx, details, source, canvas.width, canvas.height, { hasLateralFrame });
    return await new Promise((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Falha ao renderizar um frame.')), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadIncidentsZip(incidents, mode) {
  if (!['normal', 'bounding', 'both'].includes(mode)) throw new Error('Tipo de download inválido.');
  const files = [];
  for (const [index, incident] of incidents.entries()) {
    const paths = [[incident.details?.image_source || incident.details?.frames?.frontal?.source || 'frontal', incident.img_path]];
    if (incident.img_path_lateral) paths.push([incident.details?.frames?.lateral?.source || 'lateral', incident.img_path_lateral]);
    for (const [source, path] of paths) {
      if (!path) throw new Error('Um incidente selecionado não possui frame.');
      const blob = await fetchFrame(path);
      const safeTime = String(incident.timestamp || 'sem_data').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      const name = `frame_${String(index + 1).padStart(4, '0')}_${safeTime}_${source}`;
      if (mode !== 'bounding') {
        files.push({ name: `original/${name}.${extension(blob, path)}`, bytes: new Uint8Array(await blob.arrayBuffer()) });
      }
      if (mode !== 'normal') {
        const rendered = await annotatedFrame(blob, incident.details, source, !!incident.img_path_lateral);
        files.push({ name: `bounding_box/${name}.png`, bytes: new Uint8Array(await rendered.arrayBuffer()) });
      }
    }
  }
  const zip = createZip(files);
  const url = URL.createObjectURL(zip);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'incidentes.zip';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
