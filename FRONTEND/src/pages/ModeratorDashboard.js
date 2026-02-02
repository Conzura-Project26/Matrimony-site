import React, { useState } from 'react';
import { FaCheck, FaTimes, FaUsers, FaExclamationTriangle } from 'react-icons/fa';

const ModeratorDashboard = () => {
  const [reportedProfiles, setReportedProfiles] = useState([
    { id: 1, name: 'Priya Patel', reason: 'Fake profile', city: 'Mumbai', image: 'https://via.placeholder.com/100' },
    { id: 2, name: 'Anjali Sharma', reason: 'Inappropriate content', city: 'Delhi', image: 'https://via.placeholder.com/100' },
    { id: 3, name: 'Sonal Mehta', reason: 'Spam', city: 'Pune', image: 'https://via.placeholder.com/100' },
  ]);

  const handleAction = (id, action) => {
    console.log(`Profile ${id} ${action}`);
    // In real system, call backend API to approve/reject
    setReportedProfiles(prev => prev.filter(profile => profile.id !== id));
  };

  return (
    <div className="min-h-screen bg-brandBlue p-6">
      <h1 className="text-2xl font-bold text-brandNavy mb-6">Moderator Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard icon={<FaUsers />} label="Total Users" value="1500" color="orange" />
        <StatCard icon={<FaExclamationTriangle />} label="Pending Reports" value={reportedProfiles.length} color="red" />
        <StatCard icon={<FaCheck />} label="Verified Profiles" value="1200" color="blue" />
      </div>

      {/* Reported Profiles Table */}
      <div className="bg-brandBlue rounded shadow p-4">
        <h2 className="text-lg font-bold text-brandOrange mb-4">Reported Profiles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brandBlue/20">
                <th className="px-4 py-2 font-semibold">Profile</th>
                <th className="px-4 py-2 font-semibold">Reason</th>
                <th className="px-4 py-2 font-semibold">City</th>
                <th className="px-4 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportedProfiles.map(profile => (
                <tr key={profile.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 flex items-center gap-3">
                    <img src={profile.image} alt={profile.name} className="w-12 h-12 rounded-full" onError={(e) => { e.target.src = "https://via.placeholder.com/100"; }} />
                    <span className="font-medium text-brandNavy">{profile.name}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{profile.reason}</td>
                  <td className="px-4 py-2 text-gray-600">{profile.city}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleAction(profile.id, 'approved')}
                      className="flex items-center gap-1 bg-brandOrange text-white px-3 py-1 rounded hover:bg-orange-600"
                    >
                      <FaCheck /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(profile.id, 'rejected')}
                      className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      <FaTimes /> Reject
                    </button>
                  </td>
                </tr>
              ))}
              {reportedProfiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No reported profiles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ---------- Stat Card ---------- */
const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    orange: 'bg-orange-100 text-brandOrange',
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <div className={`flex items-center gap-4 p-4 rounded shadow ${colors[color]}`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default ModeratorDashboard;
