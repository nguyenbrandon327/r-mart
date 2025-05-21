'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { BookmarkIcon, PackageIcon, RefreshCwIcon } from 'lucide-react';
import { fetchSavedProducts } from '../../store/slices/savedProductsSlice';
import SavedProductCard from '../../components/SavedProductCard';

export default function SavedPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  
  const { items: savedProducts, loading, error } = useSelector((state) => state.savedProducts);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    // Fetch saved products
    dispatch(fetchSavedProducts());
  }, [dispatch, isAuthenticated, router]);

  const handleRefresh = () => {
    dispatch(fetchSavedProducts());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center mb-2">
            <BookmarkIcon className="w-7 h-7 mr-2" />
            Saved Products
          </h1>
          <p className="text-gray-600">
            Products you've saved for later
          </p>
        </div>
        
        <button 
          onClick={handleRefresh} 
          className="btn btn-outline btn-primary"
          disabled={loading}
        >
          <RefreshCwIcon className={`w-5 h-5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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
          {savedProducts.map((product) => (
            <SavedProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
