import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Camera, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Progress } from "../../../components/ui/Progress";

export function CameraInfo({ data, theme = "dynamic" }) {
  return (
    <div className={`panel-theme-${theme} w-full --mt-2`}>
      <Card className="panel-base backdrop-blur-sm">
        <CardHeader className="panel-header-base">
          <div>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-main-theme">
              Status das Câmeras
            </CardTitle>
            <CardDescription className="text-xs font-mono text-muted-theme mt-0.5">
              Monitoramento em tempo real das cameras de visão computacional
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4">
          {data.map((camera) => (
            <div key={camera.id} className="flex items-start gap-4 camera-card-container gap-8 p-4 border rounded-lg border-theme-divider">
              {/* Slot do Ícone da Câmera */}
              <div 
                className="p-2 border rounded-lg shrink-0 border-theme-divider" 
                style={{ backgroundColor: 'var(--p-bg)' }}
              >
                <Camera className="h-4 w-4 text-main-theme" />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-sm text-main-theme truncate">{camera.name}</h4>
                  
                  {/* Status Badge Dinâmico com Efeito de Glow e Animação */}
                  <Badge
                    variant="none"
                    className={`relative gap-1.5 font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-md border transition-all duration-300 flex items-center ${
                      camera.status === 'online' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                        : camera.status === 'warning' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)] animate-[pulse_2s_infinite_ease-in-out]' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20 opacity-70'
                    }`}
                  >
                    {/* Indicador luminoso/ponto pulsante */}
                    {camera.status === 'online' && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                    )}

                    {camera.status === 'warning' && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                      </span>
                    )}

                    {/* Ícones internos */}
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

                {/* Grade de Métricas Industrializada */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono metric-block-divider">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-theme">FPS</p>
                    <p className="font-bold mt-0.5 text-main-theme">{camera.fps}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-theme">Resolução</p>
                    <p className="font-bold mt-0.5 text-main-theme">{camera.resolution}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-theme">Detecções</p>
                    <p className="font-bold mt-0.5 text-main-theme">{camera.detections}</p>
                  </div>
                </div>

                {/* Seção do Uptime com a Barra Corrigida */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="uppercase tracking-wide text-muted-theme">Uptime</span>
                    <span className="font-bold text-main-theme">{camera.uptime}%</span>
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
        </CardContent>
      </Card>
    </div>
  );
}

export default CameraInfo;