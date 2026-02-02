/**
 * Token Manager Utility
 * Handles storage and retrieval of authentication tokens
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const tokenManager = {
    // Get Access Token
    getToken: () => {
        return sessionStorage.getItem(ACCESS_TOKEN_KEY);
    },

    // Set Access Token
    setToken: (token) => {
        if (token) {
            sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
        }
    },

    // Get Refresh Token
    getRefreshToken: () => {
        return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    },

    // Set Refresh Token
    setRefreshToken: (token) => {
        if (token) {
            sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
        }
    },

    // Clear all tokens (Logout)
    clearTokens: () => {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);

        // Also clear role and user profile from localStorage if using hybrid approach
        localStorage.removeItem('role');
        localStorage.removeItem('token'); // Legacy token
    },

    // Check if user is authenticated (basic check)
    isAuthenticated: () => {
        return !!sessionStorage.getItem(ACCESS_TOKEN_KEY);
    }
};

export default tokenManager;
