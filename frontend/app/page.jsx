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
    // Only fetch recently viewed products for authenticated users when auth check is complete
    if (!isCheckingAuth && isAuthenticated) {
      dispatch(fetchRecentlyViewedProducts(10));
    }
  }, [dispatch, isAuthenticated, isCheckingAuth]);

  useEffect(() => {
    // Fetch hot products
    setHotProductsLoading(true);
    axios
      .get('/api/products/hot?limit=10', { withCredentials: true })
      .then(res => {
        setHotProducts(res.data.data ?? []);
        setHotProductsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setHotProductsLoading(false);
      });
  }, []);

  useEffect(() => {
    // Fetch recently posted products
    setRecentProductsLoading(true);
    axios
      .get('/api/products/recent?limit=10', { withCredentials: true })
      .then(res => {
        setRecentProducts(res.data.data ?? []);
        setRecentProductsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setRecentProductsLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative w-screen h-64 sm:h-72 md:h-80 lg:h-96 mb-8 sm:mb-12 overflow-hidden shadow-lg -mt-6 -ml-[50vw] left-1/2">
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
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="text-center sm:text-left text-white max-w-full sm:max-w-xs md:max-w-md lg:max-w-2xl mx-auto sm:mx-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 leading-tight" 
                  dangerouslySetInnerHTML={{__html: "Looking to declutter <br/>before Fall quarter?"}}></h2>
              <div className="flex flex-row gap-2 sm:gap-3 items-center justify-center sm:justify-start">
                <Link 
                  href={isAuthenticated ? "/add-listing" : "/auth/login"}
                  className="btn btn-md sm:btn-lg bg-white text-black border-white hover:bg-gray-100 hover:border-gray-100 text-sm sm:text-base font-semibold px-6 sm:px-8"
                >
                  Sell Now
                </Link>
                <Link 
                  href="/landing"
                  className="text-white hover:text-gray-200 hover:underline transition-colors duration-200 text-sm sm:text-base"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Browse All Listings Button - Bottom Right */}
        <div className="absolute bottom-2 sm:bottom-4 w-full">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex justify-center sm:justify-end">
              <Link 
                href="/all-products"
                className="px-6 py-3 sm:px-6 sm:py-3 md:px-10 md:py-5 bg-gradient-to-r from-[#FFB81C] to-[#FFD700] text-white font-black font-gt-america-expanded tracking-tighter text-base sm:text-base md:text-xl hover:from-[#E6A600] hover:to-[#FFCC00] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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