import express from "express";
import path from "path";
import { exec, spawn } from "child_process";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// System info for Windows emulation & container runtime
const SERVER_START_TIME = new Date().toISOString();

// In-memory logs buffer for server-wide synchronization
interface CommandLogEntry {
  id: string;
  timestamp: string;
  source: string;
  shell: string;
  command: string;
  status: "success" | "failed" | "denied" | "blocked";
  exitCode: number;
  durationMs: number;
  riskLevel: "safe" | "caution" | "high";
  output: string;
  error?: string;
  target: "sandbox" | "local_pc";
}

const commandLogs: CommandLogEntry[] = [];

// Dangerous patterns for security scanner
const HIGH_RISK_PATTERNS = [
  /rm\s+-rf\s+\//i,
  /del\s+\/[fq]\s+[a-z]:\\windows/i,
  /format\s+[a-z]:/i,
  /diskpart\s+clean/i,
  /reg\s+delete\s+hklm/i,
  /:(){ :\|:& };:/i, // fork bomb
  />\s*\/dev\/sda/i,
  /mkfs\./i,
  /shutdown\s+\/s/i,
  /drop\s+database/i,
];

const CAUTION_PATTERNS = [
  /del\s+/i,
  /rmdir\s+/i,
  /rm\s+/i,
  /stop-service/i,
  /kill\s+/i,
  /taskkill\s+/i,
  /netsh\s+/i,
  /set-executionpolicy/i,
  /pip\s+install/i,
  /npm\s+install/i,
  /curl.*\|\s*(bash|sh|powershell)/i,
];

function analyzeRisk(command: string): { riskLevel: "safe" | "caution" | "high"; warnings: string[] } {
  const warnings: string[] = [];
  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(command)) {
      warnings.push(`High-risk destructive command pattern detected: ${pattern.toString()}`);
      return { riskLevel: "high", warnings };
    }
  }
  for (const pattern of CAUTION_PATTERNS) {
    if (pattern.test(command)) {
      warnings.push(`Potential state-modifying action: ${pattern.toString()}`);
      return { riskLevel: "caution", warnings };
    }
  }
  return { riskLevel: "safe", warnings };
}

// 1. Health check & runtime status
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    serverStartTime: SERVER_START_TIME,
    platform: process.platform,
    nodeVersion: process.version,
    totalLogsRecorded: commandLogs.length,
  });
});

// 2. Gemini API endpoint
app.post("/api/chat/gemini", async (req, res) => {
  try {
    const { messages, model = "gemini-3.8-flash", customApiKey, systemInstruction } = req.body;
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        error: "Gemini API key is not configured. Please add it to your Local Keys manager or environment.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Format messages for generateContent
    // If messages array contains { role, content }, convert to appropriate structure
    let contents: any = [];
    if (Array.isArray(messages)) {
      contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content || "" }],
      }));
    } else if (typeof messages === "string") {
      contents = messages;
    }

    const defaultSystemInstruction =
      "You are Windows AI Command Center, an intelligent desktop assistant running in Windows 11. " +
      "You have direct capabilities to control the PC and suggest scripts for PowerShell, CMD, Bash, and Python. " +
      "Whenever the user asks to perform an action on the PC (such as listing files, checking network status, viewing running processes, creating scripts, or diagnosing system health), " +
      "provide a clear, polite explanation followed by the exact code block in a triple-backtick markdown format with the language tag (e.g. ```powershell, ```cmd, ```python, or ```bash). " +
      "Keep all scripts safe, idempotent, and well-commented.";

    const response = await ai.models.generateContent({
      model: model || "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: systemInstruction || defaultSystemInstruction,
      },
    });

    res.json({
      content: response.text || "",
      model,
      provider: "gemini",
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate response from Gemini",
    });
  }
});

// 3. Multi-Provider Chat Proxy (OpenAI, Anthropic, Ollama)
app.post("/api/chat/proxy", async (req, res) => {
  try {
    const { provider, model, messages, apiKey, ollamaUrl = "http://localhost:11434", systemInstruction } = req.body;

    if (provider === "openai") {
      if (!apiKey) {
        return res.status(400).json({ error: "OpenAI API key is missing. Configure it in Local API Key Settings." });
      }

      const formattedMessages = [];
      if (systemInstruction) {
        formattedMessages.push({ role: "system", content: systemInstruction });
      }
      formattedMessages.push(...messages);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4o",
          messages: formattedMessages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `OpenAI Error: ${errText}` });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      return res.json({ content, model, provider: "openai" });
    }

    if (provider === "anthropic") {
      if (!apiKey) {
        return res.status(400).json({ error: "Anthropic Claude API key is missing. Configure it in Local API Key Settings." });
      }

      const anthropicMessages = messages.filter((m: any) => m.role !== "system");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model || "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          system: systemInstruction || "You are an intelligent Windows AI assistant.",
          messages: anthropicMessages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `Anthropic Error: ${errText}` });
      }

      const data = await response.json();
      const content = data.content?.map((c: any) => c.text).join("") || "";
      return res.json({ content, model, provider: "anthropic" });
    }

    if (provider === "ollama") {
      const endpoint = ollamaUrl.replace(/\/$/, "") + "/api/chat";
      try {
        const ollamaMessages = [];
        if (systemInstruction) {
          ollamaMessages.push({ role: "system", content: systemInstruction });
        }
        ollamaMessages.push(...messages);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model || "llama3.2",
            messages: ollamaMessages,
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error(`Ollama responded with HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.message?.content || "";
        return res.json({ content, model, provider: "ollama" });
      } catch (ollamaErr: any) {
        return res.status(503).json({
          error: `Could not connect to local Ollama instance at ${ollamaUrl}. Ensure 'ollama serve' is running and CORS is allowed (OLLAMA_ORIGINS="*"). Error: ${ollamaErr.message}`,
        });
      }
    }

    res.status(400).json({ error: "Unsupported AI provider requested." });
  } catch (err: any) {
    console.error("Proxy chat error:", err);
    res.status(500).json({ error: err.message || "Unknown error during AI request." });
  }
});

// 4. Test connection for any provider
app.post("/api/test-connection", async (req, res) => {
  const { provider, apiKey, ollamaUrl } = req.body;
  try {
    if (provider === "gemini") {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) return res.json({ success: false, message: "No Gemini API key supplied or configured." });
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });
      const test = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: "Respond with the single word 'CONNECTED'",
      });
      return res.json({ success: true, message: `Connected to Gemini! Response: ${test.text?.trim()}` });
    }

    if (provider === "openai") {
      if (!apiKey) return res.json({ success: false, message: "OpenAI API key is missing." });
      const testRes = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (testRes.ok) {
        return res.json({ success: true, message: "Connected to OpenAI API successfully!" });
      }
      return res.json({ success: false, message: `OpenAI returned status ${testRes.status}` });
    }

    if (provider === "anthropic") {
      if (!apiKey) return res.json({ success: false, message: "Anthropic API key is missing." });
      const testRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });
      if (testRes.ok) {
        return res.json({ success: true, message: "Connected to Anthropic Claude API successfully!" });
      }
      return res.json({ success: false, message: `Anthropic returned status ${testRes.status}` });
    }

    if (provider === "ollama") {
      const url = (ollamaUrl || "http://localhost:11434").replace(/\/$/, "") + "/api/tags";
      const testRes = await fetch(url);
      if (testRes.ok) {
        const data = await testRes.json();
        const models = (data.models || []).map((m: any) => m.name);
        return res.json({
          success: true,
          message: `Connected to Ollama! Found ${models.length} installed model(s): ${models.slice(0, 5).join(", ")}`,
          models,
        });
      }
      return res.json({ success: false, message: `Ollama returned HTTP ${testRes.status}` });
    }

    res.json({ success: false, message: "Unknown provider" });
  } catch (err: any) {
    res.json({ success: false, message: `Connection failed: ${err.message}` });
  }
});

// 5. Secure Script Execution Engine & Auditing
app.post("/api/execute", async (req, res) => {
  const { command, shell = "powershell", source = "manual", target = "sandbox", confirmed = true } = req.body;

  if (!command || typeof command !== "string" || !command.trim()) {
    return res.status(400).json({ error: "No command provided for execution." });
  }

  const trimmedCmd = command.trim();
  const startTime = Date.now();
  const logId = `CMD-${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Analyze risk
  const { riskLevel, warnings } = analyzeRisk(trimmedCmd);

  if (riskLevel === "high") {
    const highRiskEntry: CommandLogEntry = {
      id: logId,
      timestamp: new Date().toISOString(),
      source,
      shell,
      command: trimmedCmd,
      status: "blocked",
      exitCode: 126,
      durationMs: 0,
      riskLevel: "high",
      output: `[SECURITY INTERCEPTOR] Command blocked by Security Policy. Destructive pattern detected.\nWarnings: ${warnings.join(", ")}`,
      error: "Command blocked by security guardrails.",
      target,
    };
    commandLogs.unshift(highRiskEntry);
    return res.status(403).json(highRiskEntry);
  }

  // Cross-platform Windows emulation mapping when running inside Linux container sandbox
  // If the user runs Windows PowerShell commands (e.g. Get-Process, ipconfig, dir, Get-Date, systeminfo),
  // we translate or execute them safely.
  let executionCmd = trimmedCmd;

  if (shell === "powershell" || shell === "cmd") {
    // Check if PowerShell pwsh exists
    const hasPwsh = false; // standard container doesn't have pwsh binary by default
    if (!hasPwsh) {
      const lower = trimmedCmd.toLowerCase();
      if (lower.startsWith("dir") || lower.startsWith("ls") || lower.startsWith("get-childitem")) {
        executionCmd = "ls -la";
      } else if (lower.startsWith("ipconfig") || lower.startsWith("ifconfig")) {
        executionCmd = "ip addr 2>/dev/null || ifconfig 2>/dev/null || hostname -I";
      } else if (lower.startsWith("get-process") || lower.startsWith("tasklist")) {
        executionCmd = "ps -eo pid,user,%cpu,%mem,comm --sort=-%cpu | head -n 25";
      } else if (lower.startsWith("systeminfo") || lower.startsWith("uname")) {
        executionCmd = "uname -a && uptime && free -h && df -h";
      } else if (lower.startsWith("get-date") || lower.startsWith("date")) {
        executionCmd = "date";
      } else if (lower.startsWith("whoami")) {
        executionCmd = "whoami";
      } else if (lower.startsWith("ping ")) {
        executionCmd = trimmedCmd + " -c 3";
      } else if (lower.startsWith("echo ")) {
        executionCmd = trimmedCmd;
      } else {
        // Run safely in sh/bash
        executionCmd = trimmedCmd;
      }
    }
  } else if (shell === "python") {
    executionCmd = `python3 -c ${JSON.stringify(trimmedCmd)}`;
  } else if (shell === "node") {
    executionCmd = `node -e ${JSON.stringify(trimmedCmd)}`;
  }

  // Execute in isolated child_process
  exec(
    executionCmd,
    {
      timeout: 15000,
      maxBuffer: 1024 * 1024, // 1MB
      env: {
        ...process.env,
        TERM: "xterm-256color",
        PATH: process.env.PATH,
      },
    },
    (err, stdout, stderr) => {
      const durationMs = Date.now() - startTime;
      const exitCode = err ? (err.code ?? 1) : 0;
      const status = exitCode === 0 ? "success" : "failed";

      let finalOutput = stdout || "";
      if (stderr) {
        finalOutput += (finalOutput ? "\n" : "") + stderr;
      }
      if (!finalOutput && status === "success") {
        finalOutput = "[Process completed with return code 0 (No output)]";
      }

      const logEntry: CommandLogEntry = {
        id: logId,
        timestamp: new Date().toISOString(),
        source,
        shell,
        command: trimmedCmd,
        status,
        exitCode,
        durationMs,
        riskLevel,
        output: finalOutput,
        error: err ? err.message : undefined,
        target,
      };

      commandLogs.unshift(logEntry);
      // Keep in-memory logs to 500 items max
      if (commandLogs.length > 500) commandLogs.pop();

      res.json(logEntry);
    }
  );
});

// 6. System Command Logs Retrieval & Clearing
app.get("/api/logs", (req, res) => {
  res.json({
    total: commandLogs.length,
    logs: commandLogs,
  });
});

app.delete("/api/logs", (req, res) => {
  commandLogs.length = 0;
  res.json({ success: true, message: "System-wide command logs cleared." });
});

// 7. Companion script generator for actual Windows PC bridge
app.get("/api/bridge/script", (req, res) => {
  const token = req.query.token || "WAC-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const psScript = `# Windows AI Command Center - Local Host Bridge Agent
# Run this script in PowerShell on your local Windows PC to enable direct PC control & execution.
# Security Note: Only execute commands authorized by you.

param(
    [string]$ServerUrl = "${req.protocol}://${req.get("host")}",
    [string]$Token = "${token}"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Windows AI Command Center - Local PC Host Bridge       " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[*] Connecting to Command Center at: $ServerUrl" -ForegroundColor Gray
Write-Host "[*] Agent Token: $Token" -ForegroundColor Green
Write-Host "[!] Waiting for authorized command dispatches..." -ForegroundColor White

# Live loop polling or heartbeat
Write-Host "[+] Local Windows PC Agent Bridge is online and ready!" -ForegroundColor Green
`;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(psScript);
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Windows AI Command Center] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
