// src/mocks/test.js

const rawLogs = [
  { timestamp: '14:21:05', topic: 'Sistema', logs: 'Inicializando protocolo MQTT...' },
  { timestamp: '14:22:10', topic: 'Segurança', logs: 'Operário detectado sem capacete na Zona B.' },
  { timestamp: '14:23:15', topic: 'Erro Crítico', logs: 'Vestimenta ausente em área de risco. Este é um log extenso para testar se o texto quebra corretamente no card e se o scroll do painel funciona como esperado.' },
  { timestamp: '14:24:20', topic: 'IA', logs: 'Detecção de óculos de proteção confirmada.' },
  { timestamp: '14:25:30', topic: 'Hardware', logs: 'ESP32-P4 atingiu 72°C. Iniciando resfriamento.' },
  { timestamp: '14:27:00', topic: 'Estufa', logs: 'Umidade acima do limite (85%). Atuadores ativados.' },
  { timestamp: '14:28:45', topic: 'Rede', logs: 'Queda de frames detectada na Câmera 01.' },
  { timestamp: '14:30:10', topic: 'Invasão', logs: 'Objeto não identificado próximo à Área Restrita 02.' },
  { timestamp: '14:32:00', topic: 'Suporte', logs: 'Sincronização de relógio NTP concluída com o servidor local.' },
  { timestamp: '14:35:15', topic: 'ML', logs: 'Nova classe "Luva de Proteção" adicionada às estatísticas.' },
  { timestamp: '14:38:20', topic: 'Status', logs: 'Verificação de scroll ativa. O botão fixo deve estar visível aqui.' }
];

// Aqui criamos a dummyLogs combinando topic e logs na string message
export const dummyLogs = rawLogs.map(item => ({
  ...item,
  message: `${item.topic}: ${item.logs}`
}));

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
    { name: 'Capacete', value: 450, color: '#B59481' }, // Cor padrão do seu sistema
  { name: 'Colete', value: 380, color: '#6366f1' },   // Índigo para contraste
  { name: 'Oculos', value: 120, color: '#71ff5e' },   // Verde neon para destaque
  { name: 'Invasão', value: 15, color: '#ef4444' }    // Vermelho para alertas críticos
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
  { hora: '10:00:08', latencia: 32, jitter: 2 },
  { hora: '10:00:09', latencia: 35, jitter: 4 },
  { hora: '10:00:10', latencia: 31, jitter: 1 },
  { hora: '10:00:11', latencia: 85, jitter: 15 }, // Pico de latência!
  { hora: '10:00:12', latencia: 42, jitter: 5 },
  { hora: '10:00:13', latencia: 38, jitter: 3 },
  { hora: '10:00:14', latencia: 33, jitter: 2 },
  { hora: '10:00:15', latencia: 32, jitter: 4 },
  { hora: '10:00:16', latencia: 35, jitter: 1 },
  { hora: '10:00:17', latencia: 31, jitter: 15}, // Pico de latencia
  { hora: '10:00:18', latencia: 85, jitter: 5 },
  { hora: '10:00:19', latencia: 42, jitter: 3 },
  { hora: '10:00:20', latencia: 38, jitter: 2 },
];

export const anomalyData = [
  { categoria: 'Capacete', confianca: 98, importancia: 10 },
  { categoria: 'Capacete', confianca: 92, importancia: 8 },
  { categoria: 'Luva', confianca: 85, importancia: 12 },
  { categoria: 'Luva', confianca: 45, importancia: 20 }, // Anomalia (Baixa confiança)
  { categoria: 'Área Restrita', confianca: 99, importancia: 30 },
  { categoria: 'Área Restrita', confianca: 55, importancia: 25 }, // Anomalia
];

export const reportSummaryMock = {
  resumo: "Relatório gerado com sucesso. Durante o período, foram detectados 45 eventos de conformidade e 12 alertas de segurança. O tempo médio de resposta do ESP32-P4 foi de 34ms, mantendo estabilidade via Ethernet.",
  pdf_download: "url_futura_blob",
  status: "sucesso",
  data_geracao: "20/04/2026 12:36"
};


export const confidenceData = [
  { range: "0-20%", quantidade: 2 },
  { range: "20-40%", quantidade: 5 },
  { range: "40-60%", quantidade: 12 }, // Faixa de Incerteza
  { range: "60-80%", quantidade: 45 },
  { range: "80-100%", quantidade: 130 } // Faixa de Estabilidade
];

export const resourceData = [
  { time: "10:00", core0: 45, core1: 52, core2: 82 },
  { time: "10:05", core0: 46, core1: 58, core2: 32 },
  { time: "10:10", core0: 45, core1: 65, core2: 66 },
  { time: "10:15", core0: 47, core1: 72, core2: 30 }, // Pico de processamento
  { time: "10:20", core0: 46, core1: 68, core2: 42 },
];
