import React, { useState, useRef, useEffect, useContext } from 'react';
import { MapContext } from '../../context/MapContext';

const SearchControl = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  
  const { 
    mapInstance,
    geoJsonData,
    setGeoJsonData,
    boundaryLayers,
    setBoundaryLayers,
    setCurrentLevel,
    setSelectedState: setContextSelectedState,
    setSelectedDistrict: setContextSelectedDistrict,
    boundariesEnabled,
    setBoundariesEnabled
  } = useContext(MapContext);

  // Indian states list
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Jammu and Kashmir', 'Delhi'
  ];

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Helper function to normalize state names
  const normalizeStateName = (name) => {
    if (!name) return '';
    return name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_]/g, '');
  };

  // Get state folder name for GitHub API
  const getStateFolderName = (stateName) => {
    const folderMap = {
      ODISHA: 'ORISSA',
      ORISSA: 'ORISSA',
      BIHAR: 'BIHAR',
      MADHYA_PRADESH: 'MADHYA PRADESH',
      JAMMU_AND_KASHMIR: 'JAMMU KASHMIR',
      ANDHRA_PRADESH: 'ANDHRA PRADESH',
      HIMACHAL_PRADESH: 'HIMACHAL PRADESH',
      UTTAR_PRADESH: 'UTTAR PRADESH',
      WEST_BENGAL: 'WEST BENGAL',
      TAMIL_NADU: 'TAMIL NADU',
      // Add more as needed
    };
    const normalized = normalizeStateName(stateName);
    return folderMap[normalized] || normalized;
  };

  // Load districts for selected state
  const loadDistricts = async (stateName) => {
    if (!stateName) {
      setAvailableDistricts([]);
      return;
    }

    const normalized = normalizeStateName(stateName);
    
    // Check if we already have district data
    if (geoJsonData.districts[normalized]) {
      const districts = geoJsonData.districts[normalized].features
        .map(feature => feature.properties.dtname || feature.properties.DISTRICT)
        .filter(Boolean)
        .sort();
      setAvailableDistricts(districts);
      return;
    }

    setIsLoading(true);
    try {
      const folderName = getStateFolderName(stateName);
      const encodedFolderName = encodeURIComponent(folderName);
      const fileName = normalized === 'ORISSA' ? 'ODISHA_DISTRICTS' : `${folderName}_DISTRICTS`;
      const encodedFileName = encodeURIComponent(fileName);
      const url = `https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/STATES/${encodedFolderName}/${encodedFileName}.geojson`;
      
      console.log(`Loading districts for ${stateName}: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: File not found for ${stateName}`);
      }
      
      const data = await response.json();
      
      if (data.type !== 'FeatureCollection') {
        throw new Error('Invalid GeoJSON format');
      }
      
      // Update context with district data
      setGeoJsonData(prev => ({
        ...prev,
        districts: { ...prev.districts, [normalized]: data }
      }));
      
      // Extract district names
      const districts = data.features
        .map(feature => feature.properties.dtname || feature.properties.DISTRICT)
        .filter(Boolean)
        .sort();
      
      setAvailableDistricts(districts);
      
    } catch (error) {
      console.error(`Failed to load districts for ${stateName}:`, error);
      alert(`Failed to load districts for ${stateName}. Please try again.`);
      setAvailableDistricts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle state selection
  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setSelectedDistrict('');
    loadDistricts(state);
  };

  // Handle search submit
  const handleSearch = async () => {
    if (!selectedState || !selectedDistrict || !mapInstance) {
      alert('Please select both state and district');
      return;
    }

    try {
      // Get district data
      const normalized = normalizeStateName(selectedState);
      const districtData = geoJsonData.districts[normalized];
      
      if (!districtData) {
        alert('District data not available');
        return;
      }

      console.log('Available district data:', districtData);
      console.log('Looking for district:', selectedDistrict);
      console.log('Available districts:', districtData.features.map(f => ({
        dtname: f.properties.dtname,
        DISTRICT: f.properties.DISTRICT,
        allProps: Object.keys(f.properties)
      })));

      // Find the specific district - try multiple property names
      const districtFeature = districtData.features.find(feature => {
        const props = feature.properties;
        const distName = props.dtname || props.DISTRICT || props.NAME || props.name;
        if (distName) {
          const match = distName.toLowerCase().trim() === selectedDistrict.toLowerCase().trim();
          console.log(`Comparing "${distName}" with "${selectedDistrict}": ${match}`);
          return match;
        }
        return false;
      });

      if (!districtFeature) {
        console.error('District not found. Available districts:', 
          districtData.features.map(f => f.properties.dtname || f.properties.DISTRICT || f.properties.NAME));
        alert(`District "${selectedDistrict}" not found in the data`);
        return;
      }

      console.log('Found district feature:', districtFeature);

      // Clear ALL existing boundary layers (both from normal navigation and search)
      if (boundaryLayers.states) {
        try {
          mapInstance.removeLayer(boundaryLayers.states);
          console.log('Removed states layer');
        } catch (error) {
          console.error('Error removing states layer:', error);
        }
      }
      
      if (boundaryLayers.districts) {
        try {
          mapInstance.removeLayer(boundaryLayers.districts);
          console.log('Removed districts layer');
        } catch (error) {
          console.error('Error removing districts layer:', error);
        }
      }

      // Create and add only the selected district layer
      const searchDistrictLayer = window.L.geoJSON(districtFeature, {
        style: { 
          color: '#e74c3c', 
          weight: 3, 
          fillOpacity: 0.2,
          fillColor: '#e74c3c',
          dashArray: '8, 4' // Dashed line to distinguish from normal navigation
        }
      });
      
      // Add to map
      searchDistrictLayer.addTo(mapInstance);
      console.log('Added search district layer to map');

      // Fit bounds to the district
      const bounds = searchDistrictLayer.getBounds();
      console.log('District bounds:', bounds);
      
      mapInstance.fitBounds(bounds, { 
        padding: [30, 30],
        animate: true,
        duration: 1.0
      });

      // Clear context state to disconnect from normal navigation system
      setContextSelectedState(null);
      setContextSelectedDistrict(null);
      setCurrentLevel('search'); // Special level for search results
      
      // Store only the search result layer
      setBoundaryLayers({ states: null, districts: searchDistrictLayer });

      // Close search modal
      setIsOpen(false);
      
      console.log(`✅ Successfully searched and zoomed to: ${selectedDistrict}, ${selectedState} (search mode)`);

    } catch (error) {
      console.error('Error during search:', error);
      alert('Failed to search location. Please try again.');
    }
  };

  // Reset search form
  const resetSearch = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setAvailableDistricts([]);
  };

  return (
    <div className="absolute top-3 left-15 z-[1003]" ref={searchRef}>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white rounded-full shadow-lg p-3 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 hover:shadow-xl"
        title="Search Location"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Search Modal */}
      <div className={`absolute top-16 left-0 transition-all duration-300 ease-in-out transform ${
        isOpen 
          ? 'opacity-100 translate-y-0 scale-100 z-[1010]' 
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none z-[1003]'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ width: '320px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Search Location
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4">
            {/* State Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select State
              </label>
              <select
                value={selectedState}
                onChange={handleStateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Choose a state...</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* District Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedState || isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoading ? 'Loading districts...' : 
                   !selectedState ? 'First select a state' : 
                   'Choose a district...'}
                </option>
                {availableDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleSearch}
                disabled={!selectedState || !selectedDistrict || isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                ) : (
                  'Search'
                )}
              </button>
              
              <button
                onClick={resetSearch}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchControl;