import React from 'react';
import { Home, Camera, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from "../utils/cn";

// Configuração dos itens para facilitar a manutenção
const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'camera', icon: Camera, label: 'Monitoramento', active: true },
  { id: 'settings', icon: Settings, label: 'Configurações' },
];

export const NavBar = () => {
  return (
    <nav className="flex justify-center items-center gap-10 py-6 mb-8">
      {navItems.map((item) => (
        <button
          key={item.id}
          title={item.label}
          className={cn(
            "transition-all duration-300 ease-in-out hover:scale-110",
            item.active 
              ? "text-white border-b-2 border-white pb-1" 
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <item.icon size={28} strokeWidth={item.active ? 2.5 : 2} />
        </button>
      ))}
    </nav>
  );
};