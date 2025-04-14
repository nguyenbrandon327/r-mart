'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const categories = [
  { value: 'clothes', label: 'Clothes' },
  { value: 'tech', label: 'Tech' },
  { value: 'textbooks', label: 'Textbooks' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'food', label: 'Food' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'housing', label: 'Housing' },
  { value: 'rides', label: 'Rides' },
  { value: 'merch', label: 'Merch' },
  { value: 'other', label: 'Other' },
  { value: 'in-searching-for', label: 'I\'m searching for' }
];

function SecondaryNavbar() {
  const pathname = usePathname();
  
  return (
    <div className="bg-base-200 py-2 px-4 shadow-sm sticky top-16 z-30">
      <div className="container mx-auto flex justify-center">
        <div className="flex items-center overflow-x-auto hide-scrollbar max-w-full">
          <Link 
            href="/"
            className={`flex items-center whitespace-nowrap px-3 py-1.5 mx-1 rounded-md font-medium text-sm transition-colors ${
              pathname === '/' ? 'bg-primary text-primary-content' : 'hover:bg-base-300'
            }`}
          >
            All Products
          </Link>
          
          {categories.map((category) => (
            <Link
              key={category.value}
              href={`/category/${category.value}`}
              className={`whitespace-nowrap px-3 py-1.5 mx-1 rounded-md font-medium text-sm transition-colors ${
                pathname === `/category/${category.value}` ? 'bg-primary text-primary-content' : 'hover:bg-base-300'
              }`}
            >
              {category.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SecondaryNavbar; 