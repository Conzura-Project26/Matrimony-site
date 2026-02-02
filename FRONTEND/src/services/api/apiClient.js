import axios from 'axios';
import { API_CONFIG } from '../../config/api.config';
import tokenManager from '../../utils/tokenManager';
import errorHandler from '../../utils/errorHandler';

// Create Axios Instance
const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request Interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Attach Token
        const token = tokenManager.getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Log Request (Dev only)
        if (API_CONFIG.ENABLE_LOGGING) {
            console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.data || '');
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => {
        // Log Response (Dev only)
        if (API_CONFIG.ENABLE_LOGGING) {
            console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
        }
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle Token Expiry (401)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = tokenManager.getRefreshToken();
                if (refreshToken) {
                    // Attempt refresh
                    // Note: We use axios directly here to avoid circular dependency loop if we used authService
                    const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
                        refreshToken
                    });

                    if (response.data && response.data.accessToken) {
                        tokenManager.setToken(response.data.accessToken);
                        // Retry original request with new token
                        originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                        return apiClient(originalRequest);
                    }
                }
            } catch (refreshError) {
                // Refresh failed - logout user
                tokenManager.clearTokens();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Standard Error Handling
        const handledError = errorHandler.handle(error);
        return Promise.reject(handledError);
    }
);

export default apiClient;
