// API Service Layer for Unicorn PC Builder

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API request failed');
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// ============================================================================
// INTELLIGENT BUILD API
// ============================================================================

export const intelligentAPI = {
    /**
     * Get available options for intelligent build
     */
    getOptions: async () => {
        return apiCall('/api/intelligent/options');
    },

    /**
     * Get AI recommendation
     * @param {Object} data - { budget, resolution, use_case, fps? }
     */
    getRecommendation: async (data) => {
        return apiCall('/api/intelligent/recommend', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// ============================================================================
// MANUAL BUILD API
// ============================================================================

export const manualAPI = {
    /**
     * Get CPUs by brand
     * @param {string} brand - 'Intel' or 'AMD'
     */
    getCPUs: async (brand) => {
        return apiCall(`/api/manual/cpus?brand=${encodeURIComponent(brand)}`);
    },

    /**
     * Get motherboards by socket
     * @param {string} socket - e.g., 'LGA1700'
     */
    getMotherboards: async (socket) => {
        return apiCall(`/api/manual/motherboards?socket=${encodeURIComponent(socket)}`);
    },

    /**
     * Get all GPUs
     */
    getGPUs: async () => {
        return apiCall('/api/manual/gpus');
    },

    /**
     * Get RAM by type
     * @param {string} ramType - 'DDR4' or 'DDR5'
     */
    getRAM: async (ramType) => {
        return apiCall(`/api/manual/ram?ram_type=${encodeURIComponent(ramType)}`);
    },

    /**
     * Get coolers by socket
     * @param {string} socket - e.g., 'LGA1700'
     */
    getCoolers: async (socket) => {
        return apiCall(`/api/manual/coolers?socket=${encodeURIComponent(socket)}`);
    },

    /**
     * Get all storage options
     */
    getStorage: async () => {
        return apiCall('/api/manual/storage');
    },

    /**
     * Get all PSUs
     */
    getPSUs: async () => {
        return apiCall('/api/manual/psus');
    },

    /**
     * Get cases by form factor and GPU length
     * @param {string} formFactor - e.g., 'ATX'
     * @param {number} gpuLength - GPU length in cm
     */
    getCases: async (formFactor, gpuLength) => {
        return apiCall(
            `/api/manual/cases?form_factor=${encodeURIComponent(formFactor)}&gpu_length=${gpuLength}`
        );
    },

    /**
     * Validate complete build
     * @param {Object} build - Complete build object
     */
    validateBuild: async (build) => {
        return apiCall('/api/manual/validate', {
            method: 'POST',
            body: JSON.stringify(build),
        });
    },
};

// ============================================================================
// PERFORMANCE PREDICTION API
// ============================================================================

export const performanceAPI = {
    /**
     * Predict PC performance
     * @param {Object} data - { cpu, gpu, ram }
     */
    predict: async (data) => {
        return apiCall('/api/performance/predict', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthCheck = async () => {
    return apiCall('/api/health');
};

export default {
    intelligent: intelligentAPI,
    manual: manualAPI,
    performance: performanceAPI,
    healthCheck,
};
