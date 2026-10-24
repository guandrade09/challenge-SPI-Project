import { useEffect, useRef, useState } from 'react';
import { Radio, UserRound, UserX } from 'lucide-react';
import reconhecimentoFacialService from '../../../services/reconhecimentoFacialService';
import { streamService } from '../../../services/streamService';
import { formatTs } from '../../../utils/formatLabel';
import { ConfidenceBadge } from '../../../components/ui/Badge';

const POLL_INTERVAL_MS = 5000;

// Painel "ao vivo" pra confirmar visualmente que o orquestrador está reconhecendo rostos,
// sem precisar olhar o terminal ou chamar a API na mão — atualiza sozinho a cada 5s.
export function RecentRecognitionsPanel() {
  const [reconhecimentos, setReconhecimentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchRecentes = async () => {
      try {
        const data = await reconhecimentoFacialService.getRecentes(20);
        if (!mountedRef.current) return;
        setReconhecimentos(data);
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err.response?.data?.message || 'Não foi possível carregar os reconhecimentos');
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    fetchRecentes();
    const intervalId = setInterval(fetchRecentes, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="panel-subcard rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-theme-head flex items-center gap-1.5 text-sm font-theme-title">
          <Radio size={14} className="text-emerald-400 animate-pulse" /> Reconhecimentos Recentes
        </span>
        <span className="text-theme-muted text-[10px] font-mono">atualiza a cada 5s</span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-theme-divider/40 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-theme-muted text-xs py-4 text-center font-theme-body">{error}</p>
      ) : reconhecimentos.length === 0 ? (
        <p className="text-theme-muted text-xs py-4 text-center font-theme-body">
          Nenhum reconhecimento ainda. Fique parado de frente pra câmera por alguns segundos.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {reconhecimentos.map((item) => {
            const reconhecido = item.funcionario_id !== null && item.funcionario_id !== undefined;
            const imgUrl = item.img_path ? streamService.imagePathToUrl(item.img_path) : null;
            return (
              <div
                key={item.id}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--p-bg)] border border-theme-divider"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-theme-divider bg-theme-divider/30 flex items-center justify-center shrink-0">
                  {imgUrl ? (
                    <img src={imgUrl} alt={item.nome_detectado} className="w-full h-full object-cover" />
                  ) : reconhecido ? (
                    <UserRound size={16} className="text-theme-muted" />
                  ) : (
                    <UserX size={16} className="text-theme-muted" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-xs font-semibold truncate ${reconhecido ? 'text-theme-title' : 'text-amber-400'}`}>
                    {item.nome_detectado || 'Desconhecido'}
                  </span>
                  <span className="text-theme-muted text-[10px] font-mono truncate">
                    {item.setor ? `${item.setor} • ` : ''}{formatTs(item.timestamp)}
                  </span>
                </div>
                <ConfidenceBadge value={item.confidence} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecentRecognitionsPanel;
