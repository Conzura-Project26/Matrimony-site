import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import RotatingTagline from '../components/RotatingTagline';
import { FaCheckCircle, FaSpinner, FaExchangeAlt, FaUserCheck, FaRupeeSign, FaHandshake, FaGlobe, FaShieldAlt, FaClock, FaDesktop, FaSearch, FaEnvelopeOpenText, FaUser, FaArrowRight } from 'react-icons/fa';

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const Home = () => {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      dobDay: "",
      dobMonth: "",
      dobYear: ""
    }
  });

  const [step, setStep] = useState(1); // 1: Form, 2: Verification, 3: Success
  const [verificationData, setVerificationData] = useState(null);

  // Watch DOB fields for age calculation
  const dobDay = watch("dobDay");
  const dobMonth = watch("dobMonth");
  const dobYear = watch("dobYear");

  const calculateAge = () => {
    if (!dobDay || !dobMonth || !dobYear) return null;
    const year = parseInt(dobYear);
    if (isNaN(year)) return null;
    const today = new Date();
    let age = today.getFullYear() - year;
    return age > 0 ? age : null;
  };

  const age = calculateAge();

  const onSubmit = (data) => {
    if (data.password !== data.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setVerificationData(data);
    setStep(2); // Move to Verification Step
  };

  const handleFinalSubmit = () => {
    const data = verificationData;
    const userProfile = {
      ...data,
      password: data.password, // Store as plain text to match Register.js and dataService expectations
      age: age,
      dob: `${data.dobYear}-${data.dobMonth}-${data.dobDay}`,
      id: "OM" + (data.mobile ? data.mobile.slice(-4) : Math.floor(1000 + Math.random() * 9000)) + "X",
      adminStatus: "Pending",
      registrationDate: new Date().toISOString(),
      role: "user"
    };

    localStorage.setItem("registerData", JSON.stringify(data));
    localStorage.setItem("userProfile", JSON.stringify(userProfile));
    localStorage.setItem("role", "user"); // Log the user in for current session
    localStorage.setItem("token", "mock_token_" + Date.now()); // Add mock token

    const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
    allUsers.push(userProfile);
    localStorage.setItem("allUsers", JSON.stringify(allUsers));

    setStep(3); // Success Step
    setTimeout(() => {
      navigate("/create-profile", { state: data });
    }, 3000);
  };

  const titles = ['Mr.', 'Ms.', 'CA', 'Dr.', 'Prof', 'Shri.', 'Smt.'];
  const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
  const castes = [
    'Brahmin',
    'Kshatriya',
    'Vaishya',
    'Kayastha',
    'Scheduled Caste (SC)',
    'Scheduled Tribe (ST)',
    'Maratha',
    'Reddy',
    'Nair',
    'Ezhava',
    'Gowda',
    'Yadav',
    'Jat',
    'Rajput',
    'Naidu',
    'Kamma',
    'Kurmi',
    'Lingayat',
    'Vellalar',
    'Mudaliar',
    'Pillai',
    'Vanniyar',
    'Aggarwal',
    'Arora',
    'Khatri',
    'Bania', 'Sunni',
    'Shia',
    'Ahmadiyya',
    'Bohra',
    'Khoja',
    'Ansari',
    'Qureshi',
    'Sheikh',
    'Syed',
    'Pathan',
    'Mughal',
    'Rajput Muslim',
    'Jat Muslim', 'Roman Catholic',
    'Protestant',
    'Orthodox',
    'Pentecostal',
    'Church of South India (CSI)',
    'Church of North India (CNI)',
    'Jacobite',
    'Marthoma',
    'Latin Catholic',
    'Syrian Catholic',
    'Knanaya',
    'Anglo Indian', 'Jat Sikh',
    'Ramgarhia',
    'Saini',
    'Labana',
    'Ramdasia',
    'Mazhabhi',
    'Bhatia',
    'Bhapa', 'Mahayana',
    'Theravada',
    'Vajrayana',
    'Neo-Buddhist',
    'Ambedkarite', 'Digambara',
    'Svetambara',
    'Agarwal',
    'Porwal',
    'Oswal',
    'Jaiswal',
    'Khandelwal', 'Zoroastrian',
    'Irani',
    'Conservative',
    'Reform', 'No Caste',
    'Not Applicable',
    'Other'
  ];

  const profiles = ['Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend'];
  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Parsi', 'Jain', 'Buddhist', 'Jewish', 'No Religion', 'Spiritual', 'Other'];
  const motherTongues = ['Hindi', 'English', 'Marathi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Gujarati', 'Punjabi', 'Urdu', 'Other'];

  return (
    <div className="min-h-screen relative overflow-x-hidden">

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />


      <section id="hero-premium" className="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden">

        {/* Background Image - Full Screen Cinematic */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-hands-new.png?v=3"
            alt="Royal Wedding Hands"
            loading="eager"
            className="w-full h-full object-cover object-[center_35%]"
          />
          {/* Blue Sky Gradient Overlay - Clean & Light */}
          <div className="absolute inset-0 bg-gradient-to-b from-brandBlue/10 via-transparent to-brandNavy/30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
        </div>

        {/* Top Floating Header (Centered Vertically Now) */}
        <div className="relative z-10 text-center w-full max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white tracking-wide drop-shadow-2xl" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 4px 15px rgba(0,0,0,0.6)' }}>
              SARV <span className="text-4xl lg:text-6xl align-middle mx-2 text-brandGold border border-white/40 rounded-full p-2 lg:p-3 relative -top-2">❤</span> VIVAH
            </h1>
            <div className="flex items-center justify-center gap-6 mt-8">
              <div className="hidden md:block h-px w-32 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              <span className="text-white/90 uppercase tracking-[0.4em] text-[10px] md:text-sm font-medium shadow-sm">One Platform. All Castes. One Life Partner.</span>
              <div className="hidden md:block h-px w-32 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            </div>

            {/* Main CTA Triggers */}
            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">

              {/* Register Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setStep(1); setIsRegisterOpen(true); }} // Reset to step 1 on open
                className="bg-brandGold text-brandNavy border border-brandGold px-10 py-4 rounded-full font-serif font-bold tracking-widest hover:bg-white hover:border-white transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)] uppercase text-xs md:text-sm group flex items-center gap-3"
              >
                <span>Register Free</span>
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>

              {/* Login Button - NOW VISIBLE ALSO */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-white/10 backdrop-blur-md border border-white/40 text-white px-10 py-4 rounded-full font-serif font-bold tracking-widest hover:bg-white/20 transition-all shadow-lg uppercase text-xs md:text-sm flex items-center gap-3"
              >
                <FaUser />
                <span>Member Login</span>
              </motion.button>
            </div>

            <div className="mt-8 flex justify-center gap-8 text-white/50 text-[10px] tracking-widest uppercase">
              <span className="flex items-center gap-2"><FaShieldAlt /> 100% Verified</span>
              <span className="flex items-center gap-2"><FaHandshake /> 43 Years of Trust</span>
            </div>
          </motion.div>
        </div>


        {/* REGISTER MODAL - Premium Glass Style */}
        <AnimatePresence>
          {isRegisterOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              {/* Dark Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsRegisterOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
              />

              {/* Modal Content - The Glass Igloo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-2xl bg-brandNavy/40 backdrop-blur-xl border border-white/20 rounded-t-[150px] rounded-b-[40px] shadow-2xl p-8 relative overflow-hidden z-20"
              >
                {/* Close Button */}
                <button onClick={() => setIsRegisterOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                {/* Decorative Top Arch Border */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />

                <div className="text-center mb-6 relative z-10 pt-4">
                  <h2 className="text-3xl font-serif text-white tracking-wide mb-1">Begin Your Story</h2>
                  <div className="w-16 h-0.5 bg-brandGold mx-auto mb-3" />

                  <button
                    onClick={() => { setIsRegisterOpen(false); setIsLoginModalOpen(true); }}
                    className="mx-auto text-white/80 hover:text-white border border-white/20 hover:border-brandGold px-4 py-1 rounded-full text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 justify-center bg-black/20"
                  >
                    <FaUser size={10} /> Already a Member? Login
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.form
                      key="step1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-4 text-left"
                    >
                      {/* Marital + Gender + Profile Created By */}
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Profile Created By *
                          </label>
                          <select
                            {...register("createdFor", { required: true })}
                            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-brandOrange outline-none transition"
                          >
                            <option value="">Select</option>
                            <option>Self</option>
                            <option>Parent (Father/Mother)</option>
                            <option>Guardian</option>
                            <option>Brother</option>
                            <option>Sister</option>
                            <option>Friend</option>

                          </select>
                          {errors.createdFor && <p className="text-red-500 text-xs text-left">Required</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Marital Status *
                          </label>
                          <select
                            {...register("maritalStatus", { required: true })}
                            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-brandOrange outline-none transition"
                          >
                            <option value="">Select</option>
                            <option>Never Married</option>
                            <option>Divorced</option>
                            <option>Widow/Widower</option>

                          </select>
                          {errors.maritalStatus && <p className="text-red-500 text-xs text-left">Required</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Gender *
                          </label>
                          <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" value="Male" {...register("gender", { required: true })} className="accent-brandOrange" /> Male
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" value="Female" {...register("gender", { required: true })} className="accent-brandOrange" /> Female
                            </label>
                          </div>
                          {errors.gender && <p className="text-red-500 text-xs text-left">Required</p>}
                        </div>
                      </div>

                      {/* Name + Email */}
                      <div className="grid grid-cols-2 gap-10">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Groom / Bride Name *
                          </label>
                          <div className="flex gap-2">
                            <select className="border rounded px-3 py-2 w-28">
                              <option>Mr</option>
                              <option>Ms</option>
                              <option>CA</option>
                              <option>Dr.</option>
                              <option>Prof</option>
                              <option>Shri</option>
                              <option>Smt.</option>
                            </select>
                            <input
                              {...register("name", { required: true })}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Enter Full Name"
                            />
                          </div>
                          {errors.name && <p className="text-red-500 text-xs text-left">Required</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Email Address *
                          </label>
                          <input
                            {...register("email", { required: true })}
                            type="email"
                            placeholder="email@example.com"
                            className="w-full border rounded px-3 py-2"
                          />
                          {errors.email && <p className="text-red-500 text-xs text-left">Required</p>}
                        </div>
                      </div>

                      {/* Mobile + DOB */}
                      <div className="grid grid-cols-2 gap-10">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Mobile No *
                          </label>
                          <div className="flex gap-2">
                            <span className="border px-3 py-2 rounded bg-gray-50">+91</span>
                            <input
                              {...register("mobile", { required: true })}
                              maxLength={10}
                              className="w-full border rounded px-3 py-2"
                              placeholder="9876543210"
                            />
                          </div>
                          {errors.mobile && <p className="text-red-500 text-xs text-left">Required</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Date of Birth *
                          </label>
                          <div className="flex gap-3">
                            <select {...register("dobDay", { required: true })} className="w-full border rounded px-2 py-2">
                              <option value="">Day</option>
                              {[...Array(31)].map((_, i) => <option key={i + 1}>{i + 1}</option>)}
                            </select>
                            <select {...register("dobMonth", { required: true })} className="w-full border rounded px-2 py-2">
                              <option value="">Month</option>
                              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => <option key={m}>{m}</option>)}
                            </select>
                            <select {...register("dobYear", { required: true })} className="w-full border rounded px-2 py-2">
                              <option value="">Year</option>
                              {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - 18 - i).map(y => <option key={y}>{y}</option>)}
                            </select>
                          </div>
                          {(errors.dobDay || errors.dobMonth || errors.dobYear) && (
                            <p className="text-red-500 text-xs text-left">Required</p>
                          )}
                          {age && (
                            <p className="text-brandOrange text-[10px] font-bold mt-1 text-left animate-pulse">
                              Auto-calculated Age: {age} Years
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Caste */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Caste *</label>
                        <select {...register("caste", { required: true })} className="w-full border rounded px-3 py-2">
                          <option value="">Select Caste</option>
                          {castes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {errors.caste && <p className="text-red-500 text-xs text-left">Required</p>}
                      </div>

                      {/* Password */}
                      <div className="grid grid-cols-2 gap-10">
                        <div>
                          <label className="block text-sm font-medium mb-1">Password *</label>
                          <input type="password" {...register("password", { required: true })} className="w-full border rounded px-3 py-2" placeholder="Create Password" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                          <input type="password" {...register("confirmPassword", { required: true })} className="w-full border rounded px-3 py-2" placeholder="Confirm Password" />
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="flex justify-center pt-6">
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-brandOrange to-brandNavy text-white px-12 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all"
                        >
                          Register Now
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {step === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                      <h3 className="text-white font-serif text-2xl mb-2">Verify Mobile</h3>
                      <p className="text-white/60 text-xs mb-8">OTP Code sent to {verificationData?.mobile}</p>
                      <div className="flex justify-center gap-4 mb-8">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="w-12 h-14 border-b-2 border-white/50 flex items-center justify-center text-2xl text-white font-serif">
                            {i * 2}
                          </div>
                        ))}
                      </div>
                      <button onClick={handleFinalSubmit} className="w-full bg-brandGold text-brandNavy py-3 rounded-full font-bold text-xs uppercase hover:bg-white transition-colors">Confirm & Access</button>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-white">
                      <div className="w-20 h-20 border-2 border-green-400 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-900/40 backdrop-blur-sm">
                        <FaCheckCircle className="text-4xl text-green-400" />
                      </div>
                      <h3 className="font-serif text-3xl mb-2">Welcome Home</h3>
                      <p className="text-xs uppercase tracking-widest text-white/70">Redirecting to your dashboard...</p>
                    </motion.div>
                  )}

                </AnimatePresence>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </section>

      {/* Rest of the page content */}
      <div className="relative z-20 bg-brandBlue">
        {/* Stats Section - Sun Rising Icons */}
        {/* Premium Stats Section */}
        <section className="py-16 bg-brandNavy relative overflow-hidden">
          {/* Decorative BG pattern */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: 100000, label: 'Happy Marriages', icon: FaHandshake, suffix: '+' },
                { number: 50000, label: 'Verified Profiles', icon: FaUserCheck, suffix: '+' },
                { number: 500, label: 'Community Events', icon: FaGlobe, suffix: '+' },
                { number: 43, label: 'Years of Trust', icon: FaShieldAlt, suffix: '+' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-brandGold to-yellow-600 p-[2px] shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <div className="w-full h-full bg-brandNavy rounded-xl flex items-center justify-center">
                      <stat.icon className="text-3xl text-brandGold" />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1 font-serif">
                    <AnimatedCounter end={stat.number} suffix={stat.suffix} />
                  </div>
                  <div className="text-brandGold text-sm uppercase tracking-wider font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Royal CTA Banner */}
        <section className="py-12 bg-gradient-to-r from-brandRed to-red-900 border-y-4 border-brandGold">
          <div className="container mx-auto px-4 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-serif font-bold text-white mb-6"
            >
              Your happily ever after begins here
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/register")}
              className="bg-brandGold text-brandNavy px-10 py-3 rounded-full font-bold text-lg shadow-2xl hover:bg-white transition-colors border-2 border-transparent hover:border-brandGold"
            >
              Create Free Profile
            </motion.button>
          </div>
        </section>

        {/* Premium Reasons Section - Glass Cards */}
        <section className="py-20 bg-gray-50 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-brandNavy mb-4">
                Why Choose <span className="text-brandRed">SarvVivah</span>?
              </h2>
              <div className="w-24 h-1 bg-brandGold mx-auto rounded-full" />
            </motion.div>

            {/* Elegant Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {[
                { title: 'Trust & Safety', desc: '100% Mobile verified profiles with government ID checks.', icon: FaShieldAlt },
                { title: 'Best Matches', desc: 'Advanced AI algorithms to find your perfect life partner.', icon: FaUserCheck },
                { title: 'Privacy Control', desc: 'You control who sees your photos and contact details.', icon: FaEnvelopeOpenText },
                { title: 'Premium Support', desc: 'Dedicated relationship managers to assist your journey.', icon: FaHandshake },
                { title: 'Budget Friendly', desc: 'Most affordable premium plans in the industry.', icon: FaRupeeSign },
                { title: 'Global Reach', desc: 'Find matches from your community across the globe.', icon: FaGlobe },
                { title: 'Secure Chat', desc: 'Chat instantly without revealing your phone number.', icon: FaEnvelopeOpenText },
                { title: 'Success Stories', desc: '43 Years ofBringing hearts together.', icon: FaCheckCircle },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:border-brandGold/50 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-brandRed/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-brandRed group-hover:text-white transition-colors text-brandRed">
                    <item.icon className="text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-brandNavy mb-2 group-hover:text-brandRed transition-colors">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>

    </div>
  );
};

export default Home;