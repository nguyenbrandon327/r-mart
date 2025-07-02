'use client';

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { PackageIcon, ShoppingBagIcon } from "lucide-react";
import { fetchProducts } from '../../store/slices/productSlice';
import ProductCard from "../../components/ProductCard";
import AddProductModal from "../../components/EditProductModal";

export default function AllProductsPage() {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const { isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      leftHalf: {
        category: "Clothes",
        image: "/clothes-hero.jpg"
      },
      rightHalf: {
        category: "Tech",
        image: "/tech-hero.jpg"
      }
    },
    {
      id: 2,
      leftHalf: {
        category: "Textbooks",
        image: "/books-hero.jpg"
      },
      rightHalf: {
        category: "Furniture",
        image: "/furniture-hero.jpg"
      }
    },
    {
      id: 3,
      leftHalf: {
        category: "Housing",
        image: "/housing-hero.jpg" // Using banner1 as placeholder for housing
      },
      rightHalf: {
        category: "Kitchen",
        image: "/kitchen-hero.jpg"
      }
    },
    {
      id: 4,
      leftHalf: {
        category: "Merch",
        image: "/merch-hero.jpg" // Using banner2 as placeholder for merch
      },
      rightHalf: {
        category: "Vehicles",
        image: "/vehicles-hero.jpg"
      }
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
    // Only fetch when auth check is complete
    if (!isCheckingAuth) {
      // Always fetch all products without exclusion on this page
      dispatch(fetchProducts(false));
    }
  }, [dispatch, isAuthenticated, isCheckingAuth]);

  // Auto-rotate slides every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div>
      {/* Hero Carousel */}
      <div className="relative w-full h-72 md:h-80 lg:h-88 mb-12 rounded-lg overflow-hidden shadow-lg">
        <div className="carousel w-full h-full">
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              className={`carousel-item relative w-full h-full transition-transform duration-500 ease-in-out`}
              style={{ 
                position: 'absolute',
                transform: `translateX(${(index - currentSlide) * 100}%)`
              }}
            >
              <div className="w-full h-full flex">
                {/* Left Half */}
                <div className="relative w-1/2 h-full">
                  <img 
                    src={slide.leftHalf.image} 
                    className="w-full h-full object-cover" 
                    alt={slide.leftHalf.category}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center">
                    <h3 className="text-white text-xl md:text-2xl lg:text-3xl font-black font-gt-america-expanded tracking-tight mb-4">
                      {slide.leftHalf.category}
                    </h3>
                    <button className="btn btn-sm px-4 py-1 bg-white text-black hover:bg-gray-100 border-none rounded-none text-xs">
                      Shop Now
                    </button>
                  </div>
                </div>
                
                {/* Right Half */}
                <div className="relative w-1/2 h-full">
                  <img 
                    src={slide.rightHalf.image} 
                    className="w-full h-full object-cover" 
                    alt={slide.rightHalf.category}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center">
                    <h3 className="text-white text-xl md:text-2xl lg:text-3xl font-black font-gt-america-expanded tracking-tight mb-4">
                      {slide.rightHalf.category}
                    </h3>
                    <button className="btn btn-sm px-4 py-1 bg-white text-black hover:bg-gray-100 border-none rounded-none text-xs">
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
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

      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center mb-2">
            <ShoppingBagIcon className="size-6 mr-2" />
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
