'use client';

import React, { memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPinIcon } from "lucide-react";

function ProductCard({ product, sourceContext = null }) {
  // Memoize category lookup to avoid recreating object on every render
  const categoryLabel = useMemo(() => {
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
    
    return categories[product.category] || 'Uncategorized';
  }, [product.category]);

  // Memoize cover image calculation
  const coverImage = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return product.image || 'https://placehold.co/400x400?text=No+Image';
  }, [product.images, product.image]);

  // Memoize link href
  const linkHref = useMemo(() => {
    return sourceContext 
      ? `/product/${product.slug || product.id}?from=${sourceContext}`
      : `/product/${product.slug || product.id}`;
  }, [product.slug, product.id, sourceContext]);

  // Memoize price formatting
  const formattedPrice = useMemo(() => {
    return `$${Number(product.price).toFixed(2)}`;
  }, [product.price]);

  return (
    <Link href={linkHref}>
      <div className="bg-transparent rounded-none cursor-pointer border-2 border-transparent hover:border-gray-500 transition-all duration-300 -m-1 p-1">
        {/* PRODUCT IMAGE */}
        <figure className="relative aspect-square mb-0 rounded-md overflow-hidden">
          <Image
            src={coverImage}
            alt={product.name}
            fill
            className={`object-cover rounded-md ${product.is_sold ? 'opacity-60' : ''}`}
            sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, (max-width: 1024px) 210px, (max-width: 1280px) 235px, (max-width: 1536px) 245px, 255px"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
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
            <h2 className="text-[clamp(0.95rem,1.6vw,1.125rem)] font-semibold text-black truncate overflow-hidden whitespace-nowrap w-full">{product.name}</h2>
          </div>
            <p className="text-[clamp(0.95rem,1.6vw,1.125rem)] font-normal text-black">{formattedPrice}</p>
          
          {/* LOCATION INFO - Only show if distance is available */}
            {product.distance !== undefined && (
            <div className="flex items-center text-[clamp(0.8rem,1.4vw,0.875rem)] text-gray-600 mt-1">
              <MapPinIcon className="w-4 h-4 mr-1" />
              <span>
                {product.distance < 0.1 
                  ? 'Very close' 
                  : `${product.distance} mi`}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(ProductCard, (prevProps, nextProps) => {
  // Custom comparison function to optimize re-rendering
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.is_sold === nextProps.product.is_sold &&
    prevProps.product.distance === nextProps.product.distance &&
    prevProps.sourceContext === nextProps.sourceContext &&
    JSON.stringify(prevProps.product.images) === JSON.stringify(nextProps.product.images)
  );
});