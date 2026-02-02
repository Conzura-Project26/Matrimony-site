import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Providers
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import Dashboard from './pages/Dashboard';
import SearchMatches from './pages/SearchMatches';
import Interests from './pages/Interests';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import ViewProfile from './pages/ViewProfile';
import Settings from './pages/Settings';

import CreateProfile from './pages/CreateProfile';
import ReportAbuse from './pages/ReportAbuse';

// Admin
import AdminDashboard from './pages/AdminDashboard';

import ProtectedRoute from './routes/ProtectedRoute';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>

            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* PROFILE CREATION (after register) */}
            <Route
              path="/create-profile"
              element={
                <ProtectedRoute role="user">
                  <CreateProfile />
                </ProtectedRoute>
              }
            />

            {/* USER ROUTES */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="user">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/search"
              element={
                <ProtectedRoute role="user">
                  <SearchMatches />
                </ProtectedRoute>
              }
            />

            <Route
              path="/interests"
              element={
                <ProtectedRoute role="user">
                  <Interests />
                </ProtectedRoute>
              }
            />

            <Route
              path="/messages"
              element={
                <ProtectedRoute role="user">
                  <Messages />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute role="user">
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/view-profile/:id"
              element={
                <ProtectedRoute role="user">
                  <ViewProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute role="user">
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/report-abuse"
              element={
                <ProtectedRoute role="user">
                  <ReportAbuse />
                </ProtectedRoute>
              }
            />

            {/* ADMIN ROUTES */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/moderator"
              element={
                <ProtectedRoute role="moderator">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
