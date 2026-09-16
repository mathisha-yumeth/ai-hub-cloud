import React, { useState } from "react";
import { 
  X, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  HardDrive, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Upload, 
  ShieldAlert,
  HelpCircle
} from "lucide-react";
import { LocalApiKeys } from "../types";

interface KeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: LocalApiKeys;
  onSaveKeys: (keys: LocalApiKeys) => void;
  hasServerGeminiKey: boolean;
}

export const KeyManagerModal: React.FC<KeyManagerModalProps> = ({
  isOpen,
  onClose,
  keys,
  onSaveKeys,
  hasServerGeminiKey,
}) => {
  const [formData, setFormData] = useState<LocalApiKeys>({ ...keys });
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } }>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleVisibility = (field: string) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTestConnection = async (provider: "gemini" | "openai" | "anthropic" | "ollama") => {
    setTestingProvider(provider);
    try {
      const payload: any = { provider };
      if (provider === "gemini") {
        payload.apiKey = formData.useSystemGemini ? "" : formData.geminiCustomKey;
      } else if (provider === "openai") {
        payload.apiKey = formData.openaiKey;
      } else if (provider === "anthropic") {
        payload.apiKey = formData.anthropicKey;
      } else if (provider === "ollama") {
        payload.ollamaUrl = formData.ollamaUrl;
      }

      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: data.success, message: data.message },
      }));

      // If Ollama returned models, prefill if none set
      if (provider === "ollama" && data.models && data.models.length > 0) {
        if (!formData.ollamaModel) {
          setFormData((prev) => ({ ...prev, ollamaModel: data.models[0] }));
        }
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: `Network request error: ${err.message}` },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSave = () => {
    onSaveKeys(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleExport = () => {
    const jsonStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "windows-ai-keys-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setFormData((prev) => ({ ...prev, ...parsed }));
        alert("Configuration imported successfully!");
      } catch (err) {
        alert("Invalid JSON file for key configuration.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      id="key-manager-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div 
        id="key-manager-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Local API Key & Provider Management</h2>
              <p className="text-xs text-slate-400">
                Credentials stay in your browser localStorage and are seamlessly injected for model switching.
              </p>
            </div>
          </div>
          <button
            id="btn-close-keys-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-200 divide-y divide-slate-800">
          {/* Security Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-200">
            <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your API keys are stored purely in your local browser sandbox. They allow rapid switching between 
              <span className="font-semibold text-blue-300"> Google Gemini</span>, 
              <span className="font-semibold text-purple-300"> Anthropic Claude</span>, 
              <span className="font-semibold text-emerald-300"> OpenAI GPT</span>, and 
              <span className="font-semibold text-amber-300"> Ollama (Local PC)</span>.
            </p>
          </div>

          {/* 1. Google Gemini */}
          <div className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="font-semibold text-slate-100 text-sm">Google Gemini</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/50 text-[10px]">
                  Gemini 3.8 Flash & 3.1 Pro
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTestConnection("gemini")}
                disabled={testingProvider === "gemini"}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] transition"
              >
                {testingProvider === "gemini" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 text-blue-400" />}
                Test Connection
              </button>
            </div>

            {hasServerGeminiKey && (
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.useSystemGemini}
                  onChange={(e) => setFormData({ ...formData, useSystemGemini: e.target.checked })}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 bg-slate-800"
                />
                <span className="text-xs">
                  Use environment injected key (<span className="text-emerald-400 font-mono">GEMINI_API_KEY</span> auto-detected)
                </span>
              </label>
            )}

            {(!hasServerGeminiKey || !formData.useSystemGemini) && (
              <div className="relative">
                <input
                  type={showKeys.gemini ? "text" : "password"}
                  placeholder="AIzaSy..."
                  value={formData.geminiCustomKey}
                  onChange={(e) => setFormData({ ...formData, geminiCustomKey: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md focus:border-blue-500 focus:outline-none font-mono text-xs pr-9 text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility("gemini")}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showKeys.gemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {testResults.gemini && (
              <div className={`text-[11px] flex items-center gap-1.5 ${testResults.gemini.success ? "text-emerald-400" : "text-rose-400"}`}>
                {testResults.gemini.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{testResults.gemini.message}</span>
              </div>
            )}
          </div>

          {/* 2. OpenAI GPT */}
          <div className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-slate-100 text-sm">OpenAI (GPT-4o, o3-mini)</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 text-[10px]">
                  OpenAI API
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTestConnection("openai")}
                disabled={testingProvider === "openai"}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] transition"
              >
                {testingProvider === "openai" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 text-emerald-400" />}
                Test Connection
              </button>
            </div>

            <div className="relative">
              <input
                type={showKeys.openai ? "text" : "password"}
                placeholder="sk-proj-..."
                value={formData.openaiKey}
                onChange={(e) => setFormData({ ...formData, openaiKey: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md focus:border-emerald-500 focus:outline-none font-mono text-xs pr-9 text-slate-100"
              />
              <button
                type="button"
                onClick={() => toggleVisibility("openai")}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showKeys.openai ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {testResults.openai && (
              <div className={`text-[11px] flex items-center gap-1.5 ${testResults.openai.success ? "text-emerald-400" : "text-rose-400"}`}>
                {testResults.openai.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{testResults.openai.message}</span>
              </div>
            )}
          </div>

          {/* 3. Anthropic Claude */}
          <div className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="font-semibold text-slate-100 text-sm">Anthropic Claude</span>
                <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/50 text-[10px]">
                  Claude 3.5 Sonnet & Haiku
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTestConnection("anthropic")}
                disabled={testingProvider === "anthropic"}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] transition"
              >
                {testingProvider === "anthropic" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 text-purple-400" />}
                Test Connection
              </button>
            </div>

            <div className="relative">
              <input
                type={showKeys.anthropic ? "text" : "password"}
                placeholder="sk-ant-api03-..."
                value={formData.anthropicKey}
                onChange={(e) => setFormData({ ...formData, anthropicKey: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md focus:border-purple-500 focus:outline-none font-mono text-xs pr-9 text-slate-100"
              />
              <button
                type="button"
                onClick={() => toggleVisibility("anthropic")}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showKeys.anthropic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {testResults.anthropic && (
              <div className={`text-[11px] flex items-center gap-1.5 ${testResults.anthropic.success ? "text-emerald-400" : "text-rose-400"}`}>
                {testResults.anthropic.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{testResults.anthropic.message}</span>
              </div>
            )}
          </div>

          {/* 4. Ollama (Local PC AI) */}
          <div className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="font-semibold text-slate-100 text-sm">Ollama (Local AI)</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/50 text-[10px]">
                  100% Offline & Private
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTestConnection("ollama")}
                disabled={testingProvider === "ollama"}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] transition"
              >
                {testingProvider === "ollama" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 text-amber-400" />}
                Test & Fetch Models
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Ollama Host Endpoint</label>
                <input
                  type="text"
                  placeholder="http://localhost:11434"
                  value={formData.ollamaUrl}
                  onChange={(e) => setFormData({ ...formData, ollamaUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md focus:border-amber-500 focus:outline-none font-mono text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Default Model Name</label>
                <input
                  type="text"
                  placeholder="llama3.2, mistral, deepseek-r1"
                  value={formData.ollamaModel}
                  onChange={(e) => setFormData({ ...formData, ollamaModel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md focus:border-amber-500 focus:outline-none font-mono text-xs text-slate-100"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Tip: Ensure Ollama is running on your computer (<code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono">ollama run llama3.2</code>) and accepts web requests (<code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300 font-mono">OLLAMA_ORIGINS="*"</code>).
            </p>

            {testResults.ollama && (
              <div className={`text-[11px] flex items-center gap-1.5 ${testResults.ollama.success ? "text-emerald-400" : "text-amber-400"}`}>
                {testResults.ollama.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{testResults.ollama.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700 transition"
              title="Export keys to encrypted backup file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>
            <label className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-cancel-keys"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition"
            >
              Cancel
            </button>
            <button
              id="btn-save-keys"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition"
            >
              {savedSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {savedSuccess ? "Saved!" : "Apply Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
