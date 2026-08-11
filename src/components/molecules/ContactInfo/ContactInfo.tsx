"use client";
import Location from '@/components/atoms/Icons/Location';
import EmailIcon from '@/components/atoms/Icons/Mail';
import PhoneIcon from '@/components/atoms/Icons/Phone';
import React from 'react';

const ContactInfoCard = () => {
  return (
    <div 
      className="max-w-full w-full sm:w-[268px] h-auto pt-[22px] pr-6 pb-[22px] pl-6 flex flex-col gap-6 rounded-[20px] border border-white/16"
    >
      <div className="flex items-center text-white">
        <div className="flex-shrink-0">
          <Location size={20}/>
        </div>
        <span className="text-sm ml-2">Canada, Ontario</span>
      </div>

      <div className="text-white flex items-center">
        <div className="flex-shrink-0">
          <PhoneIcon size={20} />
        </div>
        <span className="text-sm ml-2">+1 647-703-7821</span>
      </div>

      <div className="text-white flex items-start">
        <div className="flex-shrink-0 mt-1">
          <EmailIcon size={20}/>
        </div>
        <span className="text-sm ml-2 break-words overflow-hidden overflow-wrap-anywhere truncate-multi">excelprosocceracademy@gmail.com</span>
      </div>
    </div>
  );
};

export default ContactInfoCard;