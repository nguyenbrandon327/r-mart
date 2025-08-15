'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { UserIcon, LogOutIcon, HeartIcon, MessageCircleMore, UserCircleIcon, ChevronDownIcon, PlusIcon, SearchIcon, MenuIcon, SettingsIcon } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import SearchBar from './SearchBar';
import MobileSearchModal from './MobileSearchModal';
import { useEffect, useState } from 'react';

function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const isHomePage = pathname === "/";
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.chat);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  // Debug logging to track unread count changes
  useEffect(() => {
    // Debug logs removed for production
  }, [unreadCount]);
  
  const handleLogout = async () => {
    try {
      await dispatch(logout());
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const closeDropdown = () => {
    // Close dropdown by removing focus from the trigger
    const dropdown = document.activeElement;
    if (dropdown) {
      dropdown.blur();
    }
  };

  // Helper function to get username from email
  const getUsername = (email) => {
    return email ? email.split('@')[0] : '';
  };

  const handleMobileSearch = () => {
    setIsMobileSearchOpen(true);
  };

  return (
    <div className="bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="navbar px-4 min-h-[4rem] justify-between">
          {/* LEFT SECTION - LOGO AND SEARCH */}
          <div className="flex items-center gap-1 flex-1">
            <div className="flex-none">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                  <Image 
                    src="/logo-pic.png" 
                    alt="R'mart Logo" 
                    width={48}
                    height={48}
                    className="object-contain"
                    priority
                  />
                  <span
                    className="font-black font-gt-america-expanded tracking-tighter text-2xl 
                      bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
                  >
                    r'mart
                  </span>
                </div>
              </Link>
            </div>
            
            {/* DESKTOP SEARCH BAR */}
            <div className="hidden md:block flex-1">
              <SearchBar />
            </div>

            {/* MOBILE SEARCH ICON */}
            <div className="md:hidden flex-1 flex justify-end mr-2">
              <button 
                onClick={handleMobileSearch}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <SearchIcon className="size-4" />
              </button>
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-4 flex-none">
              {/* Conditional rendering based on authentication status */}
              {!isAuthenticated ? (
                <>
                  <Link href="/auth/login" className="btn btn-ghost btn-sm rounded-none">
                    Login
                  </Link>
                  <Link href="/auth/signup" className="btn btn-primary btn-sm rounded-none">
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  {/* DESKTOP ACTION BUTTONS */}
                  <div className="hidden md:flex items-center gap-4">
                    <Link href="/add-listing" className="btn btn-primary rounded-none !h-10 !min-h-0 text-white">
                      <PlusIcon className="size-4" />
                      Create a Listing
                    </Link>
                    
                    <Link href="/saved" className="btn btn-ghost btn-sm btn-circle">
                      <HeartIcon className="size-4" />
                    </Link>
                    
                    <Link href="/inbox" className="btn btn-ghost btn-sm btn-circle relative">
                      <MessageCircleMore className="size-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-error text-error-content text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </div>

                  {/* MOBILE ACTION MENU */}
                  <div className="md:hidden">
                    <div className="dropdown dropdown-end">
                      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-circle">
                        <MenuIcon className="size-4" />
                      </div>
                      <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-0 w-52 p-2 shadow">
                        <li>
                          <Link href="/add-listing" onClick={closeDropdown}>
                            <PlusIcon className="size-4" />
                            Create a Listing
                          </Link>
                        </li>
                        <li>
                          <Link href="/saved" onClick={closeDropdown}>
                            <HeartIcon className="size-4" />
                            Saved Items
                          </Link>
                        </li>
                        <li>
                          <Link href="/inbox" className="relative" onClick={closeDropdown}>
                            <MessageCircleMore className="size-4" />
                            <span>Inbox</span>
                            {unreadCount > 0 && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-error text-error-content text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            )}
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Profile Picture Dropdown */}
                  {user && (
                    <div className="dropdown dropdown-end">
                      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm px-2 gap-1 flex items-center">
                        <div className="avatar">
                          <div className="w-8 h-8 rounded-full relative overflow-hidden">
                            <Image
                              src={user.profile_pic || "/profile-pic.png"}
                              alt={user.profile_pic ? `${user.name}'s profile` : "Default profile picture"}
                              fill
                              className="rounded-full object-cover"
                              sizes="32px"
                              loading="lazy"
                            />
                          </div>
                        </div>
                        <ChevronDownIcon className="size-3 hidden sm:block" />
                      </div>
                      <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-0 w-52 p-2 shadow">
                        <li className="menu-title">
                          <span>Hello, {user.name}</span>
                        </li>
                        <li>
                          <Link href={`/profile/${user.username || getUsername(user.email)}`} className="justify-between" onClick={closeDropdown}>
                            <span>Profile</span>
                            <UserIcon className="size-4" />
                          </Link>
                        </li>
                        <li>
                          <Link href={`/settings`} className="justify-between" onClick={closeDropdown}>
                            <span>Settings</span>
                            <SettingsIcon className="size-4" />
                          </Link>
                        </li>
                        <li>
                          <Link href="/terms" onClick={closeDropdown}>
                            <span>Terms of Service</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/privacy" onClick={closeDropdown}>
                            <span>Privacy Policy</span>
                          </Link>
                        </li>
                        <li>
                          <button onClick={handleLogout} className="justify-between">
                            <span>Logout</span>
                            <LogOutIcon className="size-4" />
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </>
              )}
          </div>
        </div>
      </div>
      
      {/* Mobile Search Modal */}
      <MobileSearchModal 
        isOpen={isMobileSearchOpen} 
        onClose={() => setIsMobileSearchOpen(false)} 
      />
    </div>
  );
}

export default Navbar; 