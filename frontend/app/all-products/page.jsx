'use client';

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import Image from 'next/image';
import { 
  PackageIcon, 
  ShoppingBagIcon,
  SparklesIcon,
  MapPinIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon
} from "lucide-react";
import { fetchProducts, fetchProductsByLocation, setSort } from '../../store/slices/productSlice';
import ProductCard from "../../components/ProductCard";
import AddProductModal from "../../components/EditProductModal";
import Breadcrumb, { createBreadcrumbs } from "../../components/Breadcrumb";

const sortOptions = [
  { value: 'best_match', label: 'Best match', icon: SparklesIcon, description: 'Most relevant items' },
  { value: 'distance', label: 'Distance', icon: MapPinIcon, description: 'Closest to you' },
  { value: 'recent_first', label: 'Recent first', icon: ClockIcon, description: 'Newest listings' },
  { value: 'price_low_high', label: 'Price: Low to high', icon: ArrowUpIcon, description: 'Cheapest first' },
  { value: 'price_high_low', label: 'Price: High to low', icon: ArrowDownIcon, description: 'Most expensive first' }
];

// Helper function to convert category names to URL slugs
const getCategorySlug = (categoryName) => {
  const categoryMap = {
    'Clothes': 'clothes',
    'Tech': 'tech',
    'Textbooks': 'textbooks',
    'Furniture': 'furniture',
    'Kitchen': 'kitchen',
    'Vehicles': 'vehicles',
    'Housing': 'housing',
    'Merch': 'merch'
  };
  return categoryMap[categoryName] || categoryName.toLowerCase();
};

export default function AllProductsPage() {
  const dispatch = useDispatch();
  const { products, loading, error, sort } = useSelector((state) => state.products);
  const { isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Desktop slides (2 categories per slide)
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

  // Mobile slides (1 category per slide)
  const mobileSlides = [
    { id: 1, category: "Clothes", image: "/clothes-hero.jpg" },
    { id: 2, category: "Tech", image: "/tech-hero.jpg" },
    { id: 3, category: "Textbooks", image: "/books-hero.jpg" },
    { id: 4, category: "Furniture", image: "/furniture-hero.jpg" },
    { id: 5, category: "Housing", image: "/housing-hero.jpg" },
    { id: 6, category: "Kitchen", image: "/kitchen-hero.jpg" },
    { id: 7, category: "Merch", image: "/merch-hero.jpg" },
    { id: 8, category: "Vehicles", image: "/vehicles-hero.jpg" }
  ];

  const currentSlides = isMobile ? mobileSlides : slides;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % currentSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + currentSlides.length) % currentSlides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleSortChange = (newSort) => {
    if (newSort === 'distance' && !isAuthenticated) {
      alert('Please log in to sort by distance');
      return;
    }
    dispatch(setSort(newSort));
    setIsDropdownOpen(false);
  };

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint in Tailwind
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset slide when switching between mobile/desktop to prevent out-of-bounds
  useEffect(() => {
    if (currentSlide >= currentSlides.length) {
      setCurrentSlide(0);
    }
  }, [isMobile, currentSlide, currentSlides.length]);

  useEffect(() => {
    // Only fetch when auth check is complete
    if (!isCheckingAuth) {
      if (sort === 'distance') {
        if (!isAuthenticated) {
          // If not authenticated, fallback to best_match
          dispatch(setSort('best_match'));
          return;
        }
        dispatch(fetchProductsByLocation({ 
          maxDistance: 100, // Use a large default distance for all products
          sort: 'distance' 
        }));
              } else {
          // Fetch all products with sorting
          dispatch(fetchProducts({ excludeRecentlyViewed: false, sort }));
        }
    }
  }, [dispatch, isAuthenticated, isCheckingAuth, sort]);

  // Auto-rotate slides every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % currentSlides.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [currentSlides.length]);

  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb 
        items={createBreadcrumbs.custom([{ label: 'All Products' }])}
        className="mb-6"
      />
      
      {/* Hero Carousel */}
      <div className="relative w-full h-72 md:h-80 lg:h-88 mb-12 rounded-lg overflow-hidden shadow-lg">
        <div className="carousel w-full h-full">
          {currentSlides.map((slide, index) => (
            <div 
              key={slide.id}
              className={`carousel-item relative w-full h-full transition-transform duration-500 ease-in-out`}
              style={{ 
                position: 'absolute',
                transform: `translateX(${(index - currentSlide) * 100}%)`
              }}
            >
              {isMobile ? (
                /* Mobile: Single category per slide */
                <div className="relative w-full h-full">
                  <Image 
                    src={slide.image} 
                    alt={slide.category}
                    fill
                    className="object-cover" 
                    sizes="100vw"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center">
                    <h3 className="text-white text-xl md:text-2xl lg:text-3xl font-black font-gt-america-expanded tracking-tight mb-4">
                      {slide.category}
                    </h3>
                    <Link 
                      href={`/category/${getCategorySlug(slide.category)}`}
                      className="btn btn-sm px-4 py-1 bg-white text-black hover:bg-gray-100 border-none rounded-none text-xs"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              ) : (
                /* Desktop: Two categories per slide */
                <div className="w-full h-full flex">
                  {/* Left Half */}
                  <div className="relative w-1/2 h-full">
                    <Image 
                      src={slide.leftHalf.image} 
                      alt={slide.leftHalf.category}
                      fill
                      className="object-cover" 
                      sizes="50vw"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center">
                      <h3 className="text-white text-xl md:text-2xl lg:text-3xl font-black font-gt-america-expanded tracking-tight mb-4">
                        {slide.leftHalf.category}
                      </h3>
                      <Link 
                        href={`/category/${getCategorySlug(slide.leftHalf.category)}`}
                        className="btn btn-sm px-4 py-1 bg-white text-black hover:bg-gray-100 border-none rounded-none text-xs"
                      >
                        Shop Now
                      </Link>
                    </div>
                  </div>
                  
                  {/* Right Half */}
                  <div className="relative w-1/2 h-full">
                    <Image 
                      src={slide.rightHalf.image} 
                      alt={slide.rightHalf.category}
                      fill
                      className="object-cover" 
                      sizes="50vw"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center">
                      <h3 className="text-white text-xl md:text-2xl lg:text-3xl font-black font-gt-america-expanded tracking-tight mb-4">
                        {slide.rightHalf.category}
                      </h3>
                      <Link 
                        href={`/category/${getCategorySlug(slide.rightHalf.category)}`}
                        className="btn btn-sm px-4 py-1 bg-white text-black hover:bg-gray-100 border-none rounded-none text-xs"
                      >
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Carousel Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {currentSlides.map((_, index) => (
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
        <div className="flex items-center gap-4">
          {/* Enhanced Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-base-100 border border-base-300 rounded-lg hover:border-primary/50 transition-all duration-200 min-w-[180px] shadow-sm hover:shadow-md"
            >
              {(() => {
                const currentSortOption = sortOptions.find(option => option.value === sort);
                const CurrentIcon = currentSortOption?.icon || SparklesIcon;
                return (
                  <>
                    <CurrentIcon className="size-4 text-primary" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{currentSortOption?.label}</div>
                      <div className="text-xs text-base-content/60">{currentSortOption?.description}</div>
                    </div>
                    <ChevronDownIcon className={`size-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </>
                );
              })()}
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 overflow-hidden">
                {sortOptions.map((option) => {
                  const OptionIcon = option.icon;
                  const isDisabled = option.value === 'distance' && !isAuthenticated;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => !isDisabled && handleSortChange(option.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                        sort === option.value 
                          ? 'bg-primary/10 border-r-2 border-r-primary' 
                          : 'hover:bg-base-200'
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      disabled={isDisabled}
                    >
                      <OptionIcon className={`size-4 ${sort === option.value ? 'text-primary' : 'text-base-content/60'}`} />
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${sort === option.value ? 'text-primary' : ''}`}>
                          {option.label}
                          {isDisabled && ' (Login required)'}
                        </div>
                        <div className="text-xs text-base-content/60">{option.description}</div>
                      </div>
                      {sort === option.value && (
                        <div className="size-2 bg-primary rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Click outside handler */}
            {isDropdownOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDropdownOpen(false)}
              />
            )}
          </div>
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
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
