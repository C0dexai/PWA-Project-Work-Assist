
import React from 'react';

interface IconProps {
  className?: string;
}

const SpinnerIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v.01M12 21v-.01M4.22 4.22l.01.01M19.78 19.78l-.01-.01M3 12h.01M21 12h-.01M4.22 19.78l.01-.01M19.78 4.22l-.01.01"
    />
  </svg>
);

export default SpinnerIcon;
