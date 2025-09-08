import React, { useState, useContext, useRef, useEffect } from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import Input from '../forms/Input';
import useDebounce from '../../hooks/useDebounce';
import { MapContext } from '../../context/MapContext';
import { getSpatialData, getMockBounds } from '../../services/mapService';

const SearchControl = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const map = useLeafletMap();
  const { setFilters } = useContext(MapContext);
  const { claims } = getSpatialData();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Extract unique locations from claims
  const locations = React.useMemo(() => {
    const states = [...new Set(claims.features.map(f => f.properties.state))];
    const districts = [...new Set(claims.features.map(f => f.properties.district))];
    const villages = [...new Set(claims.features.map(f => f.properties.village))];
    
    return [
      ...states.map(s => ({ name: s, type: 'state', fullName: `${s} (State)` })),
      ...districts.map(d => ({ name: d, type: 'district', fullName: `${d} (District)` })),
      ...villages.map(v => ({ name: v, type: 'village', fullName: `${v} (Village)` }))
    ].sort((a, b) => a.name.localeCompare(b.name));
  }, [claims]);

  // Prevent map scroll when hovering over the search panel
  useEffect(() => {
    const handleWheel = (e) => {
      e.stopPropagation();
    };

    const panelElement = searchRef.current;
    if (panelElement && isExpanded) {
      panelElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        panelElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isExpanded]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target) && isExpanded) {
        setIsExpanded(false);
        setSearchResults([]);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Handle search with debouncing
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      setIsSearching(true);
      const filtered = locations.filter(loc => 
        loc.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ).slice(0, 8); // Limit results
      
      setSearchResults(filtered);
      setIsSearching(false);
      setSelectedIndex(-1);
    } else {
      setSearchResults([]);
      setSelectedIndex(-1);
    }
  }, [debouncedSearch, locations]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isExpanded || searchResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
            handleLocationSelect(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsExpanded(false);
          setSearchResults([]);
          break;
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isExpanded, searchResults, selectedIndex]);

  const handleLocationSelect = (location) => {
    const { name, type } = location;
    setSearchTerm(name);
    
    // Find the feature to get complete location data
    const feature = claims.features.find(f => {
      switch (type) {
        case 'village': return f.properties.village === name;
        case 'district': return f.properties.district === name;
        case 'state': return f.properties.state === name;
        default: return false;
      }
    });

    if (feature) {
      const { state, district, village } = feature.properties;
      setFilters((prev) => ({
        ...prev,
        state: type === 'state' ? name : state,
        district: type === 'district' ? name : (type === 'state' ? '' : district),
        village: type === 'village' ? name : '',
      }));

      // Zoom to location
      const bounds = getMockBounds(name);
      if (bounds) {
        map.fitBounds(bounds, { animate: true, duration: 0.8 });
      }
    }

    setSearchResults([]);
    setSelectedIndex(-1);
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setIsExpanded(!isExpanded);
      setTimeout(() => setIsAnimating(false), 300);
      
      if (!isExpanded) {
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        setSearchResults([]);
        setSelectedIndex(-1);
      }
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'state':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case 'district':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'village':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute top-4 right-20 z-[1002]" ref={searchRef}>
      {/* Floating Action Button */}
      <div 
        onClick={toggleExpanded}
        className={`relative bg-white rounded-full shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 ${
          searchTerm ? 'ring-4 ring-green-400 ring-opacity-50' : 'hover:shadow-xl'
        } ${isExpanded ? 'rotate-180' : ''}`}
        style={{ 
          width: '48px', 
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg 
          className={`w-6 h-6 transition-colors duration-300 ${
            searchTerm ? 'text-green-600' : 'text-gray-600'
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={isExpanded 
              ? "M6 18L18 6M6 6l12 12"
              : "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            }
          />
        </svg>
        
        {/* Active search indicator */}
        {searchTerm && !isExpanded && (
          <div className="absolute -top-2 -right-2 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Expanded Search Panel - Now opens to the left */}
      <div className={`absolute top-16 right-0 transition-all duration-300 ease-in-out transform ${
        isExpanded 
          ? 'opacity-100 translate-y-0 scale-100 z-[1010]' 
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none z-[1002]'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ width: '360px' }}>
          {/* Search Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-semibold text-white">Search Locations</h3>
              {searchTerm && (
                <button 
                  onClick={clearSearch}
                  className="ml-auto px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search states, districts, or villages..."
                className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
              
              {/* Loading spinner or search icon */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isSearching ? (
                  <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full"></div>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {searchResults.map((location, index) => (
                <div
                  key={`${location.type}-${location.name}`}
                  onClick={() => handleLocationSelect(location)}
                  className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors duration-200 ${
                    index === selectedIndex 
                      ? 'bg-green-50 border-r-4 border-green-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {getLocationIcon(location.type)}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{location.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{location.type}</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="p-6 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.002-5.824-2.496" />
              </svg>
              <p className="text-gray-500 text-sm">No locations found for "{searchTerm}"</p>
              <p className="text-gray-400 text-xs mt-1">Try searching for states, districts, or villages</p>
            </div>
          )}

          {/* Quick Help */}
          {!searchTerm && (
            <div className="p-4 bg-gray-50">
              <div className="text-xs text-gray-600">
                <div className="flex items-center space-x-2 mb-2">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs" 
                       style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>↑↓</kbd>
                  <span>Navigate results</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                       style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>Enter</kbd>
                  <span>Select location</span>
                </div>
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                       style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>Esc</kbd>
                  <span>Close search</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Searches or Quick Access */}
          {!searchTerm && (
            <div className="border-t border-gray-100">
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Quick Access</h4>
                <div className="flex flex-wrap gap-2">
                  {['Maharashtra', 'Karnataka', 'Odisha'].map((state) => (
                    <button
                      key={state}
                      onClick={() => setSearchTerm(state)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors duration-200"
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchControl;