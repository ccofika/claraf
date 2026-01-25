import React from 'react';

const GlassActions = ({ children, className = '' }) => {
  return (
    <div className={`relative flex items-center rounded-xl ${className}`}>
      {/* Animated gradient border - Light */}
      <div
        className="absolute inset-0 rounded-xl dark:hidden"
        style={{
          padding: '1px',
          background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0.03) 60%, rgba(0,0,0,0.1) 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          animation: 'rotateGradient 4s ease-in-out infinite',
        }}
      />
      {/* Animated gradient border - Dark */}
      <div
        className="absolute inset-0 rounded-xl hidden dark:block"
        style={{
          padding: '1px',
          background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.2) 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          animation: 'rotateGradient 4s ease-in-out infinite',
        }}
      />
      {/* Inner glass background - Light */}
      <div
        className="absolute inset-[1px] rounded-[11px] dark:hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.98) 50%, rgba(255,255,255,0.95) 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.06)',
        }}
      />
      {/* Inner glass background - Dark */}
      <div
        className="absolute inset-[1px] rounded-[11px] hidden dark:block"
        style={{
          background: 'linear-gradient(145deg, rgba(35,35,35,0.9) 0%, rgba(25,25,25,0.95) 50%, rgba(30,30,30,0.9) 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.3)',
        }}
      />
      {/* Content */}
      {children}
    </div>
  );
};

const GlassActionButton = ({ onClick, title, children, className = '', isFirst, isLast, variant = 'default' }) => {
  const baseClass = 'relative z-10 p-2 transition-colors inline-flex items-center';
  const roundedClass = isFirst ? 'rounded-l-[10px]' : isLast ? 'rounded-r-[10px]' : '';

  const variantClasses = {
    default: 'hover:bg-black/5 dark:hover:bg-white/10',
    danger: 'hover:bg-red-500/10 group/delete',
    success: 'hover:bg-green-500/10 group/success',
    primary: 'hover:bg-blue-500/10 group/primary',
    warning: 'hover:bg-amber-500/10 group/warning',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClass} ${roundedClass} ${variantClasses[variant]} ${className}`}
      title={title}
    >
      {children}
    </button>
  );
};

const GlassActionDivider = () => (
  <div className="relative z-10 w-px h-4 bg-gray-300/50 dark:bg-neutral-600/50" />
);

export { GlassActions, GlassActionButton, GlassActionDivider };
