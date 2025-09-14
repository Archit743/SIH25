import React, { useState, useContext, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapContext } from '../../context/MapContext';

const ImportControl = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedLayers, setImportedLayers] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const controlRef = useRef(null);
  const fileInputRef = useRef(null);
  const map = useMap();
  
  const { addDrawnLayer } = useContext(MapContext);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (controlRef.current && !controlRef.current.contains(event.target) && isExpanded) {
        setIsExpanded(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded]);

  // Parse KML/KMZ content
  const parseKML = (kmlContent, fileName) => {
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlContent, 'text/xml');
    
    // Check for parsing errors
    const parserError = kmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid KML format');
    }

    const features = [];
    const placemarks = kmlDoc.querySelectorAll('Placemark');
    
    placemarks.forEach((placemark, index) => {
      try {
        const feature = parsePlacemark(placemark, index, fileName);
        if (feature) {
          features.push(feature);
        }
      } catch (error) {
        console.warn(`Error parsing placemark ${index}:`, error);
      }
    });

    return {
      type: 'FeatureCollection',
      features: features,
      metadata: {
        fileName: fileName,
        importDate: new Date().toISOString(),
        totalFeatures: features.length
      }
    };
  };

  // Parse individual placemark
  const parsePlacemark = (placemark, index, fileName) => {
    const nameElement = placemark.querySelector('name');
    const descriptionElement = placemark.querySelector('description');
    const name = nameElement ? nameElement.textContent.trim() : `Feature ${index + 1}`;
    const description = descriptionElement ? descriptionElement.textContent.trim() : '';

    // Extract coordinates based on geometry type
    const point = placemark.querySelector('Point coordinates');
    const lineString = placemark.querySelector('LineString coordinates');
    const polygon = placemark.querySelector('Polygon outerBoundaryIs LinearRing coordinates');

    let geometry = null;
    let featureType = 'unknown';

    if (point) {
      const coords = parseCoordinates(point.textContent.trim());
      if (coords.length > 0) {
        geometry = {
          type: 'Point',
          coordinates: coords[0]
        };
        featureType = 'marker';
      }
    } else if (lineString) {
      const coords = parseCoordinates(lineString.textContent.trim());
      if (coords.length > 1) {
        geometry = {
          type: 'LineString',
          coordinates: coords
        };
        featureType = 'polyline';
      }
    } else if (polygon) {
      const coords = parseCoordinates(polygon.textContent.trim());
      if (coords.length > 2) {
        // Close the polygon if it's not already closed
        if (coords[0][0] !== coords[coords.length - 1][0] || 
            coords[0][1] !== coords[coords.length - 1][1]) {
          coords.push(coords[0]);
        }
        geometry = {
          type: 'Polygon',
          coordinates: [coords]
        };
        featureType = 'polygon';
      }
    }

    if (!geometry) {
      return null;
    }

    // Extract additional properties from extended data
    const properties = {
      name: name,
      description: description,
      source: fileName,
      importedAt: new Date().toISOString(),
      featureType: featureType
    };

    // Parse extended data if present
    const extendedData = placemark.querySelector('ExtendedData');
    if (extendedData) {
      const dataElements = extendedData.querySelectorAll('Data');
      dataElements.forEach(dataElement => {
        const nameAttr = dataElement.getAttribute('name');
        const valueElement = dataElement.querySelector('value');
        if (nameAttr && valueElement) {
          properties[nameAttr] = valueElement.textContent.trim();
        }
      });
    }

    return {
      type: 'Feature',
      geometry: geometry,
      properties: properties
    };
  };

  // Parse coordinate string from KML
  const parseCoordinates = (coordString) => {
    const coords = [];
    const coordPairs = coordString.trim().split(/\s+/);
    
    coordPairs.forEach(pair => {
      const parts = pair.split(',');
      if (parts.length >= 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        const alt = parts.length > 2 ? parseFloat(parts[2]) : 0;
        
        if (!isNaN(lng) && !isNaN(lat)) {
          coords.push([lng, lat]);
        }
      }
    });
    
    return coords;
  };

  // Convert GeoJSON to Leaflet layers
  const createLeafletLayers = (geoJsonData) => {
    const layers = [];
    
    geoJsonData.features.forEach((feature, index) => {
      const { geometry, properties } = feature;
      let layer = null;
      let measurements = {};

      switch (geometry.type) {
        case 'Point':
          layer = L.marker([geometry.coordinates[1], geometry.coordinates[0]], {
            icon: L.divIcon({
              className: 'imported-marker',
              html: '<div style="background-color:#e74c3c;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          });
          break;

        case 'LineString':
          const lineCoords = geometry.coordinates.map(coord => [coord[1], coord[0]]);
          layer = L.polyline(lineCoords, {
            color: '#e74c3c',
            weight: 3,
            opacity: 0.8
          });
          
          // Calculate distance
          let totalDistance = 0;
          for (let i = 0; i < lineCoords.length - 1; i++) {
            totalDistance += L.latLng(lineCoords[i]).distanceTo(L.latLng(lineCoords[i + 1]));
          }
          measurements.distance = totalDistance >= 1000 ? 
            `${(totalDistance / 1000).toFixed(2)} km` : 
            `${totalDistance.toFixed(0)} m`;
          break;

        case 'Polygon':
          const polygonCoords = geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
          layer = L.polygon(polygonCoords, {
            color: '#e74c3c',
            fillColor: '#e74c3c',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
          });
          
          // Calculate area using Leaflet's built-in method
          const tempPolygon = L.polygon(polygonCoords);
          const area = L.GeometryUtil ? L.GeometryUtil.geodesicArea(tempPolygon.getLatLngs()[0]) : 0;
          measurements.area = area >= 1000000 ? 
            `${(area / 1000000).toFixed(2)} km²` : 
            area >= 10000 ? 
            `${(area / 10000).toFixed(2)} ha` : 
            `${area.toFixed(0)} m²`;
          break;

        default:
          console.warn('Unsupported geometry type:', geometry.type);
          return;
      }

      if (layer) {
        // Add popup with feature info
        const popupContent = `
          <div class="text-sm">
            <strong>${properties.name || 'Imported Feature'}</strong><br>
            ${properties.description ? `<em>${properties.description}</em><br>` : ''}
            <small>Source: ${properties.source}</small>
            ${Object.keys(measurements).length > 0 ? '<br>' + 
              Object.entries(measurements).map(([key, value]) => 
                `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`
              ).join('<br>') : ''}
          </div>
        `;
        
        layer.bindPopup(popupContent);
        
        // Add tooltip for hover
        if (properties.name) {
          layer.bindTooltip(properties.name, {
            permanent: false,
            direction: 'top',
            opacity: 0.9
          });
        }

        layer.addTo(map);

        // Store layer data
        const layerData = {
          id: `imported_${Date.now()}_${index}`,
          layer: layer,
          geoJson: feature,
          type: properties.featureType || geometry.type.toLowerCase(),
          measurements: measurements,
          source: properties.source,
          imported: true
        };

        layers.push(layerData);
        
        // Add to drawn layers context
        addDrawnLayer(layerData);
      }
    });

    return layers;
  };

  // Handle file selection
  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    setIsImporting(true);
    const importedFiles = [];

    try {
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.kml') && !file.name.toLowerCase().endsWith('.kmz')) {
          alert(`${file.name} is not a supported file type. Please upload KML files.`);
          continue;
        }

        try {
          let content;
          
          if (file.name.toLowerCase().endsWith('.kmz')) {
            // Handle KMZ files (ZIP compressed KML)
            const JSZip = await import('jszip');
            const zip = new JSZip.default();
            const zipContent = await zip.loadAsync(file);
            
            // Look for KML file inside the ZIP
            const kmlFile = Object.keys(zipContent.files).find(filename => 
              filename.toLowerCase().endsWith('.kml')
            );
            
            if (!kmlFile) {
              throw new Error('No KML file found in KMZ archive');
            }
            
            content = await zipContent.files[kmlFile].async('string');
          } else {
            // Handle KML files
            content = await file.text();
          }

          // Parse KML content
          const geoJsonData = parseKML(content, file.name);
          
          if (geoJsonData.features.length === 0) {
            alert(`No valid features found in ${file.name}`);
            continue;
          }

          // Create Leaflet layers
          const layers = createLeafletLayers(geoJsonData);
          
          if (layers.length > 0) {
            // Fit map to show all imported features
            const group = L.featureGroup(layers.map(l => l.layer));
            map.fitBounds(group.getBounds().pad(0.1));

            importedFiles.push({
              fileName: file.name,
              featureCount: layers.length,
              layers: layers,
              timestamp: new Date().toISOString()
            });
          }

        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          alert(`Error importing ${file.name}: ${error.message}`);
        }
      }

      if (importedFiles.length > 0) {
        setImportedLayers(prev => [...prev, ...importedFiles]);
        
        const totalFeatures = importedFiles.reduce((sum, file) => sum + file.featureCount, 0);
        alert(`Successfully imported ${totalFeatures} features from ${importedFiles.length} file(s)`);
      }

    } catch (error) {
      console.error('Error during import:', error);
      alert('Error importing files. Please check the console for details.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearImportedLayers = () => {
    importedLayers.forEach(file => {
      file.layers.forEach(layerData => {
        map.removeLayer(layerData.layer);
      });
    });
    setImportedLayers([]);
  };

  const removeImportedFile = (fileName) => {
    const fileData = importedLayers.find(file => file.fileName === fileName);
    if (fileData) {
      fileData.layers.forEach(layerData => {
        map.removeLayer(layerData.layer);
      });
      setImportedLayers(prev => prev.filter(file => file.fileName !== fileName));
    }
  };

  return (
    <div className="absolute top-3 right-4 z-[1004]" ref={controlRef}>
      {/* Import Status Indicator */}
      {isImporting && (
        <div className="absolute -top-12 left-0 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg animate-pulse">
          Importing files...
        </div>
      )}

      {/* Floating Action Button */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-white rounded-full shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 hover:shadow-xl ${
          isImporting ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
        } ${importedLayers.length > 0 ? 'ring-2 ring-purple-400' : ''} ${isExpanded ? 'rotate-180' : ''}`}
        style={{ 
          width: '48px', 
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Import KML/KMZ Files"
      >
        <svg 
          className={`w-5 h-5 transition-colors duration-300 ${
            isImporting ? 'text-blue-600' : importedLayers.length > 0 ? 'text-purple-600' : 'text-gray-600'
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
              : "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            }
          />
        </svg>
        
        {/* Import count badge */}
        {importedLayers.length > 0 && !isExpanded && (
          <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold">
            {importedLayers.reduce((sum, file) => sum + file.featureCount, 0)}
          </div>
        )}
      </div>

      {/* Expanded Panel */}
      <div className={`absolute top-14 right-0 transition-all duration-300 ease-in-out transform ${
        isExpanded 
          ? 'opacity-100 translate-y-0 scale-100 z-[1010]' 
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none z-[1004]'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ width: '320px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm">Import KML Data</h3>
                {importedLayers.length > 0 && (
                  <p className="text-purple-100 text-xs">
                    {importedLayers.reduce((sum, file) => sum + file.featureCount, 0)} features from {importedLayers.length} file{importedLayers.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Import Area */}
          <div className="p-4">
            {/* Drag & Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                dragActive 
                  ? 'border-purple-400 bg-purple-50' 
                  : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <svg className={`mx-auto h-12 w-12 ${dragActive ? 'text-purple-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Drop KML/KMZ files here</span> or
              </p>
              <button
                onClick={triggerFileInput}
                disabled={isImporting}
                className="mt-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isImporting ? 'Importing...' : 'Select Files'}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".kml,.kmz"
                multiple
                onChange={(e) => handleFileSelect(Array.from(e.target.files))}
                className="hidden"
              />
              
              <p className="mt-2 text-xs text-gray-500">
                Supports KML and KMZ files
              </p>
            </div>

            {/* Clear All Button */}
            {importedLayers.length > 0 && (
              <button
                onClick={clearImportedLayers}
                className="w-full mt-4 py-2 px-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-200 text-sm font-medium"
              >
                Clear All Imports ({importedLayers.reduce((sum, file) => sum + file.featureCount, 0)})
              </button>
            )}
          </div>

          {/* Imported Files List */}
          {importedLayers.length > 0 && (
            <div className="border-t border-gray-100 max-h-48 overflow-y-auto">
              <div className="p-2">
                {importedLayers.map((file, index) => (
                  <div key={`${file.fileName}_${index}`} className="mb-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.fileName}>
                          {file.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.featureCount} feature{file.featureCount > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(file.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => removeImportedFile(file.fileName)}
                        className="ml-2 text-red-400 hover:text-red-600 p-1"
                        title="Remove imported file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Footer */}
          <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Imported features will be added to your drawing layers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportControl;