import React, { useState, useEffect } from 'react';
import { FaCrown, FaStar, FaGem, FaCheck, FaTimes, FaEdit, FaFilter, FaDollarSign } from 'react-icons/fa';

const SubscriptionManagement = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [filterPlan, setFilterPlan] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [editingUser, setEditingUser] = useState(null);
    const [newPlan, setNewPlan] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    // Subscription Plans Configuration
    const PLANS = {
        Free: { color: 'bg-gray-100 text-gray-700', icon: FaStar, price: 0 },
        Basic: { color: 'bg-blue-100 text-blue-700', icon: FaStar, price: 999 },
        Premium: { color: 'bg-purple-100 text-purple-700', icon: FaCrown, price: 2499 },
        Gold: { color: 'bg-yellow-100 text-yellow-700', icon: FaGem, price: 4999 }
    };

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = () => {
        // Load all users and their subscription data
        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

        // Combine all users
        const allUsersWithSub = [...allUsers];
        if (userProfile.id && !allUsers.find(u => u.id === userProfile.id)) {
            allUsersWithSub.push(userProfile);
        }

        // Map to subscription format
        const subs = allUsersWithSub.map(user => ({
            userId: user.id,
            userName: user.name || user.fullName || 'Unknown User',
            email: user.email || 'N/A',
            plan: user.subscription?.plan || 'Free',
            status: user.subscription?.status || 'Active',
            startDate: user.subscription?.startDate || new Date().toISOString(),
            expiryDate: user.subscription?.expiryDate || null,
            autoRenew: user.subscription?.autoRenew || false
        }));

        setSubscriptions(subs);
    };

    const updateSubscription = (userId, plan, expiry) => {
        // Update in allUsers
        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const userIndex = allUsers.findIndex(u => u.id === userId);

        const subscriptionData = {
            plan,
            status: 'Active',
            startDate: new Date().toISOString(),
            expiryDate: expiry || null,
            autoRenew: false
        };

        if (userIndex > -1) {
            allUsers[userIndex].subscription = subscriptionData;
            localStorage.setItem('allUsers', JSON.stringify(allUsers));
        }

        // Update in userProfile if it's the current user
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (userProfile.id === userId) {
            userProfile.subscription = subscriptionData;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
        }

        loadSubscriptions();
        setEditingUser(null);
        setNewPlan('');
        setExpiryDate('');
        alert(`Subscription updated to ${plan}!`);
    };

    const cancelSubscription = (userId) => {
        if (!window.confirm('Are you sure you want to cancel this subscription?')) return;

        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const userIndex = allUsers.findIndex(u => u.id === userId);

        if (userIndex > -1) {
            allUsers[userIndex].subscription = {
                ...allUsers[userIndex].subscription,
                status: 'Cancelled',
                plan: 'Free'
            };
            localStorage.setItem('allUsers', JSON.stringify(allUsers));
        }

        // Update in userProfile if it's the current user
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (userProfile.id === userId) {
            userProfile.subscription = {
                ...userProfile.subscription,
                status: 'Cancelled',
                plan: 'Free'
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
        }

        loadSubscriptions();
        alert('Subscription cancelled!');
    };

    // Filter subscriptions
    const filteredSubs = subscriptions.filter(sub => {
        const planMatch = filterPlan === 'All' || sub.plan === filterPlan;
        const statusMatch = filterStatus === 'All' || sub.status === filterStatus;
        return planMatch && statusMatch;
    });

    // Calculate stats
    const stats = {
        total: subscriptions.length,
        free: subscriptions.filter(s => s.plan === 'Free').length,
        basic: subscriptions.filter(s => s.plan === 'Basic').length,
        premium: subscriptions.filter(s => s.plan === 'Premium').length,
        gold: subscriptions.filter(s => s.plan === 'Gold').length,
        active: subscriptions.filter(s => s.status === 'Active').length,
        revenue: subscriptions.reduce((sum, s) => {
            if (s.status === 'Active' && s.plan !== 'Free') {
                return sum + (PLANS[s.plan]?.price || 0);
            }
            return sum;
        }, 0)
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Users" value={stats.total} icon={FaStar} color="bg-brandNavy" />
                <StatCard title="Active Subscriptions" value={stats.active} icon={FaCheck} color="bg-green-600" />
                <StatCard title="Premium Users" value={stats.premium + stats.gold} icon={FaCrown} color="bg-purple-600" />
                <StatCard title="Monthly Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={FaDollarSign} color="bg-brandOrange" />
            </div>

            {/* Plan Distribution */}
            <div className="bg-brandBlue rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-bold text-brandNavy mb-4">Plan Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(PLANS).map(([planName, config]) => (
                        <div key={planName} className={`${config.color} rounded-lg p-4 text-center`}>
                            <config.icon className="text-2xl mx-auto mb-2" />
                            <p className="font-bold text-lg">{stats[planName.toLowerCase()]}</p>
                            <p className="text-xs font-medium">{planName}</p>
                            <p className="text-xs opacity-75">₹{config.price}/mo</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-brandBlue rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-gray-500" />
                        <span className="font-semibold text-gray-700">Filters:</span>
                    </div>

                    <select
                        value={filterPlan}
                        onChange={(e) => setFilterPlan(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brandOrange outline-none"
                    >
                        <option value="All">All Plans</option>
                        {Object.keys(PLANS).map(plan => (
                            <option key={plan} value={plan}>{plan}</option>
                        ))}
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brandOrange outline-none"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Expired">Expired</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>

                    <span className="ml-auto text-sm text-gray-600">
                        Showing {filteredSubs.length} of {subscriptions.length} users
                    </span>
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-brandBlue rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-brandNavy p-4 text-white">
                    <h2 className="font-bold text-lg">User Subscriptions</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Plan</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Expiry Date</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSubs.length > 0 ? (
                                filteredSubs.map(sub => (
                                    <tr key={sub.userId} className="hover:bg-orange-50/30 transition">
                                        <td className="p-4">
                                            <p className="font-semibold text-brandNavy">{sub.userName}</p>
                                            <p className="text-xs text-gray-500">ID: {sub.userId}</p>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">{sub.email}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${PLANS[sub.plan]?.color || 'bg-gray-100 text-gray-700'} flex items-center gap-1 w-fit`}>
                                                {React.createElement(PLANS[sub.plan]?.icon || FaStar, { className: 'text-xs' })}
                                                {sub.plan}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                    sub.status === 'Expired' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'Lifetime'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingUser(sub.userId);
                                                        setNewPlan(sub.plan);
                                                        setExpiryDate(sub.expiryDate ? new Date(sub.expiryDate).toISOString().split('T')[0] : '');
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700 p-2"
                                                    title="Edit Subscription"
                                                >
                                                    <FaEdit />
                                                </button>
                                                {sub.status === 'Active' && sub.plan !== 'Free' && (
                                                    <button
                                                        onClick={() => cancelSubscription(sub.userId)}
                                                        className="text-red-500 hover:text-red-700 p-2"
                                                        title="Cancel Subscription"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400 italic">
                                        No subscriptions found matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-brandNavy mb-4">Update Subscription</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Plan</label>
                                <select
                                    value={newPlan}
                                    onChange={(e) => setNewPlan(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brandOrange outline-none"
                                >
                                    {Object.keys(PLANS).map(plan => (
                                        <option key={plan} value={plan}>{plan} - ₹{PLANS[plan].price}/mo</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brandOrange outline-none"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty for lifetime access</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => updateSubscription(editingUser, newPlan, expiryDate || null)}
                                    className="flex-1 bg-brandOrange text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition"
                                >
                                    Update
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingUser(null);
                                        setNewPlan('');
                                        setExpiryDate('');
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-brandBlue p-6 rounded-xl shadow border border-gray-100 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</p>
                <p className="text-3xl font-bold text-brandNavy mt-2">{value}</p>
            </div>
            <Icon className={`text-4xl opacity-20`} />
        </div>
    </div>
);

export default SubscriptionManagement;
