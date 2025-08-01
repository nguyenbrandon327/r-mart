'use client';

import Link from 'next/link';
import { HomeIcon } from 'lucide-react';

/**
 * Breadcrumb component using daisyUI breadcrumb classes
 * @param {Array} items - Array of breadcrumb items with { label, href?, icon? }
 * @param {string} className - Additional CSS classes
 */
export default function Breadcrumb({ items = [], className = "" }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`breadcrumbs text-sm ${className}`}>
      <ul>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const ItemIcon = item.icon;
          
          return (
            <li key={index}>
              {item.href && !isLast ? (
                <Link 
                  href={item.href}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  {ItemIcon && <ItemIcon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className={`flex items-center gap-1 ${isLast ? 'text-base-content/70' : ''}`}>
                  {ItemIcon && <ItemIcon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Helper function to create common breadcrumb patterns
 */
export const createBreadcrumbs = {
  // Home > Category
  category: (categoryName) => [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: categoryName }
  ],

  // Home > Category > Product
  product: (categoryName, productName, categorySlug) => [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: categoryName, href: `/category/${categorySlug}` },
    { label: productName }
  ],

  // Home > Product (for direct navigation from homepage)
  productFromHome: (productName) => [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: productName }
  ],

  // Home > Search Results
  search: (query) => [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'Search Results' },
    { label: `"${query}"` }
  ],

  // Home > Profile > Username
  profile: (username) => [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'Profile', href: '/profile' },
    { label: username }
  ],

  // Home > Saved Items
  saved: () => [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'Saved Items' }
  ],

  // Home > Inbox
  inbox: () => [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'Inbox' }
  ],

  // Home > Inbox > Chat
  chat: (otherUserName) => [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'Inbox', href: '/inbox' },
    { label: `Chat with ${otherUserName}` }
  ],

  // Custom breadcrumb builder
  custom: (items) => [
    { label: 'Home', href: '/', icon: HomeIcon },
    ...items
  ]
};