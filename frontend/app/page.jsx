'use client';

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import ProductCarousel from "../components/ProductCarousel";
import { fetchRecentlyViewedProducts } from '../store/slices/recentlyViewedSlice';

export default function HomePage() {
  const dispatch = useDispatch();
  const { isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);
  const { products: recentlyViewedProducts, loading: recentlyViewedLoading } = useSelector((state) => state.recentlyViewed);
  
  // Hot products state
  const [hotProducts, setHotProducts] = useState([]);
  const [hotProductsLoading, setHotProductsLoading] = useState(true);
  
  // Recently posted products state
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentProductsLoading, setRecentProductsLoading] = useState(true);

  useEffect(() => {
    // Fetch all product data in parallel
    const fetchAllProducts = async () => {
      // Always fetch hot and recent products
      setHotProductsLoading(true);
      setRecentProductsLoading(true);

      const apiCalls = [
        axios.get('/api/products/hot?limit=10', { withCredentials: true }),
        axios.get('/api/products/recent?limit=10', { withCredentials: true })
      ];

      try {
        const results = await Promise.allSettled(apiCalls);
        
        // Handle hot products result
        if (results[0].status === 'fulfilled') {
          setHotProducts(results[0].value.data.data ?? []);
        } else {
          console.error('Failed to fetch hot products:', results[0].reason);
          setHotProducts([]);
        }
        
        // Handle recent products result
        if (results[1].status === 'fulfilled') {
          setRecentProducts(results[1].value.data.data ?? []);
        } else {
          console.error('Failed to fetch recent products:', results[1].reason);
          setRecentProducts([]);
        }
      } catch (error) {
        console.error('Unexpected error fetching products:', error);
        setHotProducts([]);
        setRecentProducts([]);
      } finally {
        setHotProductsLoading(false);
        setRecentProductsLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  useEffect(() => {
    // Only fetch recently viewed products for authenticated users when auth check is complete
    if (!isCheckingAuth && isAuthenticated) {
      dispatch(fetchRecentlyViewedProducts(10));
    }
  }, [dispatch, isAuthenticated, isCheckingAuth]);

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative w-screen h-[clamp(16rem,24vw,24rem)] mb-[clamp(2rem,4vw,3rem)] overflow-hidden shadow-lg -mt-6 -ml-[50vw] left-1/2">
        <Image 
          src="/banner1.png" 
          alt="Made for students, by students"
          fill
          className="object-cover" 
          sizes="100vw"
          priority
        />
        <div 
          className="absolute inset-0 flex items-center"
          style={{
            background: 'linear-gradient(to right, rgba(0, 61, 165, 0.9) 0%, rgba(0, 61, 165, 0.6) 30%, rgba(0, 61, 165, 0.3) 50%, transparent 70%)'
          }}
        >
          <div className="w-full max-w-7xl mx-auto px-[clamp(0.75rem,2.5vw,2rem)]">
            <div className="text-center sm:text-left text-white max-w-full sm:max-w-xs md:max-w-md lg:max-w-2xl mx-auto sm:mx-0">
              <h2 className="text-[clamp(1.25rem,4.2vw,2.25rem)] font-extrabold mb-3 sm:mb-4 leading-tight" 
                  dangerouslySetInnerHTML={{__html: "Looking to declutter <br/>this Fall quarter?"}}></h2>
              <div className="flex flex-row gap-2 sm:gap-3 items-center justify-center sm:justify-start">
                <Link 
                  href={isAuthenticated ? "/add-listing" : "/auth/login"}
                  className="btn bg-white text-black border-white hover:bg-gray-100 hover:border-gray-100 text-[clamp(0.875rem,2vw,1rem)] font-semibold px-[clamp(1rem,2.5vw,2rem)] py-[clamp(0.5rem,1.2vw,0.875rem)]"
                >
                  Sell Now
                </Link>
                <Link 
                  href="/landing"
                  className="text-white hover:text-gray-200 hover:underline transition-colors duration-200 text-[clamp(0.875rem,1.8vw,1rem)]"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Browse All Listings Button - Bottom Right */}
        <div className="absolute bottom-2 sm:bottom-4 w-full">
          <div className="w-full max-w-7xl mx-auto px-[clamp(0.75rem,2.5vw,2rem)]">
            <div className="flex justify-center sm:justify-end">
              <Link 
                href="/all-listings"
                className="px-[clamp(1.5rem,3.5vw,2.5rem)] py-[clamp(0.75rem,2vw,1.25rem)] bg-gradient-to-r from-[#FFB81C] to-[#FFD700] text-white font-black font-gt-america-expanded tracking-tighter text-[clamp(1rem,2.8vw,1.25rem)] hover:from-[#E6A600] hover:to-[#FFCC00] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ borderRadius: '0px' }}
              >
                <span className="hidden sm:inline">BROWSE ALL LISTINGS</span>
                <span className="sm:hidden">BROWSE ALL</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Viewed Products */}
      {isAuthenticated && (
        <ProductCarousel
          title="Recently Viewed"
          icon="👁️"
          products={recentlyViewedProducts}
          loading={recentlyViewedLoading}
          sourceContext="home"
        />
      )}

      {/* 🔥 Hot listings */}
      <ProductCarousel
        title="Hot at UCR"
        icon="🔥"
        products={hotProducts}
        loading={hotProductsLoading}
        sourceContext="home"
      />

      {/* Just Posted listings */}
      <ProductCarousel
        title="Just Posted"
        icon="⚡"
        products={recentProducts}
        loading={recentProductsLoading}
        sourceContext="home"
      />
    </div>
  );
} 