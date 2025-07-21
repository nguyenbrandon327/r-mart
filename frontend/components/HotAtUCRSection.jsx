'use client';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';

export default function HotAtUCRSection() {
  const [products, setProducts] = useState([]);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    axios
      .get('/api/products/hot?limit=10', { withCredentials: true })
      .then(res => setProducts(res.data.data ?? []))
      .catch(console.error);
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (!products.length) return null;

  return (
    <section className="my-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span>🔥</span> Hot at UCR
        </h2>
        <div className="flex gap-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(p => (
          <div key={p.id} className="flex-shrink-0 w-48">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
} 