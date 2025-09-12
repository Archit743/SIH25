// LayerControl.js - Updated with boundary toggle
import React, { useState, useRef, useEffect, useContext } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { MapContext } from '../../context/MapContext';

const LayerControl = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTileLayer, setSelectedTileLayer] = useState('openstreetmap');
  const [currentTileLayer, setCurrentTileLayer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const controlRef = useRef(null);
  const map = useMap();
  const { resetToIndia, boundariesEnabled, toggleBoundaries } = useContext(MapContext);

  const layers = {
    openstreetmap: {
      name: 'Street Map',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    satellite: {
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    terrain: {
      name: 'Terrain',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    claimableRegions: {
      name: 'Claimable Regions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    forestReserves: {
      name: 'Forest Reserves',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 12.5 5 11 7c-.5-2 0-4 2-5 2 1 3 3.5 3 6 0-2 1.5-4 3.5-5 2 1 3 3.5 3 6 0-2 1-4 3-5 2 1 3 3 3 5" />
        </svg>
      )
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (controlRef.current && !controlRef.current.contains(event.target) && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  useEffect(() => {
    if (map && !currentTileLayer) {
      const layer = new window.L.TileLayer(layers[selectedTileLayer].url, {
        attribution: layers[selectedTileLayer].attribution
      });
      layer.addTo(map);
      setCurrentTileLayer(layer);
    }
  }, [map, selectedTileLayer, currentTileLayer]);

  const changeTileLayer = (layerKey) => {
    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
    }
    
    const newLayer = new window.L.TileLayer(layers[layerKey].url, {
      attribution: layers[layerKey].attribution
    });
    
    newLayer.addTo(map);
    setCurrentTileLayer(newLayer);
    setSelectedTileLayer(layerKey);
  };

  const toggleLayer = (layerKey) => {
    // Do nothing for claimableRegions and forestReserves
    console.log(`Toggle ${layerKey}: No action implemented`);
  };

  const toggleExpanded = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setIsExpanded(!isExpanded);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1003]" ref={controlRef}>
      <div 
        onClick={toggleExpanded}
        className={`bg-white rounded-full shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 hover:shadow-xl ${isExpanded ? 'rotate-180' : ''}`}
        style={{ 
          width: '48px', 
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={`Current: ${layers[selectedTileLayer].name}`}
      >
        <div className="text-gray-600">
          {isExpanded ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            layers[selectedTileLayer].icon
          )}
        </div>
      </div>

      <div className={`absolute top-14 right-0 transition-all duration-300 ease-in-out transform ${
        isExpanded 
          ? 'opacity-100 translate-y-0 scale-100 z-[1010]' 
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none z-[1003]'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ width: '220px' }}>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 text-white">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Map Layers</h3>
            </div>
          </div>
          
          <div className="p-2">
            {/* Boundary Toggle */}
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <button
                onClick={toggleBoundaries}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                  boundariesEnabled
                    ? 'bg-green-50 text-green-700 border-2 border-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className={`w-4 h-4 ${boundariesEnabled ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">Boundaries</span>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                  boundariesEnabled ? 'bg-green-400' : 'bg-gray-300'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform duration-200 ${
                    boundariesEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}></div>
                </div>
              </button>
            </div>

            {/* Tile Layer Options */}
            {Object.entries(layers).map(([key, layer]) => (
              <button
                key={key}
                onClick={() => key === 'claimableRegions' || key === 'forestReserves' ? toggleLayer(key) : changeTileLayer(key)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  key === selectedTileLayer
                    ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={key === selectedTileLayer ? 'text-purple-500' : 'text-gray-400'}>
                  {layer.icon}
                </div>
                <span className="text-sm font-medium">{layer.name}</span>
                {key === selectedTileLayer && (
                  <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full"></div>
                )}
              </button>
            ))}
            
            <button
              onClick={resetToIndia}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 mt-2 pt-2 border-t border-gray-100"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm font-medium">Back to India</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerControl;