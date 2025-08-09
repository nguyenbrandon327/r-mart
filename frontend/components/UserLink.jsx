'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { PROFILE_BLUR_DATA_URL } from '../utils/imageUtils';

export default function UserLink({ user, children, className = "", showProfilePic = false, profilePicSize = "w-10 h-10" }) {
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Extract username from email (fallback for backward compatibility)
  const getUsername = (email) => {
    return email ? email.split('@')[0] : '';
  };

  // Get the appropriate href based on authentication status
  const getHref = (username) => {
    return isAuthenticated ? `/profile/${username}` : '/auth/login';
  };

  // Get username from user object (prefers username field over email extraction)
  const getUsernameFromUser = (user) => {
    if (user.username) {
      return user.username;
    }
    if (user.user_username) {
      return user.user_username;
    }
    if (user.email) {
      return getUsername(user.email);
    }
    if (user.user_email) {
      return getUsername(user.user_email);
    }
    return null;
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
  const ProfilePicture = ({ user, size, forceDefault = false }) => {
    const profilePic = forceDefault ? null : getProfilePicture(user);
    const userName = getUserName(user);
    
    // Extract dimensions from size class (e.g., "w-10 h-10" -> 40px)
    const sizeMatch = size.match(/w-(\d+)/);
    const dimension = sizeMatch ? parseInt(sizeMatch[1]) * 4 : 40; // Convert Tailwind size to pixels
    
    return (
      <div className={`${size} relative rounded-full overflow-hidden`}>
        <Image
          src={profilePic || "/profile-pic.png"}
          alt={`${userName}'s profile`}
          fill
          className="rounded-full object-cover"
          sizes={`${dimension}px`}
          loading="lazy"
          placeholder="blur"
          blurDataURL={PROFILE_BLUR_DATA_URL}
        />
      </div>
    );
  };

  // Get display text based on authentication status
  const getDisplayText = () => {
    if (children) return children;
    
    if (isAuthenticated) {
      // For authenticated users, show both username and name
      const username = getUsernameFromUser(user);
      const name = getUserName(user);
      if (username && name && username !== name) {
        return `${name} (@${username})`;
      }
      return name;
    } else {
      // For non-authenticated users, show only username
      return `@${getUsernameFromUser(user) || getUserName(user)}`;
    }
  };

  // Content to display
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {showProfilePic && (
        <ProfilePicture 
          user={user} 
          size={profilePicSize} 
          forceDefault={!isAuthenticated}
        />
      )}
      <span className="text-base font-medium">{getDisplayText()}</span>
    </div>
  );

  // If we have user data, create a profile link
  if (user && typeof user === 'object') {
    const username = getUsernameFromUser(user);
    if (username) {
      return (
        <Link 
          href={getHref(username)}
          className={`hover:text-blue-600 transition-colors ${showProfilePic ? '' : 'hover:underline'}`}
        >
          {content}
        </Link>
      );
    }
  }

  // If we have a username string, create a profile link
  if (typeof user === 'string') {
    return (
      <Link 
        href={getHref(user)}
        className={`hover:text-blue-600 transition-colors ${showProfilePic ? '' : 'hover:underline'}`}
      >
        {content}
      </Link>
    );
  }

  // Fallback: just render the content without link
  return content;
} 