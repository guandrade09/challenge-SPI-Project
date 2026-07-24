import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Camera, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Progress } from "../../../components/ui/Progress";

export function CameraInfo({ data = [], theme = "dynamic" }) {
  return (
    <div className={`panel-theme-${theme} font-theme-body w-full`}>
      <Card className="panel-base backdrop-blur-sm transition-all duration-200 hover:border-[var(--p-subtext)]">
        
        {/* Cabeçalho do Card */}
        <CardHeader className="panel-header-base">
          <div>
            <CardTitle className="text-theme-title text-sm">
              Status das Câmeras
            </CardTitle>
            <CardDescription className="text-theme-muted text-xs mt-0.5">
              Monitoramento em tempo real das câmeras de visão computacional
            </CardDescription>
          </div>
        </CardHeader>
        
        {/* Lista de Câmeras */}
        <CardContent className="space-y-4 pt-4">
          {data.map((camera) => (
            <div 
              key={camera.id} 
              className="flex items-start gap-3.5 p-3.5 border rounded-xl border-theme-divider row-theme-hover transition-colors duration-200"
            >
              {/* Container do Ícone da Câmera (Estilo Micro-Card) */}
              <div className="p-2 border rounded-lg shrink-0 border-theme-divider bg-[var(--p-header-bg)] text-[var(--p-subtext)]">
                <Camera className="h-4 w-4 opacity-80" />
              </div>

              {/* Conteúdo Informativo */}
              <div className="flex-1 space-y-3 min-w-0">
                
                {/* Nome da Câmera + Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-xs text-[var(--p-text)] truncate">
                    {camera.name}
                  </h4>
                  
                  {/* Status Badge Dinâmico */}
                  <Badge
                    variant="none"
                    className={`relative gap-1.5 font-semibold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-md border transition-all duration-300 flex items-center shrink-0 ${
                      camera.status === 'online' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                        : camera.status === 'warning' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)] animate-[pulse_2s_infinite_ease-in-out]' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20 opacity-70'
                    }`}
                  >
                    {/* Indicador Luminoso (Ponto Pulsante) */}
                    {(camera.status === 'online' || camera.status === 'warning') && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          camera.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                          camera.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}></span>
                      </span>
                    )}

                    {/* Ícone do Status */}
                    {camera.status === 'online' ? (
                      <Wifi className="h-2.5 w-2.5" />
                    ) : camera.status === 'warning' ? (
                      <AlertTriangle className="h-2.5 w-2.5" />
                    ) : (
                      <WifiOff className="h-2.5 w-2.5" />
                    )}

                    <span>
                      {camera.status === 'online' ? 'Online' : camera.status === 'warning' ? 'Atenção' : 'Offline'}
                    </span>
                  </Badge>
                </div>

                {/* Grade de Métricas Industrializadas */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-theme-head p-2 opacity-75">FPS</p>
                    <p className="font-semibold mt-0.5 p-2 text-[var(--p-text)]">{camera.fps}</p>
                  </div>
                  <div>
                    <p className="text-theme-head p-2 opacity-75 ">Resolução</p>
                    <p className="font-semibold mt-0.5 p-2 text-[var(--p-text)]">{camera.resolution}</p>
                  </div>
                  <div>
                    <p className="text-theme-head p-2 opacity-75 gap-1">Detecções</p>
                    <p className="font-semibold mt-0.5 p-2 text-[var(--p-text)]">{camera.detections}</p>
                  </div>
                </div>

                {/* Barra de Uptime */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-theme-head opacity-75">Uptime</span>
                    <span className="font-semibold text-xs text-[var(--p-text)]">{camera.uptime}%</span>
                  </div>
                  <Progress 
                    value={camera.uptime} 
                    className="h-1.5 progress-track-theme"
                    indicatorClassName="progress-fill-theme" 
                  />
                </div>

              </div>
            </div>
          ))}

          {/* Estado Vazio (Zero câmeras) */}
          {data.length === 0 && (
            <div className="text-center py-6 text-sm text-theme-muted border border-dashed border-theme-divider rounded-xl">
              Nenhuma câmera configurada no momento.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CameraInfo;