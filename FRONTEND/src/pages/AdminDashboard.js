import React, { useState, useEffect } from 'react';
import {
  FaUsers,
  FaUserShield,
  FaChartLine,
  FaCog,
  FaTrash,
  FaPlus,
  FaCheck,
  FaTimes,
  FaList,
  FaLayerGroup,
  FaBars,
  FaArrowLeft,
  FaExclamationTriangle,
  FaShieldAlt,
  FaCamera,
  FaCrown,
  FaSignOutAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionManagement from './SubscriptionManagement';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState('admin'); // 'admin' or 'moderator'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data States
  const [users, setUsers] = useState([
    { id: 101, name: 'Rahul Sharma', role: 'User', status: 'Active', verification: 'Verified' },
    { id: 102, name: 'Priya Patel', role: 'User', status: 'Active', verification: 'Verified' },
    { id: 103, name: 'Amit Verma', role: 'Moderator', status: 'Active', verification: 'Verified' },
  ]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [newModerator, setNewModerator] = useState('');

  // Master Data States
  const [castes, setCastes] = useState(['Brahmin', 'Kshatriya', 'Vaishya', 'Shudra']);
  const [newCaste, setNewCaste] = useState('');

  const [communities, setCommunities] = useState(['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain']);
  const [newCommunity, setNewCommunity] = useState('');

  const [abuseReports, setAbuseReports] = useState([]);
  const [settings, setSettings] = useState({
    siteTitle: 'SarvVivah Matrimony',
    contactEmail: 'admin@sarvvivah.com',
    supportPhone: '+91 8450 914835',
    maintenanceMode: false
  });

  // Check Role on Mount
  useEffect(() => {
    const role = localStorage.getItem("role") || "admin";
    setCurrentUserRole(role);

    // Initial load of reports
    const savedReports = JSON.parse(localStorage.getItem('reportedAbuse') || '[]');
    setAbuseReports(savedReports);

    // Fetch mock pending user
    const localProfile = localStorage.getItem("userProfile");
    if (localProfile) {
      const parsed = JSON.parse(localProfile);
      if (parsed.adminStatus !== "Approved" && parsed.adminStatus !== "Rejected") {
        setPendingUsers([{
          id: 999,
          name: parsed.fullName || parsed.name || "Current User",
          role: "User",
          status: "Pending",
          verification: "Pending",
          details: parsed
        }]);
      }
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // --- ACTIONS ---
  const approveUser = (user) => {
    setUsers([...users, { ...user, status: 'Active', verification: 'Verified' }]);
    setPendingUsers(pendingUsers.filter(u => u.id !== user.id));
    if (user.id === 999) {
      const localProfile = JSON.parse(localStorage.getItem("userProfile"));
      localProfile.adminStatus = "Approved";
      localStorage.setItem("userProfile", JSON.stringify(localProfile));
      alert(`${user.name} has been Approved!`);
    }
  };

  const rejectUser = (user) => {
    setPendingUsers(pendingUsers.filter(u => u.id !== user.id));
    if (user.id === 999) {
      const localProfile = JSON.parse(localStorage.getItem("userProfile"));
      localProfile.adminStatus = "Rejected";
      localStorage.setItem("userProfile", JSON.stringify(localProfile));
      alert(`${user.name} has been Rejected.`);
    }
  };

  const addModerator = () => {
    if (!newModerator) return;
    setUsers([...users, { id: Date.now(), name: newModerator, role: 'Moderator', status: 'Active', verification: 'Verified' }]);
    setNewModerator('');
  };

  const removeUser = (id) => {
    if (currentUserRole !== 'admin') {
      alert("Only Admins can delete users.");
      return;
    }
    setUsers(users.filter(u => u.id !== id));
  };

  const addCaste = () => {
    if (newCaste && !castes.includes(newCaste)) {
      setCastes([...castes, newCaste]);
      setNewCaste('');
    }
  };

  const addCommunity = () => {
    if (newCommunity && !communities.includes(newCommunity)) {
      setCommunities([...communities, newCommunity]);
      setNewCommunity('');
    }
  };

  const resolveReport = (id) => {
    const updated = abuseReports.map(r => r.id === id ? { ...r, status: 'Resolved' } : r);
    setAbuseReports(updated);
    localStorage.setItem('reportedAbuse', JSON.stringify(updated));
  };

  const deleteReport = (id) => {
    const updated = abuseReports.filter(r => r.id !== id);
    setAbuseReports(updated);
    localStorage.setItem('reportedAbuse', JSON.stringify(updated));
  };

  const updateSettings = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen flex bg-brandBlue font-sans relative">

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 w-64 bg-brandNavy text-white p-6 flex flex-col shadow-2xl z-50 transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <h2 className="text-2xl font-bold mb-8 text-brandOrange flex items-center gap-2 flex-shrink-0">
          SarvVivah <span className="text-xs text-white border border-white px-1 rounded uppercase">{currentUserRole}</span>
        </h2>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto -mx-2 px-2 custom-scrollbar">
          <ul className="space-y-4 text-sm font-medium">
            <li onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 cursor-pointer transition p-2 rounded-lg ${activeTab === 'dashboard' ? 'bg-brandOrange text-white' : 'hover:bg-brandOrange/10 hover:text-orange-400'}`}>
              <FaChartLine className="text-lg" /> Dashboard
            </li>
            <li onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 cursor-pointer transition p-2 rounded-lg ${activeTab === 'users' ? 'bg-brandOrange text-white' : 'hover:bg-brandOrange/10 hover:text-orange-400'}`}>
              <FaUsers className="text-lg" /> User Management
            </li>

            <li onClick={() => { setActiveTab('castes'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 cursor-pointer transition p-2 rounded-lg ${activeTab === 'castes' ? 'bg-brandOrange text-white' : 'hover:bg-brandOrange/10 hover:text-orange-400'}`}>
              <FaLayerGroup className="text-lg" /> Castes
            </li>
            <li onClick={() => { setActiveTab('communities'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 cursor-pointer transition p-2 rounded-lg ${activeTab === 'communities' ? 'bg-brandOrange text-white' : 'hover:bg-brandOrange/10 hover:text-orange-400'}`}>
              <FaList className="text-lg" /> Communities
            </li>

            <li onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 cursor-pointer transition p-2 rounded-lg ${activeTab === 'reports' ? 'bg-brandOrange text-white' : 'hover:bg-brandOrange/10 hover:text-orange-400'}`}>
              <FaExclamationTriangle className="text-lg" /> Abuse Reports
            </li>

            <li onClick={() => { setActiveTab('photos'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 cursor-pointer transition p-2 rounded-lg ${activeTab === 'photos' ? 'bg-brandOrange text-white' : 'hover:bg-brandOrange/10 hover:text-orange-400'}`}>
              <FaCamera className="text-lg" /> Photo Approvals
            </li>

            <li onClick={() => { setActiveTab('subscriptions'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 cursor-pointer transition p-2 rounded-lg ${activeTab === 'subscriptions' ? 'bg-brandOrange text-white' : 'hover:bg-brandOrange/10 hover:text-orange-400'}`}>
              <FaCrown className="text-lg" /> Subscriptions
            </li>

            {currentUserRole === 'admin' && (
              <>
                <li onClick={() => { setActiveTab('moderators'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 cursor-pointer transition p-2 rounded-lg ${activeTab === 'moderators' ? 'bg-brandOrange text-white' : 'hover:bg-brandOrange/10 hover:text-orange-400'}`}>
                  <FaUserShield className="text-lg" /> Moderators
                </li>
                <li onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 cursor-pointer transition p-2 rounded-lg ${activeTab === 'settings' ? 'bg-brandOrange text-white' : 'hover:bg-brandOrange/10 hover:text-orange-400'}`}>
                  <FaCog className="text-lg" /> Settings
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Pinned Logout Footer */}
        <div className="mt-4 pt-4 border-t border-brandOrange/20 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition w-full text-left font-bold"
          >
            <FaSignOutAlt className="text-lg" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6 bg-brandBlue p-4 -m-4 md:-m-8 shadow-sm">
          <h2 className="text-xl font-bold bg-gradient-to-r from-brandOrange to-orange-700 bg-clip-text text-transparent">
            SarvVivah Admin
          </h2>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-gray-100 rounded-lg"
          >
            <FaBars className="text-gray-600" />
          </button>
        </div>
        <h1 className="text-3xl font-bold text-brandNavy mb-8 capitalize">
          {activeTab.replace('-', ' ')}
        </h1>

        {/* ================= DASHBOARD TAB ================= */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Users" value={users.length + 1500} color="bg-brandNavy" />
              <StatCard title="Pending Approvals" value={pendingUsers.length} color="bg-brandOrange" />
              <StatCard title="Verified Profiles" value={980 + users.length} color="bg-green-600" />
              <StatCard title="Online Now" value="42" color="bg-purple-500" />
            </div>

            {/* Pending Requests */}
            {pendingUsers.length > 0 ? (
              <div className="bg-brandBlue rounded-xl shadow-lg mb-8 overflow-hidden border border-orange-100">
                <div className="bg-brandBlue/50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
                  <h2 className="font-bold text-orange-800 text-lg">Pending Verification Requests</h2>
                  <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full font-bold">{pendingUsers.length} New</span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-brandBlue/20 text-gray-600 text-sm uppercase">
                    <tr> <th className="p-4">Name</th> <th className="p-4">Details</th> <th className="p-4">Action</th> </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingUsers.map(user => (
                      <tr key={user.id} className="hover:bg-orange-50/30 transition">
                        <td className="p-4 font-semibold text-brandNavy">{user.name}</td>
                        <td className="p-4 text-xs text-gray-500">
                          {user.details?.caste ? `${user.details.caste}, ${user.details.city}` : "N/A"}
                        </td>
                        <td className="p-4 flex gap-2">
                          <button onClick={() => approveUser(user)} className="bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold flex gap-1 items-center"><FaCheck /> Approve</button>
                          <button onClick={() => rejectUser(user)} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold flex gap-1 items-center"><FaTimes /> Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-gray-500 italic mb-8">No pending verifications.</p>}
          </>
        )}

        {/* ================= USERS TAB ================= */}
        {(activeTab === 'users' || activeTab === 'dashboard') && (
          <div className={`bg-brandBlue rounded-xl shadow-md p-6 border border-gray-100 ${activeTab === 'dashboard' ? '' : 'mt-4'}`}>
            <h2 className="font-bold text-brandNavy mb-4 text-lg border-b pb-2">Active Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brandBlue/20 text-gray-500">
                  <tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b">
                      <td className="p-3 font-medium">{user.name}</td>
                      <td className="p-3">{user.role}</td>
                      <td className="p-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">{user.status}</span></td>
                      <td className="p-3">
                        <button onClick={() => removeUser(user.id)} className="text-red-500 hover:text-red-700 p-2"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= CASTES TAB ================= */}
        {activeTab === 'castes' && (
          <div className="bg-brandBlue rounded-xl shadow-md p-6 border border-gray-100 max-w-2xl">
            <h2 className="font-bold text-brandNavy mb-4">Manage Castes</h2>
            <div className="flex gap-2 mb-6">
              <input value={newCaste} onChange={(e) => setNewCaste(e.target.value)} placeholder="Add new caste" className="border p-2 rounded flex-1" />
              <button onClick={addCaste} className="bg-brandOrange text-white px-4 rounded font-bold">Add</button>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {castes.map(c => <li key={c} className="bg-brandBlue/20 p-2 rounded border flex justify-between">{c}</li>)}
            </ul>
          </div>
        )}

        {/* ================= COMMUNITIES TAB ================= */}
        {activeTab === 'communities' && (
          <div className="bg-brandBlue rounded-xl shadow-md p-6 border border-gray-100 max-w-2xl">
            <h2 className="font-bold text-brandNavy mb-4">Manage Communities</h2>
            <div className="flex gap-2 mb-6">
              <input value={newCommunity} onChange={(e) => setNewCommunity(e.target.value)} placeholder="Add new community" className="border p-2 rounded flex-1" />
              <button onClick={addCommunity} className="bg-blue-500 text-white px-4 rounded font-bold">Add</button>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {communities.map(c => <li key={c} className="bg-brandBlue/20 p-2 rounded border flex justify-between">{c}</li>)}
            </ul>
          </div>
        )}

        {/* ================= MODERATORS TAB (Admin Only) ================= */}
        {activeTab === 'moderators' && currentUserRole === 'admin' && (
          <div className="bg-brandBlue rounded-xl shadow-md p-6 border border-gray-100 max-w-2xl">
            <h2 className="font-bold text-brandNavy mb-4">Add Moderator</h2>
            <div className="flex gap-2">
              <input value={newModerator} onChange={(e) => setNewModerator(e.target.value)} placeholder="Enter Moderator Name" className="border p-2 rounded flex-1" />
              <button onClick={addModerator} className="bg-slate-800 text-white px-4 rounded font-bold">Add Permission</button>
            </div>
          </div>
        )}

        {/* ================= REPORTS TAB ================= */}
        {activeTab === 'reports' && (
          <div className="bg-brandBlue rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-brandNavy p-4 text-white flex justify-between items-center">
              <h2 className="font-bold">Abuse Reports</h2>
              <span className="text-xs bg-brandOrange px-2 py-1 rounded-full">{abuseReports.filter(r => r.status === 'Pending').length} Pending</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-400">
                  <tr>
                    <th className="p-4 uppercase">Category</th>
                    <th className="p-4 uppercase">Description</th>
                    <th className="p-4 uppercase">Severity</th>
                    <th className="p-4 uppercase">Status</th>
                    <th className="p-4 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {abuseReports.map(report => (
                    <tr key={report.id} className="text-sm">
                      <td className="p-4">
                        <p className="font-bold text-brandNavy">{report.category}</p>
                        <p className="text-xs text-gray-500">By: {report.reportedBy}</p>
                      </td>
                      <td className="p-4 max-w-xs truncate">{report.description}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${report.severity === 'High' ? 'bg-red-100 text-red-600' :
                          report.severity === 'Medium' ? 'bg-orange-100 text-brandOrange' : 'bg-blue-100 text-blue-600'
                          }`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${report.status === 'Resolved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2">
                        {report.status !== 'Resolved' && (
                          <button onClick={() => resolveReport(report.id)} className="text-green-500 hover:text-green-600"><FaCheck /></button>
                        )}
                        <button onClick={() => deleteReport(report.id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                  {abuseReports.length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-400 italic">No abuse reports found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= PHOTO APPROVALS TAB ================= */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="bg-brandBlue rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-brandNavy p-4 text-white">
                <h2 className="font-bold">Pending Photos</h2>
              </div>
              <div className="p-6">
                {(() => {
                  const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
                  const pendingPhotos = [];

                  allUsers.forEach(user => {
                    if (user.profilePhotoStatus === 'Pending') {
                      pendingPhotos.push({
                        type: 'Profile',
                        url: user.profilePhoto,
                        userId: user.id,
                        name: user.name || user.fullName
                      });
                    }

                    if (user.otherPhotos) {
                      user.otherPhotos.forEach((photo, idx) => {
                        if (photo.status === 'Pending') {
                          pendingPhotos.push({
                            type: 'Gallery',
                            url: (typeof photo === 'string' ? photo : photo.url),
                            idx,
                            userId: user.id,
                            name: user.name || user.fullName
                          });
                        }
                      });
                    }
                  });

                  if (pendingPhotos.length === 0) return <p className="text-gray-500 italic">No photos pending approval.</p>;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pendingPhotos.map((photo, i) => (
                        <div key={i} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                          <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
                            <img src={photo.url} alt="Pending" className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }} />
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-brandNavy">{photo.name}</h3>
                            <p className="text-xs text-brandOrange font-bold uppercase">{photo.type} Photo</p>
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => {
                                  // Update global allUsers list
                                  const currentAllUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
                                  const userIdx = currentAllUsers.findIndex(u => u.id === photo.userId);

                                  if (userIdx > -1) {
                                    if (photo.type === 'Profile') {
                                      currentAllUsers[userIdx].profilePhotoStatus = 'Approved';
                                    } else {
                                      currentAllUsers[userIdx].otherPhotos[photo.idx].status = 'Approved';
                                    }
                                    localStorage.setItem("allUsers", JSON.stringify(currentAllUsers));

                                    // If this is the logged-in user's profile, update userProfile too
                                    const loggedInUser = JSON.parse(localStorage.getItem("userProfile") || "{}");
                                    if (loggedInUser.id === photo.userId) {
                                      localStorage.setItem("userProfile", JSON.stringify(currentAllUsers[userIdx]));
                                    }

                                    alert("Photo Approved!");
                                    window.location.reload();
                                  }
                                }}
                                className="flex-1 bg-green-500 text-white py-2 rounded font-bold text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  // Update global allUsers list
                                  const currentAllUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
                                  const userIdx = currentAllUsers.findIndex(u => u.id === photo.userId);

                                  if (userIdx > -1) {
                                    if (photo.type === 'Profile') {
                                      currentAllUsers[userIdx].profilePhoto = null;
                                      currentAllUsers[userIdx].profilePhotoStatus = 'Rejected';
                                    } else {
                                      currentAllUsers[userIdx].otherPhotos.splice(photo.idx, 1);
                                    }
                                    localStorage.setItem("allUsers", JSON.stringify(currentAllUsers));

                                    // If this is the logged-in user's profile, update userProfile too
                                    const loggedInUser = JSON.parse(localStorage.getItem("userProfile") || "{}");
                                    if (loggedInUser.id === photo.userId) {
                                      localStorage.setItem("userProfile", JSON.stringify(currentAllUsers[userIdx]));
                                    }

                                    alert("Photo Rejected.");
                                    window.location.reload();
                                  }
                                }}
                                className="flex-1 bg-red-500 text-white py-2 rounded font-bold text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ================= SUBSCRIPTIONS TAB ================= */}
        {activeTab === 'subscriptions' && (
          <SubscriptionManagement />
        )}

        {/* ================= SETTINGS TAB ================= */}
        {activeTab === 'settings' && currentUserRole === 'admin' && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 max-w-3xl">
            <h2 className="text-xl font-bold text-brandNavy mb-6 flex items-center gap-2">
              <FaCog className="text-brandOrange" /> General Platform Settings
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Site Title</label>
                  <input
                    name="siteTitle"
                    value={settings.siteTitle}
                    onChange={updateSettings}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-brandOrange outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Contact Email</label>
                  <input
                    name="contactEmail"
                    value={settings.contactEmail}
                    onChange={updateSettings}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-brandOrange outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Support Hotline</label>
                <input
                  name="supportPhone"
                  value={settings.supportPhone}
                  onChange={updateSettings}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-brandOrange outline-none"
                />
              </div>

              <div className="flex items-center gap-4 bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="flex-1">
                  <h4 className="font-bold text-red-800">Maintenance Mode</h4>
                  <p className="text-xs text-red-600">When enabled, users will see a maintenance message.</p>
                </div>
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={updateSettings}
                  className="w-6 h-6 accent-red-600"
                />
              </div>

              <button className="bg-brandNavy text-white font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-slate-800 transition">
                Save Changes
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* Small stat card */
const StatCard = ({ title, value, color }) => (
  <div className="bg-brandBlue p-6 rounded-xl shadow border border-gray-100 relative overflow-hidden">
    <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</p>
    <p className="text-3xl font-bold text-brandNavy mt-2">{value}</p>
  </div>
);

export default AdminDashboard;
