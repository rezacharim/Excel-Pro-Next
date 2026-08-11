import { NextPage } from "next";


// Tag Component (Reusable atom-level component for displaying program tag like 'Popular' or 'Off')
export const Tag: NextPage<{ icon: React.ReactNode; text: string; className: string }> = ({ icon, text, className }) => {
    return (
      <div className={`absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-[#BDBDBD52] ${className}`}>
        {icon}
        <span className="text-sm font-medium">{text}</span>
      </div>
    );
  };
  