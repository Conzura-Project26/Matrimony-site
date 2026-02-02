import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaArrowLeft, FaSignOutAlt, FaStar, FaBookmark, FaBars } from "react-icons/fa";
import MobileMenu from "../components/MobileMenu";
import UserHeader from "../components/UserHeader";

// Mock profiles database
const profiles = [
  { id: 1, name: "Arjun Sharma", age: 28, gender: "Male", caste: "Brahmin", community: "Hindu", city: "Delhi", state: "Delhi", country: "India", height: 170, birthYear: 1996, income: 1500000, education: "B.Tech", occupation: "Software Engineer", image: "https://images.unsplash.com/photo-1614289371518-722f2615943d?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 2, name: "Sneha Reddy", age: 24, gender: "Female", caste: "Reddy", community: "Hindu", city: "Hyderabad", state: "Telangana", country: "India", height: 162, birthYear: 2000, income: 1200000, education: "MBA", occupation: "Marketing Manager", image: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 3, name: "Vikram Malhotra", age: 29, gender: "Male", caste: "Kshatriya", community: "Hindu", city: "Mumbai", state: "Maharashtra", country: "India", height: 180, birthYear: 1995, income: 1800000, education: "B.Des", occupation: "Graphic Designer", image: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 4, name: "Priya Patel", age: 25, gender: "Female", caste: "Vaishya", community: "Hindu", city: "Ahmedabad", state: "Gujarat", country: "India", height: 165, birthYear: 1999, income: 2000000, education: "MBBS", occupation: "Doctor", image: "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 5, name: "Rahul Verma", age: 30, gender: "Male", caste: "Kayastha", community: "Hindu", city: "Lucknow", state: "Uttar Pradesh", country: "India", height: 175, birthYear: 1994, income: 1400000, education: "M.Tech", occupation: "IT Consultant", image: "https://images.unsplash.com/photo-1630138255230-0856006f6630?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 6, name: "Meera Iyer", age: 26, gender: "Female", caste: "Brahmin", community: "Hindu", city: "Chennai", state: "Tamil Nadu", country: "India", height: 160, birthYear: 1998, income: 1600000, education: "B.Arch", occupation: "Architect", image: "https://images.unsplash.com/photo-1610030469668-935142b96fe1?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 7, name: "Siddharth Goel", age: 27, gender: "Male", caste: "Aggarwal", community: "Hindu", city: "Gurgaon", state: "Haryana", country: "India", height: 178, birthYear: 1997, income: 2500000, education: "MS Data Science", occupation: "Data Scientist", image: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 8, name: "Anjali Gupta", age: 23, gender: "Female", caste: "Bania", community: "Hindu", city: "Indore", state: "Madhya Pradesh", country: "India", height: 158, birthYear: 2001, income: 700000, education: "BA English", occupation: "Content Writer", image: "https://images.unsplash.com/photo-1610030469915-d4924c80338a?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 9, name: "Rohan Das", age: 31, gender: "Male", caste: "Kayastha", community: "Hindu", city: "Kolkata", state: "West Bengal", country: "India", height: 172, birthYear: 1993, income: 1200000, education: "B.Com", occupation: "Banker", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 10, name: "Kavita Nair", age: 26, gender: "Female", caste: "Nair", community: "Hindu", city: "Kochi", state: "Kerala", country: "India", height: 164, birthYear: 1998, income: 1000000, education: "MBA HR", occupation: "HR Professional", image: "https://images.unsplash.com/photo-1630807033100-8f3a3a109a90?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 11, name: "Kabir Khan", age: 28, gender: "Male", caste: "Sunni", community: "Muslim", city: "Bhopal", state: "Madhya Pradesh", country: "India", height: 175, birthYear: 1996, income: 1100000, education: "HM", occupation: "Chef", image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 12, name: "Ishani Bose", age: 25, gender: "Female", caste: "Kayastha", community: "Hindu", city: "Kolkata", state: "West Bengal", country: "India", height: 160, birthYear: 1999, income: 900000, education: "B.Des", occupation: "Fashion Designer", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 13, name: "Manish Pandey", age: 32, gender: "Male", caste: "Brahmin", community: "Hindu", city: "Varanasi", state: "Uttar Pradesh", country: "India", height: 170, birthYear: 1992, income: 800000, education: "PhD", occupation: "Professor", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 14, name: "Riya Sen", age: 24, gender: "Female", caste: "Kayastha", community: "Hindu", city: "Guwahati", state: "Assam", country: "India", height: 158, birthYear: 2000, income: 600000, education: "MA", occupation: "Dancer", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 15, name: "Rajesh Khanna", age: 30, gender: "Male", caste: "Khatri", community: "Hindu", city: "Chandigarh", state: "Punjab", country: "India", height: 178, birthYear: 1994, income: 2000000, education: "IAS", occupation: "Civil Servant", image: "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 16, name: "Zoya Akhtar", age: 27, gender: "Female", caste: "Shia", community: "Muslim", city: "Hyderabad", state: "Telangana", country: "India", height: 162, birthYear: 1997, income: 1500000, education: "MA Creative Writing", occupation: "Writer", image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 17, name: "Sukhwinder Singh", age: 29, gender: "Male", caste: "Sikh", community: "Sikh", city: "Amritsar", state: "Punjab", country: "India", height: 182, birthYear: 1995, income: 3000000, education: "BBA", occupation: "Entrepreneur", image: "https://images.unsplash.com/photo-1533227268408-a574a2ca315a?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 18, name: "Pooja Hegde", age: 26, gender: "Female", caste: "Maratha", community: "Hindu", city: "Pune", state: "Maharashtra", country: "India", height: 168, birthYear: 1998, income: 5000000, education: "Commercial Pilot License", occupation: "Pilot", image: "https://images.unsplash.com/photo-1531746020798-e795c5399c97?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 19, name: "Aditya Roy", age: 30, gender: "Male", caste: "Rajput", community: "Hindu", city: "Dehradun", state: "Uttarakhand", country: "India", height: 180, birthYear: 1994, income: 1800000, education: "LLB", occupation: "Lawyer", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=500&auto=format&fit=crop" },
  { id: 20, name: "Tara Sutaria", age: 25, gender: "Female", caste: "Parsi", community: "Other", city: "Mumbai", state: "Maharashtra", country: "India", height: 163, birthYear: 1999, income: 2500000, education: "B.Mus", occupation: "Singer", image: "https://images.unsplash.com/photo-1567532939604-b6c5b0ad2e01?q=80&w=400&h=500&auto=format&fit=crop" }
];

export default function SearchMatch() {
  const navigate = useNavigate();

  // Load initial state from localStorage
  const [activeTab, setActiveTab] = useState("basic");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Intelligent Gender Default based on user profile
  const [gender, setGender] = useState(() => {
    const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const userGender = userProfile.gender || "Male";
    return userGender === "Male" ? "Female" : "Male";
  });

  const [shortlisted, setShortlisted] = useState(() => {
    const saved = localStorage.getItem("shortlistedProfiles");
    return saved ? JSON.parse(saved) : [];
  });
  const [savedProfiles, setSavedProfiles] = useState(() => {
    const saved = localStorage.getItem("savedProfiles");
    return saved ? JSON.parse(saved) : [];
  });
  const [interests, setInterests] = useState(() => {
    const saved = localStorage.getItem("userInterests");
    return saved ? JSON.parse(saved) : { received: [], sent: [], accepted: [], declined: [] };
  });
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    // Show some initial profiles based on gender default
    const filtered = profiles.filter(p => !gender || p.gender === gender);
    setSearchResults(filtered);
  }, [activeTab, gender]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("shortlistedProfiles", JSON.stringify(shortlisted));
  }, [shortlisted]);

  useEffect(() => {
    localStorage.setItem("savedProfiles", JSON.stringify(savedProfiles));
  }, [savedProfiles]);

  useEffect(() => {
    localStorage.setItem("userInterests", JSON.stringify(interests));
  }, [interests]);



  const addToShortlist = (profile) => {
    if (!shortlisted.find(p => p.id === profile.id)) {
      setShortlisted([...shortlisted, profile]);
    }
  };

  const addToSaved = (profile) => {
    if (!savedProfiles.find(p => p.id === profile.id)) {
      setSavedProfiles([...savedProfiles, profile]);
    }
  };

  const sendInterest = (profile) => {
    if (!interests.sent.find((p) => p.id === profile.id)) {
      const newSent = [...interests.sent, { ...profile, status: 'pending', sentDate: new Date().toLocaleDateString() }];
      setInterests({ ...interests, sent: newSent });

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

  const removeFromShortlist = (id) => {
    setShortlisted(shortlisted.filter(p => p.id !== id));
  };

  const removeFromSaved = (id) => {
    setSavedProfiles(savedProfiles.filter(p => p.id !== id));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-brandBlue">

      {/* ===== MOBILE MENU ===== */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <header className="hidden">Mock for logout to keep logic if needed, but UserHeader handles it</header>
      <UserHeader setMobileMenuOpen={setMobileMenuOpen} showBack={true} />

      {/* Main Content */}
      <div className="container mx-auto p-6">

        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-brandNavy mb-2">Search Matches</h2>
          <p className="text-gray-600">Find your perfect life partner</p>
        </div>

        {/* Tabs */}
        <div className="bg-brandBlue rounded-2xl shadow-md p-2 flex flex-wrap gap-2 mb-8 border border-gray-100">
          {[
            { id: "basic", label: "Basic Search" },
            { id: "advance", label: "Advanced Search" },
            { id: "caste", label: "Caste Search" },
            { id: "community", label: "Community Search" },
            { id: "shortlist", label: "Saved & Shortlisted" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all
                ${activeTab === tab.id
                  ? "bg-gradient-to-r from-brandOrange to-brandNavy text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-brandBlue rounded-2xl shadow-lg p-8 min-h-[400px]">

          {/* Basic Search */}
          {activeTab === "basic" && (
            <BasicSearchUI profiles={profiles} setSearchResults={setSearchResults} />
          )}

          {activeTab === "basic" && searchResults.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((p) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  addToShortlist={addToShortlist}
                  shortlisted={shortlisted}
                  addToSaved={addToSaved}
                  savedProfiles={savedProfiles}
                  sendInterest={sendInterest}
                  interests={interests}
                />
              ))}
            </div>
          )}

          {/* Advanced Search */}
          {activeTab === "advance" && (
            <AdvanceSearchUI profiles={profiles} setSearchResults={setSearchResults} />
          )}

          {activeTab === "advance" && searchResults.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((p) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  addToShortlist={addToShortlist}
                  shortlisted={shortlisted}
                  addToSaved={addToSaved}
                  savedProfiles={savedProfiles}
                  sendInterest={sendInterest}
                  interests={interests}
                />
              ))}
            </div>
          )}

          {/* Caste Search */}
          {activeTab === "caste" && (
            <CasteSearchUI profiles={profiles} setSearchResults={setSearchResults} />
          )}

          {activeTab === "caste" && searchResults.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((p) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  addToShortlist={addToShortlist}
                  shortlisted={shortlisted}
                  addToSaved={addToSaved}
                  savedProfiles={savedProfiles}
                  sendInterest={sendInterest}
                  interests={interests}
                />
              ))}
            </div>
          )}

          {/* Community Search */}
          {activeTab === "community" && (
            <CommunitySearchUI profiles={profiles} setSearchResults={setSearchResults} />
          )}

          {activeTab === "community" && searchResults.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((p) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  addToShortlist={addToShortlist}
                  shortlisted={shortlisted}
                  addToSaved={addToSaved}
                  savedProfiles={savedProfiles}
                  sendInterest={sendInterest}
                  interests={interests}
                />
              ))}
            </div>
          )}

          {/* Shortlisted */}
          {activeTab === "shortlist" && (
            <ShortlistedUI
              shortlisted={shortlisted}
              savedProfiles={savedProfiles}
              removeFromShortlist={removeFromShortlist}
              removeFromSaved={removeFromSaved}
              sendInterest={sendInterest}
              interests={interests}
            />
          )}

        </div>
      </div>
    </div>
  );
}

// ================= BASIC SEARCH UI =================
function BasicSearchUI({ profiles, setSearchResults }) {
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [caste, setCaste] = useState("");
  const [city, setCity] = useState("");

  const handleSearch = () => {
    let results = profiles;
    if (gender) results = results.filter(p => p.gender === gender);
    if (age) results = results.filter(p => p.age === parseInt(age));
    if (caste) results = results.filter(p => p.caste === caste);
    if (city) results = results.filter(p => p.city.toLowerCase().includes(city.toLowerCase()));
    setSearchResults(results);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-brandNavy mb-4">Basic Search</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <select
          className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">Select Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>

        <select
          className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        >
          <option value="">Select Age</option>
          {Array.from({ length: 43 }, (_, i) => 18 + i).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <input
          className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <select
          className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          value={caste}
          onChange={(e) => setCaste(e.target.value)}
        >
          <option value="">Select Caste</option>
          <option>Brahmin</option>
          <option>Kshatriya</option>
          <option>Vaishya</option>
          <option>Kayastha</option>
          <option>Reddy</option>
          <option>Patel</option>
          <option>Nair</option>
          <option>Rajput</option>
        </select>
      </div>

      <button
        onClick={handleSearch}
        className="w-full bg-gradient-to-r from-brandOrange to-brandNavy text-white font-bold py-3 rounded-lg hover:shadow-lg transition"
      >
        Search
      </button>
    </div>
  );
}

// ================= ADVANCED SEARCH UI =================
function AdvanceSearchUI({ profiles, setSearchResults }) {
  const [filters, setFilters] = useState({
    gender: "", minAge: "", maxAge: "", minHeight: "", maxHeight: "",
    minIncome: "", maxIncome: "", education: "", occupation: ""
  });

  const handleSearch = () => {
    let results = profiles;
    if (filters.gender) results = results.filter(p => p.gender === filters.gender);
    if (filters.minAge) results = results.filter(p => p.age >= parseInt(filters.minAge));
    if (filters.maxAge) results = results.filter(p => p.age <= parseInt(filters.maxAge));
    if (filters.minHeight) results = results.filter(p => p.height >= parseInt(filters.minHeight));
    if (filters.maxHeight) results = results.filter(p => p.height <= parseInt(filters.maxHeight));
    if (filters.minIncome) results = results.filter(p => p.income >= parseInt(filters.minIncome));
    if (filters.maxIncome) results = results.filter(p => p.income <= parseInt(filters.maxIncome));
    if (filters.education) results = results.filter(p => p.education.toLowerCase().includes(filters.education.toLowerCase()));
    if (filters.occupation) results = results.filter(p => p.occupation.toLowerCase().includes(filters.occupation.toLowerCase()));
    setSearchResults(results);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-brandNavy mb-4">Advanced Search</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <select className="border border-gray-300 rounded-lg px-4 py-3" value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}>
          <option value="">Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>

        <input className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Min Age" type="number" value={filters.minAge} onChange={(e) => setFilters({ ...filters, minAge: e.target.value })} />
        <input className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Max Age" type="number" value={filters.maxAge} onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })} />

        <input className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Min Height (cm)" type="number" value={filters.minHeight} onChange={(e) => setFilters({ ...filters, minHeight: e.target.value })} />
        <input className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Max Height (cm)" type="number" value={filters.maxHeight} onChange={(e) => setFilters({ ...filters, maxHeight: e.target.value })} />

        <input className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Min Income" type="number" value={filters.minIncome} onChange={(e) => setFilters({ ...filters, minIncome: e.target.value })} />
        <input className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Max Income" type="number" value={filters.maxIncome} onChange={(e) => setFilters({ ...filters, maxIncome: e.target.value })} />

        <input className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Education" value={filters.education} onChange={(e) => setFilters({ ...filters, education: e.target.value })} />
        <input className="border border-gray-300 rounded-lg px-4 py-3" placeholder="Occupation" value={filters.occupation} onChange={(e) => setFilters({ ...filters, occupation: e.target.value })} />
      </div>

      <button onClick={handleSearch} className="w-full bg-gradient-to-r from-brandOrange to-brandNavy text-white font-bold py-3 rounded-lg hover:shadow-lg transition">
        Advanced Search
      </button>
    </div>
  );
}

// ================= CASTE SEARCH UI =================
function CasteSearchUI({ profiles, setSearchResults }) {
  const [caste, setCaste] = useState("");

  const handleSearch = () => {
    if (caste) {
      setSearchResults(profiles.filter(p => p.caste === caste));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-brandNavy mb-4">Search by Caste</h3>

      <select className="w-full border border-gray-300 rounded-lg px-4 py-3" value={caste} onChange={(e) => setCaste(e.target.value)}>
        <option value="">Select Caste</option>
        <option>Brahmin</option>
        <option>Kshatriya</option>
        <option>Vaishya</option>
        <option>Kayastha</option>
        <option>Reddy</option>
        <option>Patel</option>
        <option>Nair</option>
        <option>Rajput</option>
      </select>

      <button onClick={handleSearch} className="w-full bg-gradient-to-r from-brandOrange to-brandNavy text-white font-bold py-3 rounded-lg hover:shadow-lg transition">
        Search by Caste
      </button>
    </div>
  );
}

// ================= COMMUNITY SEARCH UI =================
function CommunitySearchUI({ profiles, setSearchResults }) {
  const [community, setCommunity] = useState("");

  const handleSearch = () => {
    if (community) {
      setSearchResults(profiles.filter(p => p.community === community));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-brandNavy mb-4">Search by Community</h3>

      <select className="w-full border border-gray-300 rounded-lg px-4 py-3" value={community} onChange={(e) => setCommunity(e.target.value)}>
        <option value="">Select Community</option>
        <option>Hindu</option>
        <option>Muslim</option>
        <option>Christian</option>
        <option>Sikh</option>
        <option>Jain</option>
        <option>Buddhist</option>
      </select>

      <button onClick={handleSearch} className="w-full bg-gradient-to-r from-brandOrange to-brandNavy text-white font-bold py-3 rounded-lg hover:shadow-lg transition">
        Search by Community
      </button>
    </div>
  );
}

// ================= PROFILE CARD =================
function ProfileCard({ profile, addToShortlist, shortlisted, addToSaved, savedProfiles, sendInterest, interests }) {
  const isShortlisted = shortlisted.find(p => p.id === profile.id);
  const isSaved = savedProfiles.find(p => p.id === profile.id);
  const isInterestSent = interests?.sent?.find(p => p.id === profile.id);

  return (
    <div className="bg-brandBlue rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition border border-gray-100">
      <div className="h-64 overflow-hidden relative">
        <img
          src={profile.image}
          alt={profile.name}
          className={`w-full h-full object-cover transition-all duration-500 ${profile.photoPrivacy === 'Hidden' ? 'blur-2xl' : profile.photoPrivacy === 'Visible to Connected Members Only' ? 'blur-md' : ''}`}
        />
        {profile.photoPrivacy === 'Hidden' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
            <span className="text-white text-xs font-bold text-center bg-black/60 px-3 py-2 rounded-lg backdrop-blur-sm">Photo Hidden by User</span>
          </div>
        )}
        {profile.photoPrivacy === 'Visible to Connected Members Only' && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center p-4">
            <span className="text-white text-[10px] font-bold text-center bg-brandNavy/80 px-2 py-1 rounded backdrop-blur-sm">Connect to View Photo</span>
          </div>
        )}
        {profile.status === 'Pending' && (
          <div className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase">
            Pending Approval
          </div>
        )}
      </div>

      <div className="p-6 space-y-3">
        <h3 className="text-xl font-bold text-brandNavy">{profile.name}, {profile.age}</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Caste:</strong> {profile.caste}</p>
          <p><strong>City:</strong> {profile.city}</p>
          <p><strong>Occupation:</strong> {profile.occupation}</p>
          <p><strong>Education:</strong> {profile.education}</p>
        </div>

        <div className="flex flex-col gap-2 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => addToShortlist(profile)}
              disabled={isShortlisted}
              className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${isShortlisted
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-brandOrange to-orange-700 text-white hover:shadow-lg"
                }`}
            >
              <FaStar /> {isShortlisted ? "Shortlisted" : "Shortlist"}
            </button>

            <button
              onClick={() => addToSaved(profile)}
              disabled={isSaved}
              className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${isSaved
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg"
                }`}
            >
              <FaBookmark /> {isSaved ? "Saved" : "Save"}
            </button>
          </div>

          <button
            onClick={() => sendInterest(profile)}
            disabled={isInterestSent}
            className={`w-full py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${isInterestSent
              ? "bg-green-100 text-green-600 cursor-not-allowed"
              : "bg-brandNavy text-white hover:bg-black shadow-md"
              }`}
          >
            <FaHeart /> {isInterestSent ? "Interest Sent" : "Send Interest"}
          </button>

          <Link
            to={`/view-profile/${profile.id}`}
            className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 font-semibold text-sm hover:bg-gray-50 transition text-center"
          >
            View Full Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

// ================= SHORTLISTED UI =================
function ShortlistedUI({ shortlisted, savedProfiles, removeFromShortlist, removeFromSaved, sendInterest, interests }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-brandNavy mb-4">Shortlisted Profiles ({shortlisted.length})</h3>
        {shortlisted.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shortlisted.map(p => (
              <div key={p.id} className="bg-brandBlue rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="h-48 overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-3">
                  <h4 className="font-bold text-brandNavy">{p.name}</h4>
                  <p className="text-xs text-gray-500">{p.city} | {p.occupation}</p>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => sendInterest(p)}
                      disabled={interests?.sent?.find(i => i.id === p.id)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${interests?.sent?.find(i => i.id === p.id)
                        ? "bg-green-100 text-green-600"
                        : "bg-brandOrange text-white"
                        }`}
                    >
                      <FaHeart /> {interests?.sent?.find(i => i.id === p.id) ? "Interest Sent" : "Send Interest"}
                    </button>
                    <button
                      onClick={() => removeFromShortlist(p.id)}
                      className="w-full py-2 rounded-lg border border-red-500 text-red-500 text-xs font-bold hover:bg-red-50 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No profiles shortlisted yet.</p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-brandNavy mb-4">Saved Profiles ({savedProfiles.length})</h3>
        {savedProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProfiles.map(p => (
              <div key={p.id} className="bg-brandBlue rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="h-48 overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-3">
                  <h4 className="font-bold text-brandNavy">{p.name}</h4>
                  <p className="text-xs text-gray-500">{p.city} | {p.occupation}</p>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => sendInterest(p)}
                      disabled={interests?.sent?.find(i => i.id === p.id)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${interests?.sent?.find(i => i.id === p.id)
                        ? "bg-green-100 text-green-600"
                        : "bg-brandOrange text-white shadow-md hover:scale-105 active:scale-95 transition"
                        }`}
                    >
                      <FaHeart /> {interests?.sent?.find(i => i.id === p.id) ? "Interest Sent" : "Send Interest"}
                    </button>
                    <button
                      onClick={() => removeFromSaved(p.id)}
                      className="w-full py-2 rounded-lg border border-red-500 text-red-500 text-xs font-bold hover:bg-red-50 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No profiles saved yet.</p>
        )}
      </div>
    </div>
  );
}
