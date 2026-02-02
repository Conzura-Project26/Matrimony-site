import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTimes, FaHome, FaUser, FaSearch, FaHeart, FaEnvelope, FaCog, FaSignOutAlt, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const MobileMenu = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
        onClose();
    };

    const menuItems = [
        { label: 'Dashboard', icon: FaHome, path: '/dashboard' },
        { label: 'My Profile', icon: FaUser, path: '/profile' },
        { label: 'Search Matches', icon: FaSearch, path: '/search' },
        { label: 'Interests', icon: FaHeart, path: '/interests' },
        { label: 'Messages', icon: FaEnvelope, path: '/messages' },
        { label: 'Settings', icon: FaCog, path: '/settings' },
        { label: 'Report Abuse', icon: FaExclamationTriangle, path: '/report-abuse' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={onClose}
                    />

                    {/* Menu */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3 }}
                        className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-brandNavy shadow-2xl z-50 md:hidden overflow-y-auto text-white"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-brandOrange to-orange-700 p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold">Menu</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-full transition"
                                    aria-label="Close menu"
                                >
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>
                            <p className="text-orange-100 text-sm">SarvVivah.com</p>
                        </div>

                        {/* Menu Items */}
                        <nav className="p-4 space-y-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/10 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-brandOrange/20 rounded-lg flex items-center justify-center group-hover:bg-brandOrange transition">
                                        <item.icon className="text-brandOrange text-lg group-hover:text-white" />
                                    </div>
                                    <span className="font-medium text-blue-100 group-hover:text-white transition">
                                        {item.label}
                                    </span>
                                </Link>
                            ))}

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-500/10 transition-all group mt-4"
                            >
                                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition">
                                    <FaSignOutAlt className="text-red-500 text-lg group-hover:text-white" />
                                </div>
                                <span className="font-medium text-red-200 group-hover:text-red-500 transition">
                                    Logout
                                </span>
                            </button>
                        </nav>

                        {/* Footer */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 bg-brandNavy/50">
                            <p className="text-xs text-gray-500 text-center">
                                © 2026 SarvVivah.com
                            </p>
                            <p className="text-xs text-gray-400 text-center mt-1">
                                One Platform. All Castes. One Life Partner.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileMenu;
