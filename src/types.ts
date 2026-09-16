export type AIProvider = "gemini" | "openai" | "anthropic" | "ollama";

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  badge?: string;
  contextWindow?: string;
  isLocal?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  modelUsed?: string;
  providerUsed?: AIProvider;
  executedCommandId?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  defaultModel: string;
}

export interface LocalApiKeys {
  geminiCustomKey: string;
  useSystemGemini: boolean;
  openaiKey: string;
  anthropicKey: string;
  ollamaUrl: string;
  ollamaModel: string;
}

export interface CommandLogEntry {
  id: string;
  timestamp: string;
  source: string;
  shell: "powershell" | "cmd" | "bash" | "python" | "node";
  command: string;
  status: "success" | "failed" | "denied" | "blocked";
  exitCode: number;
  durationMs: number;
  riskLevel: "safe" | "caution" | "high";
  output: string;
  error?: string;
  target: "sandbox" | "local_pc";
}

export interface SecurityScanResult {
  riskLevel: "safe" | "caution" | "high";
  reasons: string[];
  requiresConfirmation: boolean;
}

export type ActiveView = "chat" | "terminal" | "logs" | "bridge" | "settings";
