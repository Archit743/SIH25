import React, { useState, useRef, useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

const LayerControl = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('openstreetmap');
  const [currentTileLayer, setCurrentTileLayer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const controlRef = useRef(null);
  const map = useMap();

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
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (controlRef.current && !controlRef.current.contains(event.target) && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Initialize with default layer
  useEffect(() => {
    if (map && !currentTileLayer) {
      const layer = new window.L.TileLayer(layers[selectedLayer].url, {
        attribution: layers[selectedLayer].attribution
      });
      layer.addTo(map);
      setCurrentTileLayer(layer);
    }
  }, [map, selectedLayer, currentTileLayer]);

  const changeLayer = (layerKey) => {
    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
    }
    
    const newLayer = new window.L.TileLayer(layers[layerKey].url, {
      attribution: layers[layerKey].attribution
    });
    
    newLayer.addTo(map);
    setCurrentTileLayer(newLayer);
    setSelectedLayer(layerKey);
    setIsExpanded(false);
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
      {/* Floating Action Button */}
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
        title={`Current: ${layers[selectedLayer].name}`}
      >
        <div className="text-gray-600">
          {isExpanded ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            layers[selectedLayer].icon
          )}
        </div>
      </div>

      {/* Expanded Panel */}
      <div className={`absolute top-14 right-0 transition-all duration-300 ease-in-out transform ${
        isExpanded 
          ? 'opacity-100 translate-y-0 scale-100 z-[1010]' 
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none z-[1003]'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ width: '200px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 text-white">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Map Layers</h3>
            </div>
          </div>
          
          {/* Layer Options */}
          <div className="p-2">
            {Object.entries(layers).map(([key, layer]) => (
              <button
                key={key}
                onClick={() => changeLayer(key)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  selectedLayer === key 
                    ? 'bg-purple-50 text-purple-700 border-2 border-purple-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={selectedLayer === key ? 'text-purple-500' : 'text-gray-400'}>
                  {layer.icon}
                </div>
                <span className="text-sm font-medium">{layer.name}</span>
                {selectedLayer === key && (
                  <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerControl;