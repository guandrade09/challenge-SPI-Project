import React from 'react';
import { UserRound, CheckCircle2, CircleSlash } from 'lucide-react';
import { streamService } from '../../../services/streamService';
import { ButtonEditFuncionario } from './ButtonEditFuncionario';
import { ButtonDeleteFuncionario } from './ButtonDeleteFuncionario';

export function FuncionarioCard({ funcionario, theme, onEditFuncionario, onDeleteFuncionario }) {
  const isAtivo = (funcionario.status || 'ativo') === 'ativo';
  const fotoUrl = funcionario.foto_path ? streamService.imagePathToUrl(funcionario.foto_path) : null;
  const hasEncoding = Boolean(funcionario.face_encoding);

  return (
    <div className="panel-subcard rounded-xl p-3 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="w-14 h-14 rounded-full overflow-hidden border border-theme-divider bg-[var(--p-bg)] flex items-center justify-center shrink-0">
          {fotoUrl ? (
            <img src={fotoUrl} alt={funcionario.nome} className="w-full h-full object-cover" />
          ) : (
            <UserRound size={24} className="text-theme-muted" />
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ButtonEditFuncionario funcionario={funcionario} theme={theme} onEditFuncionario={onEditFuncionario} />
          <ButtonDeleteFuncionario funcionario={funcionario} theme={theme} onDeleteFuncionario={onDeleteFuncionario} />
        </div>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-theme-title text-sm font-semibold truncate font-theme-title">{funcionario.nome}</span>
        <span className="text-theme-muted text-[11px] truncate font-theme-body">
          {funcionario.cargo || 'Sem cargo definido'}{funcionario.setor ? ` • ${funcionario.setor}` : ''}
        </span>
        {funcionario.matricula && (
          <span className="text-theme-muted text-[10px] font-mono mt-0.5">Matrícula: {funcionario.matricula}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-theme-divider">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${isAtivo ? 'text-emerald-400' : 'text-theme-muted'}`}>
          {isAtivo ? <CheckCircle2 size={12} /> : <CircleSlash size={12} />}
          {isAtivo ? 'Ativo' : 'Inativo'}
        </span>
        <span className={`text-[10px] font-mono ${hasEncoding ? 'text-emerald-400' : 'text-amber-400'}`}>
          {hasEncoding ? 'Reconhecimento pronto' : 'Aguardando processamento'}
        </span>
      </div>
    </div>
  );
}

export default FuncionarioCard;
