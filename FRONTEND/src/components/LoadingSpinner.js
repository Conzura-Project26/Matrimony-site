import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ fullScreen = false, text = "Loading..." }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-16 h-16 border-4 border-gray-200 border-t-brandOrange rounded-full mb-4"
                />
                <h3 className="text-brandNavy font-semibold animate-pulse">{text}</h3>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-8 h-8 border-2 border-gray-200 border-t-brandOrange rounded-full mb-2"
            />
            {text && <span className="text-xs text-gray-500">{text}</span>}
        </div>
    );
};

export default LoadingSpinner;
