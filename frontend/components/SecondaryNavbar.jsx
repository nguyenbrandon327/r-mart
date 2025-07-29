'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

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
  { value: 'renting', label: 'Renting' },
  { value: 'merch', label: 'Merch' },
  { value: 'other', label: 'Other' },
  { value: 'in-searching-for', label: 'I\'m searching for' }
];

function SecondaryNavbar() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get current category if on a category page
  const currentCategory = categories.find(cat => pathname === `/category/${cat.value}`);
  
  return (
    <div className="bg-base-200 py-2 px-4 shadow-sm sticky top-16 z-30">
      <div className="container mx-auto flex justify-center">
        {/* Desktop view - show all categories */}
        <div className="hidden lg:flex items-center overflow-x-auto hide-scrollbar max-w-full">
          <Link 
            href="/all-products"
            className={`flex items-center whitespace-nowrap px-3 py-1.5 mx-1 rounded-md font-medium text-sm transition-colors ${
              pathname === '/all-products' ? 'text-[#003DA5] font-bold' : 'hover:bg-base-300'
            }`}
          >
            All Products
          </Link>
          
          {categories.map((category) => (
            <Link
              key={category.value}
              href={`/category/${category.value}`}
              className={`whitespace-nowrap px-3 py-1.5 mx-1 rounded-md font-medium text-sm transition-colors ${
                pathname === `/category/${category.value}` ? 'text-[#003DA5] font-bold' : 'hover:bg-base-300'
              }`}
            >
              {category.label}
            </Link>
          ))}
        </div>

        {/* Mobile/Tablet view - show dropdown */}
        <div className="flex lg:hidden items-center gap-2 w-full justify-start">
          <Link 
            href="/all-products"
            className={`flex items-center whitespace-nowrap px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${
              pathname === '/all-products' ? 'text-[#003DA5] font-bold' : 'hover:bg-base-300'
            }`}
          >
            All Products
          </Link>
          
          {/* Categories Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${
                currentCategory ? 'text-[#003DA5] font-bold' : 'hover:bg-base-300'
              }`}
            >
              <span>{currentCategory ? currentCategory.label : 'Categories'}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-base-100 rounded-md shadow-lg border border-base-300 py-1 z-50">
                {categories.map((category) => (
                  <Link
                    key={category.value}
                    href={`/category/${category.value}`}
                    onClick={() => setIsDropdownOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors hover:bg-base-200 ${
                      pathname === `/category/${category.value}` ? 'text-[#003DA5] font-bold bg-base-200' : ''
                    }`}
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecondaryNavbar; 