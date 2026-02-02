import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/api.config';

const subscriptionService = {
    // Get Plans
    getPlans: async () => {
        return await apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.GET_PLANS);
    },

    // Get Current Subscription
    getCurrentSubscription: async () => {
        return await apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.GET_CURRENT);
    },

    // Upgrade Subscription
    upgradeSubscription: async (planId, paymentDetails) => {
        return await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.UPGRADE, { planId, paymentDetails });
    },

    // Cancel Subscription
    cancelSubscription: async () => {
        return await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CANCEL);
    },

    // Admin: Update User Subscription
    updateUserSubscription: async (userId, subscriptionData) => {
        return await apiClient.put(API_ENDPOINTS.ADMIN.UPDATE_SUBSCRIPTION(userId), subscriptionData);
    }
};

export default subscriptionService;
