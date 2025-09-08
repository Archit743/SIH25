// Placeholder for API service (mock for now)
export const api = {
  get: async (url) => {
    // Simulate API call
    return new Promise((resolve) => setTimeout(() => resolve({ data: 'mock' }), 500));
  },
};