import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/Table";
import { Badge }  from "../../../components/ui/Badge";
import { Download, FileText, Calendar } from "lucide-react";
import { IconButtonModal } from '../../../components/shared';
import { reportService } from '../../../services/reportService';

export function DownloadHistory({ data, theme = "light" }) {
  const handleDownload = async (filename) => {
    try {
      await reportService.downloadReportFile(filename);
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
    }
  };

  return (
    <div className={`panel-theme-${theme}`}>
      <Card className="panel-base backdrop-blur-sm transition-all duration-200 hover:border-[var(--p-subtext)]">
        <CardHeader className="panel-header-base">
          <div>
            <CardTitle className="text-theme-title text-lg">
              Histórico de Downloads
            </CardTitle>
            <CardDescription className="text-theme-muted text-xs mt-0.5">
              Relatórios e logs exportados recentemente
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-theme-divider hover:bg-transparent">
                <TableHead className="text-theme-head">Arquivo</TableHead>
                <TableHead className="text-theme-head">Tipo</TableHead>
                <TableHead className="text-theme-head">Data</TableHead>
                <TableHead className="text-theme-head">Tamanho</TableHead>
                <TableHead className="text-theme-head text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((download) => (
                <TableRow key={download.id || download.fileName} className="border-b border-theme-divider row-theme-hover transition-colors duration-200">
                  <TableCell className="text-theme-main font-bold text-xs py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 opacity-60" />
                      <span className="truncate max-w-xs uppercase">{download.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="none" className="badge-theme-industrial font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md">
                      {download.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-theme-main text-xs font-medium">
                      <Calendar className="h-3 w-3 opacity-50" />
                      {new Date(download.date).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-xs text-theme-muted">{download.size}</TableCell>
                  <TableCell className="text-right py-2">
                    <IconButtonModal
                      onClick={() => handleDownload(download.fileName)}
                      icon={Download}
                      className="panel-btn-toggle"
                    />
                  </TableCell>
                </TableRow>
              ))}

              {data?.length === 0 && (
                <TableRow key="empty" className="border-b border-theme-divider">
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