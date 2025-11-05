import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">

          {/* Left Section - Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-900 dark:bg-neutral-100 rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-gray-900 font-bold text-lg">C</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Clara Platform</p>
              <p className="text-xs text-muted-foreground">by Mebit</p>
            </div>
          </div>

          {/* Center Section - Links */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <div className="flex items-center space-x-6">
              <Link
                to="/privacy-policy"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-600 dark:hover:text-neutral-400 transition-colors"
              >
                <Shield className="w-4 h-4 mr-1.5" />
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-600 dark:hover:text-neutral-400 transition-colors"
              >
                <FileText className="w-4 h-4 mr-1.5" />
                Terms of Service
              </Link>
            </div>
            <Link
              to="/privacy-policy#ccpa"
              className="text-xs text-muted-foreground hover:text-gray-600 dark:hover:text-neutral-400 transition-colors underline"
            >
              Do Not Sell My Personal Information
            </Link>
          </div>

          {/* Right Section - Copyright */}
          <div className="text-center md:text-right">
            <p className="text-xs text-muted-foreground">
              © {currentYear} Mebit. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              @mebit.io exclusive access
            </p>
          </div>
        </div>

        {/* Additional Info Row */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-center text-muted-foreground/80">
            Internal collaboration platform for Mebit employees and authorized personnel only
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
