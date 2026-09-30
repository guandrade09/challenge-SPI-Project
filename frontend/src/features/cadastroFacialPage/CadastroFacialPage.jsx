import { useEffect, useState } from 'react';
import { Search, ScanFace } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { useFuncionarioStore } from '../../store/useFuncionarioStore';
import { FuncionarioCard } from './components/FuncionarioCard';
import { ButtonAddFuncionario } from './components/ButtonAddFuncionario';
import { RecentRecognitionsPanel } from './components/RecentRecognitionsPanel';

export default function CadastroFacialPage() {
  const currentTheme = useUiStore((s) => s.theme);

  const funcionarios = useFuncionarioStore((s) => s.funcionarios);
  const isLoading = useFuncionarioStore((s) => s.isLoading);
  const fetchFuncionarios = useFuncionarioStore((s) => s.fetchFuncionarios);
  const addFuncionario = useFuncionarioStore((s) => s.addFuncionario);
  const updateFuncionario = useFuncionarioStore((s) => s.updateFuncionario);
  const deleteFuncionario = useFuncionarioStore((s) => s.deleteFuncionario);

  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);

  const filtered = funcionarios.filter((f) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return f.nome?.toLowerCase().includes(term) ||
      f.matricula?.toLowerCase().includes(term) ||
      f.setor?.toLowerCase().includes(term);
  });

  return (
    <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl text-[var(--p-text-title)] font-theme-title flex items-center gap-2">
              <ScanFace size={22} className="text-theme-muted" />
              Cadastro Facial
            </h2>
            <p className="text-[var(--p-text-title)] mt-1">{filtered.length} funcionário(s) cadastrado(s)</p>
          </div>
          <ButtonAddFuncionario theme={currentTheme} onAddFuncionario={addFuncionario} />
        </div>

        {/* Painel ao vivo — confirma visualmente que o orquestrador está reconhecendo rostos */}
        <RecentRecognitionsPanel />

        {/* Busca */}
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, matrícula ou setor..."
            className="w-full pl-9 p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] transition-colors font-theme-body"
          />
        </div>

        {/* Grid */}
        {isLoading && funcionarios.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="panel-subcard h-40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-theme-muted">
            Nenhum funcionário cadastrado ainda.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((funcionario) => (
              <FuncionarioCard
                key={funcionario.id}
                funcionario={funcionario}
                theme={currentTheme}
                onEditFuncionario={updateFuncionario}
                onDeleteFuncionario={deleteFuncionario}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
