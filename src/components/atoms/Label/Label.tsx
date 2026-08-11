import React from "react";

interface LabelProps {
  htmlFor: string;
  text: string;
  isFocused: boolean;
  hasValue?: boolean;
}

export const Label: React.FC<LabelProps> = ({ 
  htmlFor, 
  text, 
  isFocused, 
  hasValue = false 
}) => (
  <label
    htmlFor={htmlFor}
    className={`absolute transition-all duration-200 z-10 ${
      isFocused || hasValue
        ? 'text-xs -top-2.5 left-2 bg-white px-1 text-gray-600'
        : 'text-base text-gray-500 top-3 left-3 pointer-events-none'
    }`}
  >
    {text}
  </label>
);