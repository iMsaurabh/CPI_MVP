# Logging Config — Per-Agent Configurable Logging

---

## Where Am I?

```
[BACKEND COMPLETE] → [LOGGING CONFIG — COMPLETE] → Frontend Groups 9-12
                               ↑
                          You are here
```

---

## Objective

**Add configurable per-agent logging with dual output — console and
rotating log file. Each agent has independent on/off control and log
level. Logs persist across Docker container restarts via volume mount.**

This was added between backend completion and frontend development
because it provides immediate debugging value with minimal complexity.

---

## What Was Built

### 1. Logging Config (`config/loggingConfig.js`)

Central control panel for all agent logging. Single file controls
the logging behaviour of every agent in the system.

**Structure:**
```javascript
{
  agents: {
    orchestratorAgent: { enabled: true, level: 'info' },
    monitoringAgent:   { enabled: true, level: 'debug' },
    deploymentAgent:   { enabled: true, level: 'info' }
  },
  default: { enabled: true, level: 'info' },
  file: {
    path: 'logs/agents.log',
    frequency: 'daily',
    limit: { count: 14 }
  }
}
```

**Rules:**
- Each agent entry is independent — enabling one does not affect others
- If an agent is not listed, `default` config applies automatically
- Adding a new agent requires one new entry here — nothing else changes
- Frontend toggle will override these values per session in future

---

### 2. Agent Logger (`utils/agentLogger.js`)

Logger factory that creates a configured logger instance per agent.
Each agent calls `getAgentLogger('agentName')` once at module load.

**What each logger instance does:**
- Checks `loggingConfig` to determine if agent logging is enabled
- Returns `noOpLogger` if disabled — agents never check themselves
- Writes to console with color and pretty formatting
- Writes to rotating log file simultaneously
- Uses ISO timestamp format for readability

**Dual output — multi-target transport:**
```
One log call
     ↓
pino multi-target transport
     ↓              ↓
Console            Log file
(pino-pretty)      (pino-roll)
colorized          daily rotation
readable           persisted
```

**noOpLogger pattern:**
When an agent is disabled, a no-op logger is returned that has the
same interface (`debug`, `info`, `warn`, `error`) but does nothing.
Agents never need conditional checks — they just call the logger.

```javascript
// agent code is always the same regardless of enabled/disabled
logger.info({ task }, 'Agent started');

// if disabled, above line does nothing silently
// if enabled, above line logs to console and file
```

---

### 3. Log Levels

| Level | When to Use | Example |
|-------|------------|---------|
| `debug` | Verbose diagnostic info, high frequency | Loop iterations, parameters |
| `info` | General operational events | Agent started, tool executed |
| `warn` | Unexpected but non-breaking | Unknown tool requested |
| `error` | Failures needing attention | Tool execution failed |

**Level hierarchy:** `debug < info < warn < error`

Setting level to `warn` means only `warn` and `error` are logged.
Setting level to `debug` means everything is logged.

**Recommended per agent:**
- `orchestratorAgent` → `info` — high level coordination events
- `monitoringAgent` → `debug` — verbose for debugging data retrieval
- `deploymentAgent` → `info` — deployment confirmations

---

### 4. Log File Rotation (`pino-roll`)

Daily rotation — new log file created each day.
Old files archived with date suffix automatically.

```
logs/
├── agents.log              ← today's active file
├── agents.log.2026-04-04   ← yesterday, archived
├── agents.log.2026-04-03   ← two days ago
└── ...                     ← up to 14 days kept
```

14 day retention — older files deleted automatically.
Prevents log directory from growing indefinitely.

---

### 5. Docker Volume for Log Persistence

Without volume — logs are lost when container stops or restarts.
With volume — logs survive on host machine regardless of container state.

**Volume mapping in docker-compose.yml:**
```yaml
volumes:
  - ../backend/logs:/app/logs
  - ../backend/src/config/loggingConfig.js:/app/src/config/loggingConfig.js
```

**Two volumes mounted:**

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `backend/logs/` | `/app/logs` | Log files persist after container stops |
| `backend/src/config/loggingConfig.js` | `/app/src/config/loggingConfig.js` | Config changes without rebuild |

**Why mount loggingConfig.js as volume:**
If baked into image, every config change requires full image rebuild.
Mounting as volume means changes take effect with just a container restart:
```bash
docker compose -f docker/docker-compose.yml restart
```

Much faster than `down + build --no-cache + up`.

---

## Log Output Format

**Console:**
```
[2026-04-05 10:23:41] INFO (orchestratorAgent): Orchestrator received message
    userMessage: "What is the status of MSG12345?"

[2026-04-05 10:23:42] DEBUG (monitoringAgent): ReAct loop iteration
    iterations: 1

[2026-04-05 10:23:43] INFO (monitoringAgent): Tool executed successfully
    toolName: "getMessageStatus"
```

**Log file (JSON with ISO timestamp):**
```json
{"level":30,"time":"2026-04-05T10:23:41.123Z","name":"orchestratorAgent","msg":"Orchestrator received message","userMessage":"What is the status of MSG12345?"}
```

Console is human readable for development. File is structured JSON
for programmatic parsing and future admin dashboard integration.

---

## Usage Pattern in Every Agent

```javascript
// 1. import at top of agent file
const { getAgentLogger } = require('../utils/agentLogger');

// 2. create logger instance once at module level
const logger = getAgentLogger('agentName');

// 3. use throughout agent — same interface regardless of config
logger.debug({ params }, 'Executing tool');
logger.info({ task }, 'Agent started');
logger.warn({ toolName }, 'Unknown tool requested');
logger.error({ error: err.message }, 'Tool execution failed');
```

**Log call format:**
```javascript
logger.level({ contextObject }, 'message string');
```

Context object contains structured data. Message string is the
human readable description. Pino logs both together.

---

## Adding Logging to a New Agent

Two steps only:

**Step 1 — Add entry to loggingConfig.js:**
```javascript
agents: {
  newAgent: {
    enabled: true,
    level: 'info'
  }
}
```

**Step 2 — Add to agent file:**
```javascript
const { getAgentLogger } = require('../utils/agentLogger');
const logger = getAgentLogger('newAgent');
```

Nothing else changes. Logger factory handles the rest automatically.

---

## Key Concepts Introduced

### Multi-Target Transport
Sending log output to multiple destinations simultaneously from a
single log call. Pino's transport system handles fan-out internally.
One `logger.info()` call writes to both console and file.

### Log Rotation
Creating a new log file on a schedule (daily) and archiving old ones.
Prevents single log file from growing indefinitely. Industry standard
practice for production logging.

### noOpLogger Pattern
Returning an object with the same interface as the real logger but
with empty method implementations. Callers never need to check if
logging is enabled — the logger handles it transparently.

### Volume Mounting for Config
Mounting a config file as a Docker volume instead of baking it into
the image. Enables runtime config changes without image rebuilds.
Trade-off: config file must exist on host before container starts.

### ISO Timestamp
`pino.stdTimeFunctions.isoTime` outputs timestamps as
`"2026-04-05T10:23:41.123Z"` — internationally standardized,
human readable, sortable, and parseable by all log analysis tools.

---

## Current File Structure

```
backend/
├── logs/
│   ├── .gitkeep                    ✅ tracks folder in git
│   └── agents.log                  ← runtime, gitignored
├── src/
│   ├── config/
│   │   ├── apiConfig.js
│   │   └── loggingConfig.js        ✅ per agent logging control
│   ├── agents/
│   │   ├── orchestratorAgent.js    ✅ logging added
│   │   ├── monitoringAgent.js      ✅ logging added
│   │   └── deploymentAgent.js      ✅ logging added
│   └── utils/
│       ├── logger.js
│       ├── responseFormatter.js
│       └── agentLogger.js          ✅ logger factory
docker/
└── docker-compose.yml              ✅ volumes added
```

---

## Docker Commands Reference for Logging

```bash
# restart container after config change (no rebuild needed)
docker compose -f docker/docker-compose.yml restart

# view live container logs
docker logs cpi-agent-backend -f

# view log file on host
cat backend/logs/agents.log

# view today's logs only
tail -f backend/logs/agents.log
```

---

## README Notes (Captured During Build)

28. **Per-agent logging is controlled by loggingConfig.js:**
    - Each agent has independent enabled flag and log level
    - Adding new agent requires one entry in config — nothing else
    - noOpLogger pattern means agents never check if logging is enabled

29. **Mount loggingConfig.js as Docker volume for fast iteration:**
    - Config changes require only `docker compose restart`
    - No image rebuild needed
    - Baked config requires full `build --no-cache` cycle

30. **Log files use JSON format, console uses pretty format:**
    - JSON in files enables programmatic parsing for future dashboard
    - ISO timestamps are human readable and sortable
    - pino multi-target transport handles both simultaneously

31. **Docker volume for logs prevents data loss:**
    - Without volume, logs are lost on container stop
    - With volume, logs persist on host regardless of container state
    - Same log file receives entries from both local and Docker runs

---

## What's Next — Frontend Phase

```
Group 9  — Frontend Bootstrap (React + Vite + TailwindCSS)
Group 10 — Chat UI
Group 11 — Settings Panel (provider selection, API key, mock toggle)
Group 12 — Docker Frontend Service
```

The backend API contract is already designed for the frontend.
No backend changes needed when frontend development begins.