import React from 'react';

const Button = ({ children, variant = 'default', size = 'default', className = '', onClick, disabled, type = 'button' }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    default: 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-300',
    secondary: 'bg-white dark:bg-neutral-800 text-black dark:text-white border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-neutral-600',
    ghost: 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300',
    destructive: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-600 dark:focus:ring-red-500',
    glass: '', // Glass variant uses custom styling below
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Glass variant with animated gradient border
  if (variant === 'glass') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`relative ${baseStyles} ${sizes[size]} text-gray-900 dark:text-white ${className}`}
      >
        {/* Animated gradient border - Light theme */}
        <div
          className="absolute inset-0 rounded-xl dark:hidden"
          style={{
            padding: '1px',
            background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0.03) 60%, rgba(0,0,0,0.12) 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            animation: 'rotateGradient 4s ease-in-out infinite',
          }}
        />
        {/* Animated gradient border - Dark theme */}
        <div
          className="absolute inset-0 rounded-xl hidden dark:block"
          style={{
            padding: '1px',
            background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.2) 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            animation: 'rotateGradient 4s ease-in-out infinite',
          }}
        />
        {/* Inner glass background - Light theme */}
        <div
          className="absolute inset-[1px] rounded-[11px] dark:hidden transition-all duration-200"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.98) 50%, rgba(255,255,255,0.95) 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
          }}
        />
        {/* Inner glass background - Dark theme */}
        <div
          className="absolute inset-[1px] rounded-[11px] hidden dark:block transition-all duration-200"
          style={{
            background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 50%, rgba(25,25,25,0.9) 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.4)',
          }}
        />
        {/* Content */}
        <span className="relative z-10 inline-flex items-center">{children}</span>
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
