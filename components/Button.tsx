
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-12 px-6";

    const variantClasses = {
      default: 'text-white transition-all duration-300 transform hover:-translate-y-px',
      outline: 'border border-purple-500 text-purple-300 bg-transparent hover:bg-purple-500 hover:text-white',
      ghost: 'hover:bg-gray-100 hover:text-gray-900',
    };
    
    const defaultGradient = variant === 'default' ? {
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
    } : {};

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        ref={ref}
        style={defaultGradient}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
