import React, { useState, useRef, useEffect, useContext } from 'react';
import { MapContext } from '../../context/MapContext';

const SearchControl = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSubdistricts, setAvailableSubdistricts] = useState([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);
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
    setSelectedSubdistrict: setContextSelectedSubdistrict,
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

  // Helper functions to normalize names
  const normalizeStateName = (name) => {
    if (!name) return '';
    return name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_]/g, '');
  };

  const normalizeDistrictName = (name) => {
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
    };
    const normalized = normalizeStateName(stateName);
    return folderMap[normalized] || normalized;
  };

  // Load districts for selected state
  const loadDistricts = async (stateName) => {
    if (!stateName) {
      setAvailableDistricts([]);
      setAvailableSubdistricts([]);
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

    setIsLoadingDistricts(true);
    try {
      const folderName = getStateFolderName(stateName);
      const encodedFolderName = encodeURIComponent(folderName);
      const fileName = folderName === 'ORISSA' ? 'ODISHA_DISTRICTS' : `${folderName}_DISTRICTS`;
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
      setIsLoadingDistricts(false);
    }
  };

  // Load subdistricts for selected district
  const loadSubdistricts = async (stateName, districtName) => {
    if (!stateName || !districtName) {
      setAvailableSubdistricts([]);
      return;
    }

    const normalizedState = normalizeStateName(stateName);
    
    // Check if we already have subdistrict data for the state
    if (geoJsonData.subdistricts[normalizedState]) {
      const subdistricts = geoJsonData.subdistricts[normalizedState].features
        .filter(feature => {
          const featureDistrictName = feature.properties.dtname || feature.properties.DISTRICT;
          return featureDistrictName && featureDistrictName.toLowerCase().trim() === districtName.toLowerCase().trim();
        })
        .map(feature => feature.properties.sdtname)
        .filter(Boolean)
        .sort();
      setAvailableSubdistricts(subdistricts);
      return;
    }

    setIsLoadingSubdistricts(true);
    try {
      const folderName = getStateFolderName(stateName);
      const encodedFolderName = encodeURIComponent(folderName);
      const fileName = folderName === 'ORISSA' ? 'ODISHA_SUBDISTRICTS' : `${folderName}_SUBDISTRICTS`;
      const encodedFileName = encodeURIComponent(fileName);
      const url = `https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/STATES/${encodedFolderName}/${encodedFileName}.geojson`;
      
      console.log(`Loading subdistricts for ${stateName}: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: File not found for ${stateName}`);
      }
      
      const data = await response.json();
      
      if (data.type !== 'FeatureCollection') {
        throw new Error('Invalid GeoJSON format');
      }
      
      // Update context with subdistrict data
      setGeoJsonData(prev => ({
        ...prev,
        subdistricts: {
          ...prev.subdistricts,
          [normalizedState]: data
        }
      }));
      
      // Extract subdistrict names for the selected district
      const subdistricts = data.features
        .filter(feature => {
          const featureDistrictName = feature.properties.dtname || feature.properties.DISTRICT;
          return featureDistrictName && featureDistrictName.toLowerCase().trim() === districtName.toLowerCase().trim();
        })
        .map(feature => feature.properties.sdtname)
        .filter(Boolean)
        .sort();
      
      setAvailableSubdistricts(subdistricts);
      
    } catch (error) {
      console.error(`Failed to load subdistricts for ${districtName}, ${stateName}:`, error);
      setAvailableSubdistricts([]);
    } finally {
      setIsLoadingSubdistricts(false);
    }
  };

  // Handle state selection
  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setSelectedDistrict('');
    setSelectedSubdistrict('');
    setAvailableSubdistricts([]);
    loadDistricts(state);
  };

  // Handle district selection
  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    setSelectedSubdistrict('');
    loadSubdistricts(selectedState, district);
  };

  // Handle search submit
  const handleSearch = async () => {
    if (!selectedState || !mapInstance) {
      alert('Please select at least a state');
      return;
    }

    try {
      let searchFeature = null;
      let searchData = null;
      let searchLevel = '';
      let searchStyle = {};

      // Determine what to search for based on selections
      if (selectedSubdistrict && selectedDistrict) {
        // Search for subdistrict
        const normalizedState = normalizeStateName(selectedState);
        searchData = geoJsonData.subdistricts[normalizedState];
        
        if (!searchData) {
          alert('Subdistrict data not available');
          return;
        }

        searchFeature = searchData.features.find(feature => {
          const subdistName = feature.properties.sdtname;
          const featureDistrictName = feature.properties.dtname || feature.properties.DISTRICT;
          return subdistName && subdistName.toLowerCase().trim() === selectedSubdistrict.toLowerCase().trim() &&
                 featureDistrictName && featureDistrictName.toLowerCase().trim() === selectedDistrict.toLowerCase().trim();
        });

        if (!searchFeature) {
          alert(`Subdistrict "${selectedSubdistrict}" not found in ${selectedDistrict}`);
          return;
        }

        searchLevel = 'subdistrict';
        searchStyle = { 
          color: '#8b5cf6', 
          weight: 3, 
          fillOpacity: 0.3,
          fillColor: '#8b5cf6',
          dashArray: '8, 4'
        };

      } else if (selectedDistrict) {
        // Search for district
        const normalized = normalizeStateName(selectedState);
        searchData = geoJsonData.districts[normalized];
        
        if (!searchData) {
          alert('District data not available');
          return;
        }

        searchFeature = searchData.features.find(feature => {
          const props = feature.properties;
          const distName = props.dtname || props.DISTRICT || props.NAME || props.name;
          return distName && distName.toLowerCase().trim() === selectedDistrict.toLowerCase().trim();
        });

        if (!searchFeature) {
          alert(`District "${selectedDistrict}" not found`);
          return;
        }

        searchLevel = 'district';
        searchStyle = { 
          color: '#e74c3c', 
          weight: 3, 
          fillOpacity: 0.2,
          fillColor: '#e74c3c',
          dashArray: '8, 4'
        };

      } else {
        // Search for state
        if (!geoJsonData.states) {
          alert('State data not available');
          return;
        }

        searchFeature = geoJsonData.states.features.find(feature => {
          const stateName = feature.properties.STNAME;
          return stateName && stateName.toLowerCase().trim() === selectedState.toLowerCase().trim();
        });

        if (!searchFeature) {
          alert(`State "${selectedState}" not found`);
          return;
        }

        searchLevel = 'state';
        searchStyle = { 
          color: '#3388ff', 
          weight: 3, 
          fillOpacity: 0.1,
          fillColor: '#3388ff',
          dashArray: '8, 4'
        };
      }

      // Clear ALL existing boundary layers
      Object.keys(boundaryLayers).forEach(layerType => {
        if (boundaryLayers[layerType]) {
          try {
            mapInstance.removeLayer(boundaryLayers[layerType]);
            console.log(`Removed ${layerType} layer`);
          } catch (error) {
            console.error(`Error removing ${layerType} layer:`, error);
          }
        }
      });

      // Create and add the search result layer
      const searchLayer = window.L.geoJSON(searchFeature, {
        style: searchStyle
      });
      
      searchLayer.addTo(mapInstance);
      console.log(`Added search ${searchLevel} layer to map`);

      // Fit bounds to the search result
      const bounds = searchLayer.getBounds();
      console.log(`${searchLevel} bounds:`, bounds);
      
      mapInstance.fitBounds(bounds, { 
        padding: [30, 30],
        animate: true,
        duration: 1.0
      });

      // Clear context state to disconnect from normal navigation system
      setContextSelectedState(null);
      setContextSelectedDistrict(null);
      setContextSelectedSubdistrict(null);
      setCurrentLevel('search');
      
      // Store the search result layer based on what was searched
      const newBoundaryLayers = { states: null, districts: null, subdistricts: null };
      newBoundaryLayers[searchLevel === 'state' ? 'states' : 
                       searchLevel === 'district' ? 'districts' : 'subdistricts'] = searchLayer;
      setBoundaryLayers(newBoundaryLayers);

      // Close search modal
      setIsOpen(false);
      
      const searchTerm = selectedSubdistrict || selectedDistrict || selectedState;
      console.log(`✅ Successfully searched and zoomed to: ${searchTerm} (${searchLevel} level)`);

    } catch (error) {
      console.error('Error during search:', error);
      alert('Failed to search location. Please try again.');
    }
  };

  // Reset search form
  const resetSearch = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedSubdistrict('');
    setAvailableDistricts([]);
    setAvailableSubdistricts([]);
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
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ width: '340px' }}>
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
                Select District (Optional)
              </label>
              <select
                value={selectedDistrict}
                onChange={handleDistrictChange}
                disabled={!selectedState || isLoadingDistricts}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingDistricts ? 'Loading districts...' : 
                   !selectedState ? 'First select a state' : 
                   'Choose a district...'}
                </option>
                {availableDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            {/* Subdistrict Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Subdistrict (Optional)
              </label>
              <select
                value={selectedSubdistrict}
                onChange={(e) => setSelectedSubdistrict(e.target.value)}
                disabled={!selectedDistrict || isLoadingSubdistricts}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingSubdistricts ? 'Loading subdistricts...' : 
                   !selectedDistrict ? 'First select a district' : 
                   availableSubdistricts.length === 0 ? 'No subdistricts available' :
                   'Choose a subdistrict...'}
                </option>
                {availableSubdistricts.map(subdistrict => (
                  <option key={subdistrict} value={subdistrict}>{subdistrict}</option>
                ))}
              </select>
            </div>

            {/* Search Info */}
            <div className="mb-4 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">
                💡 You can search by state only, or narrow down to district/subdistrict level
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleSearch}
                disabled={!selectedState || isLoadingDistricts || isLoadingSubdistricts}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {(isLoadingDistricts || isLoadingSubdistricts) ? (
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