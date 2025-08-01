'use client';

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
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
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-left text-white max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3" dangerouslySetInnerHTML={{__html: "Looking to declutter <br/>before Fall quarter?"}}></h2>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Link 
                href={isAuthenticated ? "/add-listing" : "/auth/login"}
                className="btn btn-md bg-white text-black border-white hover:bg-gray-100 hover:border-gray-100"
              >
                Sell Now
              </Link>
              <Link 
                href="/landing"
                className="text-white hover:text-gray-200 hover:underline transition-colors duration-200 text-sm"
              >
                Learn More
              </Link>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Browse All Listings Button */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex justify-center">
          <Link 
            href="/all-products"
            className="px-8 py-4 bg-gradient-to-r from-[#003DA5] to-[#0056d9] text-white font-semibold text-lg hover:from-[#002b7a] hover:to-[#0044b8] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{ borderRadius: '0px' }}
          >
            Browse All Listings
          </Link>
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