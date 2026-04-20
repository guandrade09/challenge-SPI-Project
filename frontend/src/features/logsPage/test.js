export const dummyLogs = [
  { timestamp: '14:21:05', message: 'Câmera 01 conectada' },
  { timestamp: '14:22:10', message: 'Alerta: Detecção de capacete ausente,' },
  { timestamp: '14:23:15', message: 'Alerta: Detecção de vestimenta de segurança ausente, e mais coisa que não fazem sentido e teste para não caber na tela' },
  { timestamp: '14:24:20', message: 'Pronto: Detecção de oculos de proteção' },
];

export const lineLogs = [
  { hora: '00:00', alertas: 20},
  { hora: '02:00', alertas: 0},
  { hora: '04:00', alertas: 40},
  { hora: '06:00', alertas: 10},
  { hora: '08:00', alertas: 5 },
  { hora: '10:00', alertas: 12 },
  { hora: '12:00', alertas: 8 },
  { hora: '14:00', alertas: 25 },
  { hora: '16:00', alertas: 18 },
  { hora: '18:00', alertas: 10 },
  { hora: '20:00', alertas: 5},
  { hora: '22:00', alertas: 3},
  { hora: '23:59', alertas: 6}
];

export const pizzaLogs = [
  { name: 'Acerto', value: 30, color: '#00ff00' },
  { name: 'Erro', value: 100, color: '#ff0000' },
  { name: 'Acerto com erro', value: 20, color: '#0000ff' },
];

export const colunasLogs = [
  { name: 'Capacete', detectado: 45, naoDetectado: 12 },
  { name: 'Colete', detectado: 38, naoDetectado: 19 },
  { name: 'Óculos', detectado: 52, naoDetectado: 5 },
];

export const radarData = [
  { subject: 'Precisão IA', A: 120, fullMark: 150 },
  { subject: 'Conexão ESP32', A: 98, fullMark: 150 },
  { subject: 'Segurança (EPI)', A: 86, fullMark: 150 },
  { subject: 'Tempo de Resposta', A: 99, fullMark: 150 },
  { subject: 'Estabilidade', A: 85, fullMark: 150 },
];

export const areaLogs = [
  { hora: '00:00', alertas: 20, processamento: 10},
  { hora: '02:00', alertas: 0,  processamento: 30},
  { hora: '04:00', alertas: 40, processamento: 0},
  { hora: '06:00', alertas: 10, processamento: 10 },
  { hora: '08:00', alertas: 10, processamento: 20 },
  { hora: '10:00', alertas: 25, processamento: 45 },
  { hora: '12:00', alertas: 15, processamento: 30 },
  { hora: '14:00', alertas: 45, processamento: 80 },
  { hora: '16:00', alertas: 30, processamento: 55 },
  { hora: '18:00', alertas: 20, processamento: 40 },
  { hora: '20:00', alertas: 10, processamento: 25 },
  { hora: '22:00', alertas: 3,  processamento: 15 },
  { hora: '23:59', alertas: 6,  processamento: 5  }
];

export const composedLogs = [
  { hora: '00:00', alertas: 0, processamento: 30,  precisao: 89 },
  { hora: '02:00', alertas: 30, processamento: 25, precisao: 91 },
  { hora: '04:00', alertas: 3, processamento: 10,  precisao: 88 },
  { hora: '06:00', alertas: 7, processamento: 50,  precisao: 93 },
  { hora: '08:00', alertas: 5, processamento: 40,  precisao: 95 },
  { hora: '10:00', alertas: 12, processamento: 75, precisao: 92 },
  { hora: '12:00', alertas: 8, processamento: 55,  precisao: 98 },
  { hora: '14:00', alertas: 25, processamento: 95, precisao: 88 },
  { hora: '16:00', alertas: 18, processamento: 65, precisao: 94 },
  { hora: '18:00', alertas: 10, processamento: 45, precisao: 96 },
  { hora: '20:00', alertas: 20, processamento: 30, precisao: 92 },
  { hora: '22:00', alertas: 25, processamento: 67, precisao: 90 },
  { hora: '23:59', alertas: 15, processamento: 85, precisao: 88 },
];

export const confusionMatrixData = [
  { actual: 'Capacete', predicted: 'Capacete', value: 95 }, // Acerto
  { actual: 'Capacete', predicted: 'Colete', value: 2 },     // Erro
  { actual: 'Capacete', predicted: 'Oculos', value: 3 },   // Erro
  { actual: 'Colete', predicted: 'Capacete', value: 5 },     // Erro
  { actual: 'Colete', predicted: 'Colete', value: 82 },       // Acerto
  { actual: 'Colete', predicted: 'Oculos', value: 13 },     // Erro
  { actual: 'Oculos', predicted: 'Capacete', value: 1 },   // Erro
  { actual: 'Oculos', predicted: 'Colete', value: 4 },       // Erro
  { actual: 'Oculos', predicted: 'Oculos', value: 95 },   // Acerto
];

export const latencyLogs = [
  { hora: '10:00:01', latencia: 32, jitter: 2 },
  { hora: '10:00:02', latencia: 35, jitter: 4 },
  { hora: '10:00:03', latencia: 31, jitter: 1 },
  { hora: '10:00:04', latencia: 85, jitter: 15 }, // Pico de latência!
  { hora: '10:00:05', latencia: 42, jitter: 5 },
  { hora: '10:00:06', latencia: 38, jitter: 3 },
  { hora: '10:00:07', latencia: 33, jitter: 2 },
];

export const anomalyData = [
  { categoria: 'Capacete', confianca: 98, importancia: 10 },
  { categoria: 'Capacete', confianca: 92, importancia: 8 },
  { categoria: 'Luva', confianca: 85, importancia: 12 },
  { categoria: 'Luva', confianca: 45, importancia: 20 }, // Anomalia (Baixa confiança)
  { categoria: 'Área Restrita', confianca: 99, importancia: 30 },
  { categoria: 'Área Restrita', confianca: 55, importancia: 25 }, // Anomalia
];