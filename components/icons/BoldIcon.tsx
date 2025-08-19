import React from 'react';

interface IconProps {
  className?: string;
}

const BoldIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4v16m-4-8h8m-8-5h7a4 4 0 010 8h-7"
    />
  </svg>
);

export default BoldIcon;
