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
      <ProductCarousel
        title="Hot at UCR"
        icon="🔥"
        products={hotProducts}
        loading={hotProductsLoading}
      />

      {/* Recently Viewed Products */}
      {isAuthenticated && (
        <ProductCarousel
          title="Recently Viewed"
          icon="👁️"
          products={recentlyViewedProducts}
          loading={recentlyViewedLoading}
        />
      )}
    </div>
  );
} 