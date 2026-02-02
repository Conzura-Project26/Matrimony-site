import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEye } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter Email/Mobile and Password");
      return;
    }

    setIsLoading(true);
    try {
      await login({ emailOrMobile: email, password });
      onClose();

      // Role redirection is handled by AuthContext state or here
      const userRole = localStorage.getItem('role');
      if (userRole === "admin") navigate("/admin");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md relative"
            >
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl"
              >
                ✕
              </button>

              {/* Header */}
              <div className="text-center pt-8 pb-4">
                <div className="w-20 h-20 bg-brandNavy rounded-full mx-auto flex items-center justify-center border-4 border-brandGold shadow-lg mb-4">
                  <FaUser className="text-3xl text-white" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-brandNavy">
                  Welcome Back
                </h2>
                <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest">
                  Login to your account
                </p>
              </div>

              {/* Body */}
              <div className="px-8 pb-8">

                {error && (
                  <p className="text-red-500 text-sm mb-3">{error}</p>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <div className="relative">
                    <FaUser className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Profile ID / Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <FaEye
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-3.5 text-gray-400 cursor-pointer"
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-sm text-orange-500 cursor-pointer hover:underline">
                      Forgot Password?
                    </span>
                  </div>

                  {/* Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full bg-gradient-to-r from-orange-500 to-blue-500 
                               text-white py-2.5 rounded font-semibold shadow
                               hover:opacity-90 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? 'Verifying...' : 'Login'}
                  </button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-gray-600 mt-6">
                  Don&apos;t have an Account?{" "}
                  <span
                    onClick={() => {
                      onClose();
                      navigate("/register");
                    }}
                    className="text-orange-500 font-semibold cursor-pointer hover:underline"
                  >
                    Register!
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
