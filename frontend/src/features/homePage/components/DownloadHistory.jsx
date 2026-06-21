import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/Table";
import { Badge }  from "../../../components/ui/Badge";
import { Download, FileText, Calendar } from "lucide-react";
import { IconButtonModal } from '../../../components/shared';

export function DownloadHistory({ data, theme = "light" }) {
  return (
    <div className={`panel-theme-${theme}`}>
      <Card className="panel-base backdrop-blur-sm">
        <CardHeader className="panel-header-base">
          <div>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-theme-main">
              Histórico de Downloads
            </CardTitle>
            <CardDescription className="text-xs font-mono text-theme-onbg-white mt-0.5">
              Relatórios e logs exportados recentemente
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-theme-divider hover:bg-transparent">
                <TableHead className="font-mono text-[11px] uppercase tracking-wider text-theme-main">Arquivo</TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-wider text-theme-main">Tipo</TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-wider text-theme-main">Data</TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-wider text-theme-main">Tamanho</TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-wider text-right text-theme-main">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((download) => (
                <TableRow key={download.id} className="border-b border-theme-divider row-theme-hover transition-colors duration-200">
                  <TableCell className="font-medium text-theme-main py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 opacity-60" />
                      <span className="truncate max-w-xs uppercase">{download.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="none" className="badge-theme-industrial font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md">
                      {download.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-mono text-xs text-theme-main">
                      <Calendar className="h-3 w-3 opacity-50" />
                      {new Date(download.date).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-theme-muted">{download.size}</TableCell>
                  <TableCell className="text-right py-2">
                    <IconButtonModal
                      onClick={() => alert("Ainda n funciona")}
                      icon={Download}
                      className="panel-btn-toggle"
                    />
                  </TableCell>
                </TableRow>
              ))}

              {data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-sm text-theme-muted">
                    Nenhum download recente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default DownloadHistory;