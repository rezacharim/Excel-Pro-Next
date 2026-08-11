import React, { ForwardedRef, forwardRef } from "react";
import { NextPage } from "next";
import Image from "next/image";

interface PrimaryIconProps {
  number?: string | number;
  text?: string;
  icon: string;
  width?: number;
  height?: number;
  className?: string;
  variant?: "light" | "dark";
  fontWeight?: "bold" | "normal";
}

const PrimaryIcon: NextPage<PrimaryIconProps> = forwardRef(
  (
    {
      number,
      text,
      icon,
      width = 100,
      height = 100,
      className = "",
      variant = "light",
      fontWeight = "normal",
    }: PrimaryIconProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const textColor = variant === "light" ? "text-[#D4D4D4]" : "text-gray-600";

    const font = fontWeight === "bold" ? "font-bold" : "font-normal";

    return (
      <div ref={ref} className={`flex flex-col items-center`}>
        {/* Wrapper for the Icon with a circular shape */}
        <div
          className={`flex items-center justify-center w-[80px] h-[80px] rounded-full overflow-hidden bg-white mb-4 ${className}`}
        >
          <Image
            src={icon}
            alt={text || icon}
            width={width}
            height={height}
            className="object-contain"
            loading="lazy"
            quality="100"
          />
        </div>

        {/* Text Section */}
        <div className="text-center h-20 my-2">
          {number && (
            <span className="text-2xl font-bold text-red-500">{number}</span>
          )}
          {text && <p className={`my-2 ${font} ${textColor}`}>{text}</p>}
        </div>
      </div>
    );
  }
);

PrimaryIcon.displayName = "PrimaryIcon";

export default PrimaryIcon;
