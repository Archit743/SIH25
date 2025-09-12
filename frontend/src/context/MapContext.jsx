import React, { createContext, useState, useCallback } from 'react';

export const MapContext = createContext();

export const MapProvider = ({ children }) => {
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [zoom, setZoom] = useState(8);
  const [layers, setLayers] = useState({});
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    village: '',
    tribalGroup: '',
    claimStatuses: [],
    featureType: ''
  });
  const [mapInstance, setMapInstance] = useState(null);
  const [currentLevel, setCurrentLevel] = useState('india');
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [boundaryLayers, setBoundaryLayers] = useState({ states: null, districts: null });
  const [geoJsonData, setGeoJsonData] = useState({ states: null, districts: {} });
  const [loadingBoundaries, setLoadingBoundaries] = useState(false);
  const [boundariesEnabled, setBoundariesEnabled] = useState(false);

  const addLayer = useCallback((key, data) => {
    console.log(`Adding layer: ${key}`, data);
    setLayers((prev) => ({ ...prev, [key]: data }));
  }, []);

  const resetToIndia = useCallback(() => {
    console.log('🏠 Reset to India called');
    console.log('🗺️ Current mapInstance:', !!mapInstance);
    console.log('🔍 Current level:', currentLevel);
    console.log('🗺️ Current boundaryLayers:', {
      hasStates: !!boundaryLayers.states,
      hasDistricts: !!boundaryLayers.districts
    });
    
    // Always reset state-related variables first
    console.log('🧹 Clearing all selections and layers');
    setCurrentLevel('india');
    setSelectedState(null);
    setSelectedDistrict(null);
    setFilters({ 
      state: '', 
      district: '', 
      village: '', 
      tribalGroup: '', 
      claimStatuses: [], 
      featureType: '' 
    });
    
    // Remove ALL boundary layers (both navigation and search)
    if (boundaryLayers.states) {
      console.log('❌ Removing states layer');
      try {
        if (mapInstance) {
          mapInstance.removeLayer(boundaryLayers.states);
        }
      } catch (error) {
        console.error('Error removing states layer:', error);
      }
    }
    
    if (boundaryLayers.districts) {
      console.log('❌ Removing districts layer (including search results)');
      try {
        if (mapInstance) {
          mapInstance.removeLayer(boundaryLayers.districts);
        }
      } catch (error) {
        console.error('Error removing districts layer:', error);
      }
    }
    
    // Clear all boundary layer references
    setBoundaryLayers({ states: null, districts: null });
    
    // Always zoom to India view (force zoom even if already at level 5)
    if (mapInstance) {
      console.log('🔍 Zooming to India view - current zoom:', mapInstance.getZoom());
      // Force zoom by using a slightly different zoom level first, then to 5
      const currentZoom = mapInstance.getZoom();
      if (currentZoom === 5) {
        // If already at zoom 5, zoom out slightly then back to 5
        mapInstance.setView([20.5937, 78.9629], 4, { animate: false });
        setTimeout(() => {
          mapInstance.setView([20.5937, 78.9629], 5, { animate: true, duration: 1.0 });
        }, 50);
      } else {
        mapInstance.setView([20.5937, 78.9629], 5, { animate: true, duration: 1.0 });
      }
    } else {
      console.warn('⚠️ MapInstance is null, cannot zoom');
    }
    
    console.log('✅ Reset to India completed - all search results and navigation cleared');
  }, [mapInstance, boundaryLayers, currentLevel]);

  const toggleBoundaries = useCallback(() => {
    const newState = !boundariesEnabled;
    console.log('🔄 Toggling boundaries from', boundariesEnabled, 'to', newState);
    setBoundariesEnabled(newState);
    
    if (!newState) {
      console.log('🚫 Boundaries turned OFF: Triggering cleanup');
      // Reset everything when boundaries are turned off, including search results
      setCurrentLevel('india');
      setSelectedState(null);
      setSelectedDistrict(null);
      
      // Clear any existing layers (including search results)
      if (boundaryLayers.states && mapInstance) {
        try {
          mapInstance.removeLayer(boundaryLayers.states);
        } catch (error) {
          console.error('Error removing states layer:', error);
        }
      }
      
      if (boundaryLayers.districts && mapInstance) {
        try {
          mapInstance.removeLayer(boundaryLayers.districts);
        } catch (error) {
          console.error('Error removing districts layer:', error);
        }
      }
      
      setBoundaryLayers({ states: null, districts: null });
      
    } else {
      console.log('✅ Boundaries turned ON: MapContainer will add states layer if not in search mode');
    }
  }, [boundariesEnabled, boundaryLayers, mapInstance]);

  return (
    <MapContext.Provider
      value={{
        mapCenter,
        setMapCenter,
        zoom,
        setZoom,
        layers,
        addLayer,
        filters,
        setFilters,
        mapInstance,
        setMapInstance,
        currentLevel,
        setCurrentLevel,
        selectedState,
        setSelectedState,
        selectedDistrict,
        setSelectedDistrict,
        boundaryLayers,
        setBoundaryLayers,
        geoJsonData,
        setGeoJsonData,
        loadingBoundaries,
        setLoadingBoundaries,
        boundariesEnabled,
        setBoundariesEnabled,
        toggleBoundaries,
        resetToIndia,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};