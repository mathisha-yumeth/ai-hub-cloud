import { AIModel, LocalApiKeys, SecurityScanResult } from "./types";

export const AVAILABLE_MODELS: AIModel[] = [
  // Gemini
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "gemini",
    description: "Google's balanced powerhouse for reasoning, speed, and PC automation",
    badge: "Cloud (Pre-configured)",
    contextWindow: "1M tokens",
    isLocal: false,
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "gemini",
    description: "Deep reasoning for complex multi-step Windows scripting and diagnostics",
    badge: "Pro",
    contextWindow: "2M tokens",
    isLocal: false,
  },
  // Claude
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Anthropic's premier coding model with exceptional command syntax accuracy",
    badge: "Anthropic",
    contextWindow: "200k tokens",
    isLocal: false,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    description: "Ultra-fast lightweight model for rapid bash and PowerShell lookups",
    badge: "Fast",
    contextWindow: "200k tokens",
    isLocal: false,
  },
  // OpenAI GPT
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "OpenAI flagship omni-model for general PC assistance and troubleshooting",
    badge: "OpenAI",
    contextWindow: "128k tokens",
    isLocal: false,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Efficient model for quick administrative tasks and routine scripts",
    badge: "OpenAI",
    contextWindow: "128k tokens",
    isLocal: false,
  },
  {
    id: "o3-mini",
    name: "o3-mini",
    provider: "openai",
    description: "Specialized reasoning model for debugging complex pipeline scripts",
    badge: "Reasoning",
    contextWindow: "200k tokens",
    isLocal: false,
  },
  // Ollama (Local)
  {
    id: "llama3.2",
    name: "Ollama: Llama 3.2",
    provider: "ollama",
    description: "Meta's state-of-the-art open weight model running 100% locally on your PC",
    badge: "Local (Offline)",
    contextWindow: "128k tokens",
    isLocal: true,
  },
  {
    id: "deepseek-r1",
    name: "Ollama: DeepSeek-R1",
    provider: "ollama",
    description: "Open-source reasoning model running locally via Ollama service",
    badge: "Local",
    contextWindow: "64k tokens",
    isLocal: true,
  },
  {
    id: "mistral",
    name: "Ollama: Mistral 7B",
    provider: "ollama",
    description: "Compact and capable local assistant for local terminal tasks",
    badge: "Local",
    contextWindow: "32k tokens",
    isLocal: true,
  },
  {
    id: "codellama",
    name: "Ollama: CodeLlama",
    provider: "ollama",
    description: "Specialized for PowerShell, CMD, Python, and shell scripting",
    badge: "Local",
    contextWindow: "16k tokens",
    isLocal: true,
  },
];

export const DEFAULT_KEYS: LocalApiKeys = {
  geminiCustomKey: "",
  useSystemGemini: true,
  openaiKey: "",
  anthropicKey: "",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3.2",
};

export const QUICK_PC_COMMANDS = [
  {
    label: "Inspect Running Processes",
    prompt: "Show me a PowerShell command to list the top 10 processes consuming the most CPU and memory.",
    shell: "powershell",
    command: "Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Id, ProcessName, CPU, WorkingSet64",
  },
  {
    label: "Check Network & IP Config",
    prompt: "Provide a command to check all network adapters, IPv4 addresses, and active gateway.",
    shell: "powershell",
    command: "Get-NetIPConfiguration | Select-Object InterfaceAlias, IPv4Address, IPv4DefaultGateway",
  },
  {
    label: "Check Disk Space",
    prompt: "How can I check available free space on all drives in GB?",
    shell: "powershell",
    command: "Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{Name='Used(GB)';Expression={[math]::Round($_.Used/1GB,2)}}, @{Name='Free(GB)';Expression={[math]::Round($_.Free/1GB,2)}}",
  },
  {
    label: "Audit Windows Event Logs",
    prompt: "Show the latest 5 error events from the Windows System log.",
    shell: "powershell",
    command: "Get-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 5 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Id, Message",
  },
  {
    label: "Inspect Active TCP Ports",
    prompt: "List all listening TCP ports and corresponding PID on the computer.",
    shell: "cmd",
    command: "netstat -ano | findstr /i LISTENING",
  },
  {
    label: "Python System Diagnostics",
    prompt: "Run a quick Python snippet to print platform architecture, Python version, and system CPU count.",
    shell: "python",
    command: "import platform, os; print(f'OS: {platform.system()} {platform.release()} ({platform.architecture()[0]})'); print(f'CPUs: {os.cpu_count()}'); print(f'Node: {platform.node()}')",
  },
];

export function clientRiskScan(command: string): SecurityScanResult {
  const lower = command.toLowerCase();
  const reasons: string[] = [];

  // High risk patterns
  if (
    /rm\s+-rf\s+\//.test(lower) ||
    /del\s+\/[fq]\s+[a-z]:\\windows/.test(lower) ||
    /format\s+[a-z]:/.test(lower) ||
    /diskpart\s+clean/.test(lower) ||
    /reg\s+delete\s+hklm/.test(lower) ||
    /shutdown\s+\/s/.test(lower) ||
    /:(){ :\|:& };:/.test(lower)
  ) {
    reasons.push("Critical destructive command pattern detected (system format / root deletion / registry wipe).");
    return {
      riskLevel: "high",
      reasons,
      requiresConfirmation: true,
    };
  }

  // Moderate risk patterns
  if (
    /del\s+/.test(lower) ||
    /rm\s+/.test(lower) ||
    /rmdir\s+/.test(lower) ||
    /stop-service/.test(lower) ||
    /taskkill/.test(lower) ||
    /kill\s+/.test(lower) ||
    /set-executionpolicy/.test(lower) ||
    /curl.*\|\s*(bash|powershell|sh)/.test(lower)
  ) {
    reasons.push("Modifies files, services, or execution policies. Review parameters carefully.");
    return {
      riskLevel: "caution",
      reasons,
      requiresConfirmation: true,
    };
  }

  // Safe read-only commands
  return {
    riskLevel: "safe",
    reasons: ["Read-only diagnostic or informative script query."],
    requiresConfirmation: false,
  };
}
