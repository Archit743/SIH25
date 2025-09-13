import React, { useContext, useEffect, useCallback } from 'react';
import { MapContainer as LeafletMap, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapContext } from '../../context/MapContext';
import LayerControl from './LayerControl';
import MapLegend from './MapLegend';
import SearchControl from './SearchControl'; 
import DrawingTools from './DrawingTools';
import 'leaflet/dist/leaflet.css';

const MapInstanceSetter = () => {
    const map = useMap();
    const { setMapInstance } = useContext(MapContext);
    
    useEffect(() => {
      console.log('Setting map instance in context');
      setMapInstance(map);
      
      return () => {
        setMapInstance(null);
      };
    }, [map, setMapInstance]);
    
    return null;
  };

// New component to add the scale control
const ScaleControl = () => {
  const map = useMap();
  
  useEffect(() => {
    // Add scale control to bottom left
    const scaleControl = L.control.scale({
      position: 'bottomleft',
      metric: true,        // Show metric units (meters/kilometers)
      imperial: false,     // Hide imperial units (feet/miles) - set to true if you want both
      updateWhenIdle: false, // Update scale even during map movement for smoother updates
      maxWidth: 150        // Maximum width of the scale bar in pixels
    });
    
    scaleControl.addTo(map);
    
    // Cleanup: remove the control when component unmounts
    return () => {
      map.removeControl(scaleControl);
    };
  }, [map]);
  
  return null;
};

const MapLayers = () => {
  const map = useMap();
  const { 
    filters,
    currentLevel, setCurrentLevel,
    selectedState, setSelectedState,
    selectedDistrict, setSelectedDistrict,
    boundaryLayers, setBoundaryLayers,
    geoJsonData, setGeoJsonData,
    loadingBoundaries, setLoadingBoundaries,
    boundariesEnabled,
  } = useContext(MapContext);
  // Helper function to add at the top of your component
  const normalizeStateName = (name) => {
    if (!name) return '';
    return name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_]/g, '');
  };

  // Apply filters for zooming
  useEffect(() => {
    let term = '';
    if (filters.village) term = filters.village;
    else if (filters.district) term = filters.district;
    else if (filters.state) term = filters.state;
    else return;

    console.log('Filter changed to:', term);
  }, [filters.village, filters.district, filters.state]);

  // Load states GeoJSON on mount
  useEffect(() => {
    if (!boundariesEnabled) return;

    const loadStates = async () => {
      if (geoJsonData.states) {
        console.log('States GeoJSON already loaded');
        return;
      }
      setLoadingBoundaries(true);
      try {
        const url = 'https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIA_STATES.geojson';
        console.log('Fetching states:', url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.type !== 'FeatureCollection') {
          throw new Error('Invalid GeoJSON format');
        }
        console.log('States GeoJSON loaded successfully');
        setGeoJsonData((prev) => ({ ...prev, states: data }));
      } catch (error) {
        console.error('Failed to load states GeoJSON:', error);
        alert('Failed to load state boundaries. Please check your network or try again later.');
      } finally {
        setLoadingBoundaries(false);
      }
    };
    loadStates();
  }, [boundariesEnabled, geoJsonData.states, setGeoJsonData, setLoadingBoundaries]);

  // Function to load districts
  const loadDistricts = useCallback(async (stateName) => {
    if (!boundariesEnabled) return;

    const normalized = normalizeStateName(stateName);
    if (geoJsonData.districts[normalized]) {
      console.log(`Districts for ${stateName} already loaded`);
      return;
    }
    setLoadingBoundaries(true);
    try {
      const folderName = getStateFolderName(stateName);
      const encodedFolderName = encodeURIComponent(folderName);
      const fileName = normalized === 'ORISSA' ? 'ODISHA_DISTRICTS' : `${normalized}_DISTRICTS`;
      const encodedFileName = encodeURIComponent(fileName);
      const url = `https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/STATES/${encodedFolderName}/${encodedFileName}.geojson`;
      console.log(`Fetching districts for ${stateName}: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: File not found for ${stateName}`);
      }
      const data = await response.json();
      if (data.type !== 'FeatureCollection') {
        throw new Error('Invalid GeoJSON format');
      }
      console.log(`Districts for ${stateName} loaded successfully`);
      setGeoJsonData((prev) => ({
        ...prev,
        districts: { ...prev.districts, [normalized]: data },
      }));
    } catch (error) {
      console.error(`Failed to load districts for ${stateName}:`, error);
      alert(`Failed to load districts for ${stateName}.`);
    } finally {
      setLoadingBoundaries(false);
    }
  }, [boundariesEnabled, geoJsonData.districts, setGeoJsonData, setLoadingBoundaries]);

  // Remove all boundary layers when boundaries are disabled (but preserve search results)
  useEffect(() => {
    if (!boundariesEnabled) {
      console.log('Boundaries disabled, removing navigation layers only');
      
      // Only remove layers if we're NOT in search mode
      if (currentLevel !== 'search') {
        if (boundaryLayers.states || boundaryLayers.districts || selectedState || selectedDistrict || currentLevel !== 'india') {
          if (boundaryLayers.states) {
            try {
              map.removeLayer(boundaryLayers.states);
            } catch (error) {
              console.error('Error removing states layer:', error);
            }
          }
          if (boundaryLayers.districts) {
            try {
              map.removeLayer(boundaryLayers.districts);
            } catch (error) {
              console.error('Error removing districts layer:', error);
            }
          }
          setBoundaryLayers({ states: null, districts: null });
          if (selectedState !== null) setSelectedState(null);
          if (selectedDistrict !== null) setSelectedDistrict(null);
          if (currentLevel !== 'india') setCurrentLevel('india');
        }
      } else {
        console.log('Search mode active - preserving search results despite boundaries being disabled');
      }
    }
  }, [boundariesEnabled, boundaryLayers.states, boundaryLayers.districts, selectedState, selectedDistrict, currentLevel, map, setBoundaryLayers, setSelectedState, setSelectedDistrict, setCurrentLevel]);

  // Add states layer
  useEffect(() => {
    console.log('🔍 States layer effect triggered:', {
      boundariesEnabled,
      hasGeoJsonData: !!geoJsonData.states,
      hasExistingLayer: !!boundaryLayers.states,
      currentLevel
    });

    if (!boundariesEnabled || !geoJsonData.states || boundaryLayers.states) {
      console.log('❌ States layer conditions not met, skipping');
      return;
    }

    console.log('➕ Adding states layer to map');
    const statesLayer = L.geoJSON(geoJsonData.states, {
      style: { color: '#3388ff', weight: 2, fillOpacity: 0 },
      onEachFeature: (feature, layer) => {
        const stateName = feature.properties.STNAME || 'Unknown State';
        if (!feature.properties.STNAME) {
          console.warn('No state name in feature properties:', feature.properties);
        }
        layer.on('click', () => {
        if (!stateName || !boundariesEnabled) return;
        console.log(`State clicked: ${stateName}`);
        
        // Force remove existing district layer
        if (boundaryLayers.districts) {
          console.log('🧹 Removing existing district layer before state change');
          try {
            map.removeLayer(boundaryLayers.districts);
          } catch (error) {
            console.error('Error removing district layer:', error);
          }
          // Immediately clear the reference
          setBoundaryLayers((prev) => ({ ...prev, districts: null }));
        }
        
        try {
          map.fitBounds(layer.getBounds(), { padding: [50, 50] });
        } catch (error) {
          console.error('Error getting bounds:', error);
        }
        
        setSelectedState(stateName);
        setSelectedDistrict(null);
        setCurrentLevel('state');
        loadDistricts(stateName);
      });
        layer.bindPopup(`State: ${stateName}`);
      },
    }).addTo(map);
    
    setBoundaryLayers((prev) => ({ ...prev, states: statesLayer }));
    console.log('✅ States layer added successfully');
  }, [boundariesEnabled, geoJsonData.states, boundaryLayers.states, currentLevel, map, setBoundaryLayers, setSelectedState, setSelectedDistrict, setCurrentLevel, loadDistricts]);

  // Add districts layer (only for normal navigation, not search)
  useEffect(() => {
    console.log('🔍 District layer effect triggered:', {
      boundariesEnabled,
      selectedState,
      hasDistrictLayer: !!boundaryLayers.districts,
      currentLevel,
      hasDistrictData: selectedState ? !!geoJsonData.districts[normalizeStateName(selectedState)] : false
    });

    // Don't interfere if we're in search mode
    if (currentLevel === 'search') {
      console.log('❌ Search mode active, skipping normal district layer logic');
      return;
    }

    if (!boundariesEnabled || !selectedState) {
      if (boundaryLayers.districts) {
        console.log('Removing district layer due to boundaries disabled or no state selected');
        try {
          map.removeLayer(boundaryLayers.districts);
          setBoundaryLayers((prev) => ({ ...prev, districts: null }));
        } catch (error) {
          console.error('Error removing district layer:', error);
        }
      }
      return;
    }

    const normalizedState = normalizeStateName(selectedState);
    const districtData = geoJsonData.districts[normalizedState];
    
    // Check if we have district data for the selected state
    if (districtData && (currentLevel === 'state' || currentLevel === 'district')) {
      
      // Remove existing district layer if it exists
      if (boundaryLayers.districts) {
        console.log('🧹 Removing existing district layer before adding new one');
        try {
          map.removeLayer(boundaryLayers.districts);
        } catch (error) {
          console.error('Error removing existing district layer:', error);
        }
      }
      
      console.log(`➕ Adding districts layer for ${selectedState}`);
      const districtsLayer = L.geoJSON(districtData, {
        style: { color: '#ff7733', weight: 1.5, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          const distName = feature.properties.dtname || 'Unknown District';
          if (!feature.properties.dtname) {
            console.warn('No district name in feature properties:', feature.properties);
          }
          layer.on('click', () => {
            if (!distName || !boundariesEnabled || !selectedState) return;
            console.log(`District clicked: ${distName}`);
            
            try {
              map.fitBounds(layer.getBounds());
            } catch (error) {
              console.error('Error getting bounds:', error);
            }
            
            setSelectedDistrict(distName);
            setCurrentLevel('district');
          });
          layer.bindPopup(`District: ${distName}`);
        },
      }).addTo(map);
      
      setBoundaryLayers((prev) => ({ ...prev, districts: districtsLayer }));
      console.log('✅ Districts layer added successfully');
    }
  }, [boundariesEnabled, selectedState, geoJsonData.districts, currentLevel, map, setBoundaryLayers, setSelectedDistrict, setCurrentLevel]);

  // Reset to India view
  useEffect(() => {
    if (currentLevel === 'india' && !selectedState && boundariesEnabled && boundaryLayers.states) {
      console.log('🔄 Returning to India level - restoring full map view');
      map.setView([20.5937, 78.9629], 5, { animate: true, duration: 1.0 });
    }
  }, [currentLevel, selectedState, boundariesEnabled, boundaryLayers.states, map]);

  // Clear district layer when selectedState changes (but not in search mode)
  useEffect(() => {
    // Don't interfere if we're in search mode
    if (currentLevel === 'search') {
      console.log('❌ Search mode active, skipping district cleanup logic');
      return;
    }

    if (boundaryLayers.districts && !selectedState) {
      console.log('No state selected, removing district layer');
      try {
        map.removeLayer(boundaryLayers.districts);
        setBoundaryLayers((prev) => ({ ...prev, districts: null }));
        if (selectedDistrict !== null) setSelectedDistrict(null);
      } catch (error) {
        console.error('Error removing district layer:', error);
      }
    }
  }, [selectedState, boundaryLayers.districts, selectedDistrict, currentLevel, map, setBoundaryLayers, setSelectedDistrict]);


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
      // add more
    };
    const normalized = normalizeStateName(stateName);
    return folderMap[normalized] || normalized;
  };

  if (loadingBoundaries) {
    console.log('Loading boundaries...');
  }

  return null;
};

const MapContainer = () => {
  const { mapCenter, zoom } = useContext(MapContext);

  return (
    <LeafletMap
      center={mapCenter}
      zoom={zoom}
      className="map-container"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapInstanceSetter />
      <MapLayers />
      <LayerControl />
      <SearchControl />
      <MapLegend />
      <DrawingTools />
      <ScaleControl /> 
    </LeafletMap>
  );
};

export default MapContainer;