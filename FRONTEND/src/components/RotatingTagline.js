import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const taglines = [
  {
    text: 'The Search Engine for Sacred Bonds',
    subtext: 'Now the best matches for everyone, just one click away.'
  },
  {
    text: 'ಪವಿತ್ರ ಸಂಬಂಧಗಳ ಸರ್ಚ್ ಎಂಜಿನ್',
    subtext: 'ಈಗ ಎಲ್ಲರಿಗೂ ಅತ್ಯುತ್ತಮ ಜೋಡಿಗಳು, ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ.'
  },
  {
    text: 'पवित्र रिश्तों का सर्च इंजन',
    subtext: 'अब सभी के लिए सर्वोत्तम रिश्ते, बस एक क्लिक पर।'
  },
  {
    text: 'పవిత్ర బంధాల సెర్చ్ ఇంజిన్',
    subtext: 'ఇప్పుడు అందరికీ ఉత్తమ జతలు, ఒక్క క్లిక్‌లో.'
  },
  {
    text: 'புனித உறவுகளின் தேடுபொறி',
    subtext: 'இப்போது அனைவருக்கும் சிறந்த ஜோடிகள், ஒரே கிளிக்கில்.'
  },
  {
    text: 'പവിത്ര ബന്ധങ്ങളുടെ സെർച്ച് എഞ്ചിൻ',
    subtext: 'ഇപ്പോൾ എല്ലാവർക്കും മികച്ച ജോഡികൾ, ഒറ്റ ക്ലിക്കിൽ.'
  }
];

const RotatingTagline = ({ className = "", textColor = "text-brandRed" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % taglines.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`w-full max-w-xl mx-auto px-4 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Main tagline */}
          <h3 className={`text-lg md:text-xl font-bold leading-tight ${textColor}`}>
            {taglines[currentIndex].text}
          </h3>

          {/* Subtext */}
          <p className="text-gray-500 text-sm md:text-base mt-1 leading-snug">
            {taglines[currentIndex].subtext}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RotatingTagline;
