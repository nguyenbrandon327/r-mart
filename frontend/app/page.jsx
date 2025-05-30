'use client';

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { PackageIcon, ShoppingBagIcon, HistoryIcon, ChevronsRightIcon, ChevronsLeftIcon, XCircleIcon } from "lucide-react";
import { fetchProducts } from '../store/slices/productSlice';
import ProductCard from "../components/ProductCard";
import AddProductModal from "../components/EditProductModal";
import { fetchRecentlyViewedProducts, clearRecentlyViewedProducts } from '../store/slices/recentlyViewedSlice';

export default function HomePage() {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const { isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);
  const [activeSlide, setActiveSlide] = useState(1);
  const { products: recentlyViewedProducts, loading: recentlyViewedLoading } = useSelector((state) => state.recentlyViewed);
  const carouselRef = useRef(null);

  useEffect(() => {
    // Only fetch when auth check is complete
    if (!isCheckingAuth) {
      if (isAuthenticated) {
        // First fetch recently viewed products for authenticated users
        dispatch(fetchRecentlyViewedProducts(10));
      } else {
        // For non-authenticated users, fetch all products immediately
        dispatch(fetchProducts(false));
      }
    }
  }, [dispatch, isAuthenticated, isCheckingAuth]);

  useEffect(() => {
    // After recently viewed products are loaded, fetch products with exclusion
    if (isAuthenticated && !recentlyViewedLoading && !isCheckingAuth) {
      dispatch(fetchProducts(true));
    }
  }, [dispatch, isAuthenticated, recentlyViewedLoading, isCheckingAuth]);

  const goToSlide = (slideNumber) => {
    const slide = document.getElementById(`slide${slideNumber}`);
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      setActiveSlide(slideNumber);
    }
  };

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
    // Re-fetch products to show previously hidden items in "All Products"
    if (isAuthenticated && !isCheckingAuth) {
      dispatch(fetchProducts(true));
    }
  };

  const renderRecentlyViewed = () => {
    if (!isAuthenticated || recentlyViewedProducts.length === 0) {
      return null;
    }

    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold flex items-center mb-2">
              <HistoryIcon className="size-7 mr-2" />
              Recently Viewed
            </h2>
            <p className="text-base-content/70">
              Products you've recently checked out
            </p>
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
          <div className="relative group">
            <button 
              onClick={scrollLeft} 
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 btn btn-circle btn-sm opacity-80 hover:opacity-100 shadow-md"
            >
              <ChevronsLeftIcon className="size-4" />
            </button>
            
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
            
            <button 
              onClick={scrollRight} 
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 btn btn-circle btn-sm opacity-80 hover:opacity-100 shadow-md"
            >
              <ChevronsRightIcon className="size-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Carousel Banner */}
      <div className="w-full mb-8 overflow-hidden rounded-lg shadow-md">
        <div className="carousel w-full">
          <div id="slide1" className="carousel-item relative w-full">
            <div className="hero h-[300px] bg-cover bg-center" style={{ backgroundImage: 'url("/banner1.jpg")' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-blue-900/10 to-transparent" style={{ width: '90%' }}></div>
              <div className="hero-content justify-start w-full pl-20 pr-8">
                <div className="max-w-md">
                  <h2 className="text-4xl font-bold text-white">Made by students,<br />for students</h2>
                  <p className="py-4 text-white">Buy and sell goods with other verified UCR students</p>
                  <button className="btn btn-secondary">Join Now</button>
                </div>
              </div>
            </div>
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(3);
              }} className="btn btn-circle">❮</button> 
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(2);
              }} className="btn btn-circle">❯</button>
            </div>
          </div> 
          <div id="slide2" className="carousel-item relative w-full">
            <div className="hero h-[300px] bg-secondary text-secondary-content">
              <div className="hero-content text-center">
                <div className="max-w-lg">
                  <h2 className="text-4xl font-bold">New Arrivals</h2>
                  <p className="py-4">Check out our latest products just added to the store!</p>
                  <button className="btn btn-primary">Explore</button>
                </div>
              </div>
            </div>
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(1);
              }} className="btn btn-circle">❮</button> 
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(3);
              }} className="btn btn-circle">❯</button>
            </div>
          </div> 
          <div id="slide3" className="carousel-item relative w-full">
            <div className="hero h-[300px] bg-accent text-accent-content">
              <div className="hero-content text-center">
                <div className="max-w-lg">
                  <h2 className="text-4xl font-bold">Free Shipping</h2>
                  <p className="py-4">Free shipping on all orders above $50. Order now!</p>
                  <button className="btn btn-primary">Learn More</button>
                </div>
              </div>
            </div>
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(2);
              }} className="btn btn-circle">❮</button> 
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(1);
              }} className="btn btn-circle">❯</button>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Viewed Products */}
      {renderRecentlyViewed()}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center mb-2">
            <ShoppingBagIcon className="size-7 mr-2" />
            All Products
          </h1>
          <p className="text-base-content/70">
            Browse all available products in our marketplace
          </p>
        </div>
      </div>

      <AddProductModal />

      {error && <div className="alert alert-error mb-8">{error}</div>}

      {products.length === 0 && !loading && (
        <div className="flex flex-col justify-center items-center h-80 space-y-4">
          <div className="bg-base-200 rounded-full p-6">
            <PackageIcon className="size-12" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">No products found</h3>
            <p className="text-base-content/70 max-w-sm">
              Get started by adding your first product to the marketplace
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
} 