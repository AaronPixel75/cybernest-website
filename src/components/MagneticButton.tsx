import React, { useRef, useState } from 'react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
}

/**
 * MotionSites Asymmetric Magnetic Pull:
 * Pulls toward cursor with 0.25s ease-out, settles back smoothly with 0.55s ease-in-out.
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 0.28,
  className = '',
  onMouseMove,
  onMouseLeave,
  ...rest
}) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [state, setState] = useState({ x: 0, y: 0, active: false });

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!prefersReducedMotion && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      setState({
        x: Math.max(-14, Math.min(14, dx * strength)),
        y: Math.max(-10, Math.min(10, dy * strength)),
        active: true,
      });
    }
    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setState({ x: 0, y: 0, active: false });
    onMouseLeave?.(e);
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${state.x}px, ${state.y}px, 0)`,
        transition: state.active
          ? 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)'
          : 'transform 560ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className={`group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B800] ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};
