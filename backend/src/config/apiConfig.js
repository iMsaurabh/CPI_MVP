const cpiMockService = require('../services/mock/cpiMockService');
const cpiRealService = require('../services/real/cpiRealService');

// getService returns correct service at call time
// not at module load time
// this allows mock/real switching per request
function getService() {
    const useMock = process.env.USE_MOCK === 'true';
    return useMock ? cpiMockService : cpiRealService;
}

if (process.env.USE_MOCK === 'true') {
    console.log('[apiConfig] CPI Service: MOCK mode active');
} else {
    console.log('[apiConfig] CPI Service: REAL mode active');
}

module.exports = { getService };