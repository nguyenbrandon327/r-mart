'use client';

import Link from "next/link";

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
      'renting': 'Renting',
      'merch': 'Merch',
      'other': 'Other',
      'in-searching-for': 'I\'m searching for'
    };
    
    return categories[category] || 'Uncategorized';
  };

  // Get cover image (first image in array or use legacy 'image' property as fallback)
  const getCoverImage = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return product.image || 'https://placehold.co/400x400?text=No+Image';
  };

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-transparent rounded-none cursor-pointer border-2 border-transparent hover:border-gray-500 transition-all duration-300 -m-1 p-1">
        {/* PRODUCT IMAGE */}
        <figure className="relative pt-[100%] mb-0 rounded-md overflow-hidden">
          <img
            src={getCoverImage()}
            alt={product.name}
            className="absolute top-0 left-0 w-full h-full object-cover rounded-md"
          />
        </figure>

        <div className="px-0">
          {/* PRODUCT INFO */}
          <div className="flex items-start justify-between mt-1">
            <h2 className="text-xl font-semibold text-black truncate overflow-hidden whitespace-nowrap w-full">{product.name}</h2>
          </div>
          <p className="text-xl font-normal text-black">${Number(product.price).toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;