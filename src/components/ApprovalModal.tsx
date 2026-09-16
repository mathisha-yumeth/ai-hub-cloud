import React from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Play, 
  X, 
  Terminal, 
  Laptop, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  ExternalLink 
} from "lucide-react";
import { SecurityScanResult } from "../types";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  command: string;
  shell: string;
  source: string;
  target: "sandbox" | "local_pc";
  scanResult: SecurityScanResult;
  autoApproveSafe: boolean;
  onToggleAutoApprove: (val: boolean) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  command,
  shell,
  source,
  target,
  scanResult,
  autoApproveSafe,
  onToggleAutoApprove,
}) => {
  if (!isOpen) return null;

  const isHighRisk = scanResult.riskLevel === "high";
  const isCaution = scanResult.riskLevel === "caution";

  return (
    <div 
      id="approval-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div 
        id="approval-modal-card"
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header with Risk Badge */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isHighRisk 
            ? "bg-rose-950/70 border-rose-800/60" 
            : isCaution 
            ? "bg-amber-950/70 border-amber-800/60" 
            : "bg-blue-950/70 border-blue-800/60"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isHighRisk 
                ? "bg-rose-600/20 text-rose-400 border border-rose-500/30" 
                : isCaution 
                ? "bg-amber-600/20 text-amber-400 border border-amber-500/30" 
                : "bg-blue-600/20 text-blue-400 border border-blue-500/30"
            }`}>
              {isHighRisk ? (
                <ShieldAlert className="w-5 h-5" />
              ) : isCaution ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  Secure Script Execution Request
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isHighRisk 
                    ? "bg-rose-500 text-white" 
                    : isCaution 
                    ? "bg-amber-500 text-slate-950" 
                    : "bg-emerald-500 text-slate-950"
                }`}>
                  {scanResult.riskLevel} Risk
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Initiated by <span className="font-semibold text-white">{source}</span> via Windows PC Controller
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Details */}
        <div className="p-5 space-y-4 text-xs text-slate-200">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400 text-[11px] block">Execution Shell:</span>
              <span className="font-mono text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                {shell.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Target Environment:</span>
              <span className="font-mono text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                {target === "local_pc" ? "Local Windows Host (Bridge)" : "Sandbox Virtual Host"}
              </span>
            </div>
          </div>

          {/* Warnings List */}
          {scanResult.reasons.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400 block">Security Analysis:</span>
              {scanResult.reasons.map((reason, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 rounded text-xs flex items-start gap-2 ${
                    isHighRisk 
                      ? "bg-rose-950/40 border border-rose-800/40 text-rose-200" 
                      : isCaution 
                      ? "bg-amber-950/40 border border-amber-800/40 text-amber-200" 
                      : "bg-emerald-950/40 border border-emerald-800/40 text-emerald-200"
                  }`}
                >
                  <span className="font-bold">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Script Code Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-400">Command / Script Payload:</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {command.split("\n").length} line(s) • {command.length} chars
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-blue-200 max-h-48 overflow-y-auto whitespace-pre-wrap select-all">
              {command}
            </div>
          </div>

          {/* Safety Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={autoApproveSafe}
                onChange={(e) => onToggleAutoApprove(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 bg-slate-800"
              />
              <span className="text-xs">
                Auto-approve subsequent read-only diagnostic commands for this session
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3.5 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
          <button
            id="btn-reject-command"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            Reject & Abort
          </button>

          <button
            id="btn-approve-command"
            onClick={onApprove}
            disabled={isHighRisk}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-xs font-semibold shadow-md transition ${
              isHighRisk
                ? "bg-rose-900/50 text-rose-300 cursor-not-allowed"
                : isCaution
                ? "bg-amber-600 hover:bg-amber-500 text-slate-950"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isHighRisk ? "Blocked by Guardrails" : "Authorize & Execute"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
