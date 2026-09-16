import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Terminal, 
  ScrollText, 
  Radio, 
  KeyRound, 
  ShieldCheck, 
  Wifi, 
  Volume2, 
  Cpu, 
  Layers 
} from "lucide-react";
import { ActiveView } from "../types";

interface WindowsTaskbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isStartMenuOpen: boolean;
  setIsStartMenuOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenKeysModal: () => void;
  totalLogsCount: number;
}

export const WindowsTaskbar: React.FC<WindowsTaskbarProps> = ({
  activeView,
  setActiveView,
  isStartMenuOpen,
  setIsStartMenuOpen,
  onOpenKeysModal,
  totalLogsCount,
}) => {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDateStr(now.toLocaleDateString([], { month: "numeric", day: "numeric", year: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer 
      id="windows-taskbar"
      className="h-12 bg-slate-900/95 border-t border-slate-700/60 flex items-center justify-between px-3 select-none text-xs text-slate-300 backdrop-blur-xl z-30 shrink-0"
    >
      {/* Left: Quick System Status */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono text-slate-300">CPU 8%</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">
          <span className="text-slate-400">RAM:</span>
          <span className="font-mono text-slate-300">4.2 / 16 GB</span>
        </div>
      </div>

      {/* Center: Windows 11 Taskbar App Icons */}
      <div className="flex items-center gap-1">
        {/* Windows 11 Start Button */}
        <button
          id="btn-win-start"
          onClick={() => setIsStartMenuOpen((prev) => !prev)}
          className={`p-2 rounded-lg transition-all ${
            isStartMenuOpen
              ? "bg-blue-600/30 text-blue-400 scale-95"
              : "hover:bg-slate-800 text-blue-400 hover:scale-105"
          }`}
          title="Start Menu"
        >
          <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
            <div className="bg-blue-400 rounded-[1px]"></div>
            <div className="bg-blue-400 rounded-[1px]"></div>
            <div className="bg-blue-400 rounded-[1px]"></div>
            <div className="bg-blue-400 rounded-[1px]"></div>
          </div>
        </button>

        {/* Pinned / Running Apps */}
        <button
          id="taskbar-btn-chat"
          onClick={() => setActiveView("chat")}
          className={`relative p-2 rounded-lg transition-all ${
            activeView === "chat"
              ? "bg-slate-800 text-blue-400 shadow-inner"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Unified AI Chat"
        >
          <MessageSquare className="w-4 h-4" />
          {activeView === "chat" && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-500 rounded-full"></span>
          )}
        </button>

        <button
          id="taskbar-btn-terminal"
          onClick={() => setActiveView("terminal")}
          className={`relative p-2 rounded-lg transition-all ${
            activeView === "terminal"
              ? "bg-slate-800 text-emerald-400 shadow-inner"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Windows PC Terminal"
        >
          <Terminal className="w-4 h-4" />
          {activeView === "terminal" && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-500 rounded-full"></span>
          )}
        </button>

        <button
          id="taskbar-btn-logs"
          onClick={() => setActiveView("logs")}
          className={`relative p-2 rounded-lg transition-all ${
            activeView === "logs"
              ? "bg-slate-800 text-amber-400 shadow-inner"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="System Audit Logs"
        >
          <ScrollText className="w-4 h-4" />
          {totalLogsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 rounded-full text-[8px] font-bold bg-amber-500 text-slate-950 font-mono">
              {totalLogsCount}
            </span>
          )}
          {activeView === "logs" && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-500 rounded-full"></span>
          )}
        </button>

        <button
          id="taskbar-btn-bridge"
          onClick={() => setActiveView("bridge")}
          className={`relative p-2 rounded-lg transition-all ${
            activeView === "bridge"
              ? "bg-slate-800 text-purple-400 shadow-inner"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Local Host Bridge"
        >
          <Radio className="w-4 h-4" />
          {activeView === "bridge" && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-purple-500 rounded-full"></span>
          )}
        </button>

        <button
          id="taskbar-btn-settings"
          onClick={onOpenKeysModal}
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="API Keys & Model Settings"
        >
          <KeyRound className="w-4 h-4 text-amber-400/90" />
        </button>
      </div>

      {/* Right: Windows System Tray */}
      <div className="flex items-center gap-2 text-slate-400">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800 transition">
          <span title="Security Guard Active"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /></span>
          <span title="Network Connected"><Wifi className="w-3.5 h-3.5 text-slate-300" /></span>
          <span title="Audio"><Volume2 className="w-3.5 h-3.5 text-slate-300" /></span>
        </div>

        {/* Date & Time */}
        <div 
          className="text-right px-2 py-1 rounded hover:bg-slate-800 cursor-pointer transition"
          title="Windows Calendar & Notification Center"
        >
          <div className="font-medium text-slate-200 text-[11px] leading-tight font-mono">{timeStr}</div>
          <div className="text-[10px] text-slate-400 leading-tight font-mono">{dateStr}</div>
        </div>
      </div>
    </footer>
  );
};
