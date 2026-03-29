const cpiMockService = require('../services/mock/cpiMockService');
const cpiRealService = require('../services/real/cpiRealService');

const useMock = process.env.USE_MOCK === 'true';

const cpiService = useMock ? cpiMockService : cpiRealService;

if (useMock) {
    console.log('[apiConfig] CPI Service: MOCK mode active');
} else {
    console.log('[apiConfig] CPI Service: REAL mode active');
}

module.exports = { cpiService };