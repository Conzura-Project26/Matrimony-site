import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHeart, FaBell, FaBars, FaArrowLeft, FaSignOutAlt, FaPhoneAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const UserHeader = ({ setMobileMenuOpen, showBack = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    // ... notifications state can remain local or move to context later ...
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const loadNotifications = () => {
            const savedNotifications = JSON.parse(localStorage.getItem("userNotifications") || "[]");
            setNotifications(savedNotifications);
            setUnreadCount(savedNotifications.filter(n => !n.read).length);
        };

        loadNotifications();
        window.addEventListener('storage', loadNotifications);
        window.addEventListener('notifications-updated', loadNotifications);
        return () => {
            window.removeEventListener('storage', loadNotifications);
            window.removeEventListener('notifications-updated', loadNotifications);
        };
    }, []);

    const markAllAsRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        setUnreadCount(0);
        localStorage.setItem("userNotifications", JSON.stringify(updated));
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
        localStorage.setItem("userNotifications", JSON.stringify([]));
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const navLinks = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Search Matches', path: '/search' },
        { label: 'Interests', path: '/interests' },
        { label: 'Messages', path: '/messages' },
        { label: 'Profile', path: '/profile' },
        { label: 'Settings', path: '/settings' },
    ];

    return (
        <header className="bg-brandBlue shadow-sm sticky top-0 z-50 border-b border-gray-100">
            <div className="container mx-auto px-4 md:px-6 py-3 flex justify-between items-center">

                {/* Left: Branding & Back Button */}
                <div className="flex items-center gap-3 md:gap-4">
                    {showBack && (
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-600 hover:text-brandOrange transition"
                        >
                            <FaArrowLeft className="text-lg md:text-xl" />
                        </button>
                    )}
                    <Link to="/dashboard" className="flex items-center gap-1">
                        <h1 className="text-xl md:text-2xl font-bold text-brandOrange tracking-tight flex items-center">
                            SarvVivah<span className="text-brandNavy font-normal hidden sm:inline">.com</span>
                            <FaHeart className="ml-1 text-xs" />
                        </h1>
                    </Link>
                </div>

                {/* Center: Navigation Links */}
                <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-600">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`transition-colors ${location.pathname === link.path
                                ? 'text-brandOrange font-bold border-b-2 border-brandOrange pb-1'
                                : 'hover:text-brandOrange'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Right: Notifications & Tools */}
                <div className="flex items-center gap-3 md:gap-6">
                    {/* Helpline - Premium UI */}
                    <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 bg-white/40 backdrop-blur-md rounded-2xl border border-brandOrange/30 shadow-sm hover:shadow-brandOrange/20 hover:border-brandOrange transition-all cursor-pointer group">
                        <div className="relative">
                            <FaPhoneAlt className="text-brandOrange text-sm relative z-10" />
                            <span className="absolute inset-0 bg-brandOrange/40 rounded-full blur-sm scale-150 animate-pulse"></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-brandOrange tracking-widest leading-none mb-0.5">24/7 Helpline</span>
                            <span className="text-[12px] font-black text-brandNavy leading-tight tracking-tight group-hover:text-brandOrange transition-colors">+91 8450 914835</span>
                        </div>
                    </div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <FaBell
                            className={`text-xl cursor-pointer hover:text-orange-500 transition ${unreadCount > 0 ? 'text-brandOrange' : 'text-gray-600'}`}
                            onClick={() => setShowNotifications(!showNotifications)}
                        />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                        )}

                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                <div className="absolute right-0 mt-3 w-80 bg-brandBlue shadow-2xl rounded-2xl p-4 border border-gray-100 z-50">
                                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notifications</p>
                                            <h4 className="text-xs font-bold text-brandNavy">{unreadCount} Unread</h4>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-[10px] text-brandOrange font-bold hover:underline"
                                            >
                                                Mark Read
                                            </button>
                                            <button
                                                onClick={clearNotifications}
                                                className="text-[10px] text-gray-400 hover:text-red-500 font-medium"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <FaBell className="text-gray-100 text-4xl mx-auto mb-2" />
                                            <p className="text-sm text-gray-400 italic">No activity yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                            {notifications.sort((a, b) => new Date(b.time) - new Date(a.time)).map((n, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex items-start gap-3 p-3 rounded-xl border transition ${!n.read ? 'bg-orange-50/50 border-orange-100' : 'bg-transparent border-transparent hover:bg-gray-50'}`}
                                                >
                                                    <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-100 overflow-hidden border border-white shadow-sm">
                                                        <img
                                                            src={n.image || "https://via.placeholder.com/40"}
                                                            className="w-full h-full object-cover"
                                                            alt=""
                                                            onError={(e) => { e.target.src = "https://via.placeholder.com/40"; }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="flex justify-between items-start gap-1">
                                                            <p className={`text-xs leading-snug ${!n.read ? 'font-bold text-brandNavy' : 'text-gray-600'}`}>
                                                                {n.message}
                                                            </p>
                                                            {!n.read && <div className="w-2 h-2 bg-brandOrange rounded-full flex-shrink-0 mt-1"></div>}
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">
                                                                {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.time).toLocaleDateString()}
                                                            </p>
                                                            <Link
                                                                to={n.link || "/dashboard"}
                                                                onClick={() => setShowNotifications(false)}
                                                                className="text-[10px] text-brandOrange font-bold hover:underline"
                                                            >
                                                                View
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-center">
                                        <Link to="/interests" onClick={() => setShowNotifications(false)} className="text-[10px] text-gray-400 hover:text-brandNavy transition font-bold uppercase tracking-widest">See All Activity</Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Logout (Desktop Only) */}
                    <button
                        onClick={handleLogout}
                        className="hidden lg:flex items-center gap-2 text-red-500 hover:text-red-600 transition font-bold text-xs border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                        <FaSignOutAlt />
                        <span>Logout</span>
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                        aria-label="Open menu"
                    >
                        <FaBars className="text-xl text-gray-600" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default UserHeader;
