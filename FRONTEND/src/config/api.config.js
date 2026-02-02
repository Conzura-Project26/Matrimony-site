export const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    // Default to true in development if not explicitly set to false
    USE_MOCK_DATA: process.env.REACT_APP_USE_MOCK_DATA === 'true' || (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA !== 'false'),
    ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING === 'true'
};

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH_TOKEN: '/auth/refresh-token',
        VERIFY_OTP: '/auth/verify-otp',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password'
    },
    USERS: {
        PROFILE: '/users/profile',
        UPDATE_PROFILE: '/users/profile',
        SEARCH: '/users/search',
        GET_USER: (id) => `/users/${id}`,
        UPLOAD_PHOTO: '/users/photos',
        DELETE_PHOTO: (id) => `/users/photos/${id}`
    },
    INTERESTS: {
        SEND: '/interests/send',
        ACCEPT: '/interests/accept',
        REJECT: '/interests/reject',
        GET_SENT: '/interests/sent',
        GET_RECEIVED: '/interests/received',
        GET_MUTUAL: '/interests/mutual'
    },
    MESSAGES: {
        GET_CONVERSATIONS: '/messages/conversations',
        GET_MESSAGES: (userId) => `/messages/${userId}`,
        SEND_MESSAGE: '/messages/send',
        MARK_READ: (messageId) => `/messages/${messageId}/read`
    },
    ADMIN: {
        USERS: '/admin/users',
        APPROVE_USER: (id) => `/admin/users/${id}/approve`,
        REJECT_USER: (id) => `/admin/users/${id}/reject`,
        DELETE_USER: (id) => `/admin/users/${id}`,
        REPORTS: '/admin/reports',
        RESOLVE_REPORT: (id) => `/admin/reports/${id}/resolve`,
        DELETE_REPORT: (id) => `/admin/reports/${id}`,
        SUBSCRIPTIONS: '/admin/subscriptions',
        UPDATE_SUBSCRIPTION: (id) => `/admin/subscriptions/${id}`,
        PHOTOS: '/admin/photos/pending',
        APPROVE_PHOTO: (id) => `/admin/photos/${id}/approve`,
        REJECT_PHOTO: (id) => `/admin/photos/${id}/reject`,
        CASTES: '/admin/castes',
        COMMUNITIES: '/admin/communities',
        MODERATORS: '/admin/moderators',
        SETTINGS: '/admin/settings'
    },
    SUBSCRIPTIONS: {
        GET_PLANS: '/subscriptions/plans',
        GET_CURRENT: '/subscriptions/current',
        UPGRADE: '/subscriptions/upgrade',
        CANCEL: '/subscriptions/cancel'
    },
    REPORTS: {
        SUBMIT: '/reports/submit',
        GET_MY_REPORTS: '/reports/my-reports'
    }
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};
