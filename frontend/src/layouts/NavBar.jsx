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
    <nav className="flex justify-center items-center w-full">
      <div className='flex items-center'>
      {navItems.map((item) => (
        <button
          key={item.id}
          title={item.label}
          className={cn(
            "transition-all duration-300 border-b-2 pb-1",
            "mx-20",
            item.active 
              ? "text-white border-white" 
              : "text-zinc-500 border-transparent hover:text-zinc-300"
          )}
        >
          <item.icon size={28} strokeWidth={item.active ? 2.5 : 2} />
        </button>
      ))}
      </div>
    </nav>
  );
};