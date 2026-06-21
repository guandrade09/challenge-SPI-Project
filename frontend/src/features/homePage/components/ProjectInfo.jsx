import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Users, Building2, Calendar, Target } from "lucide-react";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";

export function ProjectInfo({ data, theme = "light" }) {
  return (
    <div className={`panel-theme-${theme} space-y-6`}>
      {/* Informações do Projeto */}
      <Card className="panel-base backdrop-blur-sm">
        <CardHeader className="panel-header-base">
          <div>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-theme-main">
              <Building2 className="h-4 w-4 text-theme-accent" />
              Informações do Projeto
            </CardTitle>
            <CardDescription className="text-xs font-mono text-theme-muted mt-0.5">
              Detalhes do projeto de monitoramento
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-theme-muted opacity-60">Nome do Projeto</p>
              <p className="text-sm font-medium text-theme-main">Codexis - Monitoramento de EPI</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-theme-muted opacity-60">Implementação Ideal</p>
              <p className="text-sm font-medium text-theme-main">Produção Industrial</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider flex items-center gap-1 text-theme-muted opacity-60">
                <Calendar className="h-3 w-3" />
                Data de Início
              </p>
              <p className="text-sm font-mono text-theme-main">06 de Abril, 2026</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider flex items-center gap-1 text-theme-muted opacity-60">
                <Target className="h-3 w-3" />
                Objetivo
              </p>
              <p className="text-sm font-mono font-bold text-emerald-500">~~% de conformidade</p>
            </div>
          </div>

          <div className="pt-4 border-t border-theme-divider">
            <h4 className="text-[11px] font-mono uppercase tracking-wider mb-3 text-theme-muted">EPI's Monitorados</h4>
            <div className="flex flex-wrap gap-2">
              {['Capacete', 'Óculos', 'Colete', 'Luvas', 'Botas'].map((epi) => (
                <span key={epi} className="px-2.5 py-1 badge-theme-industrial rounded-lg text-xs font-mono">
                  {epi}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipe do Projeto */}
      <Card className="panel-base backdrop-blur-sm">
        <CardHeader className="panel-header-base">
          <div>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-theme-main">
              <Users className="h-4 w-4 text-theme-accent" />
              Equipe do Projeto
            </CardTitle>
            <CardDescription className="text-xs font-mono text-theme-muted mt-0.5">
              Membros responsáveis pelo projeto de monitoramento
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {data.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-1.5 rounded-lg row-theme-hover transition-colors duration-200">
                <Avatar className="h-8 w-8 border border-theme-divider">
                  <AvatarFallback className="badge-theme-industrial font-mono text-xs">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium text-theme-main">{member.name}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-theme-muted">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProjectInfo;