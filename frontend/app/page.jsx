'use client';

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { HistoryIcon, ChevronsRightIcon, ChevronsLeftIcon, XCircleIcon } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { fetchRecentlyViewedProducts, clearRecentlyViewedProducts } from '../store/slices/recentlyViewedSlice';
import HotAtUCRSection from '../components/HotAtUCRSection';

export default function HomePage() {
  const dispatch = useDispatch();
  const { isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);
  const { products: recentlyViewedProducts, loading: recentlyViewedLoading } = useSelector((state) => state.recentlyViewed);
  const carouselRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image: "/banner1.jpg",
      title: "Made for students,<br/>by students",
      subtitle: "Buy and sell with other verified UCR students",
      buttonText: "Learn more",
      buttonStyle: "btn-warning",
      isLeftAligned: true
    },
    {
      id: 2,
      image: "/banner2.png",
      title: "Join our Discord Server",
      subtitle: "Connect with fellow UCR students and stay updated on the latest deals",
      buttonText: "Join Discord",
      buttonStyle: "btn-warning",
      isLeftAligned: true,
      isDiscord: true
    },
    {
      id: 3,
      title: "Start Selling Today",
      subtitle: "Join thousands of sellers and turn your items into cash",
      buttonText: "List Your Item",
      buttonStyle: "btn-accent",
      isGradient: true
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    // Only fetch recently viewed products for authenticated users when auth check is complete
    if (!isCheckingAuth && isAuthenticated) {
      dispatch(fetchRecentlyViewedProducts(10));
    }
  }, [dispatch, isAuthenticated, isCheckingAuth]);

  // Auto-rotate slides every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 100000);

    return () => clearInterval(interval);
  }, [slides.length]);

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
      {/* Hero Carousel */}
      <div className="relative w-full h-72 md:h-80 lg:h-88 mb-12 rounded-lg overflow-hidden shadow-lg">
        <div className="carousel w-full h-full">
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              className={`carousel-item relative w-full h-full transition-transform duration-500 ease-in-out ${
                index === currentSlide ? 'translate-x-0' : 
                index < currentSlide ? '-translate-x-full' : 'translate-x-full'
              }`}
              style={{ 
                position: 'absolute',
                transform: `translateX(${(index - currentSlide) * 100}%)`
              }}
            >
              {slide.isGradient ? (
                <div className="w-full h-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                  <div className="text-center text-white px-4">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">{slide.title}</h2>
                    <p className="text-lg md:text-xl mb-6">{slide.subtitle}</p>
                    <button className={`btn ${slide.buttonStyle} btn-lg`}>{slide.buttonText}</button>
                  </div>
                </div>
              ) : slide.isLeftAligned ? (
                <>
                  <img 
                    src={slide.image} 
                    className="w-full h-full object-cover" 
                    alt={slide.title}
                  />
                  <div 
                    className="absolute inset-0 flex items-center"
                    style={{
                      background: slide.isDiscord 
                        ? 'linear-gradient(to right, rgba(255, 184, 28, 0.9) 0%, rgba(255, 184, 28, 0.5) 40%, rgba(255, 184, 28, 0.2) 60%, transparent 75%)'
                        : 'linear-gradient(to right, rgba(0, 61, 165, 0.9) 0%, rgba(0, 61, 165, 0.5) 40%, rgba(0, 61, 165, 0.2) 60%, transparent 75%)'
                    }}
                  >
                    <div className="text-left text-white pl-16 md:pl-24 pr-8 md:pr-12 max-w-2xl ml-8 md:ml-16">
                      <h2 className="text-2xl md:text-3xl font-extrabold mb-3" dangerouslySetInnerHTML={{__html: slide.title}}></h2>
                      <p className="text-base md:text-lg mb-4">{slide.subtitle}</p>
                      <button 
                        className={`btn btn-md ${slide.isLeftAligned ? '' : slide.buttonStyle}`}
                        style={slide.isLeftAligned && !slide.isDiscord ? {
                          backgroundColor: '#FFB81C',
                          borderColor: '#FFB81C',
                          color: '#fff'
                        } : slide.isDiscord ? {
                          backgroundColor: '#5865F2',
                          borderColor: '#5865F2',
                          color: '#fff'
                        } : {}}
                        onClick={slide.isDiscord ? () => window.open('https://discord.gg/your-invite-code', '_blank') : undefined}
                      >
                        {slide.buttonText}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <img 
                    src={slide.image} 
                    className="w-full h-full object-cover" 
                    alt={slide.title}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <h2 className="text-3xl md:text-5xl font-bold mb-4">{slide.title}</h2>
                      <p className="text-lg md:text-xl mb-6">{slide.subtitle}</p>
                      <button className={`btn ${slide.buttonStyle} btn-lg`}>{slide.buttonText}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Carousel Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button 
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white scale-125 shadow-lg' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            >
              <span className="sr-only">Go to slide {index + 1}</span>
            </button>
          ))}
        </div>

        {/* Navigation arrows */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button 
            onClick={prevSlide}
            className="btn btn-circle btn-sm opacity-70 hover:opacity-100"
          >
            ❮
          </button> 
          <button 
            onClick={nextSlide}
            className="btn btn-circle btn-sm opacity-70 hover:opacity-100"
          >
            ❯
          </button>
        </div>
      </div>

      {/* 🔥 Hot listings */}
      <HotAtUCRSection />

      {/* Recently Viewed Products */}
      {renderRecentlyViewed()}
    </div>
  );
} 