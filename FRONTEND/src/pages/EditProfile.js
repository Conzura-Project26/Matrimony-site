import React, { useState } from "react";

const EditProfile = ({ setActiveTab }) => {
  const oldProfile = JSON.parse(localStorage.getItem("userProfile")) || {};
  const [form, setForm] = useState(oldProfile);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    localStorage.setItem("userProfile", JSON.stringify(form));

    // Sync with global users list
    const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
    const userIndex = allUsers.findIndex(u => u.id === form.id);
    if (userIndex > -1) {
      allUsers[userIndex] = form;
    } else {
      allUsers.push(form);
    }
    localStorage.setItem("allUsers", JSON.stringify(allUsers));

    alert("Profile updated successfully!");
    setActiveTab("myProfile");
  };

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 space-y-6 md:space-y-10">

      {/* ================= PERSONAL DETAILS ================= */}
      <Section title="Personal Details">
        <Input label="Full Name" name="name" value={form.name} onChange={handleChange} />
        <Input label="Date of Birth" type="date" name="dob" value={form.dob} onChange={handleChange} />
        <Input label="City" name="city" value={form.city} onChange={handleChange} />

        <Select
          label="Religion"
          name="religion"
          value={form.religion}
          onChange={handleChange}
          options={["Hinduism", "Islam", "Christianity", "Sikhism", "Buddhism", "Jainism", "Parsi", "Judaism", "Other", "No Religion"]} />
        <Select label="Caste" name="caste" value={form.caste} onChange={handleChange}
          options={[
            "Brahmin",
            "Kshatriya",
            "Vaishya",
            "Kayastha",
            "Scheduled Caste (SC)",
            "Scheduled Tribe (ST)",
            "Maratha",
            "Reddy",
            "Nair",
            "Ezhava",
            "Gowda",
            "Yadav",
            "Jat",
            "Rajput",
            "Naidu",
            "Kamma",
            "Kurmi",
            "Lingayat",
            "Vellalar",
            "Mudaliar",
            "Pillai",
            "Vanniyar",
            "Aggarwal",
            "Arora",
            "Khatri",
            "Bania",

            // Muslim
            "Sunni",
            "Shia",
            "Ahmadiyya",
            "Bohra",
            "Khoja",
            "Ansari",
            "Qureshi",
            "Sheikh",
            "Syed",
            "Pathan",
            "Mughal",
            "Rajput Muslim",
            "Jat Muslim",

            // Christian
            "Roman Catholic",
            "Protestant",
            "Orthodox",
            "Pentecostal",
            "Church of South India (CSI)",
            "Church of North India (CNI)",
            "Jacobite",
            "Marthoma",
            "Latin Catholic",
            "Syrian Catholic",
            "Knanaya",
            "Anglo Indian",

            // Sikh
            "Jat Sikh",
            "Khatri Sikh",
            "Arora Sikh",
            "Ramgarhia",
            "Saini",
            "Labana",
            "Ramdasia",
            "Mazhabhi",
            "Bhatia",
            "Bhapa",

            // Buddhist
            "Mahayana",
            "Theravada",
            "Vajrayana",
            "Neo-Buddhist",
            "Ambedkarite",

            // Jain
            "Digambara",
            "Svetambara",

            // Vaishya sub-castes
            "Agarwal",
            "Porwal",
            "Oswal",
            "Jaiswal",
            "Khandelwal",

            // Zoroastrian / Parsi
            "Zoroastrian",
            "Irani",

            // Judaism
            "Orthodox Jewish",
            "Conservative Jewish",
            "Reform Jewish",

            // General
            "No Caste",
            "Not Applicable",
            "Other"
          ]}
        />

        <Select
          label="Mother Tongue"
          name="motherTongue"
          value={form.motherTongue}
          onChange={handleChange}
          options={[
            "Hindi",
            "English",
            "Marathi",
            "Gujarati",
            "Kannada",
            "Tamil",
            "Telugu",
            "Malayalam",
            "Punjabi",
            "Bengali",
            "Odia",
            "Assamese",
            "Urdu",
            "Konkani",
            "Sindhi",
            "Rajasthani",
            "Haryanvi",
            "Bhojpuri",
            "Maithili",
            "Magahi",
            "Kashmiri",
            "Dogri",
            "Manipuri",
            "Santhali",
            "Nepali",
            "Tulu",
            "Coorgi (Kodava)",
            "Khasi",
            "Garo",
            "Mizo",
            "Nagamese",
            "Bhili",
            "Chhattisgarhi",
            "Garhwali",
            "Kumaoni",
            "Marwari",
            "Awadhi",
            "Braj",
            "Lambani",
            "Sourashtra",
            "Seraiki",
            "Other"
          ]}
        />

        <Select
          label="Marital Status"
          name="maritalStatus"
          value={form.maritalStatus}
          onChange={handleChange}
          options={["Never Married", "Divorced", "Widow / Widower"]}
        />
        <Select
          label="Height (cm)"
          name="height"
          value={form.height}
          onChange={handleChange}
          options={Array.from({ length: 41 }, (_, i) => 140 + i)}
        />
        <Select
          label="Weight (kg)"
          name="weight"
          value={form.weight}
          onChange={handleChange}
          options={Array.from({ length: 81 }, (_, i) => 40 + i)}
        />
        <Select
          label="Physical Status"
          name="physicalStatus"
          value={form.physicalStatus}
          onChange={handleChange}
          options={["Normal", "Physically Challenged"]}
        />
      </Section>

      {/* ================= EDUCATION DETAILS ================= */}
      <Section title="Education Details">
        <Select
          label="Highest Qualification"
          name="qualification"
          value={form.qualification}
          onChange={handleChange}
          options={["High School", "Graduate", "Post Graduate", "Doctorate"]}
        />

        <Input
          label="Institution"
          name="institution"
          value={form.institution}
          onChange={handleChange}
        />

        <Input
          label="Year of Passing"
          name="passingYear"
          value={form.passingYear}
          onChange={handleChange}
        />
      </Section>

      {/* ================= PROFESSIONAL DETAILS ================= */}
      <Section title="Professional Details">
        <Input label="Occupation" name="occupation" value={form.occupation} onChange={handleChange} />

        <Select
          label="Employment Type"
          name="employmentType"
          value={form.employmentType}
          onChange={handleChange}
          options={["Government", "Private", "Self Employed"]}
        />

        <Input label="Company" name="companyName" value={form.companyName} onChange={handleChange} />
        <Select
          label="Annual Income"
          name="annualIncome"
          value={form.annualIncome}
          onChange={handleChange}
          options={["No Income", "0-2 Lakhs", "2-4 Lakhs", "4-7 Lakhs", "7-10 Lakhs", "10-15 Lakhs", "15-25 Lakhs", "25+ Lakhs"]}
        />
        <Input label="Work Location" name="workLocation" value={form.workLocation} onChange={handleChange} />
      </Section>


      {/* ================= FAMILY DETAILS ================= */}
      <Section title="Family Details">
        <Input label="Father's Occupation" name="fatherOccupation" value={form.fatherOccupation} onChange={handleChange} />
        <Input label="Mother's Occupation" name="motherOccupation" value={form.motherOccupation} onChange={handleChange} />
        <Select
          label="Brothers"
          name="brothers"
          value={form.brothers}
          onChange={handleChange}
          options={[0, 1, 2, 3, 4, 5, 6]}
        />
        <Select
          label="Sisters"
          name="sisters"
          value={form.sisters}
          onChange={handleChange}
          options={[0, 1, 2, 3, 4, 5, 6]}
        />

        <Select
          label="Family Status"
          name="familyStatus"
          value={form.familyStatus}
          onChange={handleChange}
          options={["Middle Class", "Upper Middle Class", "Rich", "Affluent"]}
        />

        <Select
          label="Family Values"
          name="familyValues"
          value={form.familyValues}
          onChange={handleChange}
          options={["Traditional", "Moderate", "Liberal"]}
        />
      </Section>

      {/* ================= HOROSCOPE DETAILS ================= */}
      <Section title="Horoscope Details (Optional)">

        <Select
          label="Rashi"
          name="rashi"
          value={form.rashi}
          onChange={handleChange}
          options={[
            "Mesh (Aries)", "Vrishabh (Taurus)", "Mithun (Gemini)", "Karka (Cancer)",
            "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrishchik (Scorpio)",
            "Dhanu (Sagittarius)", "Makar (Capricorn)", "Kumbh (Aquarius)", "Meen (Pisces)"
          ]}
        />

        <Select
          label="Nakshatra"
          name="nakshatra"
          value={form.nakshatra}
          onChange={handleChange}
          options={[
            "Ashwini",
            "Bharani",
            "Krittika",
            "Rohini",
            "Mrigashira",

            "Ardra",
            "Punarvasu",
            "Pushya",
            "Ashlesha",
            "Magha",
            "Purva Phalguni",
            "Uttara Phalguni",
            "Hasta",
            "Chitra",
            "Swati",
            "Vishakha",
            "Anuradha",
            "Jyeshtha",
            "Mula / Moola",
            "Purva Ashadha",
            "Uttara Ashadha",
            "Shravana",
            "Dhanishtha",
            "Shatabhisha",
            "Purva Bhadrapada",
            "Uttara Bhadrapada",
            "Revati"
          ]}
        />

        <Input
          label="Time of Birth"
          name="birthTime"
          value={form.birthTime}
          onChange={handleChange}
        />

        <Input
          label="Place of Birth"
          name="birthPlace"
          value={form.birthPlace}
          onChange={handleChange}
        />

      </Section>

      {/* ================= PARTNER PREFERENCE ================= */}
      {/* ================= PARTNER PREFERENCE ================= */}
      <Section title="Partner Preference">

        {/* Preferred Age */}
        <Select
          label="Preferred Age Range"
          name="preferredAge"
          value={form.preferredAge}
          onChange={handleChange}
          options={[
            "18 - 22",
            "23 - 27",
            "28 - 32",
            "33 - 37",
            "38 - 42",
            "43 - 50",
            "Any"
          ]}
        />

        {/* Preferred Height */}
        <Select
          label="Preferred Height Range (cm)"
          name="preferredHeight"
          value={form.preferredHeight}
          onChange={handleChange}
          options={[
            "140 - 150",
            "151 - 160",
            "161 - 170",
            "171 - 180",
            "181 - 190",
            "Any"
          ]}
        />

        {/* Preferred Religion */}
        <Select
          label="Preferred Religion"
          name="preferredReligion"
          value={form.preferredReligion}
          onChange={handleChange}
          options={[
            "Hindu",
            "Muslim",
            "Christian",
            "Sikh",
            "Jain",
            "Buddhist",
            "Parsi",
            "Jewish",
            "No Preference"
          ]}
        />

        {/* Preferred Caste */}
        <Select
          label="Preferred Caste"
          name="preferredCaste"
          value={form.preferredCaste}
          onChange={handleChange}
          options={[
            "Brahmin", "Kshatriya", "Vaishya", "Kayastha", "Scheduled Caste (SC)",
            "Scheduled Tribe (ST)", "Maratha", "Reddy", "Nair", "Ezhava", "Gowda", "Yadav",
            "Jat", "Rajput", "Naidu", "Kamma", "Kurmi", "Lingayat", "Vellalar", "Mudaliar",
            "Pillai", "Vanniyar", "Aggarwal", "Arora", "Khatri", "Bania",
            "Sunni", "Shia", "Bohra", "Sheikh", "Syed", "Pathan",
            "Roman Catholic", "Protestant", "Orthodox", "Pentecostal",
            "Jat Sikh", "Ramgarhia", "Saini", "Bhatia",
            "Digambara", "Svetambara",
            "Mahayana", "Theravada", "Vajrayana",
            "Zoroastrian", "Irani",
            "No Caste", "Not Applicable", "Other", "Any"
          ]}
        />

        {/* Preferred Education */}
        <Select
          label="Preferred Education"
          name="preferredEducation"
          value={form.preferredEducation}
          onChange={handleChange}
          options={[
            "High School",
            "Graduate",
            "Post Graduate",
            "Doctorate",
            "Any"
          ]}
        />

        {/* Preferred Profession */}
        <Select
          label="Preferred Profession"
          name="preferredProfession"
          value={form.preferredProfession}
          onChange={handleChange}
          options={[
            "Software Engineer",
            "Doctor",
            "Teacher",
            "Business",
            "Government Job",
            "Self Employed",
            "Private Job",
            "Any"
          ]}
        />

        {/* Preferred Location */}
        <Select
          label="Preferred Location"
          name="preferredLocation"
          value={form.preferredLocation}
          onChange={handleChange}
          options={[
            "Same City",
            "Same State",
            "Anywhere in India",
            "Abroad",
            "Any"
          ]}
        />

      </Section>


      <div className="text-center pt-4 pb-8">
        <button
          onClick={handleSave}
          className="
            px-10 md:px-12 py-3 rounded-full 
            bg-gradient-to-r from-brandOrange to-orange-700 
            text-white font-bold 
            shadow-lg hover:scale-105 active:scale-95 transition
            w-full md:w-auto
          "
        >
          Save Changes
        </button>
      </div>

    </div>
  );
};

export default EditProfile;


/* ================= UI HELPERS ================= */

const Section = ({ title, children }) => (
  <div className="bg-brandBlue/80 backdrop-blur-xl border border-blue-200 rounded-2xl shadow-lg p-4 md:p-6">
    <h3 className="text-brandNavy font-bold mb-4 md:mb-6 text-lg">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {children}
    </div>
  </div>
);

const Input = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="text-sm font-semibold text-brandNavy">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      className="
        w-full mt-1 px-4 py-2 rounded-lg 
        border border-blue-200 
        bg-brandBlue/70 backdrop-blur-lg
        focus:outline-none focus:ring-2 
        focus:ring-brandOrange/50
      "
    />
  </div>
);
const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="text-sm font-semibold text-brandNavy">{label}</label>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      className="
        w-full mt-1 px-4 py-2 rounded-lg 
        border border-blue-200 bg-brandBlue/70 
        focus:outline-none focus:ring-2 
        focus:ring-brandOrange/50
      "
    >
      <option value="">Select {label}</option>
      {options.map((opt, i) => (
        <option key={i} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);
