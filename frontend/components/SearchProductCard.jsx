'use client';

import Link from "next/link";
import Image from "next/image";

function SearchProductCard({ product }) {
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
      'tickets': 'Tickets',
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
    <Link href={`/product/${product.slug || product.id}`}>
      <div className="bg-transparent rounded-none cursor-pointer border-2 border-transparent hover:border-gray-500 transition-all duration-300 -m-1 p-1">
        {/* PRODUCT IMAGE */}
        <figure className="relative aspect-square mb-0 rounded-md overflow-hidden">
          <Image
            src={getCoverImage()}
            alt={product.name}
            fill
            className="object-cover rounded-md"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        </figure>

        <div className="px-0">
          {/* PRODUCT INFO */}
          <div className="flex items-start justify-between mt-1">
            <h2 className="text-xl font-semibold text-black truncate overflow-hidden whitespace-nowrap w-full">
              {product.name}
            </h2>
          </div>
          <p className="text-xl font-normal text-black">${Number(product.price).toFixed(2)}</p>
          
          {/* Show description if available */}
          {product.description && (
            <p className="text-sm text-base-content/70 mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default SearchProductCard; 