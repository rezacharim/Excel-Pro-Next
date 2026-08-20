import React from 'react';
// import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-600 text-sm mb-2 md:mb-0">
            Copyright © {new Date().getFullYear()} <span className="font-bold">Excel Pro</span>.
          </div>
          
          {/* <div className="flex space-x-6">
            <Link href="/privacy-policy" className="text-gray-600 hover:text-gray-800 text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="text-gray-600 hover:text-gray-800 text-sm">
              Terms & Conditions
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;