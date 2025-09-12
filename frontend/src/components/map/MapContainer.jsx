// MapContainer.js - Fixed boundary toggle, state switching, and proper layer management
import React, { useContext, useEffect, useCallback } from 'react';
import { MapContainer as LeafletMap, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapContext } from '../../context/MapContext';
import LayerControl from './LayerControl';
import MapLegend from './MapLegend';
// import DrawingTools from './DrawingTools';
// import FilterPanel from './FilterPanel';
// import SearchControl from './SearchControl';
import 'leaflet/dist/leaflet.css';

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
    boundariesEnabled, // New prop to check if boundaries are enabled
  } = useContext(MapContext);

  // Apply filters for zooming (removed mock bounds)
  useEffect(() => {
    let term = '';
    if (filters.village) term = filters.village;
    else if (filters.district) term = filters.district;
    else if (filters.state) term = filters.state;
    else return;

    // Just log the filter change, no bounds fitting since we removed mock bounds
    console.log('Filter changed to:', term);
  }, [filters.village, filters.district, filters.state]);

  // Load states GeoJSON on mount - only if boundaries are enabled
  useEffect(() => {
    if (!boundariesEnabled) return; // Don't load if boundaries are disabled

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

  // Function to load districts - only if boundaries are enabled
  const loadDistricts = useCallback(async (stateName) => {
    if (!boundariesEnabled) return; // Don't load if boundaries are disabled

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
      const url = `https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/STATES/${encodedFolderName}/${fileName}.geojson`;
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

  // Remove all boundary layers when boundaries are disabled
  useEffect(() => {
    if (!boundariesEnabled) {
      console.log('Boundaries disabled, removing all layers');
      
      // Remove states layer
      if (boundaryLayers.states) {
        map.removeLayer(boundaryLayers.states);
      }
      
      // Remove districts layer
      if (boundaryLayers.districts) {
        map.removeLayer(boundaryLayers.districts);
      }
      
      // Clear boundary layers state
      setBoundaryLayers({ states: null, districts: null });
      
      // Reset selections
      setSelectedState(null);
      setSelectedDistrict(null);
      setCurrentLevel('india');
    }
  }, [boundariesEnabled]); // Only depend on boundariesEnabled to avoid infinite loop

  // Add states layer - only if boundaries are enabled
  useEffect(() => {
    if (!boundariesEnabled || !geoJsonData.states || boundaryLayers.states) return;

    console.log('Adding states layer');
    const statesLayer = L.geoJSON(geoJsonData.states, {
      style: { color: '#3388ff', weight: 2, fillOpacity: 0 },
      onEachFeature: (feature, layer) => {
        const stateName = feature.properties.STNAME || 'Unknown State';
        if (!feature.properties.STNAME) {
          console.warn('No state name in feature properties:', feature.properties);
        }
        layer.on('click', () => {
          if (!stateName || !boundariesEnabled) return; // Check if boundaries are enabled
          console.log(`State clicked: ${stateName}`);
          
          // CRITICAL FIX: Clear existing district layer BEFORE setting new state
          if (boundaryLayers.districts) {
            console.log('🧹 Removing existing district layer before state change');
            map.removeLayer(boundaryLayers.districts);
            setBoundaryLayers((prev) => ({ ...prev, districts: null }));
          }
          
          // Fit bounds using the actual layer bounds
          try {
            map.fitBounds(layer.getBounds(), { padding: [50, 50] });
          } catch (error) {
            console.error('Error getting bounds:', error);
          }
          
          // Set new state selections
          setSelectedState(stateName);
          setSelectedDistrict(null);
          setCurrentLevel('state');
          
          // Load districts for the new state
          loadDistricts(stateName);
        });
        layer.bindPopup(`State: ${stateName}`);
      },
    }).addTo(map);
    setBoundaryLayers((prev) => ({ ...prev, states: statesLayer }));
  }, [boundariesEnabled, geoJsonData.states, boundaryLayers.states, map, setBoundaryLayers, setSelectedState, setSelectedDistrict, setCurrentLevel, loadDistricts, boundaryLayers.districts]);

  // Add districts layer - only if boundaries are enabled and state is selected
  useEffect(() => {
    if (!boundariesEnabled || !selectedState) return;

    const normalizedState = normalizeStateName(selectedState);
    
    // Only add district layer if:
    // 1. We have a selected state
    // 2. We're at state level
    // 3. We have the district data
    // 4. We don't already have a district layer
    if (currentLevel === 'state' && geoJsonData.districts[normalizedState] && !boundaryLayers.districts) {
      console.log(`Adding districts layer for ${selectedState}`);
      const distData = geoJsonData.districts[normalizedState];
      const districtsLayer = L.geoJSON(distData, {
        style: { color: '#ff7733', weight: 1.5, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          const distName = feature.properties.dtname || 'Unknown District';
          if (!feature.properties.dtname) {
            console.warn('No district name in feature properties:', feature.properties);
          }
          layer.on('click', () => {
            if (!distName || !boundariesEnabled) return; // Check if boundaries are enabled
            console.log(`District clicked: ${distName}`);
            
            // Fit bounds using the actual layer bounds
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
    }
  }, [boundariesEnabled, selectedState, geoJsonData.districts, currentLevel, boundaryLayers.districts, map, setBoundaryLayers, setSelectedDistrict, setCurrentLevel]);

  // Clear district layer when returning to India level
  useEffect(() => {
    if (currentLevel === 'india' && boundaryLayers.districts) {
      console.log('Clearing district layer on reset to India');
      map.removeLayer(boundaryLayers.districts);
      setBoundaryLayers((prev) => ({ ...prev, districts: null }));
    }
  }, [currentLevel, boundaryLayers.districts, map, setBoundaryLayers]);

  // ENHANCED: Clear district layer when selectedState changes (switching between states)
  useEffect(() => {
    if (boundaryLayers.districts) {
      console.log(`🔄 State changed to ${selectedState}, removing previous district layer`);
      try {
        map.removeLayer(boundaryLayers.districts);
        setBoundaryLayers((prev) => ({ ...prev, districts: null }));
        console.log(`✅ Previous district layer removed successfully`);
      } catch (error) {
        console.error('❌ Error removing previous district layer:', error);
      }
    }
  }, [selectedState]); // This will run every time selectedState changes

  const normalizeStateName = (name) => {
    if (!name) return '';
    return name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_]/g, '');
  };

  const getStateFolderName = (stateName) => {
    const folderMap = {
      'ODISHA': 'ORISSA',
      'ORISSA': 'ORISSA',
      'BIHAR': 'BIHAR',
      'MADHYA_PRADESH': 'MADHYA PRADESH',
      'JAMMU_AND_KASHMIR': 'JAMMU KASHMIR',
    };
    const normalized = normalizeStateName(stateName);
    return folderMap[normalized] || normalized.replace(/_/g, ' ');
  };

  if (loadingBoundaries) {
    console.log('Loading boundaries...');
  }

  return null;
};

const MapContainer = () => {
  const { mapCenter, zoom, setMapInstance } = useContext(MapContext);

  return (
    <LeafletMap
      center={mapCenter}
      zoom={zoom}
      className="map-container"
      whenCreated={(map) => {
        setMapInstance(map);
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapLayers />
      <LayerControl />
      <MapLegend />
      {/* <DrawingTools />
      <FilterPanel />
      <SearchControl /> */}
    </LeafletMap>
  );
};

export default MapContainer;