import React, { createContext, useState, useCallback } from 'react';

export const MapContext = createContext();

export const MapProvider = ({ children }) => {
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [zoom, setZoom] = useState(5);
  const [layers, setLayers] = useState({});
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    subdistrict: '',
    village: '',
    tribalGroup: '',
    claimStatuses: [],
    featureType: ''
  });
  const [mapInstance, setMapInstance] = useState(null);
  const [currentLevel, setCurrentLevel] = useState('india');
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState(null);
  const [boundaryLayers, setBoundaryLayers] = useState({ 
    states: null, 
    districts: null, 
    subdistricts: null 
  });
  const [geoJsonData, setGeoJsonData] = useState({ 
    states: null, 
    districts: {},
    subdistricts: {} // Structure: { "STATE_NAME": { "DISTRICT_NAME": data } }
  });
  const [loadingBoundaries, setLoadingBoundaries] = useState(false);
  const [boundariesEnabled, setBoundariesEnabled] = useState(false);

  // Add drawing-related state
  const [drawnLayers, setDrawnLayers] = useState([]);

  const addLayer = useCallback((key, data) => {
    console.log(`Adding layer: ${key}`, data);
    setLayers((prev) => ({ ...prev, [key]: data }));
  }, []);

  // Drawing layer management functions
  const addDrawnLayer = useCallback((layerData) => {
    console.log('Adding drawn layer:', layerData);
    setDrawnLayers((prev) => [...prev, layerData]);
  }, []);

  const removeDrawnLayer = useCallback((layerId) => {
    console.log('Removing drawn layer:', layerId);
    setDrawnLayers((prev) => prev.filter(layer => layer.id !== layerId));
  }, []);

  const clearAllDrawnLayers = useCallback(() => {
    console.log('Clearing all drawn layers');
    setDrawnLayers([]);
  }, []);

  const resetToIndia = useCallback(() => {
    console.log('🏠 Reset to India called');
    console.log('🗺️ Current mapInstance:', !!mapInstance);
    console.log('🔍 Current level:', currentLevel);
    console.log('🗺️ Current boundaryLayers:', {
      hasStates: !!boundaryLayers.states,
      hasDistricts: !!boundaryLayers.districts,
      hasSubdistricts: !!boundaryLayers.subdistricts
    });
    
    // Always reset state-related variables first
    console.log('🧹 Clearing all selections and layers');
    setCurrentLevel('india');
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedSubdistrict(null);
    setFilters({ 
      state: '', 
      district: '', 
      subdistrict: '',
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
      console.log('❌ Removing districts layer');
      try {
        if (mapInstance) {
          mapInstance.removeLayer(boundaryLayers.districts);
        }
      } catch (error) {
        console.error('Error removing districts layer:', error);
      }
    }

    if (boundaryLayers.subdistricts) {
      console.log('❌ Removing subdistricts layer');
      try {
        if (mapInstance) {
          mapInstance.removeLayer(boundaryLayers.subdistricts);
        }
      } catch (error) {
        console.error('Error removing subdistricts layer:', error);
      }
    }
    
    // Clear all boundary layer references
    setBoundaryLayers({ states: null, districts: null, subdistricts: null });
    
    // Always zoom to India view (force zoom even if already at level 5)
    if (mapInstance) {
      console.log('🔍 Zooming to India view - current zoom:', mapInstance.getZoom());
      const currentZoom = mapInstance.getZoom();
      if (currentZoom === 5) {
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
      setCurrentLevel('india');
      setSelectedState(null);
      setSelectedDistrict(null);
      setSelectedSubdistrict(null);
      
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

      if (boundaryLayers.subdistricts && mapInstance) {
        try {
          mapInstance.removeLayer(boundaryLayers.subdistricts);
        } catch (error) {
          console.error('Error removing subdistricts layer:', error);
        }
      }
      
      setBoundaryLayers({ states: null, districts: null, subdistricts: null });
      
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
        selectedSubdistrict,
        setSelectedSubdistrict,
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
        // Drawing-related context values
        drawnLayers,
        setDrawnLayers,
        addDrawnLayer,
        removeDrawnLayer,
        clearAllDrawnLayers,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};