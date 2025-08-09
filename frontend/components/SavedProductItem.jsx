'use client';

import { useDispatch } from 'react-redux';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2Icon } from 'lucide-react';
import { unsaveProduct } from '../store/slices/savedProductsSlice';

const SavedProductItem = ({ product }) => {
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
    } catch (error) {
      console.error('Failed to remove saved product:', error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row hover:bg-gray-50 transition-colors rounded-lg">
      <Link href={`/product/${product.slug || product.id}`} className="flex flex-col md:flex-row flex-1">
        {/* Product image */}
        <div className="md:w-40 h-40 md:h-40 flex-shrink-0 relative">
          <Image
            src={getCoverImage()}
            alt={product.name}
            fill
            className="object-cover"
            sizes="160px"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        </div>
        
        {/* Product details */}
        <div className="flex-1 p-4 md:pl-4 md:py-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between h-full">
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-1">{product.name}</h4>
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">{product.description}</p>
              <p className="text-lg font-bold text-black">${Number(product.price).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Remove button */}
      <div className="flex items-center justify-end p-4 md:pl-0">
        <button 
          onClick={handleRemove}
          className="flex items-center text-red-500 hover:text-red-700 transition-colors text-sm"
        >
          <Trash2Icon className="w-4 h-4 mr-1" />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
};

export default SavedProductItem; 