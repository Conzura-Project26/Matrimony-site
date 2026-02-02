import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/api.config';

const userService = {
    // Get Profile
    getProfile: async () => {
        return await apiClient.get(API_ENDPOINTS.USERS.PROFILE);
    },

    // Update Profile
    updateProfile: async (profileData) => {
        return await apiClient.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, profileData);
    },

    // Search Users
    searchUsers: async (params) => {
        return await apiClient.get(API_ENDPOINTS.USERS.SEARCH, { params });
    },

    // Get User by ID
    getUserById: async (id) => {
        return await apiClient.get(API_ENDPOINTS.USERS.GET_USER(id));
    },

    // Upload Photo
    uploadPhoto: async (formData) => {
        return await apiClient.post(API_ENDPOINTS.USERS.UPLOAD_PHOTO, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // Delete Photo
    deletePhoto: async (id) => {
        return await apiClient.delete(API_ENDPOINTS.USERS.DELETE_PHOTO(id));
    },

    // Get Interests
    getInterests: async (type) => {
        let endpoint = API_ENDPOINTS.INTERESTS.GET_MUTUAL;
        if (type === 'sent') endpoint = API_ENDPOINTS.INTERESTS.GET_SENT;
        if (type === 'received') endpoint = API_ENDPOINTS.INTERESTS.GET_RECEIVED;
        return await apiClient.get(endpoint);
    },

    // Send Interest
    sendInterest: async (userId) => {
        return await apiClient.post(API_ENDPOINTS.INTERESTS.SEND, { userId });
    },

    // Accept Interest
    acceptInterest: async (interestId) => {
        return await apiClient.post(API_ENDPOINTS.INTERESTS.ACCEPT, { interestId });
    }
};

export default userService;
