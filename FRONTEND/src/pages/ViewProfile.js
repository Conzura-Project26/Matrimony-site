import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHeart, FaStar, FaBookmark, FaMapMarkerAlt, FaGraduationCap, FaBriefcase, FaUser, FaPhoneAlt, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import UserHeader from '../components/UserHeader';
import MobileMenu from '../components/MobileMenu';

// Mock Database (Import or redefine if shared)
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

const ViewProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Real-time Lists/Interests
    const [interests, setInterests] = useState(() => JSON.parse(localStorage.getItem("userInterests") || '{"sent":[]}'));
    const [shortlisted, setShortlisted] = useState(() => JSON.parse(localStorage.getItem("shortlistedProfiles") || "[]"));
    const [savedProfiles, setSavedProfiles] = useState(() => JSON.parse(localStorage.getItem("savedProfiles") || "[]"));

    useEffect(() => {
        // Combine all available users for searching
        const allGlobal = JSON.parse(localStorage.getItem("allUsers") || "[]");
        const combined = [...allGlobal, ...MOCK_DB_PROFILES];

        // Find the profile, handling both string and number IDs
        const found = combined.find(p => String(p.id) === String(id));
        setProfile(found);
    }, [id]);

    useEffect(() => {
        localStorage.setItem("userInterests", JSON.stringify(interests));
    }, [interests]);

    useEffect(() => {
        localStorage.setItem("shortlistedProfiles", JSON.stringify(shortlisted));
    }, [shortlisted]);

    useEffect(() => {
        localStorage.setItem("savedProfiles", JSON.stringify(savedProfiles));
    }, [savedProfiles]);

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brandBlue">
                <div className="text-center">
                    <p className="text-gray-500 mb-4 text-lg">Profile not found</p>
                    <button onClick={() => navigate(-1)} className="text-brandOrange font-bold hover:underline">Go Back</button>
                </div>
            </div>
        );
    }

    const isInterestSent = interests.sent?.some(p => String(p.id) === String(profile.id));
    const isShortlisted = shortlisted.some(p => String(p.id) === String(profile.id));
    const isSaved = savedProfiles.some(p => String(p.id) === String(profile.id));

    const handleConnect = () => {
        if (!isInterestSent) {
            const newInterests = {
                ...interests,
                sent: [...(interests.sent || []), { ...profile, sentDate: new Date().toLocaleDateString() }]
            };
            setInterests(newInterests);
            alert("Interest sent successfully!");
        }
    };

    const handleShortlist = () => {
        if (!isShortlisted) {
            setShortlisted([...shortlisted, profile]);
        } else {
            setShortlisted(shortlisted.filter(p => String(p.id) !== String(profile.id)));
        }
    };

    const handleSave = () => {
        if (!isSaved) {
            setSavedProfiles([...savedProfiles, profile]);
        } else {
            setSavedProfiles(savedProfiles.filter(p => String(p.id) !== String(profile.id)));
        }
    };

    return (
        <div className="min-h-screen bg-brandBlue pb-12">
            <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
            <UserHeader setMobileMenuOpen={setMobileMenuOpen} showBack={true} />

            <main className="container mx-auto px-4 md:px-6 pt-8">
                <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">

                    {/* Left: Sticky Image & Quick Actions */}
                    <div className="lg:w-1/3 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-brandBlue rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative"
                        >
                            <img
                                src={profile.image || profile.profilePhoto || `https://randomuser.me/api/portraits/${profile.gender === 'Male' ? 'men' : 'women'}/${profile.id}.jpg`}
                                alt={profile.name}
                                className="w-full h-[400px] object-cover"
                            />
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                <button
                                    onClick={handleShortlist}
                                    className={`p-3 rounded-full shadow-lg backdrop-blur-md transition ${isShortlisted ? 'bg-brandOrange text-white' : 'bg-white/80 text-gray-600'}`}
                                >
                                    <FaStar />
                                </button>
                                <button
                                    onClick={handleSave}
                                    className={`p-3 rounded-full shadow-lg backdrop-blur-md transition ${isSaved ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-600'}`}
                                >
                                    <FaBookmark />
                                </button>
                            </div>
                        </motion.div>

                        <button
                            onClick={handleConnect}
                            disabled={isInterestSent}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all
               ${isInterestSent
                                    ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-brandOrange to-orange-700 text-white hover:scale-[1.02] shadow-orange-200'}`}
                        >
                            <FaHeart className={isInterestSent ? '' : 'animate-pulse'} />
                            {isInterestSent ? 'Interest Already Sent' : 'Send Interest / Connect'}
                        </button>
                    </div>

                    {/* Right: Details Section */}
                    <div className="lg:w-2/3 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-brandBlue rounded-3xl shadow-xl p-8 border border-gray-100"
                        >
                            {/* Profile Main Header */}
                            <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
                                <div>
                                    <h2 className="text-3xl font-bold text-brandNavy flex items-center gap-3">
                                        {profile.name} <span className="text-xl font-normal text-gray-400">({profile.id})</span>
                                    </h2>
                                    <div className="flex flex-wrap gap-4 mt-3">
                                        <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                                            <FaUser className="text-orange-500" /> {profile.age} Years, {profile.height || "Height N/A"}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                                            <FaMapMarkerAlt className="text-orange-500" /> {profile.city}, {profile.workLocation || ""}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-orange-50 text-brandOrange px-4 py-2 rounded-full font-bold text-sm">
                                        {profile.adminStatus || "Premium Member"}
                                    </div>
                                </div>
                            </div>

                            {/* About Me */}
                            <section className="mb-10">
                                <h3 className="text-xl font-bold text-brandNavy mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-brandOrange rounded-full"></div>
                                    About My Life
                                </h3>
                                <p className="text-gray-600 leading-relaxed italic">
                                    "{profile.about || "This member is waiting to be introduced... They value family traditions and looking for someone with similar life values."}"
                                </p>
                            </section>

                            {/* Grid Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Personal Information */}
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h4 className="font-bold text-brandNavy mb-5 flex items-center gap-2">
                                        <FaUser className="text-orange-500" /> Basic Details
                                    </h4>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className="font-semibold">{profile.gender || "Female"}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Religion</span><span className="font-semibold">{profile.religion || "Hindu"}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Caste</span><span className="font-semibold">{profile.caste || "Brahmin"}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Mother Tongue</span><span className="font-semibold">{profile.motherTongue || "Hindi"}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Weight</span><span className="font-semibold">{profile.weight || "N/A"}</span></div>
                                    </div>
                                </div>

                                {/* Professional Info */}
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h4 className="font-bold text-brandNavy mb-5 flex items-center gap-2">
                                        <FaBriefcase className="text-orange-500" /> Education & Career
                                    </h4>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-gray-500">Qualification</span>
                                            <span className="font-semibold text-right">{profile.education || profile.qualification || "Post Graduate"}</span>
                                        </div>
                                        <div className="flex justify-between"><span className="text-gray-500">Occupation</span><span className="font-semibold">{profile.occupation || "Service"}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Annual Income</span><span className="font-semibold">{profile.income || profile.annualIncome || "8-10 LPA"}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Work Status</span><span className="font-semibold">Professional</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Horoscope & Lifestyle */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100/50">
                                    <h4 className="font-bold text-brandNavy mb-5">Horoscope Details</h4>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">Rashi</span><span className="font-semibold">{profile.rashi || "Kanya"}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Nakshatra</span><span className="font-semibold">{profile.nakshatra || "Chitra"}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Manglik</span><span className="font-semibold">No</span></div>
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50">
                                    <h4 className="font-bold text-brandNavy mb-5">Contact Details</h4>
                                    <div className="space-y-4 text-sm">
                                        <p className="text-xs text-gray-500 mb-2">Connect to unlock contact details</p>
                                        <div className="flex items-center gap-3 text-gray-400 blur-[3px] select-none">
                                            <FaPhoneAlt size={12} /> +91 XXXXX XXXXX
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-400 blur-[3px] select-none">
                                            <FaEnvelope size={12} /> members@sarvvivah.com
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default ViewProfile;
