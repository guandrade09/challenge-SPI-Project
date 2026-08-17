import React from 'react';
import { PANEL_STATUS } from '../../../enums/enums';
import { Badge } from '../../../components/ui/Badge';

const STATUS_CONFIG = {
  [PANEL_STATUS.PRONTO]: {
    badgeVariant: 'secondary',
    dotClass: 'bg-[var(--chart-line-ok,#10b981)] shadow-[0_0_8px_var(--chart-line-ok,#10b981)] animate-pulse',
    label: 'PRONTO',
  },
  [PANEL_STATUS.ATENCAO]: {
    badgeVariant: 'warning',
    dotClass: 'bg-[var(--p-subtext)] shadow-[0_0_8px_var(--p-subtext)] animate-pulse',
    label: 'ATENÇÃO',
  },
  [PANEL_STATUS.ALERTA]: {
    badgeVariant: 'destructive',
    dotClass: 'bg-[var(--chart-line-alert,#ef4444)] shadow-[0_0_8px_var(--chart-line-alert,#ef4444)] animate-[ping_1.5s_infinite]',
    label: 'ALERTA',
  },
};

export const AlertPanel = ({ message, status }) => {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG[PANEL_STATUS.PRONTO];

  return (
    <div className="panel-subcard flex flex-col gap-3 transition-all duration-200">
      <div className="flex items-center justify-between">
        <Badge variant={c.badgeVariant} className="gap-1.5 px-2.5 py-1">
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${c.dotClass}`} />
          {c.label}
        </Badge>
      </div>

      <div className="min-w-0">
        <p className="text-xs leading-relaxed tracking-wide m-0 text-theme-main font-mono whitespace-pre-wrap">
          {message || 'Nenhum evento registrado no log.'}
        </p>
      </div>
    </div>
  );
};

export default AlertPanel;