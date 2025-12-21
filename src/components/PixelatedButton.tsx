import React, { useState } from 'react';
import { Link } from 'react-router-dom';

type PixelatedButtonProps = {
  /**
   * Button Link
   * @example "/events"
   */
  to: string;

  /**
   * Inactive Image
   */
  inactive: string;

  /**
   * Hover Image
   */
  hover: string;

  /**
   * Clicked Image
   */
  clicked: string;

  /**
   * Additional CSS Classes
   * @example "w-[140px]"
   */
  className?: string;

  /**
   * Image Alt Text
   */
  alt?: string;
};

const PixelatedButton: React.FC<PixelatedButtonProps> = ({
  to,
  inactive,
  hover,
  clicked,
  className = 'w-1/4',
  alt = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  return (
    <Link
      to={to}
      className={`relative block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
    >
      {/* Inactive */}
      <img
        src={inactive}
        alt={alt}
        className={`
          absolute inset-0 w-full h-auto pixelated select-none
          transition-opacity duration-300 ease-out
          ${!isHovered && !isActive ? 'opacity-100' : 'opacity-0'}
        `}
        draggable={false}
      />

      {/* Hover */}
      <img
        src={hover}
        alt={alt}
        className={`
          absolute inset-0 w-full h-auto pixelated select-none
          transition-opacity duration-300 ease-out
          ${isHovered && !isActive ? 'opacity-100' : 'opacity-0'}
        `}
        draggable={false}
      />

      {/* Clicked */}
      <img
        src={clicked}
        alt={alt}
        className={`
          absolute inset-0 w-full h-auto pixelated select-none
          transition-opacity duration-300 ease-out
          ${isActive ? 'opacity-100' : 'opacity-0'}
        `}
        draggable={false}
      />

      {/* Spacer (locks layout height) */}
      <img
        src={inactive}
        alt={alt}
        className="w-full h-auto opacity-0 pointer-events-none"
        draggable={false}
      />
    </Link>
  );
};

export default PixelatedButton;
