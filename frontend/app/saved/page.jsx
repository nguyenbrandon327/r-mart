'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { BookmarkIcon } from 'lucide-react';
import { fetchSavedProducts } from '../../store/slices/savedProductsSlice';
import SavedProductGroup from '../../components/SavedProductGroup';
import AuthGuard from '../../components/AuthGuard';

export default function SavedPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  
  const { items: savedProducts, loading, error } = useSelector((state) => state.savedProducts);

  // Group products by user
  const groupedProducts = savedProducts.reduce((groups, product) => {
    const userId = product.user_id;
    if (!groups[userId]) {
      groups[userId] = {
        user: {
          id: product.user_id,
          name: product.user_name,
          user_name: product.user_name,
          user_email: product.user_email,
          user_profile_pic: product.user_profile_pic
        },
        products: []
      };
    }
    groups[userId].products.push(product);
    return groups;
  }, {});

  const groupedProductsArray = Object.values(groupedProducts);

  useEffect(() => {
    // Fetch saved products when component mounts
    dispatch(fetchSavedProducts());
  }, [dispatch]);

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center mb-2">
          <BookmarkIcon className="w-7 h-7 mr-2" />
          Saved Products
        </h1>
        <p className="text-gray-600">
          Products you've saved for later
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-8">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : savedProducts.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-80 space-y-4">
          <div className="bg-base-200 rounded-full p-6">
            <BookmarkIcon className="w-12 h-12" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">No saved products</h3>
            <p className="text-gray-600 max-w-sm">
              Browse the marketplace and save products you're interested in to see them here.
            </p>
          </div>
          <button 
            onClick={() => router.push('/')} 
            className="btn btn-primary"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedProductsArray.map((group) => (
            <SavedProductGroup 
              key={group.user.id} 
              user={group.user} 
              products={group.products} 
            />
          ))}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
