import React, { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';

const DrawingTools = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null);
  const [drawnLayers, setDrawnLayers] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const controlRef = useRef(null);
  const drawingHandlerRef = useRef(null);
  const map = useMap();

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

  // Initialize Leaflet Draw handlers
  useEffect(() => {
    if (!map || !window.L.Draw) return;

    // Cleanup any existing handlers
    if (drawingHandlerRef.current) {
      drawingHandlerRef.current.disable();
    }

    return () => {
      if (drawingHandlerRef.current) {
        drawingHandlerRef.current.disable();
      }
    };
  }, [map]);

  const startDrawing = (mode) => {
    if (!window.L.Draw) {
      console.error('Leaflet Draw not loaded');
      return;
    }

    // Stop any existing drawing
    if (drawingHandlerRef.current) {
      drawingHandlerRef.current.disable();
    }

    setDrawingMode(mode);
    setIsDrawing(true);
    setIsExpanded(false);

    const options = {
      shapeOptions: {
        color: '#3388ff',
        fillOpacity: 0.5,
        weight: 2
      }
    };

    // Create appropriate drawing handler
    let handler;
    switch (mode) {
      case 'polygon':
        handler = new window.L.Draw.Polygon(map, {
          ...options,
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: 'Cannot draw overlapping polygons'
          }
        });
        break;
      case 'rectangle':
        handler = new window.L.Draw.Rectangle(map, options);
        break;
      case 'circle':
        handler = new window.L.Draw.Circle(map, options);
        break;
      case 'marker':
        handler = new window.L.Draw.Marker(map, {
          icon: window.L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background-color:#3388ff;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })
        });
        break;
      default:
        return;
    }

    drawingHandlerRef.current = handler;
    handler.enable();

    // Listen for drawing completion
    const onDrawCreated = (e) => {
      const layer = e.layer;
      const geoJson = layer.toGeoJSON();
      
      console.log('Drawn layer:', geoJson);
      
      // Add to map
      layer.addTo(map);
      
      // Store reference
      const layerId = Date.now().toString();
      setDrawnLayers(prev => [...prev, { id: layerId, layer, geoJson, type: mode }]);
      
      // Reset drawing state
      setIsDrawing(false);
      setDrawingMode(null);
      handler.disable();
      
      // You can add additional logic here to save to backend
      // or integrate with your MapContext
    };

    map.once('draw:created', onDrawCreated);
  };

  const cancelDrawing = () => {
    if (drawingHandlerRef.current) {
      drawingHandlerRef.current.disable();
    }
    setIsDrawing(false);
    setDrawingMode(null);
  };

  const clearAllDrawings = () => {
    drawnLayers.forEach(({ layer }) => {
      map.removeLayer(layer);
    });
    setDrawnLayers([]);
  };

  const removeLayer = (layerId) => {
    const layerData = drawnLayers.find(l => l.id === layerId);
    if (layerData) {
      map.removeLayer(layerData.layer);
      setDrawnLayers(prev => prev.filter(l => l.id !== layerId));
    }
  };

  const toggleExpanded = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      if (isDrawing) {
        cancelDrawing();
      }
      setIsExpanded(!isExpanded);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const drawingTools = [
    {
      id: 'polygon',
      name: 'Polygon',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: 'rectangle',
      name: 'Rectangle',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
        </svg>
      )
    },
    {
      id: 'circle',
      name: 'Circle',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'marker',
      name: 'Marker',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="absolute top-4 left-16 z-[1004]" ref={controlRef}>
      {/* Drawing Status Indicator */}
      {isDrawing && (
        <div className="absolute -top-12 left-0 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg">
          Drawing {drawingMode}... 
          <button 
            onClick={cancelDrawing}
            className="ml-2 hover:text-red-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <div 
        onClick={toggleExpanded}
        className={`bg-white rounded-full shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 hover:shadow-xl ${
          isDrawing ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
        } ${drawnLayers.length > 0 ? 'ring-2 ring-orange-400' : ''} ${isExpanded ? 'rotate-180' : ''}`}
        style={{ 
          width: '48px', 
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Drawing Tools"
      >
        <svg 
          className={`w-5 h-5 transition-colors duration-300 ${
            isDrawing ? 'text-blue-600' : drawnLayers.length > 0 ? 'text-orange-600' : 'text-gray-600'
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={isExpanded 
              ? "M6 18L18 6M6 6l12 12"
              : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            }
          />
        </svg>
        
        {/* Layer count badge */}
        {drawnLayers.length > 0 && !isExpanded && (
          <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold">
            {drawnLayers.length}
          </div>
        )}
      </div>

      {/* Expanded Panel */}
      <div className={`absolute top-14 left-0 transition-all duration-300 ease-in-out transform ${
        isExpanded 
          ? 'opacity-100 translate-y-0 scale-100 z-[1010]' 
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none z-[1004]'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ width: '250px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm">Drawing Tools</h3>
                {drawnLayers.length > 0 && (
                  <p className="text-orange-100 text-xs">{drawnLayers.length} shape{drawnLayers.length > 1 ? 's' : ''} drawn</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Drawing Tools */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {drawingTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => startDrawing(tool.id)}
                  disabled={isDrawing}
                  className={`flex flex-col items-center space-y-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                    drawingMode === tool.id 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  } ${isDrawing && drawingMode !== tool.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {tool.icon}
                  <span className="text-xs font-medium">{tool.name}</span>
                </button>
              ))}
            </div>

            {/* Clear All Button */}
            {drawnLayers.length > 0 && (
              <button
                onClick={clearAllDrawings}
                className="w-full py-2 px-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-200 text-sm font-medium"
              >
                Clear All ({drawnLayers.length})
              </button>
            )}
          </div>

          {/* Drawn Layers List */}
          {drawnLayers.length > 0 && (
            <div className="border-t border-gray-100 max-h-32 overflow-y-auto">
              <div className="p-2">
                <h4 className="text-xs font-semibold text-gray-600 mb-2">Drawn Shapes</h4>
                {drawnLayers.map((layerData, index) => (
                  <div key={layerData.id} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded">
                    <span className="text-xs text-gray-700">
                      {layerData.type} {index + 1}
                    </span>
                    <button
                      onClick={() => removeLayer(layerData.id)}
                      className="text-red-400 hover:text-red-600 p-1"
                      title="Remove shape"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawingTools;