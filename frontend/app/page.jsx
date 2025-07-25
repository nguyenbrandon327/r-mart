'use client';

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { HistoryIcon, ChevronsRightIcon, ChevronsLeftIcon, XCircleIcon } from "lucide-react";
import Link from 'next/link';
import ProductCard from "../components/ProductCard";
import { fetchRecentlyViewedProducts, clearRecentlyViewedProducts } from '../store/slices/recentlyViewedSlice';
import HotAtUCRSection from '../components/HotAtUCRSection';

export default function HomePage() {
  const dispatch = useDispatch();
  const { isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);
  const { products: recentlyViewedProducts, loading: recentlyViewedLoading } = useSelector((state) => state.recentlyViewed);
  const carouselRef = useRef(null);

  useEffect(() => {
    // Only fetch recently viewed products for authenticated users when auth check is complete
    if (!isCheckingAuth && isAuthenticated) {
      dispatch(fetchRecentlyViewedProducts(10));
    }
  }, [dispatch, isAuthenticated, isCheckingAuth]);

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

  const handleClearHistory = () => {
    dispatch(clearRecentlyViewedProducts());
  };

  const renderRecentlyViewed = () => {
    if (!isAuthenticated || recentlyViewedProducts.length === 0) {
      return null;
    }

    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center mb-2">
              <HistoryIcon className="size-6 mr-2" />
              Recently Viewed
            </h2>
          </div>
          <button 
            onClick={handleClearHistory}
            className="btn btn-sm btn-outline"
          >
            <XCircleIcon className="size-4 mr-1" />
            Clear History
          </button>
        </div>

        {recentlyViewedLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <div>
            <div 
              ref={carouselRef} 
              className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide hover:scrollbar-default"
            >
              {recentlyViewedProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="flex-none w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 max-w-[calc(100%/5-1.2rem)]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative w-screen h-76 md:h-88 lg:h-96 mb-12 overflow-hidden shadow-lg -mt-6 -ml-[50vw] left-1/2">
        <img 
          src="/banner1.png" 
          className="w-full h-full object-cover" 
          alt="Made for students, by students"
        />
        <div 
          className="absolute inset-0 flex items-center"
          style={{
            background: 'linear-gradient(to right, rgba(0, 61, 165, 0.9) 0%, rgba(0, 61, 165, 0.5) 40%, rgba(0, 61, 165, 0.2) 60%, transparent 75%)'
          }}
        >
          <div className="text-left text-white pl-16 md:pl-24 pr-8 md:pr-12 max-w-2xl ml-8 md:ml-16">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3" dangerouslySetInnerHTML={{__html: "Made for students,<br/>by students"}}></h2>
            <p className="text-base md:text-lg mb-4">Buy and sell with other verified UCR students</p>
            <Link 
              href="/landing"
              className="btn btn-md"
              style={{
                backgroundColor: '#FFB81C',
                borderColor: '#FFB81C',
                color: '#fff'
              }}
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>

      {/* 🔥 Hot listings */}
      <HotAtUCRSection />

      {/* Recently Viewed Products */}
      {renderRecentlyViewed()}
    </div>
  );
} 