import React, { useState } from "react";
import {
  Wrench,
  BookOpen,
  FileText,
  MessageSquare,
  Sparkles,
  Library,
  Layers,
} from "lucide-react";
import CataloguesDashboard from "./CataloguesDashboard";
import NotesWorkspace from "./NotesWorkspace";
import ChatDashboard from "./ChatDashboard";

export type ToolSubtab = "catalogues" | "notebook" | "chat";

interface ToolsViewProps {
  nickname: string;
  initialSubtab?: ToolSubtab;
  onNavigateToView?: (view: string) => void;
  onShareFeed?: (entry: {
    kind: any;
    title?: string;
    body?: string;
    refId?: string;
    refType?: string;
    experience?: string;
  }) => void;
}

export default function ToolsView({
  nickname,
  initialSubtab = "catalogues",
  onNavigateToView,
  onShareFeed,
}: ToolsViewProps) {
  const [subtab, setSubtab] = useState<ToolSubtab>(initialSubtab);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header & Sub-Navigation for Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-turquoise" />
            <span>Tools &amp; Reference Suites</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Centralized workspace housing catalogues, your encrypted personal notebook, and community chat.
          </p>
        </div>

        {/* Subtab selection pills */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setSubtab("catalogues")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              subtab === "catalogues"
                ? "bg-turquoise-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Library className="w-4 h-4" />
            <span>Catalogues</span>
          </button>

          <button
            onClick={() => setSubtab("notebook")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              subtab === "notebook"
                ? "bg-turquoise-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notebook</span>
          </button>

          <button
            onClick={() => setSubtab("chat")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
              subtab === "chat"
                ? "bg-turquoise-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TOOL */}
      <div className="transition-all">
        {subtab === "catalogues" && (
          <CataloguesDashboard
            onNavigateToView={onNavigateToView}
            onShareFeed={onShareFeed}
          />
        )}

        {subtab === "notebook" && (
          <NotesWorkspace onNavigateToView={onNavigateToView} />
        )}

        {subtab === "chat" && (
          <ChatDashboard
            nickname={nickname}
            onNavigateToView={onNavigateToView}
          />
        )}
      </div>
    </div>
  );
}
