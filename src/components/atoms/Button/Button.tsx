import { ButtonHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'white';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, disabled, type = 'button', variant = 'primary', ...props }, ref) => {
    const baseClasses = `
      border
      px-2 
      py-3
      lg:px-6
      md:px-6
      disabled:cursor-not-allowed
      disabled:opacity-50
      font-bold
      transition
    `;

    const variantClasses = {
      primary: 'bg-primary hover:bg-red-700 transition-all duration-500 text-white border-transparent',
      white: 'bg-white hover:bg-primary hover:border-primary hover:text-white transition-all duration-500 text-black border-[#D5D7DA]',
    };

    return (
      <button
        type={type}
        className={twMerge(baseClasses, variantClasses[variant], className)}
        disabled={disabled}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';