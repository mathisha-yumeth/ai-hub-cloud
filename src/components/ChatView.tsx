import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { 
  Send, 
  Bot, 
  User, 
  Terminal, 
  Play, 
  Copy, 
  CheckCircle2, 
  Cpu, 
  Sparkles, 
  Plus, 
  Trash2, 
  AlertCircle, 
  ChevronDown, 
  Layers, 
  ShieldCheck, 
  Loader2,
  HardDrive,
  FileCode,
  ArrowRight
} from "lucide-react";
import { AIModel, ChatMessage, ChatThread, LocalApiKeys } from "../types";
import { AVAILABLE_MODELS, QUICK_PC_COMMANDS } from "../constants";

interface ChatViewProps {
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string) => void;
  messages: ChatMessage[];
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  onExecuteScriptFromChat: (code: string, shell: string, source: string) => void;
  keys: LocalApiKeys;
  onOpenKeysModal: () => void;
  hasServerGeminiKey: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  messages,
  selectedModel,
  onSelectModel,
  onSendMessage,
  isLoading,
  onExecuteScriptFromChat,
  keys,
  onOpenKeysModal,
  hasServerGeminiKey,
}) => {
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput("");
    await onSendMessage(userText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Helper to determine key readiness
  const isKeyConfigured = (provider: string) => {
    if (provider === "gemini") return hasServerGeminiKey || Boolean(keys.geminiCustomKey);
    if (provider === "openai") return Boolean(keys.openaiKey);
    if (provider === "anthropic") return Boolean(keys.anthropicKey);
    if (provider === "ollama") return true; // Default localhost
    return false;
  };

  // Custom code renderer with execution action button
  const renderCodeBlock = (code: string, language: string = "powershell", blockId: string) => {
    const isWindowsCommand = /powershell|pwsh|cmd|batch|sh|bash|python/i.test(language) || !language;
    const cleanShell = language?.toLowerCase().includes("cmd") ? "cmd" : language?.toLowerCase().includes("python") ? "python" : language?.toLowerCase().includes("bash") ? "bash" : "powershell";

    return (
      <div className="my-2.5 rounded-lg overflow-hidden border border-slate-700/70 bg-slate-950 font-mono text-xs shadow-md">
        <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>{language.toUpperCase() || "SCRIPT"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyCode(code, blockId)}
              className="flex items-center gap-1 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition"
              title="Copy code"
            >
              {copiedIndex === blockId ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedIndex === blockId ? "Copied" : "Copy"}</span>
            </button>
            {isWindowsCommand && (
              <button
                onClick={() => onExecuteScriptFromChat(code, cleanShell, selectedModel.name)}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition"
                title="Execute this script on PC"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Execute on PC</span>
              </button>
            )}
          </div>
        </div>
        <pre className="p-3 text-blue-200 overflow-x-auto whitespace-pre-wrap select-all font-mono leading-relaxed text-xs">
          {code}
        </pre>
      </div>
    );
  };

  return (
    <div id="unified-chat-view" className="flex-1 flex h-full bg-slate-950 overflow-hidden text-xs text-slate-200">
      {/* Sidebar: Conversation Threads */}
      <aside className="w-60 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 hidden md:flex">
        {/* New Chat Button */}
        <div className="p-3 border-b border-slate-800">
          <button
            id="btn-new-chat-thread"
            onClick={onNewThread}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat Session</span>
          </button>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            History & Sessions
          </div>
          {threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition ${
                  isActive
                    ? "bg-slate-800 text-white border border-slate-700/80 font-medium"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <div className="truncate flex-1 pr-2">
                  <p className="truncate text-xs">{thread.title}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {thread.messages.length} msg{thread.messages.length === 1 ? "" : "s"} • {thread.defaultModel.split("-")[0]}
                  </p>
                </div>
                {threads.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition"
                    title="Delete session"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Model Readiness Indicator at bottom of sidebar */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Provider Status</span>
            <button onClick={onOpenKeysModal} className="text-blue-400 hover:underline">
              Configure
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <span className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${isKeyConfigured("gemini") ? "bg-blue-950 text-blue-300" : "bg-slate-850 text-slate-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isKeyConfigured("gemini") ? "bg-blue-400" : "bg-slate-600"}`}></span>
              Gemini
            </span>
            <span className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${isKeyConfigured("openai") ? "bg-emerald-950 text-emerald-300" : "bg-slate-850 text-slate-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isKeyConfigured("openai") ? "bg-emerald-400" : "bg-slate-600"}`}></span>
              GPT
            </span>
            <span className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${isKeyConfigured("anthropic") ? "bg-purple-950 text-purple-300" : "bg-slate-850 text-slate-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isKeyConfigured("anthropic") ? "bg-purple-400" : "bg-slate-600"}`}></span>
              Claude
            </span>
            <span className={`px-1.5 py-0.5 rounded flex items-center gap-1 bg-amber-950 text-amber-300`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Ollama
            </span>
          </div>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Chat Header / Model Switcher Bar */}
        <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsModelDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 transition"
            >
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-xs">{selectedModel.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono uppercase">
                {selectedModel.provider}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Model Selector Dropdown Menu */}
            {isModelDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Switch Active Model
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {AVAILABLE_MODELS.map((model) => {
                    const isConfigured = isKeyConfigured(model.provider);
                    const isSelected = selectedModel.id === model.id;

                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition ${
                          isSelected ? "bg-blue-600/20 text-white" : "hover:bg-slate-800 text-slate-300"
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded ${
                          model.provider === "gemini" ? "text-blue-400 bg-blue-950" :
                          model.provider === "openai" ? "text-emerald-400 bg-emerald-950" :
                          model.provider === "anthropic" ? "text-purple-400 bg-purple-950" :
                          "text-amber-400 bg-amber-950"
                        }`}>
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs truncate">{model.name}</span>
                            {model.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                {model.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{model.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="p-2 border-t border-slate-800 bg-slate-950/40">
                  <button
                    onClick={() => {
                      setIsModelDropdownOpen(false);
                      onOpenKeysModal();
                    }}
                    className="w-full text-center text-xs text-blue-400 hover:text-blue-300 font-medium py-1"
                  >
                    Manage API Keys & Local Models →
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 hidden sm:inline text-[11px]">
              Active Provider: <strong className="text-slate-200 capitalize">{selectedModel.provider}</strong>
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/80 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safe Script Guard</span>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-4">
              <div className="p-4 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner">
                <Bot className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-100">
                  Welcome to Windows AI Command Center
                </h2>
                <p className="text-xs text-slate-400 max-w-md">
                  Unified workstation to chat with <span className="text-blue-400">Gemini</span>, <span className="text-purple-400">Claude</span>, <span className="text-emerald-400">GPT</span>, and <span className="text-amber-400">Ollama</span> with direct PC control, script generation, and tamper-evident audit logging.
                </p>
              </div>

              {/* Quick Suggestion Prompts */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left">
                {QUICK_PC_COMMANDS.slice(0, 4).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.prompt)}
                    className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 hover:text-white transition flex items-start gap-2 group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5 group-hover:scale-110 transition" />
                    <div>
                      <span className="font-medium block text-slate-200">{item.label}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{item.prompt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id || index}
                  className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl rounded-xl p-3.5 text-xs shadow-md ${
                    isUser
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}>
                    {/* Assistant Message Header */}
                    {!isUser && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
                        <span className="font-semibold text-blue-400">
                          {msg.modelUsed || selectedModel.name}
                        </span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                    )}

                    {/* Message Body with Markdown */}
                    <div className="space-y-2 leading-relaxed break-words">
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="markdown-body">
                          <Markdown
                            components={{
                              code({ node, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || "");
                                const isInline = !match && !String(children).includes("\n");
                                if (isInline) {
                                  return (
                                    <code className="bg-slate-950 px-1.5 py-0.5 rounded text-blue-300 font-mono text-[11px]" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                                return renderCodeBlock(String(children).replace(/\n$/, ""), match ? match[1] : "", `${msg.id}-${Math.random()}`);
                              },
                              p({ children }) {
                                return <p className="mb-2 last:mb-0">{children}</p>;
                              },
                              ul({ children }) {
                                return <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>;
                              },
                              ol({ children }) {
                                return <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>;
                              },
                              h3({ children }) {
                                return <h3 className="font-bold text-slate-100 text-sm mt-3 mb-1">{children}</h3>;
                              }
                            }}
                          >
                            {msg.content}
                          </Markdown>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Loading Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>{selectedModel.name} is thinking and formulating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 shrink-0">
          <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
            <textarea
              id="unified-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${selectedModel.name} to control your PC, write PowerShell/Python scripts, or analyze systems... (Enter to send, Shift+Enter for newline)`}
              rows={2}
              className="w-full pl-3.5 pr-24 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500 resize-none shadow-inner"
            />
            <div className="absolute right-2.5 bottom-3.5 flex items-center gap-1.5">
              <button
                id="btn-send-chat"
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition shadow-sm"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
          <div className="flex items-center justify-between max-w-4xl mx-auto pt-2 text-[10px] text-slate-500 px-1">
            <span>
              All generated scripts pass through the <span className="text-blue-400 font-medium">Security Interceptor</span> before running.
            </span>
            <span>Windows 11 Execution Sandbox</span>
          </div>
        </div>
      </main>
    </div>
  );
};
