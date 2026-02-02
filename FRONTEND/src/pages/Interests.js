import React, { useState, useEffect } from 'react';
import { FaHeart, FaTimes, FaCheck, FaClock, FaPaperPlane, FaUserFriends } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MobileMenu from '../components/MobileMenu';
import UserHeader from '../components/UserHeader';

const Interests = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('received');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);



  // State for interests with robust initialization
  const [interests, setInterests] = useState(() => {
    const saved = localStorage.getItem('userInterests');
    const parsed = saved ? JSON.parse(saved) : {};

    // Ensure all required top-level keys exist even with old data
    return {
      received: parsed.received || [
        { id: 4, name: "Priya Patel", age: 25, gender: "Female", caste: "Vaishya", city: "Ahmedabad", occupation: "Doctor", image: "https://images.unsplash.com/photo-1610030469983-98e2343a9d7b?q=80&w=400&h=500&auto=format&fit=crop", status: 'pending' },
        { id: 6, name: "Meera Iyer", age: 26, gender: "Female", caste: "Brahmin", city: "Chennai", occupation: "Architect", image: "https://images.unsplash.com/photo-1610030469668-935142b96fe1?q=80&w=400&h=500&auto=format&fit=crop", status: 'pending' },
      ],
      sent: parsed.sent || [],
      accepted: parsed.accepted || [],
      declined: parsed.declined || [],
      mutual: parsed.mutual || []
    };
  });

  // Save to localStorage whenever interests change
  useEffect(() => {
    localStorage.setItem('userInterests', JSON.stringify(interests));
  }, [interests]);

  const handleAccept = (id) => {
    const profile = interests.received.find(p => p.id === id);
    if (profile) {
      const acceptedItem = { ...profile, status: 'accepted', acceptedDate: new Date().toLocaleDateString() };
      const updatedInterests = {
        ...interests,
        received: interests.received.filter(p => p.id !== id),
        accepted: [...interests.accepted, acceptedItem],
        mutual: [...interests.mutual, acceptedItem]
      };
      setInterests(updatedInterests);

      // Add Professional Notification
      const existingNotifs = JSON.parse(localStorage.getItem("userNotifications") || "[]");
      const newNotif = {
        id: Date.now(),
        message: `You accepted ${profile.name}'s interest!`,
        image: profile.image,
        time: new Date().toISOString(),
        read: false,
        link: "/interests"
      };
      localStorage.setItem("userNotifications", JSON.stringify([newNotif, ...existingNotifs]));
      window.dispatchEvent(new Event('notifications-updated'));

      alert("Interest Accepted! You can now chat with " + profile.name);
    }
  };

  const handleReject = (id) => {
    const profile = interests.received.find(p => p.id === id);
    if (profile) {
      const updatedInterests = {
        ...interests,
        received: interests.received.filter(p => p.id !== id),
        declined: [...interests.declined, { ...profile, status: 'declined', declinedDate: new Date().toLocaleDateString() }]
      };
      setInterests(updatedInterests);

      // Add Professional Notification
      const existingNotifs = JSON.parse(localStorage.getItem("userNotifications") || "[]");
      const newNotif = {
        id: Date.now(),
        message: `You declined ${profile.name}'s interest`,
        image: profile.image,
        time: new Date().toISOString(),
        read: false,
        link: "/interests"
      };
      localStorage.setItem("userNotifications", JSON.stringify([newNotif, ...existingNotifs]));
      window.dispatchEvent(new Event('notifications-updated'));
    }
  };

  const handleCancelSent = (id) => {
    setInterests({
      ...interests,
      sent: interests.sent.filter(p => p.id !== id)
    });
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case 'received': return interests.received;
      case 'sent': return interests.sent;
      case 'accepted': return interests.accepted;
      case 'declined': return interests.declined;
      case 'mutual': return interests.mutual;
      default: return [];
    }
  };

  const currentList = getCurrentList();

  return (
    <div className="min-h-screen bg-brandBlue">

      {/* ===== MOBILE MENU ===== */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <UserHeader setMobileMenuOpen={setMobileMenuOpen} showBack={true} />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">

        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-brandNavy mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brandOrange to-orange-700 rounded-xl flex items-center justify-center shadow-lg">
              <FaUserFriends className="text-white text-xl" />
            </div>
            Interest Management
          </h2>
          <p className="text-gray-600">Manage your received and sent interests</p>
        </div>

        {/* Tabs */}
        <div className="bg-brandBlue rounded-2xl shadow-md p-2 flex flex-wrap gap-2 mb-8 border border-gray-100">
          {[
            { id: 'received', label: 'Received', icon: FaHeart, count: interests.received?.length || 0 },
            { id: 'sent', label: 'Sent', icon: FaPaperPlane, count: interests.sent?.length || 0 },
            { id: 'accepted', label: 'Accepted', icon: FaCheck, count: interests.accepted?.length || 0 },
            { id: 'mutual', label: 'Mutual', icon: FaUserFriends, count: interests.mutual?.length || 0 },
            { id: 'declined', label: 'Declined', icon: FaTimes, count: interests.declined?.length || 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-brandOrange to-brandNavy text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <tab.icon />
              {tab.label}
              <span className={`ml-1 text-xs py-0.5 px-2 rounded-full ${activeTab === tab.id ? 'bg-brandBlue/20' : 'bg-gray-200'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="wait">
            {currentList.length > 0 ? (
              currentList.map((profile, idx) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-brandBlue rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all border border-gray-100"
                >
                  {/* Profile Image */}
                  <div className="h-56 overflow-hidden relative">
                    <img
                      src={profile.image}
                      alt={profile.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      {activeTab === 'accepted' && (
                        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                          <FaCheck className="text-[10px]" /> Accepted
                        </div>
                      )}
                      {activeTab === 'declined' && (
                        <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                          <FaTimes className="text-[10px]" /> Declined
                        </div>
                      )}
                      {activeTab === 'sent' && (
                        <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                          <FaClock className="text-[10px]" /> Pending
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                      <h3 className="font-bold text-lg">{profile.name}, {profile.age}</h3>
                      <p className="text-xs opacity-90">{profile.city}</p>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="font-medium">{profile.occupation}</span>
                      <span className="text-gray-500">{profile.caste}</span>
                    </div>

                    {profile.acceptedDate && (
                      <p className="text-xs text-green-600 font-medium">Accepted on {profile.acceptedDate}</p>
                    )}
                    {profile.declinedDate && (
                      <p className="text-xs text-red-600 font-medium">Declined on {profile.declinedDate}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {activeTab === 'received' && (
                        <>
                          <button
                            onClick={() => handleAccept(profile.id)}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                          >
                            <FaCheck /> Accept
                          </button>
                          <button
                            onClick={() => handleReject(profile.id)}
                            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2"
                          >
                            <FaTimes /> Decline
                          </button>
                        </>
                      )}
                      {activeTab === 'sent' && (
                        <button
                          onClick={() => handleCancelSent(profile.id)}
                          className="flex-1 bg-red-100 text-red-600 font-semibold py-2.5 rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-2"
                        >
                          <FaTimes /> Cancel
                        </button>
                      )}
                      {(activeTab === 'accepted' || activeTab === 'declined') && (
                        <Link
                          to={`/view-profile/${profile.id}`}
                          className="flex-1 bg-gradient-to-r from-brandOrange to-brandNavy text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all text-center"
                        >
                          View Profile
                        </Link>
                      )}
                      {activeTab === 'mutual' && (
                        <>
                          <Link
                            to="/messages"
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all text-center flex items-center justify-center gap-2"
                          >
                            <FaPaperPlane /> Message
                          </Link>
                          <Link
                            to={`/view-profile/${profile.id}`}
                            className="flex-1 bg-gradient-to-r from-brandOrange to-brandNavy text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all text-center"
                          >
                            View Profile
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUserFriends className="text-4xl text-gray-300" />
                </div>
                <p className="text-lg text-gray-500 font-medium">No {activeTab} interests yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  {activeTab === 'received' && "When someone sends you an interest, it will appear here."}
                  {activeTab === 'sent' && "Start exploring profiles and send interests!"}
                  {activeTab === 'accepted' && "Accepted interests will be shown here."}
                  {activeTab === 'declined' && "Declined interests will be shown here."}
                </p>
                {activeTab === 'sent' && (
                  <Link to="/search" className="inline-block mt-4 bg-gradient-to-r from-brandOrange to-brandNavy text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition">
                    Search Matches
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>
    </div>
  );
};

export default Interests;
