import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Camera, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Progress } from "../../../components/ui/Progress";

export function CameraInfo({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status das Câmeras</CardTitle>
        <CardDescription>Monitoramento em tempo real das câmeras de visão computacional</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((camera) => (
          <div key={camera.id} className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Camera className="h-5 w-5 text-gray-600" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{camera.name}</h4>
                <Badge
                  variant={camera.status === 'online' ? 'default' : camera.status === 'warning' ? 'secondary' : 'destructive'}
                  className="gap-1"
                >
                  {camera.status === 'online' ? (
                    <Wifi className="h-3 w-3" />
                  ) : camera.status === 'warning' ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  {camera.status === 'online' ? 'Online' : camera.status === 'warning' ? 'Atenção' : 'Offline'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">FPS</p>
                  <p className="font-medium">{camera.fps}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Resolução</p>
                  <p className="font-medium">{camera.resolution}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Detecções (hoje)</p>
                  <p className="font-medium">{camera.detections}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium">{camera.uptime}%</span>
                </div>
                <Progress value={camera.uptime} />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default CameraInfo;