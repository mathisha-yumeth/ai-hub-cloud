import React, { useState } from "react";
import { 
  ScrollText, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Terminal, 
  Play, 
  Copy, 
  ExternalLink,
  RefreshCw,
  FileSpreadsheet
} from "lucide-react";
import { CommandLogEntry } from "../types";

interface AuditLogsViewProps {
  logs: CommandLogEntry[];
  onClearLogs: () => void;
  onRerunCommand: (cmd: string, shell: string) => void;
  onRefreshLogs: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  logs,
  onClearLogs,
  onRerunCommand,
  onRefreshLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shellFilter, setShellFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<CommandLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.output.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "success" && log.status === "success") ||
      (statusFilter === "failed" && log.status === "failed") ||
      (statusFilter === "blocked" && (log.status === "blocked" || log.status === "denied"));

    const matchesShell = shellFilter === "all" || log.shell === shellFilter;

    return matchesSearch && matchesStatus && matchesShell;
  });

  // Summary statistics
  const total = logs.length;
  const successCount = logs.filter((l) => l.status === "success").length;
  const blockedCount = logs.filter((l) => l.status === "blocked" || l.status === "denied").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;
  const avgDuration = total > 0 ? Math.round(logs.reduce((acc, l) => acc + (l.durationMs || 0), 0) / total) : 0;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const exportAsJSON = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `windows-ai-audit-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    const headers = ["ID", "Timestamp", "Source", "Shell", "Status", "ExitCode", "DurationMs", "RiskLevel", "Command"];
    const rows = logs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.source}"`,
      l.shell,
      l.status,
      l.exitCode,
      l.durationMs,
      l.riskLevel,
      `"${l.command.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `windows-ai-audit-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="audit-logs-view" className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden text-xs text-slate-200">
      {/* Top Banner & Stats */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                System-Wide Command & Script Audit Log
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
                  Windows Event Log Style
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Tamper-evident audit trail of all actions executed by Gemini, Claude, GPT, Ollama, and user terminal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshLogs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
              title="Refresh log stream"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportAsCSV}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
              title="Export as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportAsJSON}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
              title="Export as JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition"
              title="Clear all recorded logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Total Audited Events</span>
            <span className="text-xl font-bold text-slate-100 font-mono mt-0.5 block">{total}</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-emerald-400 block">Successful Executions</span>
            <span className="text-xl font-bold text-emerald-300 font-mono mt-0.5 block">{successCount}</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-rose-400 block">Security Interceptions</span>
            <span className="text-xl font-bold text-rose-300 font-mono mt-0.5 block">{blockedCount}</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-blue-400 block">Avg Execution Latency</span>
            <span className="text-xl font-bold text-blue-300 font-mono mt-0.5 block">{avgDuration} ms</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by command, model, output text, or event ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md focus:border-blue-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Status: All</option>
            <option value="success">Status: Success (Exit 0)</option>
            <option value="failed">Status: Failed (Non-zero)</option>
            <option value="blocked">Status: Blocked / Denied</option>
          </select>

          {/* Shell Filter */}
          <select
            value={shellFilter}
            onChange={(e) => setShellFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Shell: All</option>
            <option value="powershell">PowerShell</option>
            <option value="cmd">CMD Prompt</option>
            <option value="bash">Bash / Shell</option>
            <option value="python">Python</option>
          </select>
        </div>
      </div>

      {/* Main Table / Logs Content */}
      <div className="flex-1 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 space-y-2">
            <ScrollText className="w-10 h-10 stroke-1 text-slate-600" />
            <p className="font-medium text-slate-400 text-sm">No audited command records found</p>
            <p className="text-xs text-slate-500 text-center max-w-sm">
              Commands executed from the AI Chat (Gemini, Claude, GPT, Ollama) or the PC Terminal will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-850">
            {filteredLogs.map((log) => {
              const isSuccess = log.status === "success";
              const isBlocked = log.status === "blocked" || log.status === "denied";

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3.5 hover:bg-slate-900/70 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    selectedLog?.id === log.id ? "bg-slate-900 border-l-2 border-blue-500" : ""
                  }`}
                >
                  {/* Left Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {isSuccess ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isBlocked ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-slate-400 text-[10px] font-semibold">{log.id}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {log.shell.toUpperCase()}
                        </span>
                        <span className="text-slate-400 text-[10px]">via</span>
                        <span className="font-medium text-blue-300 text-[11px]">{log.source}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium uppercase ${
                          log.riskLevel === "high"
                            ? "bg-rose-950 text-rose-300 border border-rose-800/50"
                            : log.riskLevel === "caution"
                            ? "bg-amber-950 text-amber-300 border border-amber-800/50"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                        }`}>
                          {log.riskLevel}
                        </span>
                      </div>

                      <p className="font-mono text-xs text-slate-200 truncate max-w-2xl bg-slate-950 px-2 py-1 rounded border border-slate-850">
                        {log.command}
                      </p>
                    </div>
                  </div>

                  {/* Right metadata & actions */}
                  <div className="flex items-center gap-4 text-slate-400 text-[11px] shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <span className="font-mono text-slate-400">
                      {log.durationMs}ms
                    </span>

                    <span className={`px-2 py-0.5 rounded font-mono font-medium ${
                      isSuccess ? "bg-emerald-950/80 text-emerald-400" : isBlocked ? "bg-rose-950/80 text-rose-400" : "bg-amber-950/80 text-amber-400"
                    }`}>
                      Exit {log.exitCode}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(log.command, log.id);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        title="Copy command"
                      >
                        {copiedId === log.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRerunCommand(log.command, log.shell);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-300 rounded hover:bg-slate-800"
                        title="Re-run in Terminal"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Log Inspector Modal / Drawer */}
      {selectedLog && (
        <div 
          id="log-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-slate-100 text-sm">Event Log Inspector</span>
                <span className="font-mono text-xs text-slate-400">({selectedLog.id})</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-850">
                <div>
                  <span className="text-slate-500 block text-[10px]">Source Model:</span>
                  <span className="font-semibold text-slate-200">{selectedLog.source}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Shell Engine:</span>
                  <span className="font-semibold text-slate-200">{selectedLog.shell.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Exit Code:</span>
                  <span className="font-mono text-slate-200">{selectedLog.exitCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Execution Time:</span>
                  <span className="font-mono text-slate-200">{selectedLog.durationMs} ms</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-1">Executed Command:</span>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-blue-200 whitespace-pre-wrap select-all">
                  {selectedLog.command}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-1">Captured Output (stdout & stderr):</span>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto select-all">
                  {selectedLog.output || "(No output captured)"}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-[11px] font-mono">
                {new Date(selectedLog.timestamp).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onRerunCommand(selectedLog.command, selectedLog.shell);
                    setSelectedLog(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run in Terminal</span>
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
