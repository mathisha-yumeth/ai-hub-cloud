import React, { useState } from "react";
import { 
  Terminal as TerminalIcon, 
  Play, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Laptop, 
  Sparkles, 
  Loader2, 
  Clock, 
  HelpCircle,
  FileCode,
  SquareCode
} from "lucide-react";
import { QUICK_PC_COMMANDS, clientRiskScan } from "../constants";
import { CommandLogEntry } from "../types";

interface TerminalWorkbenchProps {
  onExecuteCommand: (command: string, shell: string, source: string) => Promise<CommandLogEntry | null>;
  isExecuting: boolean;
  initialCommand?: string;
  initialShell?: string;
}

export const TerminalWorkbench: React.FC<TerminalWorkbenchProps> = ({
  onExecuteCommand,
  isExecuting,
  initialCommand = "",
  initialShell = "powershell",
}) => {
  const [shell, setShell] = useState<string>(initialShell || "powershell");
  const [command, setCommand] = useState<string>(
    initialCommand || "Get-Process | Sort-Object CPU -Descending | Select-Object -First 8 Id, ProcessName, CPU"
  );
  const [target, setTarget] = useState<"sandbox" | "local_pc">("sandbox");
  const [terminalHistory, setTerminalHistory] = useState<
    Array<{
      cmd: string;
      shell: string;
      output: string;
      status: string;
      exitCode: number;
      durationMs: number;
      timestamp: string;
    }>
  >([]);
  const [copied, setCopied] = useState(false);

  // Scan current command for security risks live
  const scanResult = clientRiskScan(command);

  const handleRun = async () => {
    if (!command.trim() || isExecuting) return;
    const result = await onExecuteCommand(command, shell, "Manual Terminal");
    if (result) {
      setTerminalHistory((prev) => [
        {
          cmd: result.command,
          shell: result.shell,
          output: result.output,
          status: result.status,
          exitCode: result.exitCode,
          durationMs: result.durationMs,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    }
  };

  const handleCopyOutput = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const clearHistory = () => {
    setTerminalHistory([]);
  };

  return (
    <div id="terminal-workbench" className="flex-1 flex flex-col h-full bg-slate-950 text-xs text-slate-200 overflow-hidden">
      {/* Windows Terminal Tab Strip */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 pt-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          {[
            { id: "powershell", label: "PowerShell 7", icon: TerminalIcon, color: "text-blue-400" },
            { id: "cmd", label: "Command Prompt", icon: TerminalIcon, color: "text-slate-300" },
            { id: "bash", label: "Bash / Shell", icon: SquareCode, color: "text-emerald-400" },
            { id: "python", label: "Python 3", icon: FileCode, color: "text-amber-400" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = shell === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setShell(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-t-md font-medium transition-all ${
                  isActive
                    ? "bg-slate-950 text-slate-100 border-t-2 border-blue-500 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Execution Target Switcher */}
        <div className="flex items-center gap-2 pb-1.5 text-[11px]">
          <span className="text-slate-400">Target Host:</span>
          <div className="bg-slate-950 p-0.5 rounded-md border border-slate-800 flex items-center">
            <button
              onClick={() => setTarget("sandbox")}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                target === "sandbox" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sandbox Container
            </button>
            <button
              onClick={() => setTarget("local_pc")}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                target === "local_pc" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Local Windows PC
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Action Deck */}
      <div className="p-4 bg-slate-900/60 border-b border-slate-800 shrink-0 space-y-3">
        {/* Quick Recipe Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <span className="text-slate-400 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Quick Recipes:
          </span>
          {QUICK_PC_COMMANDS.map((recipe, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCommand(recipe.command);
                setShell(recipe.shell);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap transition"
            >
              {recipe.label}
            </button>
          ))}
        </div>

        {/* Command Input Area */}
        <div className="relative">
          <textarea
            id="terminal-script-editor"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            rows={4}
            placeholder={`Enter ${shell.toUpperCase()} command or script here...`}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-xs text-blue-200 resize-none shadow-inner"
          />
        </div>

        {/* Action Controls & Security Scan Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Risk Level Badge */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
              scanResult.riskLevel === "high"
                ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                : scanResult.riskLevel === "caution"
                ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                : "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
            }`}>
              {scanResult.riskLevel === "high" ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              ) : scanResult.riskLevel === "caution" ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Security Status: {scanResult.riskLevel.toUpperCase()}</span>
            </div>
            <span className="text-slate-400 text-[11px]">
              {scanResult.reasons[0]}
            </span>
          </div>

          {/* Run Button */}
          <div className="flex items-center gap-2">
            <button
              id="btn-run-terminal-command"
              onClick={handleRun}
              disabled={isExecuting || !command.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition"
            >
              {isExecuting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isExecuting ? "Executing Script..." : "Execute Script"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Live Output Console */}
      <div className="flex-1 flex flex-col min-h-0 bg-black/90 p-4 font-mono text-xs overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px] mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-300">Console Output Stream</span>
            {terminalHistory.length > 0 && (
              <span className="text-[10px] text-slate-500">
                ({terminalHistory.length} execution{terminalHistory.length > 1 ? "s" : ""})
              </span>
            )}
          </div>
          {terminalHistory.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyOutput(terminalHistory[0]?.output || "")}
                className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition"
              >
                {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy Latest</span>
              </button>
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-400 px-2 py-0.5 rounded hover:bg-slate-800 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {terminalHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 select-none">
              <TerminalIcon className="w-8 h-8 stroke-1 text-slate-700" />
              <p className="text-slate-500 text-xs">Ready for execution.</p>
              <p className="text-[11px] text-slate-600">
                Click "Execute Script" or choose a quick recipe above to run diagnostics and scripts securely.
              </p>
            </div>
          ) : (
            terminalHistory.map((item, index) => (
              <div key={index} className="space-y-1.5 border-b border-slate-900 pb-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-blue-400">
                    PS C:\Windows\System32&gt; <span className="text-slate-200">{item.cmd}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{item.timestamp}</span>
                    <span className="text-slate-400">{item.durationMs}ms</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                      item.exitCode === 0 ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                    }`}>
                      Exit {item.exitCode}
                    </span>
                  </div>
                </div>
                <pre className="text-slate-300 whitespace-pre-wrap font-mono text-[11px] bg-slate-950/60 p-2.5 rounded border border-slate-900 overflow-x-auto select-all">
                  {item.output}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
