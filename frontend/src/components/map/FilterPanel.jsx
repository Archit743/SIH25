import React, { useContext, useState, useRef, useEffect } from 'react';
import { MapContext } from '../../context/MapContext';
import { getSpatialData } from '../../services/mapService';
import Select from '../forms/Select';

const statuses = ['Approved', 'Pending', 'Under Review', 'Rejected'];
const featureTypes = ['IFR', 'CR', 'CFR', 'All'];

const FilterPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef(null);
  const { filters, setFilters } = useContext(MapContext);
  const { claims } = getSpatialData();

  // Prevent map scroll when hovering over the filter panel
  useEffect(() => {
    const handleWheel = (e) => {
      e.stopPropagation();
    };

    const panelElement = panelRef.current;
    if (panelElement) {
      panelElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        panelElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isExpanded]);

  // Extract unique values from claims
  const states = [...new Set(claims.features.map(f => f.properties.state))].sort();
  const districts = filters.state
    ? [...new Set(claims.features
        .filter(f => f.properties.state === filters.state)
        .map(f => f.properties.district))].sort()
    : [...new Set(claims.features.map(f => f.properties.district))].sort();
  const villages = filters.district
    ? [...new Set(claims.features
        .filter(f => f.properties.district === filters.district)
        .map(f => f.properties.village))].sort()
    : [...new Set(claims.features.map(f => f.properties.village))].sort();
  const tribalGroups = [...new Set(claims.features.map(f => f.properties.tribalGroup))].sort();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target) && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const handleChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'state' ? { district: '', village: '' } : {}),
      ...(key === 'district' ? { village: '' } : {}),
    }));
  };

  const handleStatusChange = (status, checked) => {
    setFilters((prev) => ({
      ...prev,
      claimStatuses: checked
        ? [...prev.claimStatuses, status]
        : prev.claimStatuses.filter(s => s !== status),
    }));
  };

  const toggleExpanded = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setIsExpanded(!isExpanded);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const clearAllFilters = () => {
    setFilters({
      state: '',
      district: '',
      village: '',
      tribalGroup: '',
      featureType: '',
      claimStatuses: []
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filters.state || filters.district || filters.village || 
    filters.tribalGroup || filters.featureType || filters.claimStatuses.length > 0;

  // Count active filters
  const activeFilterCount = [
    filters.state,
    filters.district, 
    filters.village,
    filters.tribalGroup,
    filters.featureType,
    filters.claimStatuses.length > 0 ? 'status' : null
  ].filter(Boolean).length;

  return (
    <div className="absolute top-4 left-32 z-[1001]" ref={panelRef}>
      {/* Floating Action Button - Collapsed State */}
      <div 
        onClick={toggleExpanded}
        className={`relative bg-white rounded-full shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 ${
          hasActiveFilters ? 'ring-4 ring-blue-400 ring-opacity-50' : 'hover:shadow-xl'
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
            hasActiveFilters ? 'text-blue-600' : 'text-gray-600'
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
              : "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
            }
          />
        </svg>
        
        {/* Active filter count badge */}
        {activeFilterCount > 0 && !isExpanded && (
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold animate-pulse">
            {activeFilterCount}
          </div>
        )}
      </div>

      {/* Expanded Panel */}
      <div className={`absolute top-16 left-0 transition-all duration-300 ease-in-out transform ${
        isExpanded 
          ? 'opacity-100 translate-y-0 scale-100 z-[1010]' 
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none z-[1001]'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ width: '320px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Filters</h3>
                {activeFilterCount > 0 && (
                  <p className="text-blue-100 text-sm">{activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}</p>
                )}
              </div>
              {hasActiveFilters && (
                <button 
                  onClick={clearAllFilters}
                  className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              {/* Location Filters */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location
                </div>
                <Select
                  label="State"
                  options={[{ value: '', label: 'All States' }, ...states.map(s => ({ value: s, label: s }))]}
                  value={filters.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                />
                <Select
                  label="District"
                  options={[{ value: '', label: 'All Districts' }, ...districts.map(d => ({ value: d, label: d }))]}
                  value={filters.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                  disabled={!filters.state && districts.length > 20} // Disable if too many options without state filter
                />
                <Select
                  label="Village"
                  options={[{ value: '', label: 'All Villages' }, ...villages.map(v => ({ value: v, label: v }))]}
                  value={filters.village}
                  onChange={(e) => handleChange('village', e.target.value)}
                  disabled={!filters.district && villages.length > 50} // Disable if too many options without district filter
                />
              </div>

              <hr className="border-gray-200" />

              {/* Tribal Group Filter */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Community
                </div>
                <Select
                  label="Tribal Group"
                  options={[{ value: '', label: 'All Groups' }, ...tribalGroups.map(g => ({ value: g, label: g }))]}
                  value={filters.tribalGroup}
                  onChange={(e) => handleChange('tribalGroup', e.target.value)}
                />
              </div>

              <hr className="border-gray-200" />

              {/* Feature Type Filter */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Type
                </div>
                <Select
                  label="Feature Type"
                  options={featureTypes.map(ft => ({ value: ft === 'All' ? '' : ft, label: ft }))}
                  value={filters.featureType || ''}
                  onChange={(e) => handleChange('featureType', e.target.value)}
                />
              </div>

              <hr className="border-gray-200" />
              
              {/* Status Checkboxes */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Claim Status
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {statuses.map(status => (
                    <label 
                      key={status} 
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        checked={filters.claimStatuses.includes(status)}
                        onChange={(e) => handleStatusChange(status, e.target.checked)}
                      />
                      <span className="text-sm text-gray-700 select-none">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;