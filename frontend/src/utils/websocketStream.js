// src/utils/websocketStream.js

/**
 * Processa mensagens binárias do WebSocket para streams de vídeo.
 * Converte o frame JPEG em ObjectURL apenas se pertencer estritamente à câmera informada.
 * 
 * @param {MessageEvent} event Evento recebido no ws.onmessage
 * @param {Object} cam Câmera esperada ({ id, ip, setor, papel })
 * @returns {Promise<{ imageUrl: string, isConnected: boolean } | null>}
 */
export async function processWsStreamMessage(event, cam) {
  try {
    if (!(event.data instanceof Blob)) return null;

    const arrayBuffer = await event.data.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const newlineIndex = bytes.indexOf(10); // Procura a quebra de linha (\n) após o JSON

    if (newlineIndex === -1) return null;

    const headerData = bytes.subarray(0, newlineIndex);
    const headerString = new TextDecoder().decode(headerData);
    
    let header;
    try {
      header = JSON.parse(headerString);
    } catch {
      return null;
    }

    if (header.type !== 'frame') return null;

    // --- TRAVA RIGOROSA DE VALIDAÇÃO (PREVINE DUPLICAÇÃO DE STREAM) ---

    // 1. Validação por IP (Se informado pelo backend e cadastrado na câmera)
    if (header.ip && cam?.ip) {
      if (header.ip !== cam.ip) return null;
    }
    // 2. Validação por ID (Se informado no header)
    else if (header.cameraId && cam?.id) {
      if (String(header.cameraId) !== String(cam.id)) return null;
    }
    // 3. Validação por Setor e Papel (Caso IP e ID não venham no pacote)
    else if (!header.ip && !header.cameraId) {
      if (!cam?.setor || !cam?.papel) return null;
      if (header.setor !== cam.setor) return null;
      if (header.source !== cam.papel) return null;
    }

    // Se validou com sucesso, gera a URL da imagem JPEG
    const jpegBlob = new Blob([bytes.subarray(newlineIndex + 1)], { type: 'image/jpeg' });
    const imageUrl = URL.createObjectURL(jpegBlob);

    return {
      imageUrl,
      isConnected: true,
    };
  } catch (err) {
    return null;
  }
}