import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Camera, Wifi, WifiOff, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Progress } from "../../../components/ui/progress";
import { IconButtonModal } from "../../../components/shared/IconButtonModal";

export function CameraInfo({ data = [], theme = "light" }) {
  // Estado para controlar a paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Garantia de array
  const camerasList = Array.isArray(data) ? data : [];

  // Cálculos de Paginação
  const totalItems = camerasList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCameras = camerasList.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className={`panel-theme-${theme} font-theme-body space-y-6`}>
      <Card className="panel-base backdrop-blur-sm transition-all duration-200 hover:border-[var(--p-subtext)]">
        {/* Cabeçalho do Card */}
        <CardHeader className="panel-header-base">
          <div className="flex items-center justify-between w-full">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-theme-title text-sm">
                <Camera className="h-4 w-4 text-[var(--p-subtext)]" />
                Câmeras Monitoradas
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full badge-theme-industrial font-mono font-normal">
                  {totalItems} total
                </span>
              </CardTitle>
              <CardDescription className="text-theme-muted text-xs">
                Status e métricas de execução em tempo real
              </CardDescription>
            </div>

            {/* Controles de Paginação no Topo */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-theme-muted hidden sm:inline">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <IconButtonModal
                  onClick={handlePrevPage}
                  icon={ChevronLeft}
                  disabled={currentPage === 1}
                  title="Próxima Página"
                  varint="ghost"
                  className='text[var-(--p-text-title)]'
                  ></IconButtonModal>

                  <IconButtonModal
                  icon={ChevronRight}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  title="Próxima Página"
                  varint="ghost"
                  className='text[var-(--p-text-title)]'
                  ></IconButtonModal>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Conteúdo Principal */}
        <CardContent className="pt-4 space-y-4">
          {currentCameras.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCameras.map((camera) => {
                const nomeCam = camera.nome || camera.name || "Câmera Sem Nome";
                const rawStatus = (camera.status || "").toLowerCase();
                
                let statusVisual = "offline";
                if (rawStatus === "active" || rawStatus === "online") {
                  statusVisual = "online";
                } else if (rawStatus === "registered" || rawStatus === "connecting" || rawStatus === "warning") {
                  statusVisual = "warning";
                }

                const fpsCam = camera.fps ?? 30;
                const resolutionCam = camera.resolution || "1080p";
                const detectionsCam = camera.epis ? (Array.isArray(camera.epis) ? camera.epis.length : 0) : 0;
                const uptimeCam = camera.uptime ?? 99.8;

                return (
                  <div 
                    key={camera.id || camera._id} 
                    className="flex items-start gap-3 p-3 rounded-lg row-theme-hover border border-theme-divider transition-all duration-200"
                  >
                    {/* Avatar / Ícone da Câmera */}
                    <div className="p-2 rounded-md border border-theme-divider bg-[var(--p-header-bg)] shrink-0">
                      <Camera className="h-4 w-4 text-[var(--p-subtext)]" />
                    </div>

                    <div className="flex-1 space-y-2.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate">
                          <h4 className="font-semibold text-xs text-theme-main truncate">
                            {nomeCam}
                          </h4>
                          {camera.setor && (
                            <span className="text-[10px] text-theme-head block truncate">
                              Setor: {camera.setor}
                            </span>
                          )}
                        </div>
                        
                        {/* Status Badge */}
                        <Badge
                          variant="none"
                          className={`relative gap-1 font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border transition-all duration-300 flex items-center shrink-0 ${
                            statusVisual === 'online' 
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                              : statusVisual === 'warning' 
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)] animate-[pulse_2s_infinite_ease-in-out]' 
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 opacity-80'
                          }`}
                        >
                          {(statusVisual === 'online' || statusVisual === 'warning') && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                statusVisual === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}></span>
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                                statusVisual === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}></span>
                            </span>
                          )}

                          {statusVisual === 'online' ? (
                            <Wifi className="h-2.5 w-2.5" />
                          ) : statusVisual === 'warning' ? (
                            <AlertTriangle className="h-2.5 w-2.5" />
                          ) : (
                            <WifiOff className="h-2.5 w-2.5" />
                          )}

                          <span>
                            {statusVisual === 'online' ? 'Ativa' : statusVisual === 'warning' ? 'Registrada' : 'Inativa'}
                          </span>
                        </Badge>
                      </div>

                      {/* Métricas Técnicas */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-theme-head text-[10px]">FPS</p>
                          <p className="font-semibold text-theme-main">{fpsCam}</p>
                        </div>
                        <div>
                          <p className="text-theme-head text-[10px]">Resolução</p>
                          <p className="font-semibold text-theme-main">{resolutionCam}</p>
                        </div>
                        <div>
                          <p className="text-theme-head text-[10px]">EPIs Monit.</p>
                          <p className="font-semibold text-theme-main">{detectionsCam}</p>
                        </div>
                      </div>

                      {/* Progresso / Uptime */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-theme-head">Uptime</span>
                          <span className="font-semibold text-theme-main">{uptimeCam}%</span>
                        </div>
                        <Progress 
                          value={uptimeCam} 
                          className="h-1.5 progress-track-theme"
                          indicatorClassName="progress-fill-theme" 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-theme-muted border border-dashed border-theme-divider rounded-xl">
              Nenhuma câmera encontrada no banco de dados.
            </div>
          )}

          {/* Rodapé da Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-theme-divider text-xs text-theme-muted">
              <span>
                Exibindo {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} câmeras
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CameraInfo;