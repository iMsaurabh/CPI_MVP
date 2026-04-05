// loggingConfig is the central control panel for per-agent logging.
// Each agent has independent enabled flag and log level.
//
// enabled: true/false — toggles logging for that agent entirely
// level: controls minimum severity logged
//   'debug' — everything including verbose diagnostic info
//   'info'  — general operational messages
//   'warn'  — something unexpected but not breaking
//   'error' — failures that need attention
//
// Hierarchy: debug < info < warn < error
// Setting level to 'warn' means only warn and error messages are logged.
// Setting level to 'debug' means everything is logged.
//
// default applies to any agent not explicitly listed.
// Adding a new agent requires one new entry here — nothing else changes.
//
// Future: these values will be overridable per session from frontend UI.

const loggingConfig = {
    agents: {
        orchestratorAgent: {
            enabled: true,
            level: 'info'
        },
        monitoringAgent: {
            enabled: true,
            level: 'debug'
        },
        deploymentAgent: {
            enabled: true,
            level: 'info'
        }
    },

    // global fallback for any agent not listed above
    default: {
        enabled: true,
        level: 'info'
    },

    // log file settings
    file: {
        // path relative to project root when running locally
        // inside Docker this maps to the mounted volume path
        path: 'logs/agents.log',
        // rotate daily — new file each day
        // old files renamed to agents.log.2026-04-05 etc
        frequency: 'daily',
        // keep last 14 days of log files
        limit: { count: 14 }
    }
};

module.exports = loggingConfig;