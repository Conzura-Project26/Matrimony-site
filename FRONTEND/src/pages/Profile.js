import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaArrowLeft, FaSignOutAlt, FaBars } from "react-icons/fa";
import EditProfile from "./EditProfile";
import PhotoGallery from "./PhotoGallery";
import DeleteProfile from "./DeleteProfile";
import MobileMenu from "../components/MobileMenu";
import UserHeader from "../components/UserHeader";


/* ================= REUSABLE CARD ================= */
const InfoCard = ({ title, children }) => (
  <div className="relative bg-brandBlue/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 overflow-hidden transition hover:shadow-xl">

    {/* Left Accent Strip */}
    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-orange-400"></div>

    {/* Card Header */}
    <div className="bg-gradient-to-r from-blue-50 to-orange-50 px-6 py-3 border-b border-blue-100">
      <h3 className="text-sm font-bold tracking-wide text-brandNavy uppercase">
        {title}
      </h3>
    </div>

    {/* Card Body */}
    <div className="p-6 grid grid-cols-2 gap-x-20 gap-y-4 text-sm">
      {children}
    </div>
  </div>
);


/* ================= MAIN PROFILE ================= */
const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("myProfile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-brandBlue">

      {/* ===== MOBILE MENU ===== */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <UserHeader setMobileMenuOpen={setMobileMenuOpen} showBack={true} />

      {/* ===== PREMIUM PROFILE HEADER ===== */}
      <div className="w-full px-4 md:px-8 lg:px-12 mt-6">
        <div className="relative bg-gradient-to-r from-brandNavy to-brandOrange rounded-3xl p-[2px] shadow-xl"></div>
        <div className="bg-brandBlue/70 backdrop-blur-xl border border-blue-200 rounded-2xl shadow-lg px-4 md:px-6 py-4 flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>

          {[
            { key: "myProfile", label: "My Profile" },
            { key: "editProfile", label: "Edit Profile" },
            { key: "gallery", label: "Photo Gallery" },
            { key: "delete", label: "Delete Profile" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`relative px-4 md:px-7 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${activeTab === item.key
                ? `
              bg-gradient-to-r from-brandOrange to-orange-600
              text-white shadow-lg scale-105
              ring-2 ring-orange-300/50
            `
                : `
              bg-brandBlue/80 backdrop-blur-md
              text-brandNavy border border-blue-200
              hover:bg-blue-50 hover:scale-105
            `
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="p-6">
        {activeTab === "myProfile" && <MyProfileSection />}
        {activeTab === "editProfile" && (
          <EditProfile setActiveTab={setActiveTab} />
        )}
        {activeTab === "gallery" && <PhotoGallery />}
        {activeTab === "delete" && <DeleteProfile />}
      </div>


    </div>
  );
};


/* ================================================================= */
/* ===================== MY PROFILE SECTION ========================= */
/* ================================================================= */

const MyProfileSection = () => {
  const [tab, setTab] = useState("personal");
  const profile = JSON.parse(localStorage.getItem("userProfile")) || {};

  const calculateAge = (dob, dobDay, dobMonth, dobYear, registerAge) => {
    if (registerAge) return registerAge;
    if (dob) {
      const birthDate = new Date(dob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      }
    }
    if (dobYear) {
      return new Date().getFullYear() - parseInt(dobYear);
    }
    return "-";
  };

  return (
    <div>

      {/* ================= TOP PROFILE CARD ================= */}
      <div className="w-full px-4 md:px-8 lg:px-12 pt-6">
        <div className="relative bg-gradient-to-r from-brandNavy to-brandOrange rounded-3xl p-[2px] shadow-xl">
          <div className="bg-brandBlue rounded-3xl p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-8 items-center">

            {/* Photo */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-orange-400 shadow-md flex-shrink-0 relative">
              {profile.profilePhoto ? (
                <>
                  <img
                    src={profile.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  {profile.profilePhotoStatus === 'Pending' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-orange-600 px-2 py-0.5 rounded">Pending Approval</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-orange-400 font-semibold">
                  Upload Photo
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-8 lg:gap-x-32 gap-y-3 md:gap-y-4 text-sm w-full">
              {[
                ["Name", profile.name || profile.fullName || "Member"],
                ["Age", calculateAge(profile.dob, profile.dobDay, profile.dobMonth, profile.dobYear, profile.age)],
                ["Date of Birth", profile.dob || (profile.dobDay && profile.dobYear ? `${profile.dobDay} ${profile.dobMonth || ""} ${profile.dobYear}` : "-")],
                ["City", profile.city || profile.workLocation || profile.birthPlace],

                ["Religion", profile.religion || "-"],
                ["Caste", profile.caste || "-"],
              ].map(([label, value], i) => (
                <p key={i} className="text-brandNavy">
                  {label} :
                  <span className="text-gray-900 font-semibold ml-1">
                    {value || "-"}
                  </span>
                </p>
              ))}
            </div>


          </div>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="w-full px-4 md:px-8 lg:px-12 flex gap-2 md:gap-4 mt-8 overflow-x-auto scrollbar-hide">
        {[
          { key: "personal", label: "Personal Information" },
          { key: "family", label: "Family & Other Information" },
          { key: "expect", label: "Partner Preference" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 md:px-7 py-2 rounded-full text-xs md:text-sm font-bold tracking-wide transition-all duration-300 whitespace-nowrap ${tab === t.key
              ? "bg-gradient-to-r from-brandOrange to-orange-600 text-white shadow-lg scale-105"
              : "bg-brandBlue text-brandNavy border border-blue-200 hover:bg-blue-50"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ================= CONTENT ================= */}
      <div className="w-full px-4 md:px-8 lg:px-12 mt-8 space-y-8 flex-1">

        {/* ---------------- PERSONAL ---------------- */}
        {tab === "personal" && (
          <>
            <InfoCard title="Personal Details">
              {[
                ["Height", profile.height && `${profile.height} cm`],
                ["Weight", profile.weight && `${profile.weight} kg`],
                ["Marital Status", profile.maritalStatus],
                ["Physical Status", profile.physicalStatus],
                ["Mother Tongue", profile.motherTongue],
              ].map(([label, value], i) => (
                <p key={i} className="text-brandNavy/70">
                  {label} :
                  <span className="text-brandNavy font-semibold ml-1">
                    {value || "-"}
                  </span>
                </p>
              ))}
            </InfoCard>

            <InfoCard title="Education Details">
              {[
                ["Highest Qualification", profile.qualification],
                ["Institution", profile.institution],
                ["Year of Passing", profile.passingYear],
              ].map(([label, value], i) => (
                <p key={i} className="text-brandNavy/70">
                  {label} :
                  <span className="text-brandNavy font-semibold ml-1">
                    {value || "-"}
                  </span>
                </p>
              ))}
            </InfoCard>

            <InfoCard title="Professional Details">
              {[
                ["Occupation", profile.occupation],
                ["Employment Type", profile.employmentType],
                ["Company", profile.companyName],
                ["Annual Income", profile.annualIncome],
                ["Work Location", profile.workLocation],
              ].map(([label, value], i) => (
                <p key={i} className="text-brandNavy/70">
                  {label} :
                  <span className="text-brandNavy font-semibold ml-1">
                    {value || "-"}
                  </span>
                </p>
              ))}
            </InfoCard>

          </>
        )}

        {/* ---------------- FAMILY ---------------- */}
        {tab === "family" && (
          <>
            <InfoCard title="Family Details">
              {[
                ["Father's Occupation", profile.fatherOccupation],
                ["Mother's Occupation", profile.motherOccupation],
                ["Brothers", profile.brothers],
                ["Sisters", profile.sisters],
                ["Family Status", profile.familyStatus],
                ["Family Values", profile.familyValues],
              ].map(([label, value], i) => (
                <p key={i} className="text-brandNavy/70">
                  {label} :
                  <span className="text-brandNavy font-semibold ml-1">
                    {value || "-"}
                  </span>
                </p>
              ))}
            </InfoCard>
            <InfoCard title="Horoscope Details">
              {[
                ["Rashi", profile.rashi],
                ["Nakshatra", profile.nakshatra],
                ["Time of Birth", profile.birthTime],
                ["Place of Birth", profile.birthPlace],
              ].map(([label, value], i) => (
                <p key={i} className="text-brandNavy/70">
                  {label} :
                  <span className="text-brandNavy font-semibold ml-1">
                    {value || "-"}
                  </span>
                </p>
              ))}
            </InfoCard>
          </>
        )}

        {/* ---------------- EXPECTATIONS ---------------- */}
        {tab === "expect" && (
          <InfoCard title="Expectations">
            {[
              ["Preferred Age Range", profile.preferredAge],
              ["Preferred Height Range", profile.preferredHeight],
              ["Religion Preference", profile.preferredReligion],
              ["Caste Preference", profile.preferredCaste],
              ["Education Preference", profile.preferredEducation],
              ["Profession Preference", profile.preferredProfession],
              ["Location Preference", profile.preferredLocation],
            ].map(([label, value], i) => (
              <p key={i} className="text-brandNavy/70">
                {label} :
                <span className="text-brandNavy font-semibold ml-1">
                  {value || "-"}
                </span>
              </p>
            ))}
          </InfoCard>
        )}
      </div>


    </div>
  );
};

export default Profile;