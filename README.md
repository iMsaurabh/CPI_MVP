# CPI Agentic API — Project Pipeline

---

## Project Overview

A **multi-agent agentic API** that accepts natural language input via
chat, orchestrates specialized AI agents via MCP protocol, and executes
operations against SAP Cloud Platform Integration (CPI) APIs. A React
frontend provides a chat interface with persistent sidebar for settings,
job scheduling and MCP server management.

**Core Architectural Patterns:**
- **Multi-Agent Orchestration** — orchestrator delegates to MCP servers
- **MCP Protocol** — Model Context Protocol for dynamic tool discovery
- **Provider Abstraction** — AI engine swappable via config
- **Strategy Pattern** — mock/real CPI switching via config
- **ReAct Pattern** — Reason + Act agentic loop
- **Response Envelope Pattern** — consistent API response shape
- **Data Driven Tool Registration** — tools defined in JSON config

---

## Technology Stack

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js | JavaScript server runtime |
| Framework | Express.js | HTTP server and routing |
| AI (Dev) | Ollama + llama3.2 | Local LLM, no API key |
| AI (Free) | Groq | Free API, reliable tool calling |
| AI (Prod) | Claude / OpenAI | Cloud LLM providers |
| Logger | Pino + pino-roll | Structured logging with rotation |
| MCP | @modelcontextprotocol/sdk | MCP protocol implementation |
| Scheduler | node-cron | Job scheduling |
| Containers | Docker | Deployment |

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React + Vite | Component based UI |
| Styling | TailwindCSS | Utility first CSS |
| HTTP Client | Axios | API calls |
| State | React Context | Shared state management |
| Notifications | EventSource (SSE) | Real time job events |

### MCP Servers
| Server | Port | Purpose |
|--------|------|---------|
| CPI MCP Server | 3001 | SAP CPI operations |
| Scheduler MCP Server | 3002 | Job scheduling operations |

---

## Complete Pipeline

```
BACKEND ✅
─────────────────────────────────────────────────────
Group 1   Bootstrap
Group 2   Mock Service + Config
Group 3   Tools
Group 4   Providers
Group 5   Agents (Multi-Agent)
Group 6   Routes
Group 7   Middleware + Utils
Group 8   Docker

MCP MIGRATION ✅
─────────────────────────────────────────────────────
Group A   CPI MCP Server Bootstrap
Group B   Backend as MCP Client
Group C   Admin UI for Tool Management

SCHEDULING ✅
─────────────────────────────────────────────────────
Group D1  Scheduler MCP Server
Group E   Notifications Frontend
Group F   Jobs Management UI + Layout Redesign

FRONTEND ✅
─────────────────────────────────────────────────────
Group 9   Frontend Bootstrap
Group 10  Chat UI
Group 11  Settings Panel
Group 12  Docker Frontend

LOGGING ✅
─────────────────────────────────────────────────────
          Per-agent configurable logging with rotation

REAL CPI ✅
─────────────────────────────────────────────────────
          OAuth 2.0 + CSRF token implementation

PENDING
─────────────────────────────────────────────────────
Group G   Log Monitoring (agents + MCP servers)
Group H   YAML to MCP Server Generation
Group I   Docker — full stack with MCP servers
```

---

# BACKEND — COMPLETE ✅

## Group 1 — Bootstrap ✅
Monorepo structure, Express server port 3000, .env config, Pino logger, health check.

## Group 2 — Mock Service + Config ✅
`getService()` evaluated at call time. Mock/real switching via USE_MOCK env var.
**Critical:** `getService()` must be a function not a variable — enables runtime switching.

## Group 3 — Tools ✅
Tool definitions, toolRegistry.js, toolMap for routing.
Later replaced by MCP server tool definitions.

## Group 4 — Providers ✅
Factory pattern. Ollama, Groq, Claude, OpenAI behind common `chat()` interface.
Groq added for reliable tool calling.

## Group 5 — Agents ✅
OrchestratorAgent + specialist agents with ReAct pattern.
**Critical:** Tool call history must use raw provider response format with `tool_call_id`.

## Group 6 — Routes ✅
`POST /api/chat`, `GET /api/providers`, `GET /api/mcp/servers`, `POST /api/mcp/reload`.

## Group 7 — Middleware + Utils ✅
requestLogger, errorHandler (4 params required), responseFormatter.
**Order:** `express.json() → requestLogger → routes → errorHandler`

## Group 8 — Docker ✅
Multi-stage Dockerfile, docker-compose, .gitattributes for LF line endings.
**Critical:** Use `env_file` not `${VAR}` in environment section.

---

# MCP MIGRATION — COMPLETE ✅

## Group A — CPI MCP Server ✅
Port 3001. Dynamic tool loading from toolsConfig.json.
MCP SDK requires Zod schemas. `buildZodSchema()` bridges config to SDK.

**Admin endpoints:** `/admin/tools` (CRUD), `/admin/execute`, `/admin/mock`, `/admin/restart-tools`

## Group B — Backend as MCP Client ✅
`backend/src/mcp/mcpClient.js` — connection, discovery, routing.
`backend/src/config/mcpConfig.js` — MCP server registry.

**Adding a new MCP server = 3 changes only:**
1. Build server in `mcp-servers/your-server/`
2. Add entry to `mcpConfig.js`
3. Add URL to `.env`

## Group C — Admin UI for Tool Management ✅
McpAdminPanel with collapsible servers, AddToolForm, ToolCard.
Mock mode via `/admin/mock` endpoint — not tool parameters (SDK strips unknown params).

---

# SCHEDULING — COMPLETE ✅

## Group D1 — Scheduler MCP Server ✅
Port 3002. node-cron scheduling, retry logic, SSE event broadcasting.

**Tools:** `previewJob`, `createJob`, `listJobs`, `deleteJob`, `toggleJob`, `runJobNow`, `getJobHistory`

**Job shape:**
```json
{
  "id": "job_abc123",
  "name": "Daily deploy MyIFlow",
  "tool": "deployArtifact",
  "parameters": { "artifactId": "MyIFlow_v1" },
  "schedule": { "frequency": "weekly", "days": ["monday"], "time": "09:00", "timezone": "UTC", "cron": "0 9 * * 1" },
  "retry": { "enabled": true, "maxRetries": 2, "delayMinutes": 5, "timeoutSeconds": 30 },
  "enabled": true
}
```

**Chat scheduling flow:** User describes → LLM calls previewJob → confirms → LLM calls createJob.

**Critical bugs fixed:**
- All tool param types as `string` — Groq validates before server receives
- Type coercion via `toBoolean()`, `toNumber()`, `parseDays()`
- Conversation history required for multi-turn confirmation
- Current UTC time injected into system prompt

## Group E — Notifications Frontend ✅
SSE via EventSource. 3 second batch window, grouped by tool name.
ToastStack (max 4, auto-dismiss 6s), NotificationBubble, NotificationPanel.

## Group F — Jobs Management UI + Layout Redesign ✅
Persistent sidebar (320px) — Settings expanded, Jobs/MCP collapsed.
Dynamic parameter forms — no raw JSON, inputs per tool parameter.
Auto-refresh every 30 seconds. Run Now modal. Execution history modal.

---

# FRONTEND — COMPLETE ✅

## Group 9 — Frontend Bootstrap ✅
React + Vite + TailwindCSS. Vite proxy for CORS. apiService.js as single HTTP client.

## Group 10 — Chat UI ✅
useChat hook, ChatWindow, ChatInput (auto-expand, focus restore), MessageBubble.
Conversation history sent with every request (last 10 messages).

## Group 11 — Settings Panel ✅
SettingsContext, ProviderSettings, localStorage persistence.

## Group 12 — Docker Frontend ✅
Multi-stage Dockerfile. Nginx serves static + proxies `/api/*` to backend.

---

# PENDING

## Group G — Log Monitoring
**Objective:** View agent and MCP server logs from admin UI.

**Existing infrastructure:**
- `backend/logs/agents.log` — already exists via pino-roll
- MCP servers need log files added

**Questions to answer:**
1. Unified view or tabs per server?
2. SSE streaming or polling?
3. Sidebar panel or full screen?

## Group H — YAML to MCP Server Generation
**Objective:** Upload OpenAPI/Swagger YAML → generate working MCP server scaffold.

**Existing YAMLs in project:**
- `IntegrationContent.yaml`
- `MessageProcessingLogs.yaml`

**Questions to answer:**
1. Upload file via UI or URL?
2. Auto-start or manual start?
3. Auto-register in mcpConfig.js or manual?

## Group I — Docker Full Stack
Add CPI MCP and Scheduler MCP as Docker containers.
Four service docker-compose: backend + frontend + cpi-mcp + scheduler-mcp.

---

## Running the Full Stack Locally

```bash
# Terminal 1
cd mcp-servers/cpi && npm run dev        # port 3001

# Terminal 2
cd mcp-servers/scheduler && npm run dev  # port 3002

# Terminal 3
cd backend && npm run dev                # port 3000

# Terminal 4
cd frontend && npm run dev               # port 5173
```

---

## Environment Variables Reference

### backend/.env
```
PORT=3000
NODE_ENV=development
USE_MOCK=true
AI_PROVIDER=groq
AI_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434
GROQ_API_KEY=
GROQ_MODEL=llama3-groq-70b-8192-tool-use-preview
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
CPI_BASE_URL=
CPI_CLIENT_ID=
CPI_CLIENT_SECRET=
CPI_TOKEN_URL=
CPI_MCP_URL=http://localhost:3001/mcp
SCHEDULER_MCP_URL=http://localhost:3002/mcp
```

### mcp-servers/cpi/.env
```
PORT=3001
USE_MOCK=true
CPI_BASE_URL=
CPI_CLIENT_ID=
CPI_CLIENT_SECRET=
CPI_TOKEN_URL=
```

### mcp-servers/scheduler/.env
```
PORT=3002
CPI_MCP_URL=http://localhost:3001
```

### frontend/.env
```
VITE_API_BASE_URL=http://localhost:5173
VITE_CPI_MCP_URL=http://localhost:3001/mcp
VITE_SCHEDULER_MCP_URL=http://localhost:3002/mcp
```

---

## Critical Rules and Gotchas

1. `getService()` must be function evaluated at call time — not module load
2. Tool call history must use raw provider response format with `tool_call_id`
3. `GROQ_MODEL` must be set explicitly — fallback to `AI_MODEL` breaks tool calling
4. Docker `environment` with `${VAR}` reads from shell not `env_file`
5. Windows line endings break Docker YAML — fix with `sed -i 's/\r//' filename`
6. React component files must be PascalCase — Linux Docker is case sensitive
7. MCP SDK requires Zod schemas not JSON Schema for tool validation
8. All MCP tool param types should be `string` — Groq validates before server
9. Separate processes have separate `process.env` — use HTTP endpoints for runtime config
10. Never use quotes around `.env` values — dotenv reads them literally
11. `messages` must be in `useCallback` dependency array for conversation history
12. dotenv must load before any `process.env` reads — always first line
13. Mock mode for MCP servers set via `/admin/mock` endpoint not tool params
14. Current UTC time must be injected into system prompt for accurate scheduling
15. `module.exports = { x }` requires `const { x } = require(...)` on import
16. `allTools` must use square brackets not curly braces when spreading arrays
17. Never use quotes around .env values — `USE_MOCK=false` not `USE_MOCK='false'`

---

## Post-MVP Backlog

| Feature | Description |
|---------|-------------|
| Authentication | User login, session management |
| Streaming responses | Token by token response display |
| MCP server registration UI | Register servers without editing config |
| Conversation memory | Persistent chat history across sessions |
| Rate limiting | API request throttling |
| CI/CD pipeline | Automated testing and deployment |