'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Search as SearchIcon, X as XIcon } from 'lucide-react';
import { 
  setSearchQuery, 
  clearSearch, 
  fetchSearchSuggestions, 
  setShowSuggestions,
  clearSuggestions 
} from '../store/slices/searchSlice';

function MobileSearchModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [localQuery, setLocalQuery] = useState('');
  const inputRef = useRef(null);
  
  const { suggestions, showSuggestions, suggestionsLoading } = useSelector((state) => state.search);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle suggestions
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

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalQuery(value);
    dispatch(setSearchQuery(value));
  };

  const handleSearch = (query = localQuery) => {
    if (query.trim()) {
      dispatch(setShowSuggestions(false));
      onClose();
      router.push(`/search?q=${encodeURIComponent(query)}`);
      // Clear the local query for next time
      setLocalQuery('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      onClose();
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

  const handleClose = () => {
    setLocalQuery('');
    dispatch(clearSearch());
    dispatch(clearSuggestions());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-0 top-0 z-50 bg-base-100 p-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && dispatch(setShowSuggestions(true))}
              placeholder="Search for anything"
              className="input input-bordered w-full pl-10 pr-10 h-12 rounded-full"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5 text-base-content/50" />
            {localQuery && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
              >
                <XIcon className="size-5" />
              </button>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-circle"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="bg-base-100 rounded-box border border-base-300 max-h-64 overflow-y-auto">
            {suggestionsLoading ? (
              <div className="p-4 text-center">
                <span className="loading loading-spinner loading-sm"></span>
              </div>
            ) : (
              <ul className="py-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-base-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <SearchIcon className="size-4 text-base-content/50" />
                        <span>{suggestion}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Search Button */}
        <div className="mt-4">
          <button
            onClick={() => handleSearch()}
            disabled={!localQuery.trim()}
            className="btn btn-primary w-full rounded-full h-12"
          >
            <SearchIcon className="size-5" />
            Search
          </button>
        </div>
      </div>
    </>
  );
}

export default MobileSearchModal;