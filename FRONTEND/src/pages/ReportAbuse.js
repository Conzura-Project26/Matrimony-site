import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaExclamationTriangle, FaArrowLeft, FaCheckCircle, FaHeart } from 'react-icons/fa';
import UserHeader from '../components/UserHeader';
import MobileMenu from '../components/MobileMenu';

const ReportAbuse = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [submitted, setSubmitted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Initial data from navigation state if available
    const initialState = location.state || {};

    const [formData, setFormData] = useState({
        category: 'Fake Profile',
        targetUserId: initialState.targetUserId || initialState.targetUserName || '',
        description: '',
        severity: 'Medium'
    });

    const categories = [
        'Fake Profile',
        'Inappropriate Photos',
        'Abusive Language',
        'Spam / Advertising',
        'Financial Fraud',
        'Other'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();

        // 1. Get existing reports
        const existingReports = JSON.parse(localStorage.getItem('reportedAbuse') || '[]');

        // 2. Create new report
        const newReport = {
            id: Date.now(),
            ...formData,
            status: 'Pending',
            timestamp: new Date().toISOString(),
            reportedBy: JSON.parse(localStorage.getItem('userProfile'))?.name || 'Anonymous'
        };

        // 3. Save to localStorage
        localStorage.setItem('reportedAbuse', JSON.stringify([newReport, ...existingReports]));

        // 4. Show success
        setSubmitted(true);
        setTimeout(() => navigate('/dashboard'), 3000);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-brandBlue flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
                    <FaCheckCircle className="text-6xl text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-brandNavy">Report Submitted</h2>
                    <p className="text-gray-600">
                        Thank you for helping us keep SarvVivah safe. Our moderation team will review your report shortly.
                    </p>
                    <p className="text-sm text-brandOrange font-medium">Redirecting to Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brandBlue pb-12">
            <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
            <UserHeader setMobileMenuOpen={setMobileMenuOpen} showBack={true} />

            <div className="max-w-2xl mx-auto pt-12 px-4">

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-brandNavy p-6 text-white">
                        <div className="flex items-center gap-3">
                            <FaExclamationTriangle className="text-brandOrange text-2xl" />
                            <h1 className="text-2xl font-bold">Report Abuse</h1>
                        </div>
                        <p className="text-blue-100 mt-2 text-sm">
                            Help us maintain a safe community by reporting suspicious or inappropriate behavior.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-brandNavy mb-2">Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-brandBlue/30 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brandOrange outline-none"
                                required
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-brandNavy mb-2">Reported Profile ID / Name (Optional)</label>
                            <input
                                type="text"
                                name="targetUserId"
                                value={formData.targetUserId}
                                onChange={handleChange}
                                placeholder="e.g. Rahul S. or OM1234X"
                                className="w-full bg-brandBlue/30 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brandOrange outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-brandNavy mb-2">Severity Level</label>
                            <div className="flex gap-4">
                                {['Low', 'Medium', 'High'].map(level => (
                                    <label key={level} className="flex-1">
                                        <input
                                            type="radio"
                                            name="severity"
                                            value={level}
                                            checked={formData.severity === level}
                                            onChange={handleChange}
                                            className="hidden peer"
                                        />
                                        <div className="text-center py-2 rounded-lg border border-gray-200 cursor-pointer peer-checked:bg-brandOrange peer-checked:text-white peer-checked:border-brandOrange transition">
                                            {level}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-brandNavy mb-2">Describe the Issue *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Please provide details about what happened..."
                                className="w-full bg-brandBlue/30 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brandOrange outline-none resize-none"
                                required
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-brandOrange text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                            Submit Report
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReportAbuse;
