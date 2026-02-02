import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FaHeart, FaUser, FaCheckCircle, FaShieldAlt, FaMobileAlt, FaEnvelopeOpenText } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";

const Register = () => {
  const navigate = useNavigate();

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

  const { register: registerUser } = useAuth(); // Rename to avoid conflict with useForm
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = (data) => {
    if (data.password !== data.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setVerificationData(data);
    setStep(2); // Move to Verification Step
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const data = verificationData;

    try {
      // Use AuthContext for registration
      await registerUser(data);

      setStep(3); // Success Step
      setTimeout(() => {
        navigate("/create-profile", { state: data });
      }, 3000);
    } catch (error) {
      alert("Registration Failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-brandBlue">

      {/* ===== Top Header (UNCHANGED STRUCTURE, NEW COLORS) ===== */}
      <div className="w-full bg-brandBlue shadow-sm px-10 py-3 flex justify-between items-center">
        <Link to="/" className="block">
          <h1 className="text-3xl font-bold flex items-center gap-1">
            <span className="text-brandOrange">SarvVivah</span>
            <span className="text-black font-normal">.com</span>
            <FaHeart className="text-brandOrange text-xl ml-1" />
          </h1>
          <p className="text-sm font-medium text-brandNavy/80">
            One Platform. All Castes. One Life Partner.
          </p>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/login" className="flex items-center gap-2 text-gray-700 hover:text-brandOrange">
            <FaUser /> Login
          </Link>

          <button
            onClick={() => navigate(0)}
            className="bg-gradient-to-r from-brandOrange to-brandNavy text-white px-4 py-1.5 rounded text-sm shadow"
          >
            Register Now
          </button>
        </div>
      </div>

      {/* ===== Form Card (Same form, NEW THEME) ===== */}
      <div className="flex-1 flex justify-center items-center py-10">
        <div className="w-full max-w-5xl bg-brandBlue rounded-xl shadow-xl overflow-hidden">

          {/* Card Header */}
          <div className="bg-gradient-to-r from-brandOrange to-brandNavy py-4 px-6 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">
              Registration Form
            </h2>
            <div className="text-sm text-white">
              📞 +91 750 61 991 62
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit(onSubmit)}
                className="p-8 space-y-6"
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
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-12 text-center space-y-8"
              >
                <div className="flex justify-center gap-12">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                      <FaEnvelopeOpenText size={24} />
                    </div>
                    <h3 className="font-bold text-brandNavy">Email Verification</h3>
                    <p className="text-xs text-gray-500">Sent to {verificationData.email}</p>
                    <input type="text" placeholder="6-Digit code" className="w-32 border rounded py-2 text-center font-bold tracking-widest text-brandNavy" maxLength={6} defaultValue="123456" />
                  </div>
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-brandOrange">
                      <FaMobileAlt size={24} />
                    </div>
                    <h3 className="font-bold text-brandNavy">Mobile Verification</h3>
                    <p className="text-xs text-gray-500">Sent to +91 {verificationData.mobile}</p>
                    <input type="text" placeholder="OTP" className="w-32 border rounded py-2 text-center font-bold tracking-widest text-brandNavy" maxLength={4} defaultValue="1234" />
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-semibold mb-6">
                    <FaShieldAlt /> Secure Encrypted Submission
                  </div>
                  <button
                    onClick={handleFinalSubmit}
                    className="bg-brandNavy text-white px-12 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition-all"
                  >
                    Verify & Create Profile
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-16 text-center space-y-6"
              >
                <FaCheckCircle className="text-7xl text-green-500 mx-auto animate-bounce" />
                <h2 className="text-3xl font-bold text-brandNavy">Congratulations!</h2>
                <p className="text-gray-600">Your account has been created successfully with secure encryption.</p>
                <div className="w-full max-w-xs mx-auto bg-green-50 border border-green-100 p-4 rounded-xl">
                  <p className="text-xs text-green-700 font-bold uppercase tracking-widest mb-1">Registration ID</p>
                  <p className="text-2xl font-black text-brandNavy">SV-{Math.floor(Math.random() * 900000) + 100000}</p>
                </div>
                <p className="text-brandOrange font-bold animate-pulse pt-4">Redirecting to profile setup...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== Footer Added ===== */}
      <Footer />
    </div>
  );
};

export default Register;
