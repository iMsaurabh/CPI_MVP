# CPI Agentic API — Project Pipeline

---

## Project Overview

Building a **multi-agent REST API** that accepts natural language input via
chat, orchestrates specialized AI agents, and executes operations against
SAP Cloud Platform Integration (CPI) APIs. A frontend chat interface
connects to this backend allowing users to interact with CPI via natural
language.

**Core Architectural Patterns Used:**
- **Multi-Agent Orchestration** — multiple AI agents with specialized responsibilities, coordinated by an orchestrator
- **Provider Abstraction** — AI engine is decoupled from business logic, swappable via config
- **Service Layer Pattern** — business logic is separated from HTTP routing
- **Mock/Real Strategy Pattern** — same interface, two implementations (fake and real)
- **RESTful API Design** — stateless HTTP endpoints following REST conventions
- **Response Envelope Pattern** — consistent response shape across all endpoints
- **ReAct Pattern** — Reason + Act agentic loop for specialist agents

---

## Technology Stack

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js | JavaScript server runtime |
| Web Framework | Express.js | HTTP server and routing |
| AI Engine (Dev) | Ollama + llama3.2 | Local LLM, no API key required |
| AI Engine (Free) | Groq | Free API, reliable tool calling |
| AI Engine (Prod) | Claude / OpenAI | Cloud LLM providers, API key required |
| HTTP Client | Axios | Makes outbound HTTP calls to CPI APIs |
| Logger | Pino | Structured, production grade logging |
| Containerization | Docker | Packages app for consistent deployment |
| Environment Config | dotenv | Manages environment variables |

### Frontend (Planned)
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React | Component based UI |
| HTTP Client | Axios | Calls backend API |
| Styling | TailwindCSS | Utility first CSS framework |
| State Management | React Context | Provider selection, chat history |

---

## Overall Pipeline

```
BACKEND (COMPLETE)
──────────────────────────────────────────────────────────────
Group 1    Group 2    Group 3    Group 4    Group 5
Bootstrap → Mock      → Tools    → Providers → Agents
           Service                            (Multi-Agent)
           + Config

Group 6    Group 7    Group 8
Routes   → Middleware → Docker
           + Utils

FRONTEND (NEXT)
──────────────────────────────────────────────────────────────
Group 9    Group 10   Group 11   Group 12
Bootstrap → Chat UI  → Settings → Docker
                       Panel      Frontend
                                  Service
```

---

# BACKEND — COMPLETE ✅

---

## Group 1 — Bootstrap ✅ COMPLETE

**Objective:** Initialize the project foundation. Get a working Express
server running with correct structure, environment config, and logging.

**Key Deliverables:**
- Monorepo folder structure established
- Express server running on `http://localhost:3000`
- Environment variables configured via `.env`
- Structured logging via Pino
- Health check endpoint: `GET /health`

**Concepts:** Monorepo structure, environment variable management,
separation of concerns, development vs production tooling.

---

## Group 2 — Mock Service + Configuration ✅ COMPLETE

**Objective:** Build a fake CPI service layer. Implement config switch
to toggle between mock and real CPI without changing business logic.

**Key Deliverables:**
- `config/apiConfig.js` — reads `USE_MOCK`, returns correct service
- `services/mock/cpiMockService.js` — fake CPI responses
- `services/real/cpiRealService.js` — scaffolded with OAuth ready

**CPI Operations:**
`getMessageStatus`, `getMessageLog`, `deployArtifact`, `undeployArtifact`

**Concepts:** Strategy Pattern, Service Layer, Token Caching, async/await.

---

## Group 3 — Tools ✅ COMPLETE

**Objective:** Define formal capability contracts that tell AI agents
what actions are available and what parameters each requires.

**Key Deliverables:**
- `tools/monitoringTools.js` — monitoring capability contracts
- `tools/deploymentTools.js` — deployment capability contracts
- `tools/toolRegistry.js` — central tool index + toolMap

**Concepts:** Tool Calling, JSON Schema, Agentic Loop,
Tool Registry, Lookup Table Pattern.

---

## Group 4 — Providers ✅ COMPLETE

**Objective:** Wrap each AI engine behind a common interface so agents
never depend on a specific provider.

**Key Deliverables:**
- `providers/baseProvider.js` — interface contract
- `providers/ollamaProvider.js` — local development
- `providers/claudeProvider.js` — Anthropic (scaffolded)
- `providers/openaiProvider.js` — OpenAI (scaffolded)
- `providers/groqProvider.js` — free API, reliable tool calling
- `providers/providerFactory.js` — factory, single entry point

**Common interface:** `chat(messages, tools, options) → response`

**Concepts:** Factory Pattern, Dependency Inversion, Lazy Loading,
Response Normalization, Temperature.

---

## Group 5 — Agents ✅ COMPLETE

**Objective:** Build the multi-agent orchestration layer. Orchestrator
coordinates specialists. Each specialist owns a focused CPI domain.

**Key Deliverables:**
- `agents/orchestratorAgent.js` — coordinates all requests
- `agents/monitoringAgent.js` — handles status and logs
- `agents/deploymentAgent.js` — handles deploy and undeploy

**Request flow:**
```
User → Orchestrator → toolMap → Specialist → ReAct Loop → cpiService → Response
```

**Concepts:** ReAct Pattern, Orchestrator Pattern, Single Responsibility
Agents, Tool Call Message Format, finish_reason, maxIterations Safety Limit.

---

## Group 6 — Routes ✅ COMPLETE

**Objective:** Expose the agent pipeline via HTTP endpoints.

**Key Deliverables:**
- `routes/chatRoutes.js` — chat and providers endpoints
- Routes registered in `server.js` under `/api` prefix

**Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Server status |
| `GET` | `/api/providers` | List supported AI providers |
| `POST` | `/api/chat` | Send message through agent pipeline |

**Concepts:** Route Layer Pattern, API Prefix Convention,
Fail Fast Validation, express.Router().

---

## Group 7 — Middleware + Utils ✅ COMPLETE

**Objective:** Add cross-cutting concerns. Middleware runs automatically
on every request. Utils are shared helpers.

**Key Deliverables:**
- `middleware/requestLogger.js` — logs every request automatically
- `middleware/errorHandler.js` — catches all unhandled errors
- `utils/responseFormatter.js` — consistent response envelope
- `utils/logger.js` — shared Pino logger instance

**Middleware order in server.js:**
```
express.json() → requestLogger → routes → errorHandler
```

**Concepts:** Middleware Pipeline, Cross-Cutting Concerns,
Response Envelope Pattern, Monkey Patching, next(err).

---

## Group 8 — Docker ✅ COMPLETE

**Objective:** Package the application into a Docker image.

**Key Deliverables:**
- `backend/.dockerignore` — excludes secrets and dev files
- `docker/Dockerfile.backend` — image build instructions
- `docker/docker-compose.yml` — service definitions
- `.gitattributes` — enforces Unix line endings for Docker files

**Key commands:**
```bash
docker compose -f docker/docker-compose.yml build --no-cache
docker compose -f docker/docker-compose.yml up -d
docker logs cpi-agent-backend -f
docker compose -f docker/docker-compose.yml down
```

**Concepts:** Image vs Container, Layer Caching, host.docker.internal,
env_file vs environment, Detached Mode, Health Check.

---

# FRONTEND — NEXT PHASE

---

## Group 9 — Frontend Bootstrap ✅ COMPLETE

**Objective:** Initialize the React frontend project. Establish folder
structure, install dependencies, configure environment, verify dev
server runs.

**Key Deliverables:**
- React project initialized inside `frontend/`
- Folder structure established
- Axios configured to point to backend API
- Environment config for API base URL
- Blank app running on `http://localhost:5173`

**Tech:** React, Vite, Axios, TailwindCSS

---

## Group 10 — Chat UI

**Objective:** Build the core chat interface. User types a message,
it is sent to `/api/chat`, response is displayed.

**Key Deliverables:**
- `components/ChatWindow.jsx` — displays conversation history
- `components/ChatInput.jsx` — message input and send button
- `components/MessageBubble.jsx` — individual message display
- `services/apiService.js` — Axios calls to backend
- Chat history maintained in component state

**UX details:**
- User messages on right, agent responses on left
- Loading indicator while agent is processing
- Display `delegatedTo` metadata below agent responses
- Error messages displayed inline if request fails

---

## Group 11 — Settings Panel

**Objective:** Build the provider selection and configuration UI.
User selects AI provider and optionally provides their own API key.

**Key Deliverables:**
- `components/SettingsPanel.jsx` — provider dropdown and API key input
- Provider list fetched dynamically from `GET /api/providers`
- Selected provider and API key sent with every chat request
- Settings persisted in browser `localStorage`
- Mock mode toggle

**UX details:**
- Settings accessible via gear icon
- Provider dropdown populated from backend
- API key input masked by default
- Current provider shown in chat header

---

## Group 12 — Docker Frontend Service

**Objective:** Add frontend as a second service in docker-compose.
Both frontend and backend run as containers.

**Key Deliverables:**
- `docker/Dockerfile.frontend` — frontend image build instructions
- `docker/docker-compose.yml` updated with frontend service
- Nginx configured to serve React build and proxy API calls
- Full stack runs with single `docker compose up` command

**Architecture inside Docker:**
```
Browser → Nginx (port 80) → serves React static files
                           → proxies /api/* → backend:3000
```

**Concepts:** Nginx reverse proxy, multi-service compose,
static file serving, build stage vs serve stage in Dockerfile.

---

## API Contract Reference

All endpoints the frontend will consume:

| Method | Endpoint | Request | Response |
|--------|----------|---------|---------|
| `GET` | `/health` | — | `{ status, mock, aiProvider }` |
| `GET` | `/api/providers` | — | `{ success, providers: [] }` |
| `POST` | `/api/chat` | `{ message, provider, apiKey }` | `{ success, response, agent, delegatedTo }` |

---

## Environment Variables Reference

### Backend (.env)
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
```

### Frontend (.env) — planned
```
VITE_API_BASE_URL=http://localhost:3000
```

---

## Terminology Reference

| Term | Plain English |
|------|--------------|
| **REST API** | Set of HTTP endpoints following standard conventions |
| **Endpoint** | Specific URL your API exposes |
| **Middleware** | Code that runs automatically on every request |
| **Service Layer** | Where business logic lives, separate from HTTP |
| **Mock Service** | Fake implementation returning realistic data |
| **Strategy Pattern** | Two implementations of same interface, swappable |
| **Factory Pattern** | Function returning correct implementation based on input |
| **Orchestrator** | Agent that coordinates others, does no domain work |
| **Specialist Agent** | Agent with single focused responsibility |
| **ReAct Pattern** | Reason + Act agentic loop |
| **Agentic Loop** | Agent reasons → calls tool → observes → responds |
| **Tool Calling** | How an LLM invokes an external function |
| **Provider** | AI engine wrapped behind common interface |
| **Abstraction Layer** | Hides implementation behind common interface |
| **Monorepo** | Single repository containing multiple related projects |
| **Environment Variable** | Config value set outside code, varies per environment |
| **Containerization** | Packaging app into portable, isolated runtime |
| **JSON Schema** | Standard format describing shape and rules of JSON data |
| **Response Envelope** | Consistent outer structure wrapping all API responses |
| **Cross-Cutting Concern** | Functionality applying across entire application |
| **Layer Caching** | Docker reusing unchanged build layers for faster rebuilds |
| **Lazy Loading** | Importing a module only when actually needed |
| **finish_reason** | LLM field indicating why response generation stopped |
| **Reverse Proxy** | Server that forwards requests to another server |

---

## Captured README Notes — Full List

1. `res.json()` sends to API caller. `logger.info()` sends to server console. Independent.
2. `.env` is for server operator config. UI selection is for end user preferences.
3. Ollama engine and model are separate installs. Models never go into Docker images.
4. Mock and real services implement identical interfaces. Config switch requires zero code changes.
5. dotenv must load before any `process.env` reads occur.
6. Destructuring mismatch — `module.exports = { x }` requires `const { x } = require(...)`.
7. Tool definitions are provider agnostic. Each provider transforms internally.
8. Tool descriptions are instructions to the LLM, not documentation for humans.
9. toolMap eliminates if/else chains. O(1) lookup, one line to add new tool.
10. Provider abstraction isolates LLM differences behind common interface.
11. Lazy loading prevents startup crashes for optional provider SDKs.
12. Temperature 0.1 for technical tool calling. Higher for creative tasks.
13. ReAct pattern — always set maxIterations to prevent infinite loops.
14. Never use internal normalized format for tool calling conversation history.
15. finish_reason `tool_calls` confirms structured tool calls. `stop` means text only.
16. Model selection determines tool calling reliability. Use fine-tuned models.
17. Routes handle HTTP concerns only. Never contain business logic.
18. Provider selection priority — request body → env var → factory default.
19. Mount API routes under `/api` prefix. Industry standard convention.
20. Middleware order is not optional. Wrong order causes silent failures.
21. Error handler requires exactly four parameters. Never remove any.
22. Always call next() or send a response in middleware. Never leave hanging.
23. NODE_ENV controls environment behaviour. Set explicitly, never assume.
24. Secrets never go into Docker images. Injected at runtime via env_file.
25. env_file loads from file. environment with ${VAR} reads from shell.
26. Always fix line endings for Docker files on Windows. Use .gitattributes.
27. Copy package.json before source code in Dockerfile. Exploits layer caching.