import React from "react";
import { Sparkles, ChevronLeft, ChevronRight, Award, Gamepad2, Users, FileText, Calendar, Compass, BookOpen } from "lucide-react";
import type { ParentTab, ActivitiesSubTab } from "../App";

interface SidebarProps {
  activeView: ParentTab;
  onNavigate: (view: ParentTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activitiesSubTab?: ActivitiesSubTab;
  onActivitiesSubTabChange?: (tab: ActivitiesSubTab) => void;
}

const PARENT_ITEMS: { id: ParentTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "home", label: "Home", icon: Sparkles },
  { id: "activities", label: "Activities", icon: Award },
  { id: "watchAds", label: "Watch Ads", icon: BookOpen },
];

const ACTIVITIES_ITEMS: { id: ActivitiesSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "challenges", label: "Challenges", icon: Award },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "tribe", label: "Tribe", icon: Users },
  { id: "notes", label: "Notebook", icon: FileText },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "events", label: "Events", icon: Compass },
  { id: "catalogues", label: "Catalogues", icon: BookOpen },
];

export default function Sidebar({ activeView, onNavigate, collapsed, onToggleCollapse, activitiesSubTab, onActivitiesSubTabChange }: SidebarProps) {
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
        {PARENT_ITEMS.map((it) => {
          const Icon = it.icon;
          const isActive = activeView === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onNavigate(it.id)}
              title={it.label}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all group ${
                isActive
                  ? "bg-turquoise-500/10 border border-turquoise-500/30 text-turquoise"
                  : "border border-transparent text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block text-xs font-mono font-bold leading-tight">{it.label}</span>
                </span>
              )}
            </button>
          );
        })}

        {activeView === "activities" && !collapsed && (
          <div className="ml-4 mt-1 space-y-1 border-l border-slate-800/50 pl-2">
            {ACTIVITIES_ITEMS.map((it) => {
              const Icon = it.icon;
              const isActive = activitiesSubTab === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => onActivitiesSubTabChange?.(it.id)}
                  title={it.label}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                    isActive
                      ? "bg-turquoise-500/10 border border-turquoise-500/30 text-turquoise"
                      : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                  )}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-mono font-bold leading-tight">{it.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {!collapsed && (
        <div className="p-2 border-t border-slate-800/80 text-[9px] font-mono text-slate-600">
          Global quick access · moonrise v1.0
        </div>
      )}
    </aside>
  );
}
