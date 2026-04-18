import React from 'react';
import { Home, Camera, LogsIcon, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom'; // Importação necessária
import { cn } from "../utils/cn";

const navItems = [
  { id: 'logs', icon: LogsIcon, label: 'Logs', path: '/logs' },
  { id: 'home', icon: Home, label: 'Home', path: '/' },
  { id: 'camera', icon: Camera, label: 'Monitoramento', path: '/monitoramento' }, 
  { id: 'settings', icon: Settings, label: 'Configurações', path: '/settings' },
];

export const NavBar = () => {
  return (
    <nav className="w-full flex justify-center items-center py-3 bg-neutral-900/90 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <div className='flex items-center gap-1'>
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            title={item.label}
            className={({ isActive }) => cn(
              "transition-all duration-300 border-b-2 pb-1 mx-6 px-3 py-1.5 rounded-md",
              
              isActive 
                ? "text-white border-white opacity-100 animate-pulse" 
                : "text-zinc-300/70 border-transparent hover:text-white hover:opacity-100 hover:bg-white/5"
            )}
          >
            {({ isActive }) => (
              <item.icon size={24} strokeWidth={isActive ? 2 : 1.5} />
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};