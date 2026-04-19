// jobStore manages all job and execution history persistence.
// Jobs and execution history are stored in JSON files.
// This is the single source of truth for all job state.
//
// All methods are synchronous file operations wrapped in try/catch.
// JSON files are read fresh on every call — no in-memory caching.
// This ensures consistency when multiple processes read the files.

const fs = require('fs');
const path = require('path');

const JOBS_CONFIG_PATH = path.resolve(__dirname, '../config/jobsConfig.json');
const HISTORY_PATH = path.resolve(__dirname, '../config/executionHistory.json');

// ─── Config helpers ──────────────────────────────────────────────────

function readConfig() {
    return JSON.parse(fs.readFileSync(JOBS_CONFIG_PATH, 'utf8'));
}

function writeConfig(config) {
    fs.writeFileSync(JOBS_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

function getRetentionConfig() {
    return readConfig().retention;
}

function getNotificationConfig() {
    return readConfig().notifications;
}

// ─── Job CRUD ────────────────────────────────────────────────────────

function getAllJobs() {
    return readConfig().jobs;
}

function getJobById(jobId) {
    return getAllJobs().find(j => j.id === jobId) || null;
}

function createJob(jobData) {
    const config = readConfig();
    const job = {
        id: `job_${Date.now()}`,
        ...jobData,
        createdAt: new Date().toISOString(),
        lastRun: null,
        nextRun: null,
        lastStatus: null
    };
    config.jobs.push(job);
    writeConfig(config);
    return job;
}

function updateJob(jobId, updates) {
    const config = readConfig();
    const index = config.jobs.findIndex(j => j.id === jobId);
    if (index === -1) throw new Error(`Job ${jobId} not found`);
    config.jobs[index] = { ...config.jobs[index], ...updates };
    writeConfig(config);
    return config.jobs[index];
}

function deleteJob(jobId) {
    const config = readConfig();
    const index = config.jobs.findIndex(j => j.id === jobId);
    if (index === -1) throw new Error(`Job ${jobId} not found`);
    config.jobs.splice(index, 1);
    writeConfig(config);
}

// ─── Execution History ───────────────────────────────────────────────

function readHistory() {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
}

function writeHistory(history) {
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf8');
}

function addExecution(execution) {
    const history = readHistory();
    const record = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        ...execution,
        createdAt: new Date().toISOString()
    };
    history.executions.push(record);
    writeHistory(history);
    purgeOldExecutions();
    return record;
}

function getExecutionsByJobId(jobId) {
    return readHistory().executions
        .filter(e => e.jobId === jobId)
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

function getAllExecutions() {
    return readHistory().executions
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

// purgeOldExecutions removes executions older than retentionDays
// and enforces maxExecutionsPerJob limit
// called automatically after every new execution is added
function purgeOldExecutions() {
    const history = readHistory();
    const { historyDays, maxExecutionsPerJob } = getRetentionConfig();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - historyDays);

    // remove executions older than historyDays
    history.executions = history.executions.filter(
        e => new Date(e.startedAt) > cutoff
    );

    // enforce maxExecutionsPerJob per job
    const jobGroups = {};
    history.executions.forEach(e => {
        if (!jobGroups[e.jobId]) jobGroups[e.jobId] = [];
        jobGroups[e.jobId].push(e);
    });

    history.executions = [];
    for (const [, execs] of Object.entries(jobGroups)) {
        // sort by date descending, keep only maxExecutionsPerJob
        const kept = execs
            .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
            .slice(0, maxExecutionsPerJob);
        history.executions.push(...kept);
    }

    writeHistory(history);
}

module.exports = {
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    addExecution,
    getExecutionsByJobId,
    getAllExecutions,
    getRetentionConfig,
    getNotificationConfig
};