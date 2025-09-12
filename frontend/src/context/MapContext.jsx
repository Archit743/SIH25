// MapContext.js - Updated with boundary toggle state
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
  const [boundariesEnabled, setBoundariesEnabled] = useState(false); // New state for boundary toggle

  const addLayer = useCallback((key, data) => {
    console.log(`Adding layer: ${key}`, data);
    setLayers((prev) => ({ ...prev, [key]: data }));
  }, []);

  const resetToIndia = useCallback(() => {
    console.log('Resetting to India');
    setCurrentLevel('india');
    setSelectedState(null);
    setSelectedDistrict(null);
    setFilters(prev => ({ ...prev, state: '', district: '', village: '' }));
    
    // Remove all boundary layers when resetting
    if (mapInstance && boundaryLayers.states) {
      mapInstance.removeLayer(boundaryLayers.states);
    }
    if (mapInstance && boundaryLayers.districts) {
      mapInstance.removeLayer(boundaryLayers.districts);
    }
    setBoundaryLayers({ states: null, districts: null });
    
    if (mapInstance) {
      mapInstance.setView([20.5937, 78.9629], 8, { animate: true, duration: 0.8 });
    }
  }, [setFilters, mapInstance, boundaryLayers]);

  const toggleBoundaries = useCallback(() => {
    const newState = !boundariesEnabled;
    setBoundariesEnabled(newState);
    
    if (!newState) {
      // If turning off boundaries, remove all boundary layers and reset
      if (mapInstance && boundaryLayers.states) {
        mapInstance.removeLayer(boundaryLayers.states);
      }
      if (mapInstance && boundaryLayers.districts) {
        mapInstance.removeLayer(boundaryLayers.districts);
      }
      setBoundaryLayers({ states: null, districts: null });
      setCurrentLevel('india');
      setSelectedState(null);
      setSelectedDistrict(null);
    }
  }, [boundariesEnabled, mapInstance, boundaryLayers]);

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