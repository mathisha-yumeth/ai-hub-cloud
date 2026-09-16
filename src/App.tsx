import React, { useState, useEffect } from "react";
import { 
  ActiveView, 
  AIModel, 
  ChatMessage, 
  ChatThread, 
  CommandLogEntry, 
  LocalApiKeys, 
  SecurityScanResult 
} from "./types";
import { AVAILABLE_MODELS, DEFAULT_KEYS, clientRiskScan } from "./constants";
import { WindowsTitleBar } from "./components/WindowsTitleBar";
import { WindowsTaskbar } from "./components/WindowsTaskbar";
import { WindowsStartMenu } from "./components/WindowsStartMenu";
import { ChatView } from "./components/ChatView";
import { TerminalWorkbench } from "./components/TerminalWorkbench";
import { AuditLogsView } from "./components/AuditLogsView";
import { LocalBridgeModal } from "./components/LocalBridgeModal";
import { KeyManagerModal } from "./components/KeyManagerModal";
import { ApprovalModal } from "./components/ApprovalModal";

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>("chat");
  const [selectedModel, setSelectedModel] = useState<AIModel>(AVAILABLE_MODELS[0]);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState(false);
  const [autoApproveSafe, setAutoApproveSafe] = useState(false);

  // Local storage for API keys
  const [keys, setKeys] = useState<LocalApiKeys>(() => {
    try {
      const saved = localStorage.getItem("wac_local_keys");
      return saved ? { ...DEFAULT_KEYS, ...JSON.parse(saved) } : DEFAULT_KEYS;
    } catch {
      return DEFAULT_KEYS;
    }
  });

  // Chat sessions state
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem("wac_chat_threads");
      if (saved) return JSON.parse(saved);
    } catch {}
    const initialThreadId = "thread-" + Date.now();
    return [
      {
        id: initialThreadId,
        title: "PC Automation & Health Check",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        defaultModel: AVAILABLE_MODELS[0].id,
        messages: [
          {
            id: "msg-welcome",
            role: "assistant",
            content:
              "👋 **Hello! I am your Windows AI Command Center.**\n\n" +
              "I can assist you with system diagnostics, network inspection, running PowerShell and Python scripts, and automating tasks across your PC.\n\n" +
              "You can seamlessly switch between **Gemini 3.8 Flash**, **Claude 3.5 Sonnet**, **GPT-4o**, and local **Ollama** models using the model pill at the top.\n\n" +
              "Here is a quick PowerShell diagnostic you can run immediately on this computer:\n" +
              "```powershell\n" +
              "# Inspect top memory and CPU processes\n" +
              "Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Id, ProcessName, CPU\n" +
              "```\n" +
              "Click **Execute on PC** above to test the secure execution interceptor!",
            timestamp: new Date().toISOString(),
            modelUsed: AVAILABLE_MODELS[0].name,
            providerUsed: "gemini",
          },
        ],
      },
    ];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id || "");
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // System-wide command audit logs
  const [commandLogs, setCommandLogs] = useState<CommandLogEntry[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Approval Modal state
  const [pendingExecution, setPendingExecution] = useState<{
    command: string;
    shell: string;
    source: string;
    target: "sandbox" | "local_pc";
    scanResult: SecurityScanResult;
  } | null>(null);

  // Terminal prefilled script
  const [terminalPrefill, setTerminalPrefill] = useState<{ command: string; shell: string }>({
    command: "",
    shell: "powershell",
  });

  // Save keys to localStorage
  const handleSaveKeys = (newKeys: LocalApiKeys) => {
    setKeys(newKeys);
    localStorage.setItem("wac_local_keys", JSON.stringify(newKeys));
  };

  // Save threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("wac_chat_threads", JSON.stringify(threads));
    } catch {}
  }, [threads]);

  // Initial fetch of server health and logs
  useEffect(() => {
    const fetchHealthAndLogs = async () => {
      try {
        const healthRes = await fetch("/api/health");
        const healthData = await healthRes.json();
        setHasServerGeminiKey(Boolean(healthData.hasGeminiKey));

        const logsRes = await fetch("/api/logs");
        const logsData = await logsRes.json();
        if (logsData.logs) {
          setCommandLogs(logsData.logs);
        }
      } catch (err) {
        console.error("Health/logs init error:", err);
      }
    };
    fetchHealthAndLogs();
  }, []);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const activeMessages = activeThread?.messages || [];

  // Chat actions
  const handleNewThread = () => {
    const newId = "thread-" + Date.now();
    const newThread: ChatThread = {
      id: newId,
      title: "New AI Session",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      defaultModel: selectedModel.id,
      messages: [],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
  };

  const handleDeleteThread = (id: string) => {
    if (threads.length <= 1) return;
    const remaining = threads.filter((t) => t.id !== id);
    setThreads(remaining);
    if (activeThreadId === id) {
      setActiveThreadId(remaining[0].id);
    }
  };

  const handleSendMessage = async (userPrompt: string) => {
    if (!userPrompt.trim() || isLoadingChat) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: userPrompt,
      timestamp: new Date().toISOString(),
    };

    // Update thread title if first user message
    let updatedTitle = activeThread.title;
    if (activeMessages.length <= 1) {
      updatedTitle = userPrompt.slice(0, 32) + (userPrompt.length > 32 ? "..." : "");
    }

    const updatedMessages = [...activeMessages, userMessage];

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, title: updatedTitle, updatedAt: new Date().toISOString(), messages: updatedMessages }
          : t
      )
    );

    setIsLoadingChat(true);

    try {
      let assistantContent = "";
      const historyForApi = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      if (selectedModel.provider === "gemini") {
        const payload: any = {
          messages: historyForApi,
          model: selectedModel.id,
          customApiKey: keys.useSystemGemini ? "" : keys.geminiCustomKey,
        };

        const res = await fetch("/api/chat/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gemini API error");
        assistantContent = data.content;
      } else {
        // OpenAI, Anthropic, Ollama
        let apiKey = "";
        if (selectedModel.provider === "openai") apiKey = keys.openaiKey;
        if (selectedModel.provider === "anthropic") apiKey = keys.anthropicKey;

        const payload = {
          provider: selectedModel.provider,
          model: selectedModel.id,
          messages: historyForApi,
          apiKey,
          ollamaUrl: keys.ollamaUrl,
        };

        const res = await fetch("/api/chat/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Proxy error for ${selectedModel.provider}`);
        assistantContent = data.content;
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date().toISOString(),
        modelUsed: selectedModel.name,
        providerUsed: selectedModel.provider,
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, updatedAt: new Date().toISOString(), messages: [...updatedMessages, assistantMessage] }
            : t
        )
      );
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        content: `⚠️ **Error communicating with ${selectedModel.name}:**\n\n${err.message}\n\nPlease check your API key in **Keys & Providers** or check endpoint settings.`,
        timestamp: new Date().toISOString(),
        modelUsed: selectedModel.name,
        providerUsed: selectedModel.provider,
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...updatedMessages, errorMessage] }
            : t
        )
      );
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Execute command core function
  const executeCommandInternal = async (
    cmd: string,
    sh: string,
    src: string,
    target: "sandbox" | "local_pc" = "sandbox"
  ): Promise<CommandLogEntry | null> => {
    setIsExecuting(true);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: cmd,
          shell: sh,
          source: src,
          target,
          confirmed: true,
        }),
      });
      const logEntry: CommandLogEntry = await res.json();

      setCommandLogs((prev) => [logEntry, ...prev.filter((l) => l.id !== logEntry.id)]);
      return logEntry;
    } catch (err: any) {
      const fallbackLog: CommandLogEntry = {
        id: `ERR-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: src,
        shell: sh as any,
        command: cmd,
        status: "failed",
        exitCode: 1,
        durationMs: 0,
        riskLevel: "caution",
        output: `Execution error: ${err.message}`,
        error: err.message,
        target,
      };
      setCommandLogs((prev) => [fallbackLog, ...prev]);
      return fallbackLog;
    } finally {
      setIsExecuting(false);
    }
  };

  // Called when user clicks "Execute on PC" or "Run"
  const handleRequestExecute = async (
    cmd: string,
    sh: string,
    src: string,
    target: "sandbox" | "local_pc" = "sandbox"
  ): Promise<CommandLogEntry | null> => {
    const scan = clientRiskScan(cmd);

    // If caution or high risk, or if autoApproveSafe is false, prompt for confirmation
    if (scan.requiresConfirmation && !autoApproveSafe) {
      setPendingExecution({
        command: cmd,
        shell: sh,
        source: src,
        target,
        scanResult: scan,
      });
      return null;
    }

    return await executeCommandInternal(cmd, sh, src, target);
  };

  // Confirm execution from ApprovalModal
  const handleApproveExecution = async () => {
    if (!pendingExecution) return;
    const { command, shell, source, target } = pendingExecution;
    setPendingExecution(null);
    await executeCommandInternal(command, shell, source, target);
  };

  const handleClearLogs = async () => {
    if (confirm("Are you sure you want to clear the entire system-wide command audit log?")) {
      try {
        await fetch("/api/logs", { method: "DELETE" });
        setCommandLogs([]);
      } catch (err) {
        console.error("Failed to clear logs:", err);
      }
    }
  };

  const handleRerunInTerminal = (cmd: string, sh: string) => {
    setTerminalPrefill({ command: cmd, shell: sh });
    setActiveView("terminal");
  };

  const refreshLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (data.logs) setCommandLogs(data.logs);
    } catch {}
  };

  return (
    <div 
      id="windows-command-center-app" 
      className={`min-h-screen bg-slate-950 font-sans flex flex-col select-none overflow-hidden ${
        isMaximized ? "p-0" : "p-2 sm:p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40"
      }`}
    >
      {/* Outer Windows Window Container */}
      <div className={`flex-1 flex flex-col bg-slate-950 border border-slate-750/70 overflow-hidden shadow-2xl relative ${
        isMaximized ? "rounded-none border-none" : "rounded-xl"
      }`}>
        {/* Windows 11 Title Bar */}
        <WindowsTitleBar
          activeView={activeView}
          setActiveView={setActiveView}
          selectedModel={selectedModel}
          onOpenModelSelect={() => setIsKeysModalOpen(true)}
          onOpenSettings={() => setIsKeysModalOpen(true)}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
          hasGeminiKey={hasServerGeminiKey}
          unresolvedLogsCount={commandLogs.filter((l) => l.status === "failed" || l.status === "blocked").length}
        />

        {/* Dynamic Center Workspaces */}
        <div className="flex-1 flex overflow-hidden relative">
          {activeView === "chat" && (
            <ChatView
              threads={threads}
              activeThreadId={activeThreadId}
              onSelectThread={setActiveThreadId}
              onNewThread={handleNewThread}
              onDeleteThread={handleDeleteThread}
              messages={activeMessages}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingChat}
              onExecuteScriptFromChat={(code, shell, source) => {
                handleRequestExecute(code, shell, source, "sandbox");
              }}
              keys={keys}
              onOpenKeysModal={() => setIsKeysModalOpen(true)}
              hasServerGeminiKey={hasServerGeminiKey}
            />
          )}

          {activeView === "terminal" && (
            <TerminalWorkbench
              onExecuteCommand={(cmd, sh, src) => handleRequestExecute(cmd, sh, src, "sandbox")}
              isExecuting={isExecuting}
              initialCommand={terminalPrefill.command}
              initialShell={terminalPrefill.shell}
            />
          )}

          {activeView === "logs" && (
            <AuditLogsView
              logs={commandLogs}
              onClearLogs={handleClearLogs}
              onRerunCommand={handleRerunInTerminal}
              onRefreshLogs={refreshLogs}
            />
          )}

          {activeView === "bridge" && (
            <LocalBridgeModal />
          )}
        </div>

        {/* Windows 11 Taskbar */}
        <WindowsTaskbar
          activeView={activeView}
          setActiveView={setActiveView}
          isStartMenuOpen={isStartMenuOpen}
          setIsStartMenuOpen={setIsStartMenuOpen}
          onOpenKeysModal={() => setIsKeysModalOpen(true)}
          totalLogsCount={commandLogs.length}
        />

        {/* Windows Start Menu Overlay */}
        <WindowsStartMenu
          isOpen={isStartMenuOpen}
          onClose={() => setIsStartMenuOpen(false)}
          setActiveView={setActiveView}
          onOpenKeysModal={() => setIsKeysModalOpen(true)}
          onRunQuickDiagnostic={(cmd, sh) => {
            handleRerunInTerminal(cmd, sh);
          }}
          onNewChat={handleNewThread}
        />

        {/* Local API Keys Manager Modal */}
        <KeyManagerModal
          isOpen={isKeysModalOpen}
          onClose={() => setIsKeysModalOpen(false)}
          keys={keys}
          onSaveKeys={handleSaveKeys}
          hasServerGeminiKey={hasServerGeminiKey}
        />

        {/* Security Approval Modal */}
        {pendingExecution && (
          <ApprovalModal
            isOpen={Boolean(pendingExecution)}
            onClose={() => setPendingExecution(null)}
            onApprove={handleApproveExecution}
            command={pendingExecution.command}
            shell={pendingExecution.shell}
            source={pendingExecution.source}
            target={pendingExecution.target}
            scanResult={pendingExecution.scanResult}
            autoApproveSafe={autoApproveSafe}
            onToggleAutoApprove={setAutoApproveSafe}
          />
        )}
      </div>
    </div>
  );
}
