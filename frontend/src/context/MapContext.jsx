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
    console.log('🏠 Reset to India called - boundaries enabled:', boundariesEnabled);
    console.log('🗺️ Current mapInstance:', !!mapInstance);
    console.log('🔍 Current boundaryLayers:', {
      hasStates: !!boundaryLayers.states,
      hasDistricts: !!boundaryLayers.districts
    });
    
    // Always reset state-related variables first
    console.log('🧹 Clearing state selections');
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
    
    // Handle boundary layer removal based on boundaries state
    if (boundariesEnabled) {
      console.log('🗺️ Boundaries ON: Removing district layer only, keeping states');
      // Remove only district layer, keep states layer for navigation
      if (boundaryLayers.districts) {
        console.log('❌ Removing district layer');
        try {
          if (mapInstance) {
            mapInstance.removeLayer(boundaryLayers.districts);
          }
          setBoundaryLayers(prev => ({ ...prev, districts: null }));
        } catch (error) {
          console.error('Error removing district layer:', error);
          // Force clear the reference even if removal fails
          setBoundaryLayers(prev => ({ ...prev, districts: null }));
        }
      }
      
    } else {
      console.log('🚫 Boundaries OFF: Removing all boundary layers');
      // Remove all boundary layers when boundaries are disabled
      if (boundaryLayers.states || boundaryLayers.districts) {
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
        setBoundaryLayers({ states: null, districts: null });
      }
    }
    
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
    
    console.log('✅ Reset to India completed');
  }, [boundariesEnabled, mapInstance, boundaryLayers]);

  const toggleBoundaries = useCallback(() => {
    const newState = !boundariesEnabled;
    console.log('🔄 Toggling boundaries from', boundariesEnabled, 'to', newState);
    setBoundariesEnabled(newState);
    
    if (!newState) {
      console.log('🚫 Boundaries turned OFF: Triggering cleanup');
      // Reset everything when boundaries are turned off
      setCurrentLevel('india');
      setSelectedState(null);
      setSelectedDistrict(null);
      
      // The MapContainer useEffect will handle layer removal
    } else {
      console.log('✅ Boundaries turned ON: MapContainer will add states layer');
    }
  }, [boundariesEnabled]);

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