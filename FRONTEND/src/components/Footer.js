import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const navigate = useNavigate();

  const handleProtectedNavigation = (path) => {
    const role = localStorage.getItem("role");

    if (!role) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  return (
    <footer className="bg-brandNavy text-blue-100 mt-20 pt-16 pb-8 border-t-4 border-brandOrange">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <FaPhone className="text-brandOrange text-lg" />
              </div>
              <div>
                <h3 className="font-bold text-2xl text-white">Sarv<span className="text-brandOrange">Vivah</span></h3>
                <p className="text-xs text-brandOrange tracking-wider lowercase">One Platform. All Castes. One Life Partner.</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed opacity-80">
              Connecting hearts across all castes, religions and communities. Your perfect match is just a click away.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              {[FaFacebook, FaInstagram, FaYoutube].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center hover:bg-brandOrange hover:text-white transition-all duration-300">
                  <Icon className="text-sm" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-brandOrange rounded-full"></span>
              Explore
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm hover:text-brandOrange transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-brandOrange rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  Home
                </Link>
              </li>
              <li>
                <button onClick={() => handleProtectedNavigation('/search')} className="text-sm hover:text-brandOrange transition-colors flex items-center gap-2 group text-left">
                  <span className="w-1.5 h-1.5 bg-brandOrange rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  Search Matches
                </button>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-brandOrange rounded-full"></span>
              My Account
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-sm hover:text-brandOrange transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-brandOrange rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm hover:text-brandOrange transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-brandOrange rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  Register
                </Link>
              </li>
              <li>
                <button onClick={() => handleProtectedNavigation('/dashboard')} className="text-sm hover:text-brandOrange transition-colors flex items-center gap-2 group text-left">
                  <span className="w-1.5 h-1.5 bg-brandOrange rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  My Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-brandOrange rounded-full"></span>
              Get in Touch
            </h4>
            <div className="bg-blue-900/30 p-4 rounded-xl border border-blue-800 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <FaMapMarkerAlt className="text-brandOrange" />
                <span>India</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FaEnvelope className="text-brandOrange" />
                <a href="mailto:support@sarvvivah.com" className="hover:text-white">support@sarvvivah.com</a>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-800/50">
                <p className="text-xs text-brandOrange mb-2 font-semibold">Subscribe to Newsletter</p>
                <div className="flex gap-2">
                  <input type="email" placeholder="Email" className="bg-blue-950/50 border border-blue-800 text-white px-3 py-1.5 rounded text-xs flex-1 focus:border-brandOrange outline-none" />
                  <button className="bg-brandOrange text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-orange-600 transition-colors">Go</button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-70">
          <p>© 2026 SarvVivah. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
          <p className="font-mono">Designed by Conzura Groups</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;