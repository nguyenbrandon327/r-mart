'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { searchProducts, setFilters, clearFilters } from '../../store/slices/searchSlice';
import SearchProductCard from '../../components/SearchProductCard';
import { Filter as FilterIcon, X as XIcon } from 'lucide-react';

const categories = [
  'All',
  'Automotive',
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports & Outdoors',
  'Toys & Games',
  'Books & Media',
  'Health & Beauty',
  'Other'
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
    limit, 
    offset, 
    filters 
  } = useSelector((state) => state.search);

  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    if (query) {
      dispatch(searchProducts({ 
        query, 
        ...filters,
        offset: 0 
      }));
    }
  }, [query, dispatch]);

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
      maxPrice: ''
    });
    dispatch(clearFilters());
    dispatch(searchProducts({ 
      query,
      offset: 0 
    }));
  };

  const loadMore = () => {
    dispatch(searchProducts({ 
      query, 
      ...filters,
      offset: offset + limit 
    }));
  };

  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">
            Search results for "{query}"
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-base-content/70">
              {total > 0 ? `Found ${total} products` : 'No products found'}
            </p>
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
                    <option key={cat} value={cat}>{cat}</option>
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
                Category: {filters.category}
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

            {/* Load More Button */}
            {searchResults.length < total && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Loading...
                    </>
                  ) : (
                    `Load More (${searchResults.length} of ${total})`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 