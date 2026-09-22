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
<<<<<<< Updated upstream
}
=======
};

// Fallback dos toggles de EPI (mesmas 6 chaves de EPI_KEY_TO_PREFIX no orquestrador). A lista
// oficial vem de GET /config/epis (ver epiConfigService.getEpiOptions); isto só vale se ele não responder.
export const DETECTION_CONFIG = [
  { id: 'colete',    label: 'Colete'    },
  { id: 'oculos',    label: 'Óculos'    },
  { id: 'capacete',  label: 'Capacete'  },
  { id: 'mascara',   label: 'Máscara'   },
  { id: 'auricular', label: 'Auricular' },
  { id: 'botas',     label: 'Botas'     },
];
>>>>>>> Stashed changes
