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
    console.log('Resetting to India, boundaries enabled:', boundariesEnabled);
    
    // Reset all state-related variables
    setCurrentLevel('india');
    setSelectedState(null);
    setSelectedDistrict(null); // Explicitly clear selectedDistrict
    setFilters({ state: '', district: '', village: '', tribalGroup: '', claimStatuses: [], featureType: '' });
    
    // Remove boundary layers based on boundariesEnabled
    if (boundariesEnabled) {
      console.log('Boundaries ON: Removing only district boundaries, keeping states');
      if (mapInstance && boundaryLayers.districts) {
        console.log('Removing district layer');
        try {
          mapInstance.removeLayer(boundaryLayers.districts);
        } catch (error) {
          console.error('Error removing district layer:', error);
        }
      }
      setBoundaryLayers(prev => ({ ...prev, districts: null }));
    } else {
      console.log('Boundaries OFF: Removing all boundary layers');
      if (mapInstance && boundaryLayers.states) {
        console.log('Removing states layer');
        try {
          mapInstance.removeLayer(boundaryLayers.states);
        } catch (error) {
          console.error('Error removing states layer:', error);
        }
      }
      if (mapInstance && boundaryLayers.districts) {
        console.log('Removing districts layer');
        try {
          mapInstance.removeLayer(boundaryLayers.districts);
        } catch (error) {
          console.error('Error removing districts layer:', error);
        }
      }
      setBoundaryLayers({ states: null, districts: null });
    }
    
    // Zoom back to India view
    if (mapInstance) {
      console.log('Zooming to India view');
      mapInstance.setView([20.5937, 78.9629], 5, { animate: true, duration: 1.0 });
    }
  }, [boundariesEnabled, mapInstance, boundaryLayers]);

  const toggleBoundaries = useCallback(() => {
    const newState = !boundariesEnabled;
    console.log('Toggling boundaries from', boundariesEnabled, 'to', newState);
    setBoundariesEnabled(newState);
    
    if (!newState) {
      console.log('Boundaries turned OFF: Letting MapContainer handle layer removal');
      setCurrentLevel('india');
      setSelectedState(null);
      setSelectedDistrict(null); // Clear selectedDistrict when disabling boundaries
    } else {
      console.log('Boundaries turned ON: States layer will be added by MapContainer');
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