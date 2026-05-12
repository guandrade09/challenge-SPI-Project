import { Bot, Sparkles } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { cn } from "../../utils/cn";

export const AiToggleButton = () => {
  const toggleAiSidebar = useUiStore((s) => s.toggleAiSidebar);
  const isAiOpen = useUiStore((s) => s.isAiSidebarOpen);

  return (
    <button
      onClick={toggleAiSidebar}
      className={cn(
        "relative group flex items-center justify-center p-2 rounded-xl transition-all duration-500",
        "bg-gradient-to-br from-indigo-500 via-green-500 to-blue-500",
        "hover:scale-110 active:scale-95 shadow-lg",
        isAiOpen
          ? "ring-2 ring-white shadow-[0_0_20px_rgba(168,85,247,0.6)]"
          : "opacity-80 hover:opacity-100 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
      )}
    >
      <div className="absolute inset-0 rounded-xl bg-inherit blur-md opacity-40 group-hover:opacity-80 transition-opacity" />

      <div className="relative flex items-center gap-1">
        <Bot
          size={22}
          className={cn(
            "text-white transition-transform duration-500",
            isAiOpen ? "rotate-[360deg]" : "group-hover:rotate-12"
          )}
        />
        <Sparkles
          size={12}
          className="text-white absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity animate-bounce"
        />
      </div>
    </button>
  );
};

export default AiToggleButton;