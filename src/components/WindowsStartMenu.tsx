import React from "react";
import { 
  MessageSquare, 
  Terminal, 
  ScrollText, 
  Radio, 
  KeyRound, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Activity, 
  Power, 
  RotateCcw, 
  Sparkles,
  Search
} from "lucide-react";
import { ActiveView } from "../types";

interface WindowsStartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveView: (view: ActiveView) => void;
  onOpenKeysModal: () => void;
  onRunQuickDiagnostic: (cmd: string, shell: string) => void;
  onNewChat: () => void;
}

export const WindowsStartMenu: React.FC<WindowsStartMenuProps> = ({
  isOpen,
  onClose,
  setActiveView,
  onOpenKeysModal,
  onRunQuickDiagnostic,
  onNewChat,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="windows-start-menu-overlay"
      className="fixed inset-0 z-40"
      onClick={onClose}
    >
      <div 
        id="windows-start-menu"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-14 left-1/2 -translate-x-1/2 w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-5 text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-200 overflow-hidden"
      >
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Type here to search apps, commands, or AI models..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
          />
        </div>

        {/* Pinned Applications */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px] mb-2 px-1">
            <span>Pinned Tools</span>
            <span className="text-[10px] text-blue-400 font-normal">Command Center Apps</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => {
                setActiveView("chat");
                onClose();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-blue-500/50 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="font-medium text-[11px] text-slate-200">Unified Chat</span>
            </button>

            <button
              onClick={() => {
                setActiveView("terminal");
                onClose();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-blue-500/50 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="font-medium text-[11px] text-slate-200">PC Terminal</span>
            </button>

            <button
              onClick={() => {
                setActiveView("logs");
                onClose();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-blue-500/50 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <ScrollText className="w-4 h-4" />
              </div>
              <span className="font-medium text-[11px] text-slate-200">Audit Logs</span>
            </button>

            <button
              onClick={() => {
                setActiveView("bridge");
                onClose();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-blue-500/50 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <Radio className="w-4 h-4" />
              </div>
              <span className="font-medium text-[11px] text-slate-200">Host Bridge</span>
            </button>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="mb-4">
          <div className="text-slate-400 font-semibold text-[11px] mb-2 px-1">
            Quick System Diagnostics
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onRunQuickDiagnostic("Get-Process | Sort-Object CPU -Descending | Select-Object -First 8 Id, ProcessName, CPU", "powershell");
                onClose();
              }}
              className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-850 border border-slate-800 text-left transition flex items-center gap-2.5"
            >
              <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="font-medium text-slate-200 block text-[11px]">Inspect CPU / Tasks</span>
                <span className="text-[10px] text-slate-400">Top active processes</span>
              </div>
            </button>

            <button
              onClick={() => {
                onRunQuickDiagnostic("Get-NetIPConfiguration", "powershell");
                onClose();
              }}
              className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-850 border border-slate-800 text-left transition flex items-center gap-2.5"
            >
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-medium text-slate-200 block text-[11px]">Network & IP Info</span>
                <span className="text-[10px] text-slate-400">Adapter configuration</span>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom User / Power Bar */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
            <div>
              <span className="font-semibold text-slate-100 block text-xs">Windows Administrator</span>
              <span className="text-[10px] text-slate-400">Secured Session</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onOpenKeysModal();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="API Keys & Settings"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Reset Chat Session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
