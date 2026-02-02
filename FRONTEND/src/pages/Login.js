import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaLock, FaEnvelope, } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Page user tried to open before login
  const from = location.state?.from?.pathname || "/dashboard";

  const { login, isLoading, error } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Use local state for form submission error if needed
  const [loginError, setLoginError] = useState('');

  const onSubmit = async (data) => {
    // Basic login without OTP for now, or implement 2FA if backend requires
    try {
      setLoginError('');
      await login(data);

      // Redirect based on role
      const userRole = localStorage.getItem('role');
      if (userRole === 'admin') navigate('/admin');
      else if (userRole === 'moderator') navigate('/moderator');
      else navigate(from, { replace: true });

    } catch (err) {
      console.error("Login failed", err);
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-brandBlue">
      <Header />

      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <h1 className="text-5xl font-bold text-brandNavy mb-6">
              Welcome Back to{" "}
              <span className="bg-gradient-to-r from-brandOrange to-brandNavy bg-clip-text text-transparent">
                SarvVivah
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Access your profile, explore matches, and connect with your potential life partner.
            </p>
          </motion.div>

          {/* Right Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto lg:mx-0"
          >
            <div className="bg-brandBlue rounded-2xl shadow-2xl p-6 md:p-10">

              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-brandNavy">Login</h2>
                <p className="text-gray-600 text-sm mt-2">
                  Enter your credentials to continue
                </p>
              </div>

              {(error || loginError) && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                  <span className="block sm:inline">{error || loginError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-brandNavy mb-2">
                    Profile ID / Email / Mobile
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-3.5 text-brandOrange" />
                    <input
                      type="text"
                      {...register('emailOrMobile', { required: true })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg"
                    />
                  </div>
                  {errors.emailOrMobile && (
                    <p className="text-red-500 text-sm mt-1">This field is required</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brandNavy mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-3.5 text-brandOrange" />
                    <input
                      type="password"
                      {...register('password', { required: true })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">Password is required</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full bg-gradient-to-r from-brandOrange to-brandNavy text-white py-3 rounded-lg font-bold ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;