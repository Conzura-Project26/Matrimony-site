import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/api.config';
import tokenManager from '../../utils/tokenManager';

const authService = {
    // Login
    login: async (credentials) => {
        const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
        if (response.accessToken) {
            tokenManager.setToken(response.accessToken);
            tokenManager.setRefreshToken(response.refreshToken);
            localStorage.setItem('role', response.user.role); // Keep for legacy compatibility
        }
        return response;
    },

    // Register
    register: async (userData) => {
        return await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    },

    // Logout
    logout: async () => {
        try {
            await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        } finally {
            tokenManager.clearTokens();
        }
    },

    // Verify OTP
    verifyOTP: async (data) => {
        const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data);
        if (response.accessToken) {
            tokenManager.setToken(response.accessToken);
            tokenManager.setRefreshToken(response.refreshToken);
        }
        return response;
    },

    // Forgot Password
    forgotPassword: async (email) => {
        return await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    },

    // Reset Password
    resetPassword: async (token, newPassword) => {
        return await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword });
    }
};

export default authService;
