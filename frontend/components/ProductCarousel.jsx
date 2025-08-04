'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import ProductCard from './ProductCard';

// Simple throttle utility outside component - no need for useCallback
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

export default function ProductCarousel({ 
  title, 
  icon, 
  products = [], 
  loading = false, 
  className = "mb-8",
  sourceContext = null
}) {
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Without it, useEffect would re-run on every render
  const updateScrollButtons = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  // Create throttled version once - this is the key optimization
  const throttledUpdateScrollButtons = useCallback(
    throttle(updateScrollButtons, 100),
    [updateScrollButtons]
  );

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      updateScrollButtons();
      carousel.addEventListener('scroll', throttledUpdateScrollButtons, { passive: true });
      window.addEventListener('resize', updateScrollButtons, { passive: true });
      
      return () => {
        carousel.removeEventListener('scroll', throttledUpdateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [products, updateScrollButtons, throttledUpdateScrollButtons]);

  const scrollLeft = () => {
    if (carouselRef.current && canScrollLeft) {
      carouselRef.current.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current && canScrollRight) {
      carouselRef.current.scrollTo({
        left: carouselRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  };

  // Don't render if no products and not loading
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold flex items-center mb-2">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      ) : (
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full transition-all duration-200 border ${
              canScrollLeft
                ? 'bg-white/85 backdrop-blur-sm hover:bg-white/95 border-gray-200/50 text-gray-600 cursor-pointer'
                : 'bg-gray-100/25 border-gray-200/20 text-gray-400 cursor-default'
            }`}
            aria-label="Scroll to beginning"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          
          {/* Right Arrow */}
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full transition-all duration-200 border ${
              canScrollRight
                ? 'bg-white/85 backdrop-blur-sm hover:bg-white/95 border-gray-200/50 text-gray-600 cursor-pointer'
                : 'bg-gray-100/25 border-gray-200/20 text-gray-400 cursor-default'
            }`}
            aria-label="Scroll to end"
          >
            <ChevronRightIcon className="size-4" />
          </button>

          <div 
            ref={carouselRef} 
            className="flex overflow-x-auto gap-5 pb-4 pt-2 px-2 scrollbar-optimized"
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex-none w-[160px] sm:w-[180px] md:w-[210px] lg:w-[235px] xl:w-[245px] 2xl:w-[255px]"
              >
                <ProductCard product={product} sourceContext={sourceContext} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 