import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHeart, FaBars, FaSignOutAlt, FaCrown, FaStar, FaGem, FaCheck } from 'react-icons/fa';
import MobileMenu from '../components/MobileMenu';
import UserHeader from '../components/UserHeader';

const Settings = () => {
  const [passwords, setPasswords] = useState({
    current: '',
    newPassword: '',
    confirmNew: ''
  });

  const [notifications, setNotifications] = useState({
    messages: true,
    interests: true,
    promotions: false
  });

  const [profileVisible, setProfileVisible] = useState(() => {
    const profile = JSON.parse(localStorage.getItem("userProfile")) || {};
    return profile.isVisible !== false; // Default to true
  });

  const [photoPrivacy, setPhotoPrivacy] = useState(() => {
    const profile = JSON.parse(localStorage.getItem("userProfile")) || {};
    return profile.photoPrivacy || 'Visible to All Members';
  });

  const [currentPlan, setCurrentPlan] = useState(() => {
    const profile = JSON.parse(localStorage.getItem("userProfile")) || {};
    return profile.subscription?.plan || 'Free';
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNew) {
      alert("New password and confirm password do not match!");
      return;
    }
    console.log("Password updated:", passwords);
    alert("Password updated successfully!");
    setPasswords({ current: '', newPassword: '', confirmNew: '' });
  };

  const handleSaveNotifications = () => {
    console.log("Notification settings saved:", notifications);
    alert("Notification settings saved!");
  };

  const handleToggleVisibility = () => {
    const newVal = !profileVisible;
    setProfileVisible(newVal);

    // Update localStorage
    const profile = JSON.parse(localStorage.getItem("userProfile")) || {};
    profile.isVisible = newVal;
    localStorage.setItem("userProfile", JSON.stringify(profile));
  };

  const handlePhotoPrivacyChange = (e) => {
    const newVal = e.target.value;
    setPhotoPrivacy(newVal);

    // Update localStorage
    const profile = JSON.parse(localStorage.getItem("userProfile")) || {};
    profile.photoPrivacy = newVal;
    localStorage.setItem("userProfile", JSON.stringify(profile));
    alert("Photo privacy updated!");
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-brandBlue">
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <UserHeader setMobileMenuOpen={setMobileMenuOpen} showBack={true} />

      <main className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-brandNavy mb-8">Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Change Password */}
          <div className="bg-brandBlue rounded shadow p-6">
            <h2 className="text-lg font-bold text-brandOrange mb-4">Change Password</h2>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brandNavy mb-1">Current Password</label>
                <input
                  type="password"
                  name="current"
                  value={passwords.current}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-brandOrange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brandNavy mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-brandOrange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brandNavy mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmNew"
                  value={passwords.confirmNew}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-brandOrange"
                />
              </div>

              <button type="submit" className="bg-brandOrange text-white px-6 py-2 rounded font-semibold hover:bg-orange-600 transition-all">
                Save Password
              </button>
            </form>
          </div>

          {/* Notification Settings */}
          <div className="bg-brandBlue rounded shadow p-6">
            <h2 className="text-lg font-bold text-blue-600 mb-4">Notification Settings</h2>
            <div className="space-y-4">
              <ToggleSwitch
                label="Messages Notifications"
                checked={notifications.messages}
                onChange={() => setNotifications(prev => ({ ...prev, messages: !prev.messages }))}
              />
              <ToggleSwitch
                label="Interests Notifications"
                checked={notifications.interests}
                onChange={() => setNotifications(prev => ({ ...prev, interests: !prev.interests }))}
              />
              <ToggleSwitch
                label="Promotions & Updates"
                checked={notifications.promotions}
                onChange={() => setNotifications(prev => ({ ...prev, promotions: !prev.promotions }))}
              />
            </div>
            <button
              onClick={handleSaveNotifications}
              className="mt-4 bg-brandNavy text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition-all"
            >
              Save Settings
            </button>
          </div>

          {/* Privacy Settings */}
          <div className="bg-brandBlue rounded shadow p-6 md:col-span-2">
            <h2 className="text-lg font-bold text-brandNavy mb-4">Privacy Settings</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-brandNavy">Photo Privacy</h3>
                  <p className="text-sm text-gray-500">Control who can see your profile photos</p>
                </div>
                <select
                  className="border rounded p-2 bg-brandBlue/50 text-brandNavy font-medium"
                  value={photoPrivacy}
                  onChange={handlePhotoPrivacyChange}
                >
                  <option>Visible to All Members</option>
                  <option>Visible to Connected Members Only</option>
                  <option>Hidden</option>
                </select>
              </div>
              <hr />
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-brandNavy">Profile Visibility</h3>
                  <p className="text-sm text-gray-500">Hide your profile if you want to take a break</p>
                </div>
                <ToggleSwitch
                  label="Profile Visible"
                  checked={profileVisible}
                  onChange={handleToggleVisibility}
                />
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="bg-brandBlue rounded shadow p-6 md:col-span-2">
            <h2 className="text-lg font-bold text-purple-600 mb-4">Subscription Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { name: 'Free', price: 0, icon: FaStar, color: 'gray', features: ['Basic profile', 'Limited matches', 'Standard support'] },
                { name: 'Basic', price: 999, icon: FaStar, color: 'blue', features: ['Unlimited matches', 'Priority support', 'Profile visibility boost'] },
                { name: 'Premium', price: 2499, icon: FaCrown, color: 'purple', features: ['All Basic features', 'Advanced filters', 'Profile boost', 'Read receipts'] },
                { name: 'Gold', price: 4999, icon: FaGem, color: 'yellow', features: ['All Premium features', 'VIP badge', 'Dedicated manager', 'Priority matching'] }
              ].map(plan => {
                const isCurrentPlan = currentPlan === plan.name;

                const handleUpgrade = () => {
                  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                  profile.subscription = {
                    plan: plan.name,
                    status: 'Active',
                    startDate: new Date().toISOString(),
                    expiryDate: null,
                    autoRenew: false
                  };
                  localStorage.setItem('userProfile', JSON.stringify(profile));

                  // Update in allUsers too
                  const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
                  const userIndex = allUsers.findIndex(u => u.id === profile.id);
                  if (userIndex > -1) {
                    allUsers[userIndex].subscription = profile.subscription;
                    localStorage.setItem('allUsers', JSON.stringify(allUsers));
                  }

                  // Update state
                  setCurrentPlan(plan.name);
                  alert(`Successfully ${plan.name === 'Free' ? 'downgraded' : 'upgraded'} to ${plan.name} plan!`);
                };

                return (
                  <div key={plan.name} className={`rounded-xl overflow-hidden border-2 ${isCurrentPlan ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'
                    } transition-all hover:shadow-lg`}>
                    <div className={`p-4 text-center ${plan.color === 'gray' ? 'bg-gray-100' :
                        plan.color === 'blue' ? 'bg-blue-100' :
                          plan.color === 'purple' ? 'bg-purple-100' :
                            'bg-yellow-100'
                      }`}>
                      <plan.icon className={`text-3xl mx-auto mb-2 ${plan.color === 'gray' ? 'text-gray-600' :
                          plan.color === 'blue' ? 'text-blue-600' :
                            plan.color === 'purple' ? 'text-purple-600' :
                              'text-yellow-600'
                        }`} />
                      <h3 className="font-bold text-lg text-brandNavy">{plan.name}</h3>
                      <p className="text-2xl font-bold text-brandOrange mt-2">₹{plan.price}</p>
                      <p className="text-xs text-gray-600">per month</p>
                    </div>
                    <div className="p-4">
                      <ul className="space-y-2 mb-4">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                            <FaCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {isCurrentPlan ? (
                        <button disabled className="w-full bg-gray-300 text-gray-600 font-semibold py-2 rounded-lg text-sm cursor-not-allowed">
                          Current Plan
                        </button>
                      ) : (
                        <button
                          onClick={handleUpgrade}
                          className={`w-full font-bold py-2 rounded-lg text-sm transition-all ${plan.color === 'gray' ? 'bg-gray-500 hover:bg-gray-600' :
                              plan.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                                plan.color === 'purple' ? 'bg-purple-500 hover:bg-purple-600' :
                                  'bg-yellow-500 hover:bg-yellow-600'
                            } text-white hover:scale-105`}
                        >
                          {currentPlan === 'Free' || plan.price > ({
                            'Free': 0, 'Basic': 999, 'Premium': 2499, 'Gold': 4999
                          }[currentPlan] || 0) ? 'Upgrade' : 'Downgrade'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* Toggle Switch Component */
const ToggleSwitch = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between w-full cursor-pointer">
    <span className="text-brandNavy font-medium">{label}</span>
    <div className="relative">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <div className={`w-12 h-6 rounded-full transition-colors ${checked ? 'bg-brandOrange' : 'bg-gray-300'}`}></div>
      <div className={`dot absolute left-0 top-0.5 w-5 h-5 bg-brandBlue rounded-full shadow transform transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
    </div>
  </label>
);

export default Settings;
