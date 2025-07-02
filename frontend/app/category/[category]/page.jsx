'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsByCategory, resetForm, setSort } from '../../../store/slices/productSlice';
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
  KeyIcon
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
  const { products, loading, error, sort } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  useEffect(() => {
    dispatch(fetchProductsByCategory({ category, sort }));
  }, [dispatch, category, sort]);

  const handleSortChange = (newSort) => {
    dispatch(setSort(newSort));
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
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort by:</label>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="best_match">Best match</option>
            <option value="recent_first">Recent first</option>
            <option value="price_low_high">Price: Low to high</option>
            <option value="price_high_low">Price: High to low</option>
          </select>
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
    </div>
  );
} 