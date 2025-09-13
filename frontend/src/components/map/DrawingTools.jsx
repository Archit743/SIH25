import React, { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';

const DrawingTools = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null);
  const [drawnLayers, setDrawnLayers] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const controlRef = useRef(null);
  const drawingHandlerRef = useRef(null);
  const measurementTooltipRef = useRef(null);
  const previewLayerRef = useRef(null);
  const map = useMap();

  // Utility function to calculate distance between two points
  const calculateDistance = (latlng1, latlng2) => {
    return latlng1.distanceTo(latlng2);
  };

  // Utility function to calculate total line distance
  const calculateLineDistance = (latlngs) => {
    let totalDistance = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      totalDistance += calculateDistance(latlngs[i], latlngs[i + 1]);
    }
    return totalDistance;
  };

  // Utility function to calculate polygon area using proper spherical calculation
  const calculatePolygonArea = (latlngs) => {
    if (latlngs.length < 3) return 0;
    
    // Convert to radians and use spherical excess formula
    const R = 6378137; // Earth radius in meters
    let area = 0;
    const n = latlngs.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const lat1 = latlngs[i].lat * Math.PI / 180;
      const lat2 = latlngs[j].lat * Math.PI / 180;
      const lng1 = latlngs[i].lng * Math.PI / 180;
      const lng2 = latlngs[j].lng * Math.PI / 180;
      const dLng = lng2 - lng1;
      
      area += dLng * (Math.sin(lat1) + Math.sin(lat2));
    }
    
    area = Math.abs(area * R * R / 2);
    return area;
  };

  // Format distance for display
  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  // Format area for display
  const formatArea = (sqMeters) => {
    if (sqMeters >= 1000000) {
      return `${(sqMeters / 1000000).toFixed(2)} km²`;
    } else if (sqMeters >= 10000) {
      return `${(sqMeters / 10000).toFixed(2)} ha`;
    }
    return `${sqMeters.toFixed(0)} m²`;
  };

  // Get all vertices from the drawing handler
  const getAllVertices = (handler) => {
    if (!handler || !handler._poly) return [];
    
    const vertices = [];
    if (handler._poly._latlngs) {
      handler._poly._latlngs.forEach(latlng => {
        vertices.push(latlng);
      });
    }
    return vertices;
  };

  // Update dynamic preview and measurements
  const updateDynamicPreview = (coordinates, mousePos, type) => {
    // Remove existing preview layer
    if (previewLayerRef.current) {
      map.removeLayer(previewLayerRef.current);
      previewLayerRef.current = null;
    }

    // Remove existing measurement tooltip
    if (measurementTooltipRef.current) {
      measurementTooltipRef.current.removeFrom(map);
      measurementTooltipRef.current = null;
    }

    let content = '';
    let position = mousePos;
    let previewCoords = [];

    switch (type) {
      case 'polyline':
        if (coordinates && coordinates.length >= 1 && mousePos) {
          previewCoords = [...coordinates, mousePos];
          const distance = calculateLineDistance(previewCoords);
          content = `Distance: ${formatDistance(distance)}`;
          
          // Create preview line
          previewLayerRef.current = L.polyline(previewCoords, {
            color: '#ff6b6b',
            weight: 2,
            opacity: 0.7,
            dashArray: '5, 10'
          }).addTo(map);
        }
        break;
        
      case 'polygon':
        if (coordinates && coordinates.length >= 1 && mousePos) {
          previewCoords = [...coordinates, mousePos];
          
          if (previewCoords.length >= 3) {
            // For polygon preview, close the shape to calculate area
            const closedCoords = [...previewCoords, previewCoords[0]];
            const area = calculatePolygonArea(previewCoords);
            const perimeter = calculateLineDistance(closedCoords);
            content = `Area: ${formatArea(area)}<br>Perimeter: ${formatDistance(perimeter)}`;
            
            // Create preview polygon
            previewLayerRef.current = L.polygon(previewCoords, {
              color: '#ff6b6b',
              fillColor: '#ff6b6b',
              weight: 2,
              opacity: 0.7,
              fillOpacity: 0.2,
              dashArray: '5, 10'
            }).addTo(map);
            
            // Position tooltip at center of preview polygon
            const bounds = L.latLngBounds(previewCoords);
            position = bounds.getCenter();
          } else {
            const distance = calculateLineDistance(previewCoords);
            content = `Distance: ${formatDistance(distance)}`;
            
            // Create preview line
            previewLayerRef.current = L.polyline(previewCoords, {
              color: '#ff6b6b',
              weight: 2,
              opacity: 0.7,
              dashArray: '5, 10'
            }).addTo(map);
          }
        }
        break;
    }

    if (content && position) {
      measurementTooltipRef.current = L.tooltip({
        permanent: true,
        direction: 'top',
        className: 'measurement-tooltip dynamic',
        offset: [0, -20]
      })
      .setLatLng(position)
      .setContent(content)
      .addTo(map);
    }
  };

  // Calculate measurements for a completed layer
  const calculateMeasurements = (layer, type) => {
    let measurements = {};
    
    console.log('Calculating measurements for type:', type, 'Layer:', layer);
    
    try {
      switch (type) {
        case 'polyline':
          const lineLatLngs = layer.getLatLngs();
          console.log('Polyline coordinates:', lineLatLngs);
          const distance = calculateLineDistance(lineLatLngs);
          measurements = {
            distance: formatDistance(distance)
          };
          break;
          
        case 'polygon':
          const polygonLatLngs = layer.getLatLngs()[0]; // Get first ring for simple polygons
          console.log('Polygon coordinates:', polygonLatLngs);
          const area = calculatePolygonArea(polygonLatLngs);
          const perimeter = calculateLineDistance([...polygonLatLngs, polygonLatLngs[0]]);
          measurements = {
            area: formatArea(area),
            perimeter: formatDistance(perimeter)
          };
          break;
          
        case 'rectangle':
          const bounds = layer.getBounds();
          console.log('Rectangle bounds:', bounds);
          const rectLatLngs = [
            bounds.getSouthWest(),
            bounds.getNorthWest(), 
            bounds.getNorthEast(),
            bounds.getSouthEast()
          ];
          const rectArea = calculatePolygonArea(rectLatLngs);
          const rectPerimeter = calculateLineDistance([...rectLatLngs, rectLatLngs[0]]);
          measurements = {
            area: formatArea(rectArea),
            perimeter: formatDistance(rectPerimeter)
          };
          break;
          
        case 'circle':
          const radius = layer.getRadius();
          console.log('Circle radius:', radius);
          const circleArea = Math.PI * Math.pow(radius, 2);
          const circumference = 2 * Math.PI * radius;
          measurements = {
            area: formatArea(circleArea),
            perimeter: formatDistance(circumference),
            radius: formatDistance(radius)
          };
          break;
          
        case 'marker':
          // Markers don't have measurements
          measurements = {};
          break;
          
        default:
          console.warn('Unknown shape type:', type);
          measurements = {};
      }
    } catch (error) {
      console.error('Error calculating measurements:', error);
      measurements = {};
    }
    
    console.log('Final measurements:', measurements);
    return measurements;
  };

  // Add hover tooltip to completed layers
  const addHoverTooltip = (layer, measurements, type) => {
    let tooltipContent = '';
    
    switch (type) {
      case 'polyline':
        tooltipContent = `Distance: ${measurements.distance}`;
        break;
      case 'polygon':
        tooltipContent = `Area: ${measurements.area}<br>Perimeter: ${measurements.perimeter}`;
        break;
      case 'rectangle':
        tooltipContent = `Area: ${measurements.area}<br>Perimeter: ${measurements.perimeter}`;
        break;
      case 'circle':
        tooltipContent = `Area: ${measurements.area}<br>Radius: ${measurements.radius}<br>Circumference: ${measurements.perimeter}`;
        break;
      default:
        return;
    }

    // Bind tooltip that shows on hover
    layer.bindTooltip(tooltipContent, {
      permanent: false,
      direction: 'top',
      className: 'hover-measurement-tooltip',
      opacity: 0.9,
      sticky: true
    });

    // Add click popup for detailed info
    layer.bindPopup(`
      <div class="text-sm">
        <strong>${type.charAt(0).toUpperCase() + type.slice(1)} Details</strong><br>
        ${tooltipContent.replace('<br>', '<br>')}
      </div>
    `);
  };

  // Group layers by type
  const groupLayersByType = () => {
    const groups = {
      polyline: [],
      polygon: [],
      rectangle: [],
      circle: [],
      marker: []
    };
    
    drawnLayers.forEach(layer => {
      if (groups[layer.type]) {
        groups[layer.type].push(layer);
      }
    });
    
    return groups;
  };

  // Toggle section collapse
  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
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

  // Initialize Leaflet Draw handlers and add custom CSS
  useEffect(() => {
    if (!map || !L.Draw) return;

    // Add custom CSS for measurement tooltips
    const style = document.createElement('style');
    style.textContent = `
      .measurement-tooltip {
        background: rgba(0, 0, 0, 0.8) !important;
        color: white !important;
        border: none !important;
        border-radius: 4px !important;
        padding: 4px 8px !important;
        font-size: 12px !important;
        font-weight: bold !important;
        pointer-events: none !important;
        z-index: 1000 !important;
      }
      .measurement-tooltip.dynamic {
        background: rgba(255, 107, 107, 0.9) !important;
        border: 2px solid #ff6b6b !important;
      }
      .hover-measurement-tooltip {
        background: rgba(51, 136, 255, 0.95) !important;
        color: white !important;
        border: none !important;
        border-radius: 6px !important;
        padding: 6px 10px !important;
        font-size: 12px !important;
        font-weight: bold !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        z-index: 1000 !important;
      }
      .leaflet-tooltip {
        z-index: 1000 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (drawingHandlerRef.current) {
        drawingHandlerRef.current.disable();
      }
      if (measurementTooltipRef.current) {
        measurementTooltipRef.current.removeFrom(map);
      }
      if (previewLayerRef.current) {
        map.removeLayer(previewLayerRef.current);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [map]);

  const startDrawing = (mode) => {
    if (!L || !L.Draw) {
      console.error('Leaflet Draw not loaded.');
      alert('Drawing tools are not available.');
      return;
    }

    // Stop any existing drawing
    if (drawingHandlerRef.current) {
      drawingHandlerRef.current.disable();
    }

    // Clean up previews
    if (measurementTooltipRef.current) {
      measurementTooltipRef.current.removeFrom(map);
      measurementTooltipRef.current = null;
    }
    if (previewLayerRef.current) {
      map.removeLayer(previewLayerRef.current);
      previewLayerRef.current = null;
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
      case 'polyline':
        handler = new L.Draw.Polyline(map, {
          ...options,
          metric: true,
          feet: false,
          showLength: false,
          repeatMode: false
        });
        break;
      case 'polygon':
        handler = new L.Draw.Polygon(map, {
          ...options,
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: 'Cannot draw overlapping polygons'
          },
          showArea: false,
          showLength: false,
          metric: true,
          repeatMode: false
        });
        break;
      case 'rectangle':
        handler = new L.Draw.Rectangle(map, {
          ...options,
          showArea: false,
          metric: true,
          feet: false,
          repeatMode: false
        });
        break;
      case 'circle':
        handler = new L.Draw.Circle(map, {
          ...options,
          showRadius: false,
          showArea: false,
          metric: true,
          repeatMode: false
        });
        break;
      case 'marker':
        handler = new L.Draw.Marker(map, {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background-color:#3388ff;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          }),
          repeatMode: false
        });
        break;
      default:
        return;
    }

    drawingHandlerRef.current = handler;

    // Add event listeners for dynamic preview
    if (mode === 'polyline' || mode === 'polygon') {
      // Track mouse movement for dynamic preview
      const onMouseMove = (e) => {
        if (handler && handler._enabled) {
          const vertices = getAllVertices(handler);
          if (vertices.length > 0) {
            updateDynamicPreview(vertices, e.latlng, mode);
          }
        }
      };

      // Clean up on drawing start
      const onDrawStart = () => {
        if (measurementTooltipRef.current) {
          measurementTooltipRef.current.removeFrom(map);
          measurementTooltipRef.current = null;
        }
        if (previewLayerRef.current) {
          map.removeLayer(previewLayerRef.current);
          previewLayerRef.current = null;
        }
      };

      // Clean up on drawing stop
      const onDrawStop = () => {
        if (measurementTooltipRef.current) {
          measurementTooltipRef.current.removeFrom(map);
          measurementTooltipRef.current = null;
        }
        if (previewLayerRef.current) {
          map.removeLayer(previewLayerRef.current);
          previewLayerRef.current = null;
        }
        map.off('mousemove', onMouseMove);
        map.off('draw:drawstart', onDrawStart);
        map.off('draw:drawstop', onDrawStop);
      };

      map.on('mousemove', onMouseMove);
      map.on('draw:drawstart', onDrawStart);
      map.on('draw:drawstop', onDrawStop);
    }

    handler.enable();

    // Listen for drawing completion
    const onDrawCreated = (e) => {
      const layer = e.layer;
      const layerType = e.layerType; // e.g., 'polyline', 'polygon', 'rectangle', 'circle', 'marker'
      const geoJson = layer.toGeoJSON();
      
      // Add to map first
      layer.addTo(map);
      
      // Calculate measurements using layerType from the event
      const measurements = calculateMeasurements(layer, layerType);
      console.log('Calculated measurements:', measurements, 'for type:', layerType);
      
      // Add hover tooltip to the layer with a small delay to ensure layer is ready
      setTimeout(() => {
        addHoverTooltip(layer, measurements, layerType);
      }, 100);
      
      console.log('Drawn layer:', geoJson, 'Measurements:', measurements);
      
      // Store reference with measurements
      const layerId = Date.now().toString();
      setDrawnLayers(prev => [...prev, { 
        id: layerId, 
        layer, 
        geoJson, 
        type: layerType, 
        measurements 
      }]);
      
      // Clean up preview elements
      if (measurementTooltipRef.current) {
        measurementTooltipRef.current.removeFrom(map);
        measurementTooltipRef.current = null;
      }
      if (previewLayerRef.current) {
        map.removeLayer(previewLayerRef.current);
        previewLayerRef.current = null;
      }
      
      // Reset drawing state
      setIsDrawing(false);
      setDrawingMode(null);
      if (handler) {
        handler.disable();
      }
    };

    map.once('draw:created', onDrawCreated);
    };

  const cancelDrawing = () => {
    if (drawingHandlerRef.current) {
      drawingHandlerRef.current.disable();
    }
    if (measurementTooltipRef.current) {
      measurementTooltipRef.current.removeFrom(map);
      measurementTooltipRef.current = null;
    }
    if (previewLayerRef.current) {
      map.removeLayer(previewLayerRef.current);
      previewLayerRef.current = null;
    }
    
    // Clean up all event listeners
    map.off('mousemove');
    map.off('draw:drawstart');
    map.off('draw:drawstop');
    
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
      id: 'polyline',
      name: 'Line',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      id: 'polygon',
      name: 'Polygon',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l5-5 5 5 8-8v12l-5 5-5-5-8 8V8z" />
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

  const layerGroups = groupLayersByType();
  const typeNames = {
    polyline: 'Lines',
    polygon: 'Polygons', 
    rectangle: 'Rectangles',
    circle: 'Circles',
    marker: 'Markers'
  };

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
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ width: '320px' }}>
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

          {/* Grouped Layers List */}
          {drawnLayers.length > 0 && (
            <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
              <div className="p-2">
                {Object.entries(layerGroups).map(([type, layers]) => {
                  if (layers.length === 0) return null;
                  
                  const isCollapsed = collapsedSections[type];
                  const typeName = typeNames[type];
                  
                  return (
                    <div key={type} className="mb-2">
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(type)}
                        className="w-full flex items-center justify-between p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <span className="text-sm font-semibold text-gray-700">
                          {typeName} ({layers.length})
                        </span>
                        <svg 
                          className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Section Content */}
                      {!isCollapsed && (
                        <div className="mt-1 space-y-1">
                          {layers.map((layerData, index) => (
                            <div key={layerData.id} className="p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">
                                  {typeName.slice(0, -1)} {index + 1}
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
                              
                              {/* Measurements */}
                              {layerData.measurements && Object.keys(layerData.measurements).length > 0 && (
                                <div className="text-xs text-gray-600 space-y-1">
                                  {layerData.measurements.distance && (
                                    <div className="flex justify-between">
                                      <span>Distance:</span>
                                      <span className="font-medium">{layerData.measurements.distance}</span>
                                    </div>
                                  )}
                                  {layerData.measurements.area && (
                                    <div className="flex justify-between">
                                      <span>Area:</span>
                                      <span className="font-medium">{layerData.measurements.area}</span>
                                    </div>
                                  )}
                                  {layerData.measurements.perimeter && (
                                    <div className="flex justify-between">
                                      <span>Perimeter:</span>
                                      <span className="font-medium">{layerData.measurements.perimeter}</span>
                                    </div>
                                  )}
                                  {layerData.measurements.radius && (
                                    <div className="flex justify-between">
                                      <span>Radius:</span>
                                      <span className="font-medium">{layerData.measurements.radius}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawingTools;