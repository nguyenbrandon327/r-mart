'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsByCategory, fetchProductsByLocation, resetForm, setSort } from '../../../store/slices/productSlice';
import ProductCard from '../../../components/ProductCard';
import { 
  ShirtIcon, 
  LaptopIcon, 
  NotebookIcon,
  SofaIcon, 
  CookingPotIcon, 
  SoupIcon, 
  CarIcon, 
  HomeIcon, 
  BusIcon, 
  ShapesIcon, 
  TagIcon, 
  SearchIcon,
  KeyIcon,
  SparklesIcon,
  MapPinIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon
} from 'lucide-react';
import AddProductModal from "../../../components/EditProductModal";

const categoryLabels = {
  'clothes': 'Clothes',
  'tech': 'Tech',
  'textbooks': 'Textbooks',
  'furniture': 'Furniture',
  'kitchen': 'Kitchen',
  'food': 'Food',
  'vehicles': 'Vehicles',
  'housing': 'Housing',
  'rides': 'Rides',
  'renting': 'Renting',
  'merch': 'Merch',
  'other': 'Other',
  'in-searching-for': 'I\'m searching for'
};

const categoryIcons = {
  'clothes': ShirtIcon,
  'tech': LaptopIcon,
  'textbooks': NotebookIcon,
  'furniture': SofaIcon,
  'kitchen': CookingPotIcon,
  'food': SoupIcon,
  'vehicles': CarIcon,
  'housing': HomeIcon,
  'rides': BusIcon,
  'renting': KeyIcon,
  'merch': ShapesIcon,
  'other': TagIcon,
  'in-searching-for': SearchIcon
};

const sortOptions = [
  { value: 'best_match', label: 'Best match', icon: SparklesIcon, description: 'Most relevant items' },
  { value: 'distance', label: 'Distance', icon: MapPinIcon, description: 'Closest to you' },
  { value: 'recent_first', label: 'Recent first', icon: ClockIcon, description: 'Newest listings' },
  { value: 'price_low_high', label: 'Price: Low to high', icon: ArrowUpIcon, description: 'Cheapest first' },
  { value: 'price_high_low', label: 'Price: High to low', icon: ArrowDownIcon, description: 'Most expensive first' }
];

export default function CategoryPage({ params }) {
  const { category } = params;
  const dispatch = useDispatch();
  const { products, loading, error, sort } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  useEffect(() => {
    if (sort === 'distance') {
      if (!isAuthenticated) {
        // If not authenticated, fallback to best_match
        dispatch(setSort('best_match'));
        return;
      }
      dispatch(fetchProductsByLocation({ 
        category, 
        maxDistance: 50, // Use a large default distance
        sort: 'distance' 
      }));
    } else {
      dispatch(fetchProductsByCategory({ category, sort }));
    }
  }, [dispatch, category, sort, isAuthenticated]);

  const handleSortChange = (newSort) => {
    if (newSort === 'distance' && !isAuthenticated) {
      alert('Please log in to sort by distance');
      return;
    }
    dispatch(setSort(newSort));
    setIsDropdownOpen(false);
  };

  const currentSortOption = sortOptions.find(option => option.value === sort);
  const CurrentIcon = currentSortOption?.icon || SparklesIcon;
  
  const categoryLabel = categoryLabels[category] || 'Unknown Category';
  const CategoryIcon = categoryIcons[category] || TagIcon;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center mb-2">
            <CategoryIcon className="size-7 mr-2" />
            {categoryLabel}
          </h1>
          <p className="text-base-content/70">
            Browse all products in the {categoryLabel.toLowerCase()} category
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Enhanced Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-base-100 border border-base-300 rounded-lg hover:border-primary/50 transition-all duration-200 min-w-[180px] shadow-sm hover:shadow-md"
            >
              <CurrentIcon className="size-4 text-primary" />
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{currentSortOption?.label}</div>
                <div className="text-xs text-base-content/60">{currentSortOption?.description}</div>
              </div>
              <ChevronDownIcon className={`size-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
            <CategoryIcon className="size-12" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">No products found</h3>
            <p className="text-base-content/70 max-w-sm">
              Get started by adding an item to the marketplace
            </p>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
} 