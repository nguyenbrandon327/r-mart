'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, X as XIcon } from 'lucide-react';
import { 
  setSearchQuery, 
  clearSearch, 
  fetchSearchSuggestions, 
  setShowSuggestions,
  clearSuggestions 
} from '../store/slices/searchSlice';

function SearchBar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [localQuery, setLocalQuery] = useState('');
  const searchRef = useRef(null);
  
  const { suggestions, showSuggestions, suggestionsLoading } = useSelector((state) => state.search);

  // Simple debounce implementation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localQuery.trim().length > 1) {
        dispatch(fetchSearchSuggestions(localQuery));
      } else {
        dispatch(clearSuggestions());
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localQuery, dispatch]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        dispatch(setShowSuggestions(false));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dispatch]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalQuery(value);
    dispatch(setSearchQuery(value));
  };

  const handleSearch = (query = localQuery) => {
    if (query.trim()) {
      dispatch(setShowSuggestions(false));
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setLocalQuery(suggestion);
    dispatch(setSearchQuery(suggestion));
    handleSearch(suggestion);
  };

  const handleClear = () => {
    setLocalQuery('');
    dispatch(clearSearch());
    dispatch(clearSuggestions());
  };

  return (
    <div className="relative flex-1 max-w-md mx-4" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && dispatch(setShowSuggestions(true))}
          placeholder="Search for products..."
          className="input input-bordered w-full pl-10 pr-10 h-10 rounded-full"
        />
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/50" />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-base-100 rounded-box shadow-lg border border-base-300 z-50 max-h-64 overflow-y-auto">
          {suggestionsLoading ? (
            <div className="p-3 text-center">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          ) : (
            <ul className="py-2">
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-base-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <SearchIcon className="size-3 text-base-content/50" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar; 