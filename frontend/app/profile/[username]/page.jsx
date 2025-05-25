'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { getUserByUsername, clearViewedUserProfile, getCurrentUserProfile } from '../../../store/slices/userSlice';
import ProductCard from '../../../components/ProductCard';
import EditProfileModal from '../../../components/EditProfileModal';
import { EditIcon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { isAuthenticated, isCheckingAuth, user } = useSelector((state) => state.auth);
  const { viewedUserProfile, userProducts, isLoading, error, currentUserProfile } = useSelector((state) => state.user);

  // Helper function to extract username from email
  const getUsername = (email) => {
    return email ? email.split('@')[0] : '';
  };

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isCheckingAuth && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Fetch user profile if authenticated
    if (isAuthenticated && username) {
      dispatch(getUserByUsername(username));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearViewedUserProfile());
    };
  }, [username, isAuthenticated, isCheckingAuth, dispatch, router]);

  // Check if the current user is viewing their own profile
  const isOwnProfile = user && viewedUserProfile && getUsername(user.email) === username;

  // Fetch current user profile if viewing own profile and not already loaded
  useEffect(() => {
    if (isOwnProfile && !currentUserProfile) {
      dispatch(getCurrentUserProfile());
    }
  }, [isOwnProfile, currentUserProfile, dispatch]);

  const handleEditProfile = () => {
    document.getElementById("edit_profile_modal").showModal();
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show loading while fetching profile
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show error if user not found
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Show profile if user found
  if (!viewedUserProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen py-8">
      <EditProfileModal />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative">
            {/* Edit button for own profile */}
            {isOwnProfile && (
              <button
                onClick={handleEditProfile}
                className="absolute top-0 right-0 btn btn-circle btn-outline btn-sm"
                title="Edit Profile"
              >
                <EditIcon className="size-4" />
              </button>
            )}
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {viewedUserProfile.profile_pic ? (
                <img
                  src={viewedUserProfile.profile_pic}
                  alt={`${viewedUserProfile.name}'s profile`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center border-4 border-gray-200">
                  <span className="text-4xl text-gray-600">👤</span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {viewedUserProfile.name}
              </h1>
              <p className="text-xl text-gray-600 mb-4">
                @{getUsername(viewedUserProfile.email)}
              </p>
              
              {viewedUserProfile.description ? (
                <p className="text-gray-700 mb-4 max-w-2xl">
                  {viewedUserProfile.description}
                </p>
              ) : isOwnProfile ? (
                <p className="text-gray-500 italic mb-4 max-w-2xl">
                  No bio yet. Click the edit button to add one!
                </p>
              ) : null}
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>Joined {formatDate(viewedUserProfile.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📦</span>
                  <span>{userProducts.length} listing{userProducts.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Listings by {viewedUserProfile.name}
          </h2>
          
          {userProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-400 mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-600">
                {viewedUserProfile.name} hasn't posted any items for sale.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {userProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
} 