import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Users, Building2, Calendar, Target, GitBranchIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { IconButtonModal } from "../../../components/shared/IconButtonModal";

export function ProjectInfo({ data = [], theme = "light" }) {
  return (
    <div className={`panel-theme-${theme} font-theme-body space-y-6`}>
      {/* Informações do Projeto */}
      <Card className="panel-base backdrop-blur-sm transition-all duration-200 hover:border-[var(--p-subtext)]">
        <CardHeader className="panel-header-base">
          <div className="flex items-center justify-between w-full">
            
            {/* Título e Descrição com a nova tipografia */}
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-theme-title text-sm">
                <Building2 className="h-4 w-4 text-[var(--p-subtext)]" />
                Informações do Projeto
              </CardTitle>
              <CardDescription className="text-theme-muted text-xs">
                Detalhes do projeto de monitoramento
              </CardDescription>
            </div>

            {/* Botão de Ação */}
            <IconButtonModal
              icon={GitBranchIcon}
              label="Detalhes"
              title="Ver detalhes do projeto"
              onClick={() => window.open("https://github.com/guandrade09/challenge-SPI-Project", "_blank", "noopener,noreferrer")}
              variant="panel-btn-toggle"
              className="text-[var(--p-subtext)] hover:text-[var(--p-text-title)] shrink-0"
            />
            
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          <div className="grid grid-cols-2 gap-4">
            
            {/* Campo 1: Nome do Projeto */}
            <div className="space-y-1">
              <p className="text-theme-head">Nome do Projeto</p>
              <p className="text-sm font-semibold text-theme-main">Codexis - Monitoramento de EPI</p>
            </div>

            {/* Campo 2: Implementação */}
            <div className="space-y-1">
              <p className="text-theme-head">Implementação Ideal</p>
              <p className="text-sm font-medium text-theme-main">Produção Industrial</p>
            </div>

            {/* Campo 3: Data */}
            <div className="space-y-1">
              <p className="text-theme-head flex items-center gap-1.5">
                <Calendar className="h-3 w-3 opacity-70" />
                Data de Início
              </p>
              <p className="text-sm font-medium text-theme-main">06 de Abril, 2026</p>
            </div>

            {/* Campo 4: Objetivo */}
            <div className="space-y-1">
              <p className="text-theme-head flex items-center gap-1.5">
                <Target className="h-3 w-3 opacity-70" />
                Objetivo
              </p>
              <p className="text-sm font-bold text-emerald-500">100% de conformidade</p>
            </div>

          </div>

          {/* Seção de EPIs */}
          <div className="pt-4 border-t border-theme-divider">
            <h4 className="text-theme-head mb-2.5">EPI's Monitorados</h4>
            <div className="flex flex-wrap gap-2">
              {['Capacete', 'Óculos', 'Colete', 'Luvas', 'Botas'].map((epi) => (
                <span 
                  key={epi} 
                  className="px-2.5 py-1 badge-theme-industrial rounded-lg text-xs font-semibold tracking-wide"
                >
                  {epi}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipe do Projeto */}
      <Card className="panel-base backdrop-blur-sm transition-all duration-200 hover:border-[var(--p-subtext)]">
        <CardHeader className="panel-header-base">
          <div>
            <CardTitle className="flex items-center gap-2 text-theme-title text-sm">
              <Users className="h-4 w-4 text-[var(--p-subtext)]" />
              Equipe do Projeto
            </CardTitle>
            <CardDescription className="text-theme-muted text-xs mt-0.5">
              Membros responsáveis pelo projeto de monitoramento
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="space-y-2">
            {data.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center gap-3 p-2 rounded-lg row-theme-hover transition-colors duration-200 hover:bg-[var(--p-subtext)]"
              >
                <Avatar className="h-8 w-8 border border-theme-divider">
                  <AvatarFallback className="badge-theme-industrial font-semibold text-xs text-[var(--p-text-title)]">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-semibold text-theme-main">{member.name}</p>
                  <p className="text-theme-head text-[10px] mt-0.5">{member.role}</p>
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