"use client";


// icons
import InstagramIcon from '@/components/atoms/Icons/InstagramIcon';
import Location from '@/components/atoms/Icons/Location';
import EmailIcon from '@/components/atoms/Icons/Mail';
import PhoneIcon from '@/components/atoms/Icons/Phone';
import Link from 'next/link';


const TopBar = () => {
  return (
    <div className="w-full bg-secondary py-2 px-6 lg:px-14 md:px-8 text-white">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          {/* Left side - Contact Information */}
          <div className="flex flex-wrap items-center gap-x-3 md:gap-x-6 text-sm">
            <div className="flex items-center">
              <Location size={16} />
              <span className="hidden sm:inline ml-1">Canada, Ontario</span>
              <span className="sm:hidden ml-1">Ontario</span>
            </div>
            
            <div className="hidden md:flex items-center">
              <EmailIcon size={16} />
              <span className="ml-1">excelprosocceracademy@gmail.com</span>
            </div>
            
            <div className="flex items-center">
              <PhoneIcon size={16} />
              <span className="ml-1">+1 647-703-7821</span>
            </div>
          </div>
          
          {/* Right side - Social Media Icons */}
          <div className="flex items-center gap-4">
            <Link href="https://www.instagram.com/excel.pro.soccer.academy?igsh=MWp5MjRvZWFvN3Jlaw==" aria-label="Instagram" className="hover:text-secondary-focus transition-colors">
              <InstagramIcon size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;