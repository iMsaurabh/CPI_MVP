// agentLogger is a logger factory for agents.
// Each agent calls getAgentLogger('agentName') to get its own
// configured logger instance.
//
// Each logger instance:
//   - checks loggingConfig to see if agent logging is enabled
//   - respects configured log level for that agent
//   - writes to console AND rotating log file simultaneously
//   - returns a no-op logger if agent logging is disabled
//
// Usage in any agent:
//   const { getAgentLogger } = require('../utils/agentLogger');
//   const logger = getAgentLogger('monitoringAgent');
//   logger.info({ messageId }, 'Fetching message status');

const pino = require('pino');
const path = require('path');
const loggingConfig = require('../config/loggingConfig');

// resolve log file path relative to backend/ directory
// works correctly both locally and inside Docker container
const logFilePath = path.resolve(__dirname, '../../', loggingConfig.file.path);

// build pino transport that writes to both console and rotating file
// simultaneously — called a multi-target transport
function buildTransport() {
    return pino.transport({
        targets: [
            // console output with pretty printing
            {
                target: 'pino-pretty',
                level: 'debug',
                options: {
                    colorize: true,
                    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                    ignore: 'pid,hostname'
                }
            },
            // rotating file output with readable timestamp
            {
                target: 'pino-roll',
                level: 'debug',
                options: {
                    file: logFilePath,
                    frequency: loggingConfig.file.frequency,
                    limit: loggingConfig.file.limit,
                    mkdir: true
                }
            }
        ]
    });
}

// shared transport instance — all agent loggers share one transport
// avoids opening multiple file handles
const transport = buildTransport();

// noOpLogger is returned when agent logging is disabled
// it has the same interface as a real logger but does nothing
// agents never need to check if logging is enabled themselves
const noOpLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { }
};

// getAgentLogger returns a configured logger for the named agent.
// Call once at the top of each agent file.
function getAgentLogger(agentName) {
    // get agent specific config or fall back to default
    const agentConfig = loggingConfig.agents[agentName] || loggingConfig.default;

    // return no-op logger if agent logging is disabled
    if (!agentConfig.enabled) {
        return noOpLogger;
    }

    // return configured pino logger for this agent
    return pino(
        {
            name: agentName,
            level: agentConfig.level,
            // format timestamp as readable date string in log file
            timestamp: pino.stdTimeFunctions.isoTime
        },
        transport
    );
}

module.exports = { getAgentLogger };