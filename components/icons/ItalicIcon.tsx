import React from 'react';

interface IconProps {
  className?: string;
}

const ItalicIcon: React.FC<IconProps> = ({ className }) => (
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
      d="M10 4v16m4-16v16M6 4h12M6 20h12"
    />
  </svg>
);

export default ItalicIcon;
