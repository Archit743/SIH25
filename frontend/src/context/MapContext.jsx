import React, { createContext, useState } from 'react';

export const MapContext = createContext();

export const MapProvider = ({ children }) => {
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [zoom, setZoom] = useState(8); // Increased default zoom
  const [layers, setLayers] = useState({});
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    village: '',
    tribalGroup: '',
    claimStatuses: [],
    featureType: '' // Fixed from ' '
  });
  const [mapInstance, setMapInstance] = useState(null);

  const addLayer = (key, data) => {
    console.log(`Adding layer: ${key}`, data);
    setLayers((prev) => ({ ...prev, [key]: data }));
  };

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
      }}
    >
      {children}
    </MapContext.Provider>
  );
};