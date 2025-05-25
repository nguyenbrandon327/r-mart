'use client';

import Link from 'next/link';

export default function UserLink({ user, children, className = "", showProfilePic = false, profilePicSize = "w-10 h-10" }) {
  // Extract username from email
  const getUsername = (email) => {
    return email ? email.split('@')[0] : '';
  };

  // Get profile picture URL or fallback
  const getProfilePicture = (user) => {
    return user?.profile_pic || user?.user_profile_pic || null;
  };

  // Get user name
  const getUserName = (user) => {
    return user?.name || user?.user_name || 'Unknown User';
  };

  // Profile picture component
  const ProfilePicture = ({ user, size }) => {
    const profilePic = getProfilePicture(user);
    const userName = getUserName(user);
    
    if (profilePic) {
      return (
        <img
          src={profilePic}
          alt={`${userName}'s profile`}
          className={`${size} rounded-full object-cover`}
        />
      );
    } else {
      // Fallback to initials
      const initials = userName.charAt(0).toUpperCase();
      return (
        <div className={`${size} rounded-full bg-blue-500 flex items-center justify-center text-white font-medium`}>
          {initials}
        </div>
      );
    }
  };

  // Content to display
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {showProfilePic && (
        <ProfilePicture user={user} size={profilePicSize} />
      )}
      <span className="text-base font-medium">{children || getUserName(user)}</span>
    </div>
  );

  // If we have user data with email, create a profile link
  if (user && user.email) {
    const username = getUsername(user.email);
    return (
      <Link 
        href={`/profile/${username}`}
        className={`hover:text-blue-600 transition-colors ${showProfilePic ? '' : 'hover:underline'}`}
      >
        {content}
      </Link>
    );
  }

  // If we have user_email (from product queries), create a profile link
  if (user && user.user_email) {
    const username = getUsername(user.user_email);
    return (
      <Link 
        href={`/profile/${username}`}
        className={`hover:text-blue-600 transition-colors ${showProfilePic ? '' : 'hover:underline'}`}
      >
        {content}
      </Link>
    );
  }

  // If we have a username string, create a profile link
  if (typeof user === 'string') {
    return (
      <Link 
        href={`/profile/${user}`}
        className={`hover:text-blue-600 transition-colors ${showProfilePic ? '' : 'hover:underline'}`}
      >
        {content}
      </Link>
    );
  }

  // Fallback: just render the content without link
  return content;
} 