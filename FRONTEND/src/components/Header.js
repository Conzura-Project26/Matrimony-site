import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHeart, FaUser, FaBars } from 'react-icons/fa';
import MobileMenu from './MobileMenu';

const Header = ({ onLoginClick }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Is Home Page?
  const isHomePage = location.pathname === "/";

  return (
    <>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <header className={`absolute top-0 left-0 right-0 z-50 ${isHomePage ? 'bg-transparent' : 'bg-brandNavy shadow-lg text-white'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between min-h-16 py-4">

            {/* Logo and Tagline - Left */}
            <Link to="/" className="flex flex-col">
              <div className="flex items-baseline space-x-1">
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  <span className="text-brandOrange">
                    Sarv
                  </span>
                  <span className={`${isHomePage ? 'text-brandNavy' : 'text-white'} text-xl md:text-2xl ml-1 font-bold`}>Vivah.com</span>
                </h1>
                <FaHeart className="text-brandOrange text-lg md:text-xl -ml-1 -mt-1" />
              </div>
              <p className={`${isHomePage ? 'text-gray-700' : 'text-blue-100'} text-base md:text-lg font-medium mt-1 leading-tight`}>
                One Platform. All Castes. One Life Partner.
              </p>
            </Link>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {!isHomePage && (
                <button
                  onClick={onLoginClick}
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-600 transition-colors font-semibold py-2 bg-transparent border-none cursor-pointer"
                >
                  <FaUser className={`text-lg ${isHomePage ? 'text-gray-700' : 'text-white'}`} />
                  <span className={`${isHomePage ? 'text-gray-700' : 'text-white'}`}>Login</span>
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`md:hidden p-2 rounded-lg transition ${isHomePage ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-blue-900 text-white'}`}
                aria-label="Open menu"
              >
                <FaBars className="text-xl" />
              </button>
            </div>

          </div>
        </div>
      </header>
    </>
  );
};

export default Header;