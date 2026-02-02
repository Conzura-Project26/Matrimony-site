import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/api.config';

const adminService = {
    // Get All Users
    getUsers: async (params) => {
        return await apiClient.get(API_ENDPOINTS.ADMIN.USERS, { params });
    },

    // Approve User
    approveUser: async (id) => {
        return await apiClient.put(API_ENDPOINTS.ADMIN.APPROVE_USER(id));
    },

    // Reject User
    rejectUser: async (id, reason) => {
        return await apiClient.put(API_ENDPOINTS.ADMIN.REJECT_USER(id), { reason });
    },

    // Delete User
    deleteUser: async (id) => {
        return await apiClient.delete(API_ENDPOINTS.ADMIN.DELETE_USER(id));
    },

    // Get Pending Photos
    getPendingPhotos: async () => {
        return await apiClient.get(API_ENDPOINTS.ADMIN.PHOTOS);
    },

    // Approve Photo
    approvePhoto: async (id) => {
        return await apiClient.put(API_ENDPOINTS.ADMIN.APPROVE_PHOTO(id));
    },

    // Reject Photo
    rejectPhoto: async (id) => {
        return await apiClient.put(API_ENDPOINTS.ADMIN.REJECT_PHOTO(id));
    },

    // Get Reports
    getReports: async () => {
        return await apiClient.get(API_ENDPOINTS.ADMIN.REPORTS);
    },

    // Resolve Report
    resolveReport: async (id, action) => {
        return await apiClient.put(API_ENDPOINTS.ADMIN.RESOLVE_REPORT(id), { action });
    }
};

export default adminService;
