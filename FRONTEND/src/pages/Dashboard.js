import React, { useEffect, useState } from 'react';
import {
  FaBell, FaSignOutAlt, FaUserEdit, FaCheck, FaTimes, FaHeart, FaStar, FaBookmark, FaUsers, FaArrowRight, FaBars, FaExclamationTriangle, FaHeadset, FaCrown, FaGem
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MobileMenu from '../components/MobileMenu';
import UserHeader from '../components/UserHeader';

// Mock Database (Same as SearchMatches for consistency)
const MOCK_DB_PROFILES = [
  { id: 1, name: "Arjun Sharma", age: 28, gender: "Male", caste: "Brahmin", city: "Delhi", occupation: "Software Engineer", image: "https://images.unsplash.com/photo-1614289371518-722f2615943d?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 2, name: "Sneha Reddy", age: 24, gender: "Female", caste: "Reddy", city: "Hyderabad", occupation: "Marketing Manager", image: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 3, name: "Vikram Malhotra", age: 29, gender: "Male", caste: "Kshatriya", city: "Mumbai", occupation: "Graphic Designer", image: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 4, name: "Priya Patel", age: 25, gender: "Female", caste: "Vaishya", city: "Ahmedabad", occupation: "Doctor", image: "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 5, name: "Rahul Verma", age: 30, gender: "Male", caste: "Kayastha", city: "Lucknow", occupation: "IT Consultant", image: "https://images.unsplash.com/photo-1630138255230-0856006f6630?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 6, name: "Meera Iyer", age: 26, gender: "Female", caste: "Brahmin", city: "Chennai", occupation: "Architect", image: "https://images.unsplash.com/photo-1610030469668-935142b96fe1?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 7, name: "Siddharth Goel", age: 27, gender: "Male", caste: "Aggarwal", city: "Gurgaon", occupation: "Data Scientist", image: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 8, name: "Anjali Gupta", age: 23, gender: "Female", caste: "Bania", city: "Indore", occupation: "Content Writer", image: "https://images.unsplash.com/photo-1610030469915-d4924c80338a?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 9, name: "Rohan Das", age: 31, gender: "Male", caste: "Kayastha", city: "Kolkata", occupation: "Banker", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 10, name: "Kavita Nair", age: 26, gender: "Female", caste: "Nair", city: "Kochi", occupation: "HR Professional", image: "https://images.unsplash.com/photo-1630807033100-8f3a3a109a90?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 11, name: "Kabir Khan", age: 28, gender: "Male", caste: "Sunni", city: "Bhopal", occupation: "Chef", image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 12, name: "Ishani Bose", age: 25, gender: "Female", caste: "Kayastha", city: "Kolkata", occupation: "Fashion Designer", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 13, name: "Manish Pandey", age: 32, gender: "Male", caste: "Brahmin", city: "Varanasi", occupation: "Professor", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 14, name: "Riya Sen", age: 24, gender: "Female", caste: "Kayastha", city: "Guwahati", occupation: "Dancer", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 15, name: "Rajesh Khanna", age: 30, gender: "Male", caste: "Khatri", city: "Chandigarh", occupation: "Civil Servant", image: "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 16, name: "Zoya Akhtar", age: 27, gender: "Female", caste: "Shia", city: "Hyderabad", occupation: "Writer", image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 17, name: "Sukhwinder Singh", age: 29, gender: "Male", caste: "Sikh", city: "Amritsar", occupation: "Entrepreneur", image: "https://images.unsplash.com/photo-1533227268408-a574a2ca315a?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 18, name: "Pooja Hegde", age: 26, gender: "Female", caste: "Maratha", city: "Pune", occupation: "Pilot", image: "https://images.unsplash.com/photo-1531746020798-e795c5399c97?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 19, name: "Aditya Roy", age: 30, gender: "Male", caste: "Rajput", city: "Dehradun", occupation: "Lawyer", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 20, name: "Tara Sutaria", age: 25, gender: "Female", caste: "Parsi", city: "Mumbai", occupation: "Singer", image: "https://images.unsplash.com/photo-1567532939604-b6c5b0ad2e01?q=80&w=400&h=500&auto=format&fit=crop" }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState("Good Morning");
  const [activeTab, setActiveTab] = useState("new"); // new, mutual, shortlist, saved
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real-time Lists
  const [shortlisted, setShortlisted] = useState([]);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [mutualMatches, setMutualMatches] = useState([]);
  const [newMatches, setNewMatches] = useState([]);
  const [interests, setInterests] = useState(() => {
    const saved = localStorage.getItem("userInterests");
    return saved ? JSON.parse(saved) : { received: [], sent: [], accepted: [], declined: [], mutual: [] };
  });

  useEffect(() => {
    // 1. Fetch User Data
    const savedProfile = localStorage.getItem("userProfile");
    const registeredData = localStorage.getItem("registerData");

    let userData = {};
    if (savedProfile) userData = JSON.parse(savedProfile);

    // Fallback merge
    if ((!userData.name && !userData.fullName) && registeredData) {
      const reg = JSON.parse(registeredData);
      userData = { ...userData, ...reg, name: reg.name, email: reg.email, mobile: reg.mobile };
    }

    // Standardize name field
    if (!userData.name && userData.fullName) userData.name = userData.fullName;

    setUser(userData);

    // 2. Load Lists from LocalStorage
    const savedShortlist = JSON.parse(localStorage.getItem("shortlistedProfiles") || "[]");
    const savedSaved = JSON.parse(localStorage.getItem("savedProfiles") || "[]");
    setShortlisted(savedShortlist);
    setSavedProfiles(savedSaved);

    // 3. Generate Matches (Simulation)
    calculateMatches(userData);

    // 3. Generate Matches (Simulation)
    calculateMatches(userData);

    // 5. Greeting
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening");

  }, []);

  const calculateMatches = (userData) => {
    const userGender = userData?.gender || "Male";
    const oppositeGender = userGender === "Male" ? "Female" : "Male";

    // Filter ALL demo profiles by opposite gender
    const allMatches = MOCK_DB_PROFILES.filter(p => p.gender === oppositeGender);

    // Mutual = Same Caste OR Same City (Simplified for demo)
    const mutuals = allMatches.filter(p =>
      (userData?.caste && p.caste === userData?.caste) ||
      (userData?.city && p.city === userData?.city) ||
      (p.id % 2 === 0) // Ensure we always have some for the demo
    ).slice(0, 10);

    setMutualMatches(mutuals);
    setNewMatches(allMatches);
  };

  // Interaction Handlers
  const handleConnect = (profile) => {
    if (!interests.sent?.find(p => p.id === profile.id)) {
      const newInterests = {
        ...interests,
        sent: [...(interests.sent || []), { ...profile, status: 'pending', sentDate: new Date().toLocaleDateString() }]
      };
      setInterests(newInterests);
      localStorage.setItem("userInterests", JSON.stringify(newInterests));

      // Add Professional Notification
      const notifications = JSON.parse(localStorage.getItem("userNotifications") || "[]");
      const newNotif = {
        id: Date.now(),
        message: `You expressed interest in ${profile.name}`,
        image: profile.image,
        time: new Date().toISOString(),
        read: false,
        link: "/interests"
      };
      localStorage.setItem("userNotifications", JSON.stringify([newNotif, ...notifications]));
      window.dispatchEvent(new Event('notifications-updated'));

      alert("Interest sent successfully!");
    }
  };

  const handleShortlist = (profile) => {
    const isAlready = shortlisted.find(p => p.id === profile.id);
    let newList;
    if (isAlready) {
      newList = shortlisted.filter(p => p.id !== profile.id);
    } else {
      newList = [...shortlisted, profile];
    }
    setShortlisted(newList);
    localStorage.setItem("shortlistedProfiles", JSON.stringify(newList));
  };

  const handleSaveProfile = (profile) => {
    const isAlready = savedProfiles.find(p => p.id === profile.id);
    let newList;
    if (isAlready) {
      newList = savedProfiles.filter(p => p.id !== profile.id);
    } else {
      newList = [...savedProfiles, profile];
    }
    setSavedProfiles(newList);
    localStorage.setItem("savedProfiles", JSON.stringify(newList));
  };

  // No longer needed, logic moved to UserHeader

  const calculateProgress = (userData) => {
    if (!userData) return 0;
    const requiredFields = ['name', 'mobile', 'email', 'dob', 'city', 'religion', 'caste', 'height', 'weight', 'motherTongue', 'physicalStatus', 'qualification', 'occupation', 'annualIncome', 'fatherOccupation', 'brothers', 'sisters', 'rashi', 'nakshatra', 'profilePhoto'];
    const filled = requiredFields.filter(field => {
      if (field === 'dob') return userData.dob || (userData.dobDay && userData.dobMonth && userData.dobYear);
      return userData[field] && userData[field] !== "";
    }).length;
    return Math.round((filled / requiredFields.length) * 100);
  };

  const getPendingTasks = (userData) => {
    if (!userData) return [];
    const tasks = [];
    if (!userData.profilePhoto) tasks.push({ label: "Upload Profile Photo", link: "/create-profile" });
    if (!userData.occupation) tasks.push({ label: "Add Professional Details", link: "/create-profile" });
    if (!userData.rashi) tasks.push({ label: "Add Horoscope Details", link: "/create-profile" });
    if (!userData.preferredCaste) tasks.push({ label: "Set Partner Preferences", link: "/create-profile" });
    return tasks;
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Stable User ID Logic
  const getStableId = () => {
    if (!user) return "Loading...";
    if (user.id) return user.id; // From Login Mock or Register

    // Fallback generation and persistence
    const newId = "OM" + (user.mobile ? user.mobile.slice(-4) : Math.floor(1000 + Math.random() * 9000)) + "X";
    // We update the user object in state and local storage to persist this ID
    const updatedUser = { ...user, id: newId };
    setUser(updatedUser);
    localStorage.setItem("userProfile", JSON.stringify(updatedUser));
    return newId;
  };

  const userId = user?.id || getStableId();

  // Tab Content Helper
  const getTabContent = () => {
    switch (activeTab) {
      case 'new': return newMatches;
      case 'mutual': return mutualMatches; // USE CALCULATED MUTUALS
      case 'shortlist': return shortlisted;
      case 'saved': return savedProfiles;
      default: return [];
    }
  };

  const currentList = getTabContent();

  return (
    <div className="min-h-screen bg-brandBlue font-sans text-brandNavy">

      {/* ================= HEADER ================= */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <UserHeader setMobileMenuOpen={setMobileMenuOpen} />

      {/* Welcome Bar */}
      <div className="bg-gradient-to-r from-brandOrange to-orange-700 text-white py-2 px-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <p className="font-medium text-sm"> {greeting}, <span className="font-bold">{user?.name || user?.fullName || "Member"}</span> (ID: {userId})</p>
          <Link to="/settings" className="text-xs bg-brandBlue/20 px-3 py-1 rounded hover:bg-brandBlue/30 transition">Settings</Link>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">

        {/* LEFT SIDEBAR: PROFILE SUMMARY */}
        <div className="lg:col-span-1 space-y-6">

          {/* Profile Card */}
          <div className="bg-brandBlue rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="h-24 bg-gradient-to-br from-brandOrange to-orange-600 relative">
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  <img
                    src={user?.profilePhoto || "https://via.placeholder.com/150"}
                    className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-md"
                    alt="Profile"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                  />
                  {user?.profilePhotoStatus === 'Pending' && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <FaExclamationTriangle className="text-white text-xs" title="Pending Approval" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-12 pb-6 px-4 text-center">
              <h2 className="text-xl font-bold text-brandNavy">{user?.name || user?.fullName || "User Name"}</h2>
              <p className="text-sm text-gray-500">{user?.occupation || "Profession Not Added"}</p>
              <p className="text-xs text-orange-500 font-semibold mt-1">{user?.city || user?.workLocation || "Location Not Added"}</p>

              <div className="mt-4 flex justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="text-center">
                  <p className="font-bold text-brandNavy">{shortlisted.length}</p>
                  <p className="text-xs">Shortlisted</p>
                </div>
                <div className="text-center border-l border-gray-200 pl-4">
                  <p className="font-bold text-brandNavy">{savedProfiles.length}</p>
                  <p className="text-xs">Saved</p>
                </div>
              </div>

              <button onClick={() => navigate('/profile')} className="w-full mt-4 bg-orange-100 text-brandOrange font-semibold py-2 rounded-lg text-sm hover:bg-orange-200 transition">
                Edit Profile
              </button>
            </div>
          </div>

          {/* Subscription Plan Card */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg overflow-hidden border-2 border-purple-200">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {user?.subscription?.plan === 'Gold' ? <FaGem className="text-yellow-300 text-xl" /> :
                    user?.subscription?.plan === 'Premium' ? <FaCrown className="text-yellow-300 text-xl" /> :
                      <FaStar className="text-yellow-300 text-xl" />}
                  <h3 className="font-bold text-lg">{user?.subscription?.plan || 'Free'} Plan</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${user?.subscription?.status === 'Active' ? 'bg-green-400 text-green-900' : 'bg-gray-300 text-gray-700'}`}>
                  {user?.subscription?.status || 'Active'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2 text-sm text-gray-700 mb-4">
                {user?.subscription?.plan === 'Free' && (
                  <>
                    <p className="flex items-center gap-2"><FaCheck className="text-green-500 text-xs" /> Basic profile access</p>
                    <p className="flex items-center gap-2"><FaTimes className="text-red-500 text-xs" /> Limited daily matches</p>
                  </>
                )}
                {(user?.subscription?.plan === 'Basic' || user?.subscription?.plan === 'Premium' || user?.subscription?.plan === 'Gold') && (
                  <>
                    <p className="flex items-center gap-2"><FaCheck className="text-green-500 text-xs" /> Unlimited matches</p>
                    <p className="flex items-center gap-2"><FaCheck className="text-green-500 text-xs" /> Priority support</p>
                  </>
                )}
                {(user?.subscription?.plan === 'Premium' || user?.subscription?.plan === 'Gold') && (
                  <>
                    <p className="flex items-center gap-2"><FaCheck className="text-green-500 text-xs" /> Profile boost</p>
                    <p className="flex items-center gap-2"><FaCheck className="text-green-500 text-xs" /> Advanced filters</p>
                  </>
                )}
                {user?.subscription?.plan === 'Gold' && (
                  <>
                    <p className="flex items-center gap-2"><FaCheck className="text-green-500 text-xs" /> VIP badge</p>
                    <p className="flex items-center gap-2"><FaCheck className="text-green-500 text-xs" /> Dedicated manager</p>
                  </>
                )}
              </div>
              {user?.subscription?.expiryDate && (
                <p className="text-xs text-gray-500 mb-3">Expires: {new Date(user.subscription.expiryDate).toLocaleDateString()}</p>
              )}
              {(!user?.subscription?.plan || user?.subscription?.plan === 'Free') && (
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-2 rounded-lg text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <FaCrown /> Upgrade Now
                </button>
              )}
              {user?.subscription?.plan && user?.subscription?.plan !== 'Free' && (
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full bg-purple-100 text-purple-700 font-semibold py-2 rounded-lg text-sm hover:bg-purple-200 transition"
                >
                  Manage Subscription
                </button>
              )}
            </div>
          </div>

          {/* Activity Stats (REAL TIME) */}
          <div className="bg-brandBlue rounded-2xl shadow-md p-6 border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><FaCheck className="text-green-500" /> Activity Corner</h3>

            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className={`h-2.5 rounded-full ${calculateProgress(user) === 100 ? 'bg-green-500' : 'bg-brandOrange'} transition-all duration-1000`}
                style={{ width: `${calculateProgress(user)}%` }}
              ></div>
            </div>
            <p className="text-xs text-right text-gray-500 font-bold">{calculateProgress(user)}% Completed</p>

            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              {getPendingTasks(user).map((task, index) => (
                <li key={index} className="flex items-center gap-2 text-brandOrange cursor-pointer hover:underline" onClick={() => navigate(task.link)}>
                  <FaArrowRight className="text-xs" /> {task.label}
                </li>
              ))}

              {getPendingTasks(user).length === 0 && (
                <li className="flex items-center gap-2 text-green-600">
                  <FaCheck className="text-xs" /> All Steps Completed!
                </li>
              )}

              <li className="flex items-center gap-2">
                {user?.mobile ? <FaCheck className="text-green-500 text-xs" /> : <FaTimes className="text-red-500 text-xs" />}
                Mobile Verified
              </li>
              <li className="flex items-center gap-2">
                {user?.email ? <FaCheck className="text-green-500 text-xs" /> : <FaTimes className="text-red-500 text-xs" />}
                Email Verified
              </li>
            </ul>

          </div>
        </div>


        {/* RIGHT MAIN: MATCHES TABS */}
        <div className="lg:col-span-3">

          {/* Tabs Header */}
          <div className="bg-brandBlue rounded-xl shadow-sm p-2 flex overflow-x-auto gap-2 mb-6">
            {[
              { id: 'new', label: 'New Matches', icon: FaStar, count: newMatches.length },
              { id: 'mutual', label: 'Mutual Matches', icon: FaUsers, count: mutualMatches.length },
              { id: 'shortlist', label: 'Shortlisted', icon: FaHeart, count: shortlisted.length },
              { id: 'saved', label: 'Saved Profiles', icon: FaBookmark, count: savedProfiles.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-xs md:text-sm transition-all whitespace-nowrap
                            ${activeTab === tab.id
                    ? 'bg-brandOrange text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <tab.icon /> {tab.label}
                <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${activeTab === tab.id ? 'bg-brandBlue/20' : 'bg-gray-200'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Matches Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence mode='wait'>
              {currentList.length > 0 ? (
                currentList.map((profile, idx) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-brandBlue rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all border border-gray-100"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img src={profile.image || `https://randomuser.me/api/portraits/${profile.gender === 'Male' ? 'men' : 'women'}/${profile.id}.jpg`}
                        alt={profile.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        {activeTab === 'shortlist' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShortlist(profile); }}
                            className="bg-brandBlue/90 p-2 rounded-full text-red-500 shadow-sm hover:bg-brandBlue transition"
                            title="Remove"
                          >
                            <FaTimes />
                          </button>
                        )}
                        {activeTab === 'saved' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveProfile(profile); }}
                            className="bg-brandBlue/90 p-2 rounded-full text-red-500 shadow-sm hover:bg-brandBlue transition"
                            title="Remove"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                        <h3 className="font-bold text-lg">{profile.name}</h3>
                        <p className="text-xs opacity-90">{profile.age} Yrs, {profile.height ? `${profile.height}cm` : ""}</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{profile.caste || "Caste N/A"}</span>
                        <span>{profile.city}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{profile.education || "Degree"}</span>
                        <span>{profile.occupation}</span>
                      </div>

                      <div className="pt-4 flex gap-2">
                        <button
                          onClick={() => handleConnect(profile)}
                          disabled={interests.sent?.some(p => p.id === profile.id)}
                          className={`flex-1 font-semibold py-2 rounded-lg shadow-md transition ${interests.sent?.some(p => p.id === profile.id)
                            ? "bg-green-100 text-green-600 cursor-not-allowed"
                            : "bg-gradient-to-r from-brandOrange to-orange-700 text-white hover:opacity-90"
                            }`}
                        >
                          {interests.sent?.some(p => p.id === profile.id) ? "Sent" : "Connect"}
                        </button>
                        <Link to={`/view-profile/${profile.id}`} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                          View
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-gray-400">
                  <FaUserEdit className="text-6xl mx-auto mb-4 opacity-20" />
                  <p className="text-lg">No profiles found in this section.</p>
                  {activeTab === 'shortlist' && <Link to="/search" className="text-orange-500 font-semibold mt-2 inline-block">Go to Search</Link>}
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main >

    </div >
  );
};

export default Dashboard;
