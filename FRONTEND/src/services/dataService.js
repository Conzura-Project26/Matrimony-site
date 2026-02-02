import { API_CONFIG } from '../config/api.config';
import authService from './api/authService';
import userService from './api/userService';
import adminService from './api/adminService';
import subscriptionService from './api/subscriptionService';

// Mock implementations (Basic localStorage wrappers to match API signatures)
const mockAuth = {
    login: async (credentials) => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const emailLower = credentials.emailOrMobile.toLowerCase();

        // Fetch all registered users
        const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");

        // Add DEFAULT Accounts for testing if not already registered
        const defaultUsers = [
            { email: "admin@sarvvivah.com", password: "admin", role: "admin", name: "System Admin", adminStatus: "Approved" },
            { email: "mod@sarvvivah.com", password: "mod", role: "moderator", name: "System Moderator", adminStatus: "Approved" }
        ];

        const combinedUsers = [...allUsers, ...defaultUsers];

        // Find user by Email OR Mobile OR Profile ID
        const user = combinedUsers.find(u =>
            u.email.toLowerCase() === emailLower ||
            (u.mobile && u.mobile === emailLower) ||
            (u.id && u.id.toLowerCase() === emailLower)
        );

        // STRICT VALIDATION: Check if user exists and password matches
        if (!user) {
            throw new Error("Account not found. Please register first.");
        }

        // Check password (support both plain text and Simple mock encryption (Base64) used in Home.js)
        const storedPass = user.password;
        const inputPass = credentials.password;

        // Robust comparison with trimming to avoid simple space errors
        const isMatch = storedPass?.trim() === inputPass?.trim() ||
            storedPass?.trim() === btoa(inputPass?.trim());

        if (!isMatch) {
            console.group("Login Password Mismatch Debug");
            console.log("Account found:", emailLower);
            console.log("Stored Password (length):", storedPass?.length);
            console.log("Attempted Password (length):", inputPass?.length);
            console.log("Is Base64 Match:", storedPass === btoa(inputPass));
            console.groupEnd();
            throw new Error("Invalid password. Please try again.");
        }

        // Return user data from storage, not hardcoded mock
        return {
            accessToken: "mock_token_" + Date.now(),
            refreshToken: "mock_refresh_" + Date.now(),
            user: { ...user, role: user.role || "user" } // Ensure role exists for ProtectedRoute
        };
    },
    register: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const emailLower = data.email.toLowerCase();

        // 1. Generate Unique "Real-Time" ID
        const generateProfileId = () => {
            const year = new Date().getFullYear();
            // Get last ID sequence from storage or start at 1000
            let lastSequence = parseInt(localStorage.getItem("lastIdSequence") || "1000");
            const newSequence = lastSequence + 1;
            localStorage.setItem("lastIdSequence", newSequence.toString());
            return `SV${year}${newSequence}`;
        };

        // 2. Determine Role/Status (Admin Logic)
        let role = "user";
        let adminStatus = "Pending";

        if (emailLower.includes("admin")) {
            role = "admin";
            adminStatus = "Approved";
        } else if (emailLower.includes("mod")) {
            role = "moderator";
            adminStatus = "Approved";
        }

        const userProfile = {
            ...data,
            id: generateProfileId(), // New Professional ID
            adminStatus: adminStatus,
            registrationDate: new Date().toISOString(),
            role: role
        };

        const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");

        // Check duplicates
        if (allUsers.find(u => u.email === data.email)) {
            throw new Error("Email already registered");
        }
        if (data.mobile && allUsers.find(u => u.mobile === data.mobile)) {
            throw new Error("Mobile number already registered");
        }

        allUsers.push(userProfile);
        localStorage.setItem("allUsers", JSON.stringify(allUsers));

        // Auto-login context for next step
        localStorage.setItem("userProfile", JSON.stringify(userProfile));

        return { success: true, message: "Registration successful", user: userProfile };
    },

    logout: async () => {
        return { success: true };
    }
};

const mockUser = {
    getProfile: async () => {
        const profile = JSON.parse(localStorage.getItem('userProfile'));
        return profile || {};
    },
    updateProfile: async (data) => {
        localStorage.setItem('userProfile', JSON.stringify(data));
        return data;
    }
};

// Data Service Abstraction
const dataService = {
    auth: API_CONFIG.USE_MOCK_DATA ? mockAuth : authService,
    user: API_CONFIG.USE_MOCK_DATA ? mockUser : userService,
    admin: API_CONFIG.USE_MOCK_DATA ? {} : adminService, // Admin mock to be implemented if needed
    subscription: API_CONFIG.USE_MOCK_DATA ? {} : subscriptionService // Subscription mock to be implemented
};

export default dataService;
