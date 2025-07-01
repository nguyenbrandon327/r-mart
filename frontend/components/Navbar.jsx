'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserIcon, UserPlusIcon, LogOutIcon, PlusCircleIcon, HeartIcon, MessageSquareTextIcon, UserCircleIcon, ChevronDownIcon } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import SearchBar from './SearchBar';

function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const isHomePage = pathname === "/";
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
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

  return (
    <div className="bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="navbar px-4 min-h-[4rem] justify-between">
          {/* LEFT SECTION - LOGO AND SEARCH */}
          <div className="flex items-center gap-1 flex-1">
            <div className="flex-none">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                  <img 
                    src="/logo-pic.png" 
                    alt="R'mart Logo" 
                    className="size-12 object-contain"
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
            
            {/* SEARCH BAR */}
            <SearchBar />
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
                  <Link href="/add-listing" className="btn btn-primary btn-sm rounded-none">
                    <PlusCircleIcon className="size-4 mr-1" />
                    Add a Listing
                  </Link>
                  
                  <Link href="/saved" className="btn btn-ghost btn-sm btn-circle">
                    <HeartIcon className="size-4" />
                  </Link>
                  
                  <Link href="/inbox" className="btn btn-ghost btn-sm btn-circle">
                    <MessageSquareTextIcon className="size-4" />
                  </Link>
                  
                  {/* Profile Picture Dropdown */}
                  {user && (
                    <div className="dropdown dropdown-end">
                      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm px-2 gap-1 flex items-center">
                        <div className="avatar">
                          <div className="w-8 rounded-full">
                            {user.profile_pic ? (
                              <img
                                src={user.profile_pic}
                                alt={`${user.name}'s profile`}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                <UserCircleIcon className="size-6 text-base-content/70" />
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronDownIcon className="size-3" />
                      </div>
                      <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-0 w-52 p-2 shadow">
                        <li className="menu-title">
                          <span>Hello, {user.name}</span>
                        </li>
                        <li>
                          <Link href={`/profile/${getUsername(user.email)}`} className="justify-between" onClick={closeDropdown}>
                            <span>Profile</span>
                            <UserIcon className="size-4" />
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
    </div>
  );
}

export default Navbar; 