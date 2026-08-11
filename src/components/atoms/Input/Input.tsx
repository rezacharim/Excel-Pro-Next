import { ChangeEvent, forwardRef, ReactNode, useState } from "react";

export interface InputProps {
  id: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { 
      id, 
      name, 
      type = 'text', 
      value, 
      onChange, 
      onFocus, 
      onBlur, 
      placeholder, 
      disabled,
      icon,
      iconPosition = 'right'
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    
    const handleFocus = () => {
      setIsFocused(true);
      if (onFocus) onFocus();
    };
    
    const handleBlur = () => {
      setIsFocused(false);
      if (onBlur) onBlur();
    };
    
    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 ${
            isFocused && icon && iconPosition === 'left' ? 'pl-10' : ''
          } ${
            isFocused && icon && iconPosition === 'right' ? 'pr-10' : ''
          }`}
        />
        
        {isFocused && icon && (
          <div 
            className={`absolute inset-y-0 ${
              iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'
            } flex items-center pointer-events-none`}
          >
            {icon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';