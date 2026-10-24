import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Users, Building2, Calendar, Target, GitBranchIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { IconButtonModal } from "../../../components/shared/IconButtonModal";

export function ProjectInfo({ data = [], theme = "light" }) {
  
  // Função para abertura segura de abas
  const handleSafeRedirect = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`panel-theme-${theme} font-theme-body space-y-6`}>
      {/* Informações do Projeto */}
      <Card className="panel-base backdrop-blur-sm transition-all duration-200 hover:border-[var(--p-subtext)]">
        <CardHeader className="panel-header-base">
          <div className="flex items-center justify-between w-full">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-theme-title text-sm">
                <Building2 className="h-4 w-4 text-[var(--p-subtext)]" />
                Informações do Projeto
              </CardTitle>
              <CardDescription className="text-theme-muted text-xs">
                Detalhes do projeto de monitoramento
              </CardDescription>
            </div>

            <IconButtonModal
              icon={GitBranchIcon}
              label="Detalhes"
              title="Ver detalhes do projeto"
              onClick={() => handleSafeRedirect("https://github.com/guandrade09/challenge-SPI-Project")}
              variant="panel-btn-toggle"
              className="text-[var(--p-subtext)] hover:text-[var(--p-text-title)] shrink-0"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-theme-head">Nome do Projeto</p>
              <p className="text-sm font-semibold text-theme-main">Codexis - Monitoramento de EPI</p>
            </div>

            <div className="space-y-1">
              <p className="text-theme-head">Implementação Ideal</p>
              <p className="text-sm font-medium text-theme-main">Produção Industrial</p>
            </div>

            <div className="space-y-1">
              <p className="text-theme-head flex items-center gap-1.5">
                <Calendar className="h-3 w-3 opacity-70" />
                Data de Início
              </p>
              <p className="text-sm font-medium text-theme-main">06 de Abril, 2026</p>
            </div>

            <div className="space-y-1">
              <p className="text-theme-head flex items-center gap-1.5">
                <Target className="h-3 w-3 opacity-70" />
                Objetivo
              </p>
              <p className="text-sm font-bold text-emerald-500">100% de conformidade</p>
            </div>
          </div>

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
                className="flex items-center justify-between p-2 rounded-lg row-theme-hover transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
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

                {/* Ações de Redirects Sociais */}
                <div className="flex items-center gap-1.5">
                  {/* Botão GitHub com SVG Nativo */}
                  {member.githubUrl && (
                    <button
                      onClick={() => handleSafeRedirect(member.githubUrl)}
                      title={`GitHub de ${member.name}`}
                      className="p-1.5 rounded-md border border-theme-divider bg-[var(--p-header-bg)] text-theme-muted hover:text-white hover:bg-neutral-800 hover:border-neutral-600 transition-all active:scale-95 flex items-center gap-1 text-[11px] font-medium group"
                    >
                      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span className="hidden sm:inline">GitHub</span>
                    </button>
                  )}

                  {/* Botão LinkedIn com SVG Nativo */}
                  {member.linkedinUrl && (
                    <button
                      onClick={() => handleSafeRedirect(member.linkedinUrl)}
                      title={`LinkedIn de ${member.name}`}
                      className="p-1.5 rounded-md border border-theme-divider bg-[var(--p-header-bg)] text-theme-muted hover:text-white hover:bg-[#0A66C2] hover:border-[#0A66C2] transition-all active:scale-95 flex items-center gap-1 text-[11px] font-medium group"
                    >
                      <svg className="h-3.5 w-3.5 fill-[#0A66C2] group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                      <span className="hidden sm:inline">LinkedIn</span>
                    </button>
                  )}
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