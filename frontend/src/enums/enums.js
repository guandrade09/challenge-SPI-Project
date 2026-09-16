export const CAMERA_STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  ONLINE: 'online',
  OFFLINE: 'offline'
};

export const PANEL_STATUS = {
  PRONTO:          'pronto',
  ATENCAO:         'atencao',
  ALERTA:          'alerta',
  ALERTA_CRITICO:  'alerta_critico',
  ALERTA_MULTIPLO: 'alerta_multiplo',
};

export const DETECTION_CONFIG = [
  { id: 'colete',   label: 'Detectar Colete'   },
  { id: 'oculos',   label: 'Detectar Óculos'   },
  { id: 'capacete', label: 'Detectar Capacete' },
  { id: 'mascara',  label: 'Detectar Máscara'  },
];