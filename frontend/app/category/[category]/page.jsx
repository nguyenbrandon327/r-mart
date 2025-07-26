'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsByCategory, fetchProductsByLocation, resetForm, setSort, setLocationFilter, toggleLocationFilter, setMaxDistance } from '../../../store/slices/productSlice';
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
  MapPinIcon,
  LocateIcon
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

export default function CategoryPage({ params }) {
  const { category } = params;
  const dispatch = useDispatch();
  const { products, loading, error, sort, locationFilter } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempDistance, setTempDistance] = useState(locationFilter.maxDistance);
  
  // Sync tempDistance with locationFilter.maxDistance when it changes
  useEffect(() => {
    setTempDistance(locationFilter.maxDistance);
  }, [locationFilter.maxDistance]);
  
  useEffect(() => {
    if (locationFilter.enabled) {
      dispatch(fetchProductsByLocation({ 
        category, 
        maxDistance: locationFilter.maxDistance, 
        sort: sort === 'best_match' ? 'distance' : sort 
      }));
    } else {
      dispatch(fetchProductsByCategory({ category, sort }));
    }
  }, [dispatch, category, sort, locationFilter.enabled, locationFilter.maxDistance]);

  const handleSortChange = (newSort) => {
    dispatch(setSort(newSort));
  };

  const handleLocationToggle = () => {
    if (!isAuthenticated) {
      alert('Please log in to use location-based filtering');
      return;
    }
    dispatch(toggleLocationFilter());
  };

  const handleDistanceChange = () => {
    dispatch(setMaxDistance(tempDistance));
    setShowLocationModal(false);
  };
  
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
          {/* Location Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLocationToggle}
              className={`btn btn-sm ${locationFilter.enabled ? 'btn-primary' : 'btn-outline'}`}
              disabled={!isAuthenticated}
            >
              <MapPinIcon className="w-4 h-4" />
              {locationFilter.enabled ? 'Location: ON' : 'Near me'}
            </button>
            {locationFilter.enabled && (
              <button
                onClick={() => setShowLocationModal(true)}
                className="btn btn-sm btn-ghost"
              >
                <LocateIcon className="w-4 h-4" />
                {locationFilter.maxDistance} mi
              </button>
            )}
          </div>
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort by:</label>
            <select
              value={locationFilter.enabled && sort === 'best_match' ? 'distance' : sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="select select-bordered select-sm"
            >
              {locationFilter.enabled && <option value="distance">Distance</option>}
              {!locationFilter.enabled && <option value="best_match">Best match</option>}
              <option value="recent_first">Recent first</option>
              <option value="price_low_high">Price: Low to high</option>
              <option value="price_high_low">Price: High to low</option>
            </select>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Distance Selection Modal */}
      {showLocationModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Set Maximum Distance</h3>
            <p className="text-sm text-gray-600 mb-4">
              Show products within this distance from your location
            </p>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Distance (miles)</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={tempDistance}
                onChange={(e) => setTempDistance(Number(e.target.value))}
                className="range range-primary mb-2"
              />
              <div className="w-full flex justify-between text-xs px-2">
                <span>1 mi</span>
                <span>25 mi</span>
                <span>50 mi</span>
              </div>
              <div className="text-center mt-2">
                <span className="text-lg font-semibold">{tempDistance} miles</span>
              </div>
            </div>
            
            <div className="modal-action">
              <button
                onClick={() => setShowLocationModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDistanceChange}
                className="btn btn-primary"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 