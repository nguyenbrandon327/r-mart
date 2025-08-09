'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { searchProducts, setFilters, clearFilters } from '../../store/slices/searchSlice';
import SearchProductCard from '../../components/SearchProductCard';
import { 
  Filter as FilterIcon, 
  X as XIcon,
  SparklesIcon,
  MapPinIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon
} from 'lucide-react';
import Breadcrumb, { createBreadcrumbs } from '../../components/Breadcrumb';

const categories = [
  'All',
  'clothes',
  'tech',
  'textbooks',
  'furniture',
  'kitchen',
  'food',
  'vehicles',
  'housing',
  'rides',
  'renting',
  'merch',
  'tickets',
  'other',
  'in-searching-for'
];

const getCategoryLabel = (category) => {
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
    'tickets': 'Tickets',
    'other': 'Other',
    'in-searching-for': 'I\'m searching for'
  };
  
  return categoryLabels[category] || category;
};

const sortOptions = [
  { value: 'best_match', label: 'Best match', icon: SparklesIcon, description: 'Most relevant items' },
  { value: 'distance', label: 'Distance', icon: MapPinIcon, description: 'Closest to you' },
  { value: 'recent_first', label: 'Recent first', icon: ClockIcon, description: 'Newest listings' },
  { value: 'price_low_high', label: 'Price: Low to high', icon: ArrowUpIcon, description: 'Cheapest first' },
  { value: 'price_high_low', label: 'Price: High to low', icon: ArrowDownIcon, description: 'Most expensive first' }
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const query = searchParams.get('q') || '';
  
  const { 
    searchResults, 
    loading, 
    error, 
    total, 
    filters 
  } = useSelector((state) => state.search);
  
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [showFilters, setShowFilters] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'best_match'
  });

  useEffect(() => {
    if (query) {
      dispatch(searchProducts({ 
        query, 
        ...filters,
        offset: 0 
      }));
    }
  }, [query, filters, dispatch]);

  useEffect(() => {
    setLocalFilters({
      category: filters.category || '',
      minPrice: filters.minPrice || '',
      maxPrice: filters.maxPrice || '',
      sort: filters.sort || 'best_match'
    });
  }, [filters]);

  const handleFilterChange = (filterType, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const applyFilters = () => {
    dispatch(setFilters(localFilters));
    dispatch(searchProducts({ 
      query, 
      ...localFilters,
      offset: 0 
    }));
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setLocalFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'best_match'
    });
    dispatch(clearFilters());
    dispatch(searchProducts({ 
      query,
      sort: 'best_match',
      offset: 0 
    }));
  };

  const handleSortChange = (newSort) => {
    if (newSort === 'distance' && !isAuthenticated) {
      alert('Please log in to sort by distance');
      return;
    }
    
    const updatedFilters = {
      ...localFilters,
      sort: newSort
    };
    setLocalFilters(updatedFilters);
    dispatch(setFilters(updatedFilters));
    dispatch(searchProducts({ 
      query, 
      ...updatedFilters,
      offset: 0 
    }));
    setIsDropdownOpen(false);
  };

  const currentSortOption = sortOptions.find(option => option.value === (filters.sort || 'best_match'));
  const CurrentIcon = currentSortOption?.icon || SparklesIcon;



  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice || (filters.sort && filters.sort !== 'best_match');

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        {query && (
          <Breadcrumb 
            items={createBreadcrumbs.search(query)}
            className="mb-6"
          />
        )}
        
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">
            Search results for "{query}"
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-base-content/70">
              {total > 0 ? `Found ${total} products` : 'No products found'}
            </p>
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
                      const isSelected = (filters.sort || 'best_match') === option.value;
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => !isDisabled && handleSortChange(option.value)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                            isSelected 
                              ? 'bg-primary/10 border-r-2 border-r-primary' 
                              : 'hover:bg-base-200'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          disabled={isDisabled}
                        >
                          <OptionIcon className={`size-4 ${isSelected ? 'text-primary' : 'text-base-content/60'}`} />
                          <div className="flex-1">
                            <div className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                              {option.label}
                              {isDisabled && ' (Login required)'}
                            </div>
                            <div className="text-xs text-base-content/60">{option.description}</div>
                          </div>
                          {isSelected && (
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
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-sm btn-ghost gap-2"
              >
                <FilterIcon className="size-4" />
                Filters
                {hasActiveFilters && (
                  <span className="badge badge-primary badge-sm">{Object.values(filters).filter(Boolean).length}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card bg-base-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="label">
                  <span className="label-text">Category</span>
                </label>
                <select
                  value={localFilters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="">All Categories</option>
                  {categories.slice(1).map((cat) => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>

              {/* Price Range Filters */}
              <div>
                <label className="label">
                  <span className="label-text">Min Price</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={localFilters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Max Price</span>
                </label>
                <input
                  type="number"
                  placeholder="Any"
                  value={localFilters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={applyFilters}
                className="btn btn-primary btn-sm"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="btn btn-ghost btn-sm"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.category && (
              <div className="badge badge-primary gap-2">
                Category: {getCategoryLabel(filters.category)}
                <button
                  onClick={() => {
                    dispatch(setFilters({ category: '' }));
                    dispatch(searchProducts({ query, ...filters, category: '', offset: 0 }));
                  }}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            )}
            {filters.sort && filters.sort !== 'best_match' && (
              <div className="badge badge-primary gap-2">
                Sort: {sortOptions.find(opt => opt.value === filters.sort)?.label || filters.sort}
                <button
                  onClick={() => {
                    dispatch(setFilters({ sort: 'best_match' }));
                    dispatch(searchProducts({ query, ...filters, sort: 'best_match', offset: 0 }));
                  }}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            )}
            {filters.minPrice && (
              <div className="badge badge-primary gap-2">
                Min: ${filters.minPrice}
                <button
                  onClick={() => {
                    dispatch(setFilters({ minPrice: '' }));
                    dispatch(searchProducts({ query, ...filters, minPrice: '', offset: 0 }));
                  }}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            )}
            {filters.maxPrice && (
              <div className="badge badge-primary gap-2">
                Max: ${filters.maxPrice}
                <button
                  onClick={() => {
                    dispatch(setFilters({ maxPrice: '' }));
                    dispatch(searchProducts({ query, ...filters, maxPrice: '', offset: 0 }));
                  }}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && searchResults.length === 0 && (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Search Results */}
        {!loading && searchResults.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-lg text-base-content/70">No products found matching your search.</p>
            <p className="text-sm text-base-content/50 mt-2">Try adjusting your filters or search term.</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {searchResults.map((product) => (
                <SearchProductCard key={product.id} product={product} />
              ))}
            </div>


          </>
        )}
      </div>
    </div>
  );
} 