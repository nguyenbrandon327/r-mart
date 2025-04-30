'use client';

import Link from "next/link";
import { TagIcon } from "lucide-react";

function ProductCard({ product }) {
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
    <Link href={`/product/${product.id}`}>
      <div className="bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-none cursor-pointer">
        {/* PRODUCT IMAGE */}
        <figure className="relative pt-[100%]">
          <img
            src={product.image}
            alt={product.name}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        </figure>

        <div className="p-4">
          {/* PRODUCT INFO */}
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold truncate overflow-hidden whitespace-nowrap w-full">{product.name}</h2>
          </div>
          <p className="text-2xl font-bold text-primary">${Number(product.price).toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;