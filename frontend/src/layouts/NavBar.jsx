import React from 'react';
import { Home, Camera, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from "../utils/cn"; // Assumindo que o caminho do import está correto

// Configuração dos itens para facilitar a manutenção (mantenho a mesma)
const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'camera', icon: Camera, label: 'Monitoramento', active: true },
  { id: 'settings', icon: Settings, label: 'Configurações' },
];

export const NavBar = () => {
  return (
    // 1. ALTERAÇÕES NA BARRA (nav):
    // - w-full: Mantém a largura total.
    // - flex justify-center items-center: Centraliza o conteúdo horizontalmente e verticalmente.
    // - py-3: Define o tamanho (altura) da barra adicionando padding vertical.
    // - bg-neutral-900/90: Define a coloração (fundo cinza escuro neutro) e opacidade (90%).
    // - backdrop-blur-sm: Opcional - Adiciona um leve desfoque no fundo atrás da barra (efeito vidro).
    // - shadow-lg: Adiciona uma sombra suave para destacar.
    // - sticky top-0 z-50: Opcional - Mantém a barra fixa no topo ao rolar a página.
    <nav className="w-full flex justify-center items-center py-3 bg-neutral-900/90 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      
      {/* Container flex para os itens */}
      <div className='flex items-center gap-1'> {/* Adicionei 'gap-1' como opção ao 'mx-20' */}
        {navItems.map((item) => (
          <button
            key={item.id}
            title={item.label} // Texto que aparece ao passar o mouse
            className={cn(
              // Classes Base do Botão:
              "transition-all duration-300 border-b-2 pb-1",
              
              // 2. ALTERAÇÕES DE ESPAÇAMENTO (Tamanho):
              // - Reduzi 'mx-20' (margem horizontal gigante) para 'mx-6' ou usei o 'gap-1' no container acima.
              // - px-3 py-1.5: Adicione padding interno no botão para uma área de clique melhor.
              "mx-6 px-3 py-1.5 rounded-md", 

              // 3. ALTERAÇÕES DE COLORÇÃO E OPACIDADE (Lógica Ativo/Inativo):
              item.active 
                // Se Ativo:
                // - text-white: Texto/ícone branco puro.
                // - border-white: Borda inferior branca pura.
                // - opacity-100: Opacidade total (sem transparência).
                ? "text-white border-white opacity-100 animate-pulse" 
                
                // Se Inativo:
                // - text-zinc-300/70: Coloração cinza claro com opacidade de 70%.
                // - border-transparent: Borda inferior transparente para não quebrar o layout.
                // - hover:text-white hover:opacity-100: No hover, fica branco puro e opacidade total.
                // - hover:bg-white/5: Opcional - Adiciona um fundo bem suave no hover.
                : "text-zinc-300/70 border-transparent hover:text-white hover:opacity-100 hover:bg-white/5"
            )}
          >
            {/* Ícone com tamanho definido (size={24} é um bom padrão) */}
            <item.icon size={24} strokeWidth={item.active ? 2 : 1.5} />
          </button>
        ))}
      </div>
    </nav>
  );
};

export default NavBar;