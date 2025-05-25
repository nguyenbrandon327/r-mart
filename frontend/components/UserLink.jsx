'use client';

import Link from 'next/link';

export default function UserLink({ user, children, className = "" }) {
  // Extract username from email
  const getUsername = (email) => {
    return email ? email.split('@')[0] : '';
  };

  // If we have user data with email, create a profile link
  if (user && user.email) {
    const username = getUsername(user.email);
    return (
      <Link 
        href={`/profile/${username}`}
        className={`hover:text-blue-600 hover:underline transition-colors ${className}`}
      >
        {children || user.name}
      </Link>
    );
  }

  // If we only have a user ID, create a profile link using ID
  if (user && user.id) {
    return (
      <Link 
        href={`/profile/user/${user.id}`}
        className={`hover:text-blue-600 hover:underline transition-colors ${className}`}
      >
        {children || user.name || 'Unknown User'}
      </Link>
    );
  }

  // If we have a username string, create a profile link
  if (typeof user === 'string') {
    return (
      <Link 
        href={`/profile/${user}`}
        className={`hover:text-blue-600 hover:underline transition-colors ${className}`}
      >
        {children || user}
      </Link>
    );
  }

  // Fallback: just render the children or user name without link
  return (
    <span className={className}>
      {children || (user && user.name) || 'Unknown User'}
    </span>
  );
} 