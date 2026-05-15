import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/Table";
import { Badge }  from "../../../components/ui/Badge";
import { Download, FileText, Calendar } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { IconButtonModal } from '../../../components/shared'

export function DownloadHistory({ data }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Histórico de Downloads</CardTitle>
            <CardDescription>Relatórios e logs exportados recentemente</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arquivo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((download) => (
              <TableRow key={download.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {download.fileName}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{download.type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(download.date).toLocaleDateString('pt-BR')}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{download.size}</TableCell>
                <TableCell className="text-right">
                  <IconButtonModal
                  onClick={() => alert("Ainda n funciona")}
                  icon={Download}
                  className="bg-blue-100 hover:bg-blue-600"
                  variant="ghost"/>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default DownloadHistory;