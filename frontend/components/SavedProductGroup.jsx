'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import SavedProductItem from './SavedProductItem';
import UserLink from './UserLink';

const SavedProductGroup = ({ user, products }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6 border border-gray-200">
      {/* Group header with user info and toggle */}
      <div 
        className="px-4 py-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div>
              <UserLink 
                user={user}
                showProfilePic={true}
                profilePicSize="w-10 h-10"
                className="font-semibold text-lg"
              />
              <p className="text-sm text-gray-600 ml-13">
                {products.length} saved product{products.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="divide-y divide-gray-200">
          {products.map((product) => (
            <div key={product.id} className="p-4">
              <SavedProductItem product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedProductGroup; 