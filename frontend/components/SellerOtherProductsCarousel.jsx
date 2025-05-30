'use client';

import { useRef } from 'react';
import { ChevronsLeftIcon, ChevronsRightIcon, PackageIcon } from "lucide-react";
import ProductCard from "./ProductCard";

export default function SellerOtherProductsCarousel({ 
  products, 
  loading, 
  seller, 
  className = "" 
}) {
  const carouselRef = useRef(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  // Don't render if no products or still loading
  if (!products || products.length === 0) {
    return null;
  }

  // Get seller name
  const getSellerName = () => {
    return seller?.name || seller?.user_name || 'Seller';
  };

  return (
    <div className={`mt-16 mb-12 ${className}`}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold flex items-center mb-2">
            <PackageIcon className="size-7 mr-2" />
            {getSellerName()}'s Other Offers
          </h2>
          <p className="text-base-content/70">
            More products from this seller
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      ) : (
        <div className="relative group">
          {products.length > 1 && (
            <button 
              onClick={scrollLeft} 
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 btn btn-circle btn-sm opacity-80 hover:opacity-100 shadow-md"
            >
              <ChevronsLeftIcon className="size-4" />
            </button>
          )}
          
          <div 
            ref={carouselRef} 
            className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide hover:scrollbar-default"
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex-none w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 max-w-[calc(100%/5-1.2rem)]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          
          {products.length > 1 && (
            <button 
              onClick={scrollRight} 
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 btn btn-circle btn-sm opacity-80 hover:opacity-100 shadow-md"
            >
              <ChevronsRightIcon className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
} 