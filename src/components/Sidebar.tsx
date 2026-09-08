import React from "react";
import {
  Sparkles, ChevronLeft, ChevronRight, Bell, CalendarDays,
  FileText, Moon, BookOpen, Rss, MessageSquare, Users, HelpCircle,
} from "lucide-react";
import type { ParentTab } from "../App";

interface SidebarProps {
  activeView: ParentTab;
  onNavigateToView: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const GLOBAL_TOOLS: { id: ParentTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "hello", label: "Hello", icon: HelpCircle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "notebook", label: "Notebook", icon: FileText },
  { id: "moondial", label: "Moondial", icon: Moon },
  { id: "catalogues", label: "Catalogues", icon: BookOpen },
  { id: "recommendationFeed", label: "Recommendations", icon: Rss },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "findSomeoneLikeMe", label: "Find Someone", icon: Users },
];

export default function Sidebar({ activeView, onNavigateToView, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={`sticky self-start top-14 max-h-[calc(100dvh-3.5rem)] flex flex-col shrink-0 border-r border-slate-800/80 bg-[#0a0b12]/90 backdrop-blur-md transition-all duration-300 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <div className="flex items-center justify-between p-2 border-b border-slate-800/80">
        {!collapsed && (
          <span className="text-[10px] font-mono text-turquoise uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> moonrise HUD
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-turquoise hover:bg-slate-800/60 transition-all"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-1.5 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 py-1.5 text-[8px] font-mono text-slate-600 uppercase tracking-widest">
            Global Tools
          </div>
        )}

        {GLOBAL_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeView === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onNavigateToView(tool.id)}
              title={tool.label}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all group ${
                isActive
                  ? "bg-turquoise-500/10 border border-turquoise-500/30 text-turquoise"
                  : "border border-transparent text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block text-xs font-mono font-bold leading-tight">{tool.label}</span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-2 border-t border-slate-800/80 text-[9px] font-mono text-slate-600">
          Global quick access · moonrise v1.0
        </div>
      )}
    </aside>
  );
}
