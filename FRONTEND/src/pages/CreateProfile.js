import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const steps = [
  "Personal Details",
  "Religion & Education",
  "Professional & Family",
  "Horoscope Details",
  "Partner Preferences",
  "Photos"
];

const CreateProfile = () => {
  const navigate = useNavigate();

  const savedData = useMemo(() => {
    return JSON.parse(localStorage.getItem("registerData")) || {};
  }, []);

  const { register, handleSubmit, setValue, getValues, watch } = useForm({
    defaultValues: savedData
  });

  const [step, setStep] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [otherPhotos, setOtherPhotos] = useState([]);
  const [selectedCaste, setSelectedCaste] = useState("");


  useEffect(() => {
    Object.keys(savedData).forEach((key) => setValue(key, savedData[key]));
  }, [savedData, setValue]);

  const completion = Math.round(((step + 1) / steps.length) * 100);

  const nextStep = () => {
    localStorage.setItem("createProfileDraft", JSON.stringify(getValues()));
    setStep((s) => (s < steps.length - 1 ? s + 1 : s));
  };

  const prevStep = () => {
    setStep((s) => (s > 0 ? s - 1 : s));
  };

  const onSubmit = (data) => {
    // Merge savedData (from Register) with form data and photos
    const registerData = JSON.parse(localStorage.getItem("registerData")) || {};

    const finalData = {
      ...registerData, // Ensure Name, DOB, Email from Register are preserved
      ...data,
      profilePhoto,
      profilePhotoStatus: profilePhoto ? 'Pending' : 'Approved',
      otherPhotos: otherPhotos.map(url => ({ url, status: 'Pending' })),
      id: "OM" + (registerData.mobile ? registerData.mobile.slice(-4) : Math.floor(1000 + Math.random() * 9000)) + "X",
      registrationDate: registerData.registrationDate || new Date().toISOString()
    };

    // Calculate age if not present (safety fallback)
    if (!finalData.age && finalData.dobYear) {
      finalData.age = new Date().getFullYear() - parseInt(finalData.dobYear);
    }

    localStorage.setItem("userProfile", JSON.stringify(finalData));

    // Sync with global users list
    const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
    const userIndex = allUsers.findIndex(u => u.name === finalData.name || u.email === finalData.email);
    if (userIndex > -1) {
      allUsers[userIndex] = finalData;
    } else {
      allUsers.push(finalData);
    }
    localStorage.setItem("allUsers", JSON.stringify(allUsers));

    navigate("/dashboard");
  };

  const handleProfilePhotoChange = (e) => {
    if (e.target.files[0]) {
      setProfilePhoto(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleOtherPhotosChange = (e) => {
    const files = Array.from(e.target.files).map((f) =>
      URL.createObjectURL(f)
    );
    setOtherPhotos(files);
  };

  // Dropdown data
  const heights = Array.from({ length: 41 }, (_, i) => 140 + i);
  const weights = Array.from({ length: 81 }, (_, i) => 40 + i);

  // Highest Qualification
  const qualifications = [
    "High School", "Diploma", "Bachelor", "Master", "Doctorate", "CA/CPA", "Other"
  ];

  // Income
  const incomeRanges = [
    "No Income", "0-2 Lakhs", "2-4 Lakhs", "4-7 Lakhs", "7-10 Lakhs", "10-15 Lakhs", "15-25 Lakhs", "25+ Lakhs"
  ];

  // Mother Tongue
  const motherTongues = [
    "Hindi", "English", "Marathi", "Gujarati", "Kannada", "Tamil", "Telugu", "Malayalam",
    "Punjabi", "Bengali", "Odia", "Assamese", "Urdu", "Konkani", "Sindhi", "Rajasthani",
    "Haryanvi", "Bhojpuri", "Maithili", "Magahi", "Kashmiri", "Dogri", "Manipuri",
    "Other"
  ];

  // Religion
  const religions = [
    "Hinduism", "Islam", "Christianity", "Sikhism", "Buddhism", "Jainism", "Parsi", "Judaism", "No Religion", "Other"
  ];

  // Caste
  const castes = [
    "Brahmin", "Kshatriya", "Vaishya", "Kayastha", "Scheduled Caste (SC)",
    "Scheduled Tribe (ST)", "Maratha", "Reddy", "Nair", "Ezhava", "Gowda", "Yadav",
    "Jat", "Rajput", "Naidu", "Kamma", "Kurmi", "Lingayat", "Vellalar", "Mudaliar",
    "Pillai", "Vanniyar", "Aggarwal", "Arora", "Khatri", "Bania",
    "Sunni", "Shia", "Ahmadiyya", "Bohra", "Khoja", "Ansari", "Qureshi", "Sheikh",
    "Syed", "Pathan", "Mughal", "Rajput Muslim", "Jat Muslim",
    "Roman Catholic", "Protestant", "Orthodox", "Pentecostal",
    "Church of South India (CSI)", "Church of North India (CNI)",
    "Jacobite", "Marthoma", "Latin Catholic", "Syrian Catholic", "Knanaya", "Anglo Indian",
    "Jat Sikh", "Ramgarhia", "Saini", "Labana", "Ramdasia", "Mazhabhi", "Bhatia",
    "Mahayana", "Theravada", "Vajrayana", "Neo-Buddhist", "Ambedkarite",
    "Digambara", "Svetambara",
    "Agarwal", "Porwal", "Oswal", "Jaiswal", "Khandelwal",
    "Zoroastrian", "Irani",
    "Orthodox", "Conservative", "Reform",
    "No Caste", "Not Applicable", "Other"
  ];

  const subCastes = {
    Brahmin: ["Iyer", "Iyengar", "Deshastha", "Kanyakubja", "Gaur", "Saraswat", "Havyaka", "Namboodiri", "Madhwa", "Smartha"],
    Rajput: ["Thakur", "Rathore", "Chauhan", "Solanki"],
    Vaishya: ["Agarwal", "Maheshwari", "Gupta", "Bania", "Komati"],
    Reddy: ["Kapu", "Reddy Balija"],
    Nair: ["Menon", "Pillai"],
    Sunni: ["Hanafi", "Shafi", "Maliki", "Hanbali"],
    Shia: ["Ithna Ashari", "Ismaili"],
    Bohra: ["Dawoodi Bohra", "Sulaymani Bohra"],
    "Roman Catholic": ["Latin Catholic", "Syro-Malabar", "Syro-Malankara"],
    Protestant: ["Lutheran", "Baptist", "Methodist", "Presbyterian"],
    Ordenox: ["Malankara Orthodox", "Jacobite"],
    "Jat Sikh": ["Sandhu", "Gill", "Dhillon", "Sidhu"],
    Ramgarhia: ["Tarkhan", "Lohar"],
    Other: ["Other"]
  };

  const employmentTypes = ["Private", "Government", "Self-Employed", "Business", "Not Working"];
  const familyValues = ["Traditional", "Moderate", "Liberal"];
  const familyStatus = ["Middle Class", "Upper Middle Class", "Rich", "Affluent"];
  const communities = [
    "Maratha", "Brahmin", "Kunbi", "Chambhar", "Mali", "Dhangar", "Agri", "Bhandari",
    "Patel", "Reddy", "Nair", "Iyer", "Iyengar", "Jat", "Aggarwal", "Sindhi", "Other"
  ];

  const rashis = [
    "Mesh (Aries)", "Vrishabh (Taurus)", "Mithun (Gemini)", "Karka (Cancer)",
    "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrishchik (Scorpio)",
    "Dhanu (Sagittarius)", "Makar (Capricorn)", "Kumbh (Aquarius)", "Meen (Pisces)"
  ];

  const nakshatras = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula",
    "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
  ];

  return (
    <div className="min-h-screen bg-brandBlue pt-24">
      {/* pt-24 prevents header overlap */}
      <Header />

      <div className="max-w-4xl mx-auto py-6 md:py-12 px-4 md:px-6">
        <div className="bg-brandBlue rounded-2xl shadow-xl border border-gray-100">

          {/* Title */}
          <div className="border-b px-4 md:px-10 py-6 text-center bg-brandBlue/50 rounded-t-2xl">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-brandOrange to-brandNavy bg-clip-text text-transparent">
              Create Your Profile
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Step {step + 1} of {steps.length} — {steps[step]}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-4 md:px-10 pt-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-brandOrange to-brandNavy transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="text-right text-xs text-gray-600 mt-1">
              {completion}% completed
            </p>

            {/* Step labels */}
            <div className="flex justify-between text-xs text-gray-500 mt-3 overflow-x-auto gap-2">
              {steps.map((s, i) => (
                <span
                  key={i}
                  className={`whitespace-nowrap ${i <= step ? "text-brandOrange font-semibold" : ""}`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit((data) => {
              if (step < steps.length - 1) {
                nextStep();
              } else {
                onSubmit(data);
              }
            })}
            className="p-4 md:p-10 space-y-6 md:space-y-8"
          >
            {/* HIDDEN FIELDS TO PRESERVE REGISTRATION DATA */}
            <input type="hidden" {...register("name")} />
            <input type="hidden" {...register("gender")} />
            <input type="hidden" {...register("maritalStatus")} />
            <input type="hidden" {...register("age")} />
            <input type="hidden" {...register("dobDay")} />
            <input type="hidden" {...register("dobMonth")} />
            <input type="hidden" {...register("dobYear")} />
            <input type="hidden" {...register("email")} />
            <input type="hidden" {...register("mobile")} />

            {/* STEP 1: Personal Details */}
            {step === 0 && (
              <>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6 flex flex-wrap gap-6 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[10px] text-brandOrange font-bold uppercase tracking-wider">Registered Name</p>
                    <p className="text-lg font-black text-brandNavy">{savedData.name || "N/A"}</p>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-[10px] text-brandOrange font-bold uppercase tracking-wider">Gender</p>
                    <p className="text-lg font-black text-brandNavy">{savedData.gender || "N/A"}</p>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <p className="text-[10px] text-brandOrange font-bold uppercase tracking-wider">Marital Status</p>
                    <p className="text-lg font-black text-brandNavy">{savedData.maritalStatus || "N/A"}</p>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <p className="text-[10px] text-brandOrange font-bold uppercase tracking-wider">DOB / Age</p>
                    <p className="text-lg font-black text-brandNavy">{savedData.age ? `${savedData.age} Years` : (savedData.dobYear ? `Born ${savedData.dobYear}` : "N/A")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Height (cm)</label>
                    <select {...register("height")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20 focus:ring-2 focus:ring-brandOrange/500">
                      <option value="">Select Height</option>
                      {heights.map((h) => (
                        <option key={h} value={h}>{h} cm</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Weight</label>
                    <select {...register("weight")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20 focus:ring-2 focus:ring-brandOrange/500">
                      <option value="">Select Weight</option>
                      {weights.map((w) => (
                        <option key={w} value={w}>{w} Kg</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Mother Tongue</label>
                    <select {...register("motherTongue", { required: true })} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="">Select Mother Tongue</option>
                      {motherTongues.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Physical Status</label>
                    <select {...register("physicalStatus", { required: true })} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="Normal">Normal</option>
                      <option value="Physically Challenged">Physically Challenged</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Community</label>
                    <select {...register("community")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20 focus:ring-2 focus:ring-brandOrange/500">
                      <option value="">Select Community</option>
                      {communities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: Religion & Education */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Religion</label>
                    <select {...register("religion", { required: true })} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="">Select Religion</option>
                      {religions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Caste</label>
                    <select
                      {...register("caste", { required: true })}
                      onChange={(e) => {
                        setSelectedCaste(e.target.value);
                        setValue("subCaste", "");
                      }}
                      className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20"
                    >
                      <option value="">Select Caste</option>
                      {castes.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Sub Caste</label>
                    {subCastes[selectedCaste] ? (
                      <select
                        {...register("subCaste", { required: true })}
                        className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20"
                      >
                        <option value="">Select Sub Caste</option>
                        {subCastes[selectedCaste].map((sc) => (
                          <option key={sc} value={sc}>{sc}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter your Sub Caste"
                        {...register("subCaste", { required: true })}
                        className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20 focus:ring-2 focus:ring-brandOrange/500"
                      />
                    )}
                  </div>
                </div>

                <hr className="border-gray-200" />

                <h3 className="font-semibold text-brandNavy">Education Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Highest Qualification</label>
                    <select {...register("qualification", { required: true })} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="">Select Qualification</option>
                      {qualifications.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Institution / University</label>
                    <input
                      type="text"
                      {...register("institution")}
                      placeholder="Eg. Mumbai University"
                      className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Passing Year</label>
                    <input
                      type="number"
                      {...register("passingYear")}
                      placeholder="Eg. 2018"
                      className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20"
                    />
                  </div>
                </div>
              </>
            )}

            {/* STEP 3: Professional & Family */}
            {step === 2 && (
              <>
                <h3 className="font-semibold text-brandNavy">Professional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Occupation</label>
                    <input
                      type="text"
                      placeholder="Eg. Software Engineer"
                      {...register("occupation", { required: true })}
                      className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20 focus:ring-2 focus:ring-brandOrange/500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Employment Type</label>
                    <select {...register("employmentType")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20 focus:ring-2 focus:ring-brandOrange/500">
                      <option value="">Select Type</option>
                      {employmentTypes.map((e) => (
                        <option key={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company / Organization</label>
                    <input
                      type="text"
                      placeholder="Eg. Google"
                      {...register("companyName")}
                      className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Annual Income</label>
                    <select {...register("annualIncome")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20 focus:ring-2 focus:ring-brandOrange/500">
                      <option value="">Select Income Range</option>
                      {incomeRanges.map((val) => (
                        <option key={val}>{val}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Work Location</label>
                    <input
                      type="text"
                      placeholder="Eg. Pune, India"
                      {...register("workLocation")}
                      className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20"
                    />
                  </div>
                </div>

                <hr className="border-gray-200" />

                <h3 className="font-semibold text-brandNavy">Family Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Father's Occupation</label>
                    <input {...register("fatherOccupation")} type="text" placeholder="Eg. Retired" className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mother's Occupation</label>
                    <input {...register("motherOccupation")} type="text" placeholder="Eg. Homemaker" className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Brothers</label>
                    <select {...register("brothers")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3+">3+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sisters</label>
                    <select {...register("sisters")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3+">3+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Family Status</label>
                    <select {...register("familyStatus")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      {familyStatus.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Family Values</label>
                    <select {...register("familyValues")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20 focus:ring-2 focus:ring-brandOrange/500">
                      {familyValues.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* STEP 4: Horoscope */}
            {step === 3 && (
              <>
                <h3 className="font-semibold text-brandNavy mb-4">Horoscope Details (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rashi (Moon Sign)</label>
                    <select {...register("rashi")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="">Select Rashi</option>
                      {rashis.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nakshatra</label>
                    <select {...register("nakshatra")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="">Select Nakshatra</option>
                      {nakshatras.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time of Birth</label>
                    <input type="time" {...register("birthTime")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Place of Birth</label>
                    <input type="text" {...register("birthPlace")} placeholder="Eg. Mumbai" className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20" />
                  </div>
                </div>
              </>
            )}

            {/* STEP 5: Partner Preferences (NEW) */}
            {step === 4 && (
              <>
                <h3 className="font-semibold text-brandNavy mb-4">Partner Preferences</h3>
                <p className="text-sm text-gray-500 mb-6">Tell us what you are looking for in a partner.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Age</label>
                    <select {...register("preferredAge")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="Any">Any</option>
                      <option value="18-22">18 - 22 Yrs</option>
                      <option value="23-27">23 - 27 Yrs</option>
                      <option value="28-32">28 - 32 Yrs</option>
                      <option value="33-37">33 - 37 Yrs</option>
                      <option value="38-42">38 - 42 Yrs</option>
                      <option value="42+">42+ Yrs</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Religion</label>
                    <select {...register("preferredReligion")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="Any">Any</option>
                      {religions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Caste</label>
                    <select {...register("preferredCaste")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="Any">Any</option>
                      <option value="Same Caste">Same Caste</option>
                      {castes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Location</label>
                    <select {...register("preferredLocation")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="Any">Any</option>
                      <option value="Same City">Same City</option>
                      <option value="Same State">Same State</option>
                      <option value="India">Anywhere in India</option>
                      <option value="Abroad">Abroad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Height</label>
                    <select {...register("preferredHeight")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="Any">Any</option>
                      <option value="4.5 - 5.0ft">4.5 - 5.0 ft</option>
                      <option value="5.0 - 5.5ft">5.0 - 5.5 ft</option>
                      <option value="5.5 - 6.0ft">5.5 - 6.0 ft</option>
                      <option value="6.0ft+">6.0 ft+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Education</label>
                    <select {...register("preferredEducation")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="Any">Any</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Post Graduate">Post Graduate</option>
                      <option value="Doctorate">Doctorate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Profession</label>
                    <select {...register("preferredProfession")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="Any">Any</option>
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Government Job">Government Job</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Community</label>
                    <select {...register("preferredCommunity")} className="w-full border border-gray-300 p-3 rounded-lg bg-brandBlue/20">
                      <option value="Any">Any</option>
                      {communities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}


            {/* STEP 6: Photos */}
            {step === 5 && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Profile Photo *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-brandBlue/20 transition cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" id="profileUpload" />
                    <label htmlFor="profileUpload" className="cursor-pointer">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          className="w-32 h-32 rounded-full mx-auto object-cover border shadow-md"
                          alt="Profile"
                        />
                      ) : (
                        <div className="text-gray-400">
                          <p>Click to upload profile photo</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Other Photos (Max 5)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-brandBlue/20 transition cursor-pointer">
                    <input type="file" accept="image/*" multiple onChange={handleOtherPhotosChange} className="hidden" id="otherUpload" />
                    <label htmlFor="otherUpload" className="cursor-pointer block mb-4 text-blue-500 font-medium">Click to upload multiple photos</label>

                    <div className="flex gap-4 justify-center flex-wrap">
                      {otherPhotos.map((p, i) => (
                        <img
                          key={i}
                          src={p}
                          className="w-20 h-20 rounded-lg object-cover border shadow-sm"
                          alt="Other"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t mt-8">
              {step > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-brandNavy rounded-lg hover:bg-brandBlue/20 font-medium"
                >
                  Back
                </button>
              )}

              <button
                type="submit"
                className="ml-auto px-10 py-2 rounded-lg text-white font-bold
                bg-gradient-to-r from-brandOrange via-orange-500 to-brandNavy
                shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                {step < steps.length - 1
                  ? "Save & Continue"
                  : "Finish & Go to Dashboard"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
