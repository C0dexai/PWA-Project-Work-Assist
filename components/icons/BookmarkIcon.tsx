import React from 'react';

interface IconProps {
  className?: string;
  filled?: boolean;
}

const BookmarkIcon: React.FC<IconProps> = ({ className, filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    fill={filled ? "currentColor" : "none"}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
    />
  </svg>
);

export default BookmarkIcon;
