'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { getUserByUsername, clearViewedUserProfile, getCurrentUserProfile } from '../../../store/slices/userSlice';
import ProductCard from '../../../components/ProductCard';
import EditProfileModal from '../../../components/EditProfileModal';
import { EditIcon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import AuthGuard from '../../../components/AuthGuard';

export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { viewedUserProfile, userProducts, isLoading, error, currentUserProfile } = useSelector((state) => state.user);

  // Helper function to extract username from email
  const getUsername = (email) => {
    return email ? email.split('@')[0] : '';
  };

  // Check if the current user is viewing their own profile
  const isOwnProfile = user && viewedUserProfile && getUsername(user.email) === username;

  // First useEffect - fetch user profile
  useEffect(() => {
    // Fetch user profile
    if (username) {
      dispatch(getUserByUsername(username));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearViewedUserProfile());
    };
  }, [username, dispatch]);

  // Second useEffect - fetch current user profile if viewing own profile
  useEffect(() => {
    if (isOwnProfile && !currentUserProfile) {
      dispatch(getCurrentUserProfile());
    }
  }, [isOwnProfile, currentUserProfile, dispatch]);

  const handleEditProfile = () => {
    document.getElementById("edit_profile_modal").showModal();
  };

  // Show error if user not found
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
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
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AuthGuard>
      <div>
        <EditProfileModal />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
          {/* Left Column - User Information */}
          <div className="lg:col-span-1 lg:border-r lg:border-gray-200 lg:pr-8">
            <div className="bg-white rounded-lg p-6 sticky top-16 self-start">
              <div className="relative">
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
                <div className="flex justify-start mb-6">
                  {viewedUserProfile.profile_pic ? (
                    <img
                      src={viewedUserProfile.profile_pic}
                      alt={`${viewedUserProfile.name}'s profile`}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-4xl text-gray-600">👤</span>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {viewedUserProfile.name}
                  </h1>
                  
                  {viewedUserProfile.description ? (
                    <p className="text-gray-700 mb-6 text-sm leading-relaxed">
                      {viewedUserProfile.description}
                    </p>
                  ) : isOwnProfile ? (
                    <p className="text-gray-500 italic mb-6 text-sm">
                      No bio yet. Click the edit button to add one!
                    </p>
                  ) : null}
                  
                  <div className="space-y-3 text-sm text-gray-500">
                    {viewedUserProfile.year && (
                      <>
                        <div className="flex items-center justify-start gap-2">
                          <span>🎓</span>
                          <span>{viewedUserProfile.year}</span>
                        </div>
                        {viewedUserProfile.major && (
                          <div className="flex items-center justify-start gap-2">
                            <span>📚</span>
                            <span>{viewedUserProfile.major}</span>
                          </div>
                        )}
                      </>
                    )}
                    {viewedUserProfile.show_location_in_profile && (
                      <div className="flex items-center justify-start gap-2">
                        <span>📍</span>
                        <span>
                          {viewedUserProfile.location_type === 'on_campus' 
                            ? (viewedUserProfile.campus_location_name || 'On-campus')
                            : viewedUserProfile.location_type === 'off_campus' 
                              ? 'Off-campus'
                              : 'UCR Campus'
                          }
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-start gap-2">
                      <span>📅</span>
                      <span>Joined {formatDate(viewedUserProfile.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-start gap-2">
                      <span>📦</span>
                      <span>{userProducts.length} listing{userProducts.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Listings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6">
              {userProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl text-gray-400 mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                  <p className="text-gray-600">
                    {viewedUserProfile.name} hasn't posted any items for sale.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {userProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
    </AuthGuard>
  );
} 