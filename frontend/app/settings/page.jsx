'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { EditIcon, LogOutIcon, KeyIcon, UserIcon, SettingsIcon } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import { getCurrentUserProfile } from '../../store/slices/userSlice';
import EditProfileModal from '../../components/EditProfileModal';
import AuthGuard from '../../components/AuthGuard';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import Breadcrumb, { createBreadcrumbs } from '../../components/Breadcrumb';

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);
  const { currentUserProfile } = useSelector((state) => state.user);

  // Fetch current user profile if not loaded
  useEffect(() => {
    if (user && !currentUserProfile) {
      dispatch(getCurrentUserProfile());
    }
  }, [user, currentUserProfile, dispatch]);

  const handleEditProfile = () => {
    document.getElementById("edit_profile_modal").showModal();
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Error logging out');
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen">
        <EditProfileModal />
        <Toaster />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={createBreadcrumbs.custom([
              { label: 'Settings' }
            ])}
            className="mb-6"
          />
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="w-8 h-8 text-black" />
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <UserIcon className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Update your profile information, photo, and personal details.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEditProfile}
                className="btn btn-primary gap-2"
                disabled={isLoading}
              >
                <EditIcon className="w-4 h-4" />
                Edit Profile
              </motion.button>
            </motion.div>

            {/* Account Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <KeyIcon className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Account</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Manage your account security and authentication settings.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleForgotPassword}
                  className="btn btn-outline gap-2"
                >
                  <KeyIcon className="w-4 h-4" />
                  Reset Password
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="btn btn-error btn-outline gap-2"
                  disabled={isLoading}
                >
                  <LogOutIcon className="w-4 h-4" />
                  {isLoading ? 'Logging out...' : 'Logout'}
                </motion.button>
              </div>
            </motion.div>

            {/* User Info Display */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status:</span>
                    <span className="text-green-600 font-medium">
                      {user.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
