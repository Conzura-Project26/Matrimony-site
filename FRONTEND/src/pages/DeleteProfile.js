import React, { useState } from "react";

const DeleteProfile = () => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const handleDelete = () => {
    if (!reason) {
      alert("Please select a reason before deleting your profile.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your profile?"
    );

    if (!confirmDelete) return;

    localStorage.removeItem("userProfile");
    alert("Your profile has been deleted successfully.");
    window.location.href = "/";
  };

  return (
    <div className="w-full px-4 md:px-12 mt-4 md:mt-8 flex justify-center">
      <div
        className="
          w-full max-w-4xl
          bg-brandBlue/80 backdrop-blur-xl
          border border-blue-200
          rounded-3xl shadow-xl
          p-6 md:p-12
        "
      >
        {/* Title */}
        <h2 className="text-center text-xl md:text-2xl font-bold text-black-500 mb-6 md:mb-10">
          We Would Like to Know Why You Want to <br className="hidden md:block" /> Delete Your Profile?
        </h2>

        {/* Reason Selection */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-12 mb-8">
          <label
            className={`
              flex items-center gap-3 cursor-pointer px-6 py-3 rounded-full 
              border transition
              ${reason === "Married"
                ? "bg-orange-500 text-white border-orange-500 shadow-md"
                : "bg-brandBlue/70 text-blue-700 border-blue-200 hover:bg-blue-50"
              }
            `}
          >
            <input
              type="radio"
              name="reason"
              value="Married"
              checked={reason === "Married"}
              onChange={(e) => setReason(e.target.value)}
              className="hidden"
            />
            Married
          </label>

          <label
            className={`
              flex items-center gap-3 cursor-pointer px-6 py-3 rounded-full 
              border transition
              ${reason === "Other"
                ? "bg-orange-500 text-white border-orange-500 shadow-md"
                : "bg-brandBlue/70 text-blue-700 border-blue-200 hover:bg-blue-50"
              }
            `}
          >
            <input
              type="radio"
              name="reason"
              value="Other"
              checked={reason === "Other"}
              onChange={(e) => setReason(e.target.value)}
              className="hidden"
            />
            Other Reasons
          </label>
        </div>

        {/* Description */}
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="
            w-full h-28
            bg-brandBlue/70 backdrop-blur-lg
            border border-blue-200
            rounded-xl p-4
            text-sm text-blue-700
            focus:outline-none focus:ring-2 focus:ring-orange-400
            resize-none
          "
        />

        {/* Delete Button */}
        <div className="flex justify-center mt-12">
          <button
            onClick={handleDelete}
            className="
              px-14 py-3 rounded-full
              font-bold text-white
              bg-gradient-to-r from-orange-500 to-orange-600
              shadow-lg hover:scale-105 transition
            "
          >
            Delete Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProfile;