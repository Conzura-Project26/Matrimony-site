import React, { createContext, useContext, useState, useEffect } from 'react';
import dataService from '../services/dataService';
import tokenManager from '../utils/tokenManager';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            const token = tokenManager.getToken();
            if (token) {
                try {
                    // If we have a token, fetch profile to verify it's valid
                    const response = await dataService.user.getProfile();
                    // Adjust based on API structure - assuming response is the profile or has .data
                    const profile = response.data || response;
                    setUser(profile);
                    setIsAuthenticated(true);
                } catch (err) {
                    console.error("Auth initialization failed:", err);
                    tokenManager.clearTokens();
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    // Login
    const login = async (credentials) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await dataService.auth.login(credentials);

            // Update state
            setUser(response.user);
            setIsAuthenticated(true);

            // Persist for legacy/hybrid components (Critical for ProtectedRoute)
            if (response.user.role) {
                localStorage.setItem('role', response.user.role);
            }
            if (response.user) {
                localStorage.setItem('userProfile', JSON.stringify(response.user));
            }

            return response;
        } catch (err) {
            setError(err.message || 'Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Register
    const register = async (userData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await dataService.auth.register(userData);
            return response;
        } catch (err) {
            setError(err.message || 'Registration failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Logout
    const logout = async () => {
        setIsLoading(true);
        try {
            await dataService.auth.logout();
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            tokenManager.clearTokens();
            localStorage.removeItem('role');
            localStorage.removeItem('userProfile');
            setIsLoading(false);
        }
    };

    // Update Profile (Local State)
    const updateLocalProfile = (updates) => {
        setUser(prev => ({ ...prev, ...updates }));
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoading,
            error,
            login,
            register,
            logout,
            updateLocalProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
