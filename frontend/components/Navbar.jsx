'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserIcon, UserPlusIcon, LogOutIcon, PlusCircleIcon, HeartIcon, MessageSquareTextIcon, ShoppingCartIcon } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

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

  return (
    <div className="bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="navbar px-4 min-h-[4rem] justify-between">
          {/* LOGO */}
          <div className="flex-1 lg:flex-none">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <ShoppingCartIcon className="size-9 text-primary" />
                <span
                  className="font-semibold font-mono tracking-widest text-2xl 
                    bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
                >
                  r'mart
                </span>
              </div>
            </Link>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-4">
              {/* Conditional rendering based on authentication status */}
              {!isAuthenticated ? (
                <>
                  <Link href="/auth/login" className="btn btn-ghost btn-sm">
                    <UserIcon className="size-4 mr-1" />
                    Login
                  </Link>
                  <Link href="/auth/signup" className="btn btn-primary btn-sm">
                    <UserPlusIcon className="size-4 mr-1" />
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/add-listing" className="btn btn-primary btn-sm">
                    <PlusCircleIcon className="size-4 mr-1" />
                    Add Product
                  </Link>
                  
                  <Link href="/saved" className="btn btn-ghost btn-sm btn-circle">
                    <HeartIcon className="size-4" />
                  </Link>
                  
                  <Link href="/inbox" className="btn btn-ghost btn-sm btn-circle">
                    <MessageSquareTextIcon className="size-4" />
                  </Link>
                  
                  {user && (
                    <span className="text-sm font-medium">
                      Hello, {user.name}
                    </span>
                  )}
                  
                  <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                    <LogOutIcon className="size-4 mr-1" />
                    Logout
                  </button>
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar; 