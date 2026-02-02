import React, { useState } from "react";

const PhotoGallery = () => {
  const oldProfile = JSON.parse(localStorage.getItem("userProfile")) || {};

  const [profilePhoto, setProfilePhoto] = useState(oldProfile.profilePhoto || null);
  const [profilePhotoStatus, setProfilePhotoStatus] = useState(oldProfile.profilePhotoStatus || 'Approved');
  const [gallery, setGallery] = useState(oldProfile.otherPhotos || []);

  // Change profile photo
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setProfilePhoto(base64String);
      setProfilePhotoStatus('Pending'); // Mandatory admin approval

      const updated = {
        ...oldProfile,
        profilePhoto: base64String,
        profilePhotoStatus: 'Pending',
        otherPhotos: gallery,
      };

      try {
        localStorage.setItem("userProfile", JSON.stringify(updated));

        // Sync with allUsers global list
        const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
        const userIndex = allUsers.findIndex(u => u.id === updated.id);
        if (userIndex > -1) {
          allUsers[userIndex] = updated;
        } else {
          allUsers.push(updated);
        }
        localStorage.setItem("allUsers", JSON.stringify(allUsers));

        alert("Photo uploaded! It will be visible once approved by admin.");
      } catch (err) {
        alert("Storage full. Profile photo might be too large. Try a smaller image.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload multiple gallery photos
  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const imageURLs = files.map((file) => URL.createObjectURL(file));
    const updatedGallery = [...gallery, ...imageURLs.map(url => ({ url, status: 'Pending' }))];
    setGallery(updatedGallery);

    const updated = {
      ...oldProfile,
      profilePhoto,
      profilePhotoStatus,
      otherPhotos: updatedGallery,
    };

    try {
      localStorage.setItem("userProfile", JSON.stringify(updated));

      // Sync with allUsers
      const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
      const userIndex = allUsers.findIndex(u => u.id === updated.id);
      if (userIndex > -1) {
        allUsers[userIndex] = updated;
      } else {
        allUsers.push(updated);
      }
      localStorage.setItem("allUsers", JSON.stringify(allUsers));
    } catch (err) {
      alert("Storage full. Please delete some photos before uploading more.");
    }
  };

  // Delete a photo
  const deletePhoto = (index) => {
    const updatedGallery = gallery.filter((_, i) => i !== index);
    setGallery(updatedGallery);

    const updated = {
      ...oldProfile,
      profilePhoto,
      profilePhotoStatus,
      otherPhotos: updatedGallery,
    };

    localStorage.setItem("userProfile", JSON.stringify(updated));

    // Sync with allUsers
    const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
    const userIndex = allUsers.findIndex(u => u.id === updated.id);
    if (userIndex > -1) {
      allUsers[userIndex] = updated;
    } else {
      allUsers.push(updated);
    }
    localStorage.setItem("allUsers", JSON.stringify(allUsers));
  };

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 space-y-6 md:space-y-10">

      {/* ================= PROFILE PHOTO ================= */}
      <div className="bg-brandBlue/80 backdrop-blur-xl border border-blue-200 rounded-2xl shadow-lg p-4 md:p-6">
        <h2 className="text-blue-700 font-bold mb-4 text-lg">Profile Photo</h2>

        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-orange-400 shadow-md">
            {profilePhoto ? (
              <div className="relative w-full h-full">
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                />
                {profilePhotoStatus === 'Pending' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-orange-600 px-2 py-0.5 rounded">Pending Approval</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-orange-500 font-semibold">
                No Photo
              </div>
            )}
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleProfilePhotoChange}
            />
            <span className="px-6 py-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow hover:scale-105 transition">
              Change Profile Photo
            </span>
          </label>
        </div>
      </div>

      {/* ================= GALLERY ================= */}
      <div className="bg-brandBlue/80 backdrop-blur-xl border border-blue-200 rounded-2xl shadow-lg p-4 md:p-6">
        <h2 className="text-blue-700 font-bold mb-4 text-lg">
          Photo Gallery (Upload Multiple)
        </h2>

        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleGalleryUpload}
          />
          <span className="inline-block mb-6 px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow hover:scale-105 transition">
            Upload Photos
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {gallery.length === 0 && (
            <p className="text-gray-500 col-span-4">
              No photos uploaded yet.
            </p>
          )}

          {gallery.map((img, i) => (
            <div
              key={i}
              className="relative group rounded-xl overflow-hidden border border-blue-200 shadow-md"
            >
              <img
                src={typeof img === 'string' ? img : img.url}
                alt="Gallery"
                className="w-full h-40 object-cover"
                onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
              />
              {(typeof img === 'object' && img.status === 'Pending') && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold uppercase bg-orange-600 px-2 py-1 rounded">Pending Approval</span>
                </div>
              )}

              {/* Delete Button */}
              <button
                onClick={() => deletePhoto(i)}
                className="
                  absolute top-2 right-2 
                  bg-red-600 text-white text-xs 
                  px-2 py-1 rounded-full 
                  opacity-0 group-hover:opacity-100 transition
                "
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default PhotoGallery;