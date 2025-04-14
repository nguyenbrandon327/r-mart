'use client';

import { useDispatch } from 'react-redux';
import { EditIcon, Trash2Icon, TagIcon } from "lucide-react";
import Link from "next/link";
import { deleteProduct } from '../store/slices/productSlice';

function ProductCard({ product }) {
  const dispatch = useDispatch();
  
  const getCategoryLabel = (category) => {
    const categories = {
      'clothes': 'Clothes',
      'tech': 'Tech',
      'textbooks': 'Textbooks',
      'furniture': 'Furniture',
      'kitchen': 'Kitchen',
      'food': 'Food',
      'vehicles': 'Vehicles',
      'housing': 'Housing',
      'rides': 'Rides',
      'merch': 'Merch',
      'other': 'Other',
      'in-searching-for': 'I\'m searching for'
    };
    
    return categories[category] || 'Uncategorized';
  };

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
      {/* PRODUCT IMAGE */}
      <figure className="relative pt-[56.25%]">
        <img
          src={product.image}
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </figure>

      <div className="card-body">
        {/* PRODUCT INFO */}
        <div className="flex items-start justify-between">
          <h2 className="card-title text-lg font-semibold">{product.name}</h2>
        </div>
        <p className="text-2xl font-bold text-primary">${Number(product.price).toFixed(2)}</p>
        {product.description && (
          <p className="text-base-content/70 line-clamp-2">{product.description}</p>
        )}

        {/* CARD ACTIONS */}
        <div className="card-actions justify-end mt-4">
          <Link href={`/product/${product.id}`} className="btn btn-sm btn-info btn-outline">
            <EditIcon className="size-4" />
          </Link>

          <button
            className="btn btn-sm btn-error btn-outline"
            onClick={() => dispatch(deleteProduct(product.id))}
          >
            <Trash2Icon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard; 