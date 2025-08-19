import React from 'react';

interface IconProps {
  className?: string;
}

const HeadingIcon: React.FC<IconProps> = ({ className }) => (
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
      d="M12 4v16m-4-8h8m-8-5h.01M16 4h.01M8 20h.01M16 20h.01"
    />
  </svg>
);

export default HeadingIcon;
