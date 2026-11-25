import React from 'react';

interface BrandMarkProps {
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  variant = 'light',
  showWordmark = true,
  className = '',
}) => {
  const textColor = variant === 'light' ? 'text-[#FFFFFF]' : 'text-[#1A1A1A]';
  const strokeMain = variant === 'light' ? '#FFFFFF' : '#1A1A1A';

  return (
    <span className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Outer architectural hexagon */}
        <path
          d="M20 3L34.7224 11.5V28.5L20 37L5.27757 28.5V11.5L20 3Z"
          fill="#4C138E"
          stroke={strokeMain}
          strokeOpacity="0.28"
          strokeWidth="1.5"
        />
        {/* Inner nested geometric nest wing */}
        <path
          d="M20 9.5L29.1 14.75V25.25L20 30.5L10.9 25.25V14.75L20 9.5Z"
          stroke="#F5B800"
          strokeWidth="1.6"
        />
        {/* Central core vector & upward flight apex */}
        <path
          d="M14.5 22.5L20 14L25.5 22.5L20 20.2L14.5 22.5Z"
          fill="#F5B800"
        />
        <circle cx="20" cy="25.5" r="1.8" fill="#FFFFFF" />
      </svg>
      {showWordmark && (
        <span
          className={`font-display text-lg font-bold tracking-tight whitespace-nowrap ${textColor}`}
        >
          CyberNest
        </span>
      )}
    </span>
  );
};
