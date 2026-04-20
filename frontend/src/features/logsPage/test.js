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