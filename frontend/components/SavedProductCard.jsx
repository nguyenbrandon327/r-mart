'use client';

import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { Trash2Icon } from 'lucide-react';
import { unsaveProduct, fetchSavedProducts } from '../store/slices/savedProductsSlice';

const SavedProductCard = ({ product }) => {
  const dispatch = useDispatch();
  
  // Get cover image (first image in array or use fallback)
  const getCoverImage = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return product.image || 'https://placehold.co/400x400?text=No+Image';
  };

  const handleRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await dispatch(unsaveProduct(product.id)).unwrap();
      // Refresh the saved products list
      dispatch(fetchSavedProducts());
    } catch (error) {
      console.error('Failed to remove saved product:', error);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      {/* User info at the top */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
            {product.user_name ? product.user_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <span className="font-medium">{product.user_name || 'Unknown User'}</span>
          </div>
        </div>
      </div>
      
      {/* Main content area with image and product details */}
      <Link href={`/product/${product.id}`}>
        <div className="flex flex-col md:flex-row">
          {/* Product image on the left */}
          <div className="md:w-1/3 h-48 md:h-60">
            <img
              src={getCoverImage()}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Product details on the right */}
          <div className="p-4 md:w-2/3 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-2 line-clamp-3">{product.description}</p>
              <p className="text-xl font-bold text-blue-600">${Number(product.price).toFixed(2)}</p>
            </div>
            
            {/* Remove button at the bottom right */}
            <div className="flex justify-end mt-4">
              <button 
                onClick={handleRemove}
                className="flex items-center text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2Icon className="w-5 h-5 mr-1" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default SavedProductCard; 