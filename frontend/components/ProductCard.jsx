'use client';

import Link from "next/link";
import { MapPinIcon } from "lucide-react";

function ProductCard({ product }) {
  const getCategoryLabel = (category) => {
    const categories = {
      'clothes': 'Clothes',
      'tech': 'Tech',
      'textbooks': 'Textbooks',
      'furniture': 'Furniture',
      'kitchen': 'Kitchen',
      'food': 'Food',
      'vehicles': 'Vehicles',
      'housing': 'Housing',
      'rides': 'Rides',
      'renting': 'Renting',
      'merch': 'Merch',
      'other': 'Other',
      'in-searching-for': 'I\'m searching for'
    };
    
    return categories[category] || 'Uncategorized';
  };

  // Get cover image (first image in array or use legacy 'image' property as fallback)
  const getCoverImage = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return product.image || 'https://placehold.co/400x400?text=No+Image';
  };

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-transparent rounded-none cursor-pointer border-2 border-transparent hover:border-gray-500 transition-all duration-300 -m-1 p-1">
        {/* PRODUCT IMAGE */}
        <figure className="relative pt-[100%] mb-0 rounded-md overflow-hidden">
          <img
            src={getCoverImage()}
            alt={product.name}
            className={`absolute top-0 left-0 w-full h-full object-cover rounded-md ${product.is_sold ? 'opacity-60' : ''}`}
          />
          {/* SOLD RIBBON */}
          {product.is_sold && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 text-sm font-bold rounded-md shadow-lg transform rotate-12 z-10">
              SOLD
            </div>
          )}
        </figure>

        <div className="px-0">
          {/* PRODUCT INFO */}
          <div className="flex items-start justify-between mt-1">
            <h2 className="text-lg font-semibold text-black truncate overflow-hidden whitespace-nowrap w-full">{product.name}</h2>
          </div>
          <p className="text-lg font-normal text-black">${Number(product.price).toFixed(2)}</p>
          
          {/* LOCATION INFO - Only show if distance is available */}
          {product.distance !== undefined && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPinIcon className="w-4 h-4 mr-1" />
              <span>
                {product.distance < 0.1 
                  ? 'Very close' 
                  : `${product.distance} mi`}
                {product.seller_location && (
                  <span className="ml-1 text-gray-500">
                    • {product.seller_location}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;