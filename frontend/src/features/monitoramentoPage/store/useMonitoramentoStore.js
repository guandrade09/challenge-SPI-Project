import { create } from 'zustand';
import { CAMERA_STATUS } from '../enums';

export const useMonitoramentoStore = create((set) => ({
  status: CAMERA_STATUS.IDLE,
  detections: {
    colete: false,
    oculus: false,
    capacete: false,
  },
  alertas: [],
  
  setStatus: (newStatus) => set({ status: newStatus }),
  toggleDetection: (key) => set((state) => ({
    detections: { ...state.detections, [key]: !state.detections[key] }
  })),
  addAlerta: (alerta) => set((state) => ({ 
    alertas: [alerta, ...state.alertas] 
  })),
}));