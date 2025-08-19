import React from 'react';

interface IconProps {
  className?: string;
}

const AlignRightIcon: React.FC<IconProps> = ({ className }) => (
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
      d="M4 6h16M10 12h10M4 18h16"
    />
  </svg>
);

export default AlignRightIcon;
