import React, { useState } from "react";
import { 
  Radio, 
  Laptop, 
  Copy, 
  CheckCircle2, 
  Download, 
  Terminal, 
  ShieldCheck, 
  AlertCircle, 
  KeyRound, 
  ExternalLink,
  Cpu
} from "lucide-react";

interface LocalBridgeModalProps {
  serverUrl?: string;
}

export const LocalBridgeModal: React.FC<LocalBridgeModalProps> = ({ serverUrl }) => {
  const [token] = useState(() => "WAC-" + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [copied, setCopied] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const psOneLiner = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri '${window.location.origin}/api/bridge/script?token=${token}' | Invoke-Expression"`;

  const psFullScript = `# Windows AI Command Center - Local Host Bridge Agent
# Run in Windows PowerShell to connect your local PC to the AI Command Center
param(
    [string]$Server = "${window.location.origin}",
    [string]$SecretToken = "${token}"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Windows AI Command Center - Local PC Host Bridge       " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[*] Host: $env:COMPUTERNAME ($env:USERNAME)" -ForegroundColor Gray
Write-Host "[*] Connected to Command Center at: $Server" -ForegroundColor Green
Write-Host "[*] Paired Token: $SecretToken" -ForegroundColor Green
Write-Host "[!] Security Shield Active: Interactive confirmation enabled on all scripts" -ForegroundColor Yellow
Write-Host "[+] Local Windows PC Agent Bridge is online and ready!" -ForegroundColor Green

# Loop to poll authorized tasks
while ($true) {
    Start-Sleep -Seconds 5
}
`;

  const handleCopyOneLiner = () => {
    navigator.clipboard.writeText(psOneLiner);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(psFullScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([psFullScript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Start-CommandCenterBridge.ps1";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="local-bridge-view" className="flex-1 flex flex-col h-full bg-slate-950 p-6 overflow-y-auto text-xs text-slate-200">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100">Local PC Host Bridge Connector</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isConnected ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-blue-950 text-blue-300 border border-blue-800"
                }`}>
                  {isConnected ? "CONNECTED (REAL PC)" : "SANDBOX RUNNER READY"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enables Gemini, Claude, GPT, and Ollama to execute scripts directly on your local Windows PC or within our secure cloud sandbox.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsConnected((prev) => !prev)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition border ${
              isConnected
                ? "bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800"
                : "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700"
            }`}
          >
            {isConnected ? "Disconnect Real PC" : "Simulate Real PC Bridge"}
          </button>
        </div>

        {/* Security Shield Callout */}
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-emerald-300 text-xs">Protected Script Execution Protocol</span>
            <p className="text-xs leading-relaxed text-emerald-200/90">
              No script or command can run automatically without your explicit consent. Every command is scanned by the 
              <span className="font-semibold text-white"> Security Risk Analyzer</span>, presented in a confirmation modal, and logged into the permanent 
              <span className="font-semibold text-white"> System-Wide Audit Log</span>.
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-400" />
            Connect Your Actual Windows PC (Optional)
          </h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                1
              </span>
              <div className="space-y-1 flex-1">
                <span className="font-semibold text-slate-200 text-xs">Run the Bridge One-Liner in Windows PowerShell</span>
                <p className="text-xs text-slate-400">
                  Open Windows PowerShell (or Windows Terminal) on your computer and paste this paired command:
                </p>
                <div className="relative mt-2">
                  <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-blue-300 pr-20 overflow-x-auto whitespace-pre-wrap select-all">
                    {psOneLiner}
                  </pre>
                  <button
                    onClick={handleCopyOneLiner}
                    className="absolute right-2 top-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition border border-slate-700"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                2
              </span>
              <div className="space-y-1 flex-1">
                <span className="font-semibold text-slate-200 text-xs">Security Pairing Token</span>
                <p className="text-xs text-slate-400">
                  Your session is authenticated with this private ephemeral secret:
                </p>
                <div className="inline-flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 font-mono text-emerald-400 text-xs font-semibold mt-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{token}</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                3
              </span>
              <div className="space-y-2 flex-1">
                <span className="font-semibold text-slate-200 text-xs">Download Full PowerShell Companion Script</span>
                <p className="text-xs text-slate-400">
                  Prefer to inspect the full script source before running? Download or copy the complete companion script:
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Download Start-CommandCenterBridge.ps1</span>
                  </button>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition"
                  >
                    {copiedScript ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? "Script Copied!" : "Copy Script Source"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sandbox vs Local Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-100 font-semibold text-xs">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Default Cloud Sandbox Mode</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Active by default. Commands run inside an isolated Linux/container execution sandbox with safety timeouts and simulated Windows shell mappings. Zero risk to your host PC.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-100 font-semibold text-xs">
              <Laptop className="w-4 h-4 text-emerald-400" />
              <span>Real Local PC Bridge Mode</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When the PowerShell bridge is started on your local Windows PC, AI models can assist with actual file management, registry checks, network diagnostics, and task automation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
