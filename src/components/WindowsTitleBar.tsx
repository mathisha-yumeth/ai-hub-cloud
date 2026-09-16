import React from "react";
import { 
  Minus, 
  Square, 
  X, 
  ShieldCheck, 
  Terminal, 
  MessageSquare, 
  ScrollText, 
  KeyRound, 
  Radio, 
  Cpu, 
  Layers 
} from "lucide-react";
import { ActiveView, AIModel } from "../types";

interface WindowsTitleBarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedModel: AIModel;
  onOpenModelSelect: () => void;
  onOpenSettings: () => void;
  isMaximized: boolean;
  setIsMaximized: (val: boolean | ((prev: boolean) => boolean)) => void;
  hasGeminiKey: boolean;
  unresolvedLogsCount: number;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  activeView,
  setActiveView,
  selectedModel,
  onOpenModelSelect,
  onOpenSettings,
  isMaximized,
  setIsMaximized,
  hasGeminiKey,
  unresolvedLogsCount,
}) => {
  return (
    <header 
      id="windows-titlebar"
      className="h-11 bg-slate-900/95 border-b border-slate-700/60 flex items-center justify-between px-3 select-none text-xs text-slate-200 backdrop-blur-md z-30 sticky top-0"
    >
      {/* Left: Windows Branding & App Title */}
      <div className="flex items-center gap-3">
        {/* Windows 11 Logo */}
        <div className="grid grid-cols-2 gap-0.5 w-4 h-4" title="Windows 11">
          <div className="bg-blue-400 rounded-[1px]"></div>
          <div className="bg-blue-400 rounded-[1px]"></div>
          <div className="bg-blue-400 rounded-[1px]"></div>
          <div className="bg-blue-400 rounded-[1px]"></div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-100 tracking-tight text-[13px]">
            Windows AI Command Center
          </span>
          <span className="hidden md:inline-block px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
            v2.4 Pro
          </span>
        </div>

        {/* View Switcher Tabs (Windows Fluent Tabs) */}
        <nav className="flex items-center gap-1 ml-4 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/50">
          <button
            id="tab-chat"
            onClick={() => setActiveView("chat")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              activeView === "chat"
                ? "bg-blue-600 text-white shadow-sm font-medium"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Unified Chat</span>
          </button>

          <button
            id="tab-terminal"
            onClick={() => setActiveView("terminal")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              activeView === "terminal"
                ? "bg-blue-600 text-white shadow-sm font-medium"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>PC Terminal</span>
          </button>

          <button
            id="tab-logs"
            onClick={() => setActiveView("logs")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors relative ${
              activeView === "logs"
                ? "bg-blue-600 text-white shadow-sm font-medium"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
            {unresolvedLogsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/90 text-slate-900 font-bold">
                {unresolvedLogsCount}
              </span>
            )}
          </button>

          <button
            id="tab-bridge"
            onClick={() => setActiveView("bridge")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              activeView === "bridge"
                ? "bg-blue-600 text-white shadow-sm font-medium"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>PC Bridge</span>
          </button>
        </nav>
      </div>

      {/* Middle: Active Model Selector Pill */}
      <div className="hidden lg:flex items-center gap-2">
        <button
          id="btn-model-selector"
          onClick={onOpenModelSelect}
          className="flex items-center gap-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-md border border-slate-700 transition hover:border-slate-600"
          title="Click to switch active AI model"
        >
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-medium text-slate-100">{selectedModel.name}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-blue-300 font-mono">
            {selectedModel.provider.toUpperCase()}
          </span>
          <Layers className="w-3 h-3 text-slate-400" />
        </button>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Security Interceptor Active</span>
        </div>
      </div>

      {/* Right: Settings & Window Controls */}
      <div className="flex items-center gap-1">
        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          className="flex items-center gap-1 px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition border border-transparent hover:border-slate-700 mr-2"
          title="Manage API Keys & Local Models"
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Keys & Providers</span>
        </button>

        {/* Windows Standard Controls */}
        <div className="flex items-center -mr-1">
          <button
            id="btn-win-minimize"
            className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Minimize"
            onClick={() => {}}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-win-maximize"
            className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isMaximized ? "Restore" : "Maximize"}
            onClick={() => setIsMaximized((prev) => !prev)}
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            id="btn-win-close"
            className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition"
            title="Close Application"
            onClick={() => alert("Windows AI Command Center is active. Minimize to keep background monitoring alive.")}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
