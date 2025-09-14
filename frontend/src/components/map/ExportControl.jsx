import React, { useState, useContext, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MapContext } from '../../context/MapContext';

const ExportControl = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null);
  const controlRef = useRef(null);
  const map = useMap();
  
  const {
    currentLevel,
    selectedState,
    selectedDistrict,
    selectedSubdistrict,
    geoJsonData,
    boundaryLayers,
    drawnLayers // Get drawn layers from context
  } = useContext(MapContext);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (controlRef.current && !controlRef.current.contains(event.target) && isExpanded) {
        setIsExpanded(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded]);

  // Get current boundary data based on navigation level
  const getCurrentBoundaryData = () => {
    const normalizeStateName = (name) => {
      if (!name) return '';
      return name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_]/g, '');
    };

    switch (currentLevel) {
      case 'india':
        return {
          type: 'FeatureCollection',
          features: geoJsonData.states?.features || [],
          name: 'India States',
          level: 'states'
        };

      case 'state':
        if (!selectedState) return null;
        const normalizedState = normalizeStateName(selectedState);
        const districtData = geoJsonData.districts[normalizedState];
        return districtData ? {
          ...districtData,
          name: `${selectedState} Districts`,
          level: 'districts'
        } : null;

      case 'district':
        if (!selectedState || !selectedDistrict) return null;
        const stateNormalized = normalizeStateName(selectedState);
        const subdistrictData = geoJsonData.subdistricts[stateNormalized];
        if (!subdistrictData) return null;
        
        // Filter subdistricts for the selected district
        const filteredFeatures = subdistrictData.features.filter(feature => 
          feature.properties.dtname === selectedDistrict
        );
        
        return filteredFeatures.length > 0 ? {
          type: 'FeatureCollection',
          features: filteredFeatures,
          name: `${selectedDistrict} Subdistricts, ${selectedState}`,
          level: 'subdistricts'
        } : null;

      case 'subdistrict':
        if (!selectedState || !selectedDistrict || !selectedSubdistrict) return null;
        const stateNorm = normalizeStateName(selectedState);
        const allSubdistricts = geoJsonData.subdistricts[stateNorm];
        if (!allSubdistricts) return null;
        
        // Find the specific subdistrict
        const specificSubdistrict = allSubdistricts.features.find(feature => 
          feature.properties.dtname === selectedDistrict && 
          feature.properties.sdtname === selectedSubdistrict
        );
        
        return specificSubdistrict ? {
          type: 'FeatureCollection',
          features: [specificSubdistrict],
          name: `${selectedSubdistrict} Subdistrict, ${selectedDistrict}, ${selectedState}`,
          level: 'subdistrict'
        } : null;

      default:
        return null;
    }
  };

  // Export boundary data as GeoJSON
  const exportBoundaryGeoJSON = async () => {
    setIsExporting(true);
    setExportType('boundary');
    
    try {
      const boundaryData = getCurrentBoundaryData();
      if (!boundaryData) {
        alert('No boundary data available for current selection');
        return;
      }

      // Create enhanced GeoJSON with metadata
      const exportData = {
        type: 'FeatureCollection',
        metadata: {
          name: boundaryData.name,
          level: boundaryData.level,
          exportDate: new Date().toISOString(),
          exportedBy: 'Map Application',
          currentSelection: {
            state: selectedState,
            district: selectedDistrict,
            subdistrict: selectedSubdistrict
          }
        },
        features: boundaryData.features
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `boundary-${boundaryData.level}-${Date.now()}.geojson`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting boundary GeoJSON:', error);
      alert('Error exporting boundary data');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Convert GeoJSON to KML format
  const geoJsonToKml = (geoJson, title = 'Exported Data') => {
    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${title}</name>
    <description>Exported from Map Application on ${new Date().toLocaleDateString()}</description>
`;

    geoJson.features.forEach((feature, index) => {
      const { geometry, properties } = feature;
      const name = properties.name || properties.sdtname || properties.dtname || properties.STNAME || `Feature ${index + 1}`;
      
      kml += `    <Placemark>
      <name>${name}</name>
      <description>`;
      
      // Add properties as description
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          kml += `${key}: ${value}\n`;
        }
      });
      
      kml += `</description>
`;

      // Handle different geometry types
      switch (geometry.type) {
        case 'Point':
          kml += `      <Point>
        <coordinates>${geometry.coordinates[0]},${geometry.coordinates[1]}</coordinates>
      </Point>
`;
          break;
          
        case 'LineString':
          kml += `      <LineString>
        <coordinates>`;
          geometry.coordinates.forEach(coord => {
            kml += `${coord[0]},${coord[1]} `;
          });
          kml += `</coordinates>
      </LineString>
`;
          break;
          
        case 'Polygon':
          kml += `      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>`;
          geometry.coordinates[0].forEach(coord => {
            kml += `${coord[0]},${coord[1]} `;
          });
          kml += `</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
`;
          break;
          
        case 'MultiPolygon':
          geometry.coordinates.forEach((polygon, pIndex) => {
            kml += `      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>`;
            polygon[0].forEach(coord => {
              kml += `${coord[0]},${coord[1]} `;
            });
            kml += `</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
`;
          });
          break;
      }
      
      kml += `    </Placemark>
`;
    });

    kml += `  </Document>
</kml>`;
    
    return kml;
  };

  // Export drawn shapes as KML
  const exportDrawnShapesKML = async () => {
    setIsExporting(true);
    setExportType('shapes');
    
    try {
      if (!drawnLayers || drawnLayers.length === 0) {
        alert('No drawn shapes to export');
        return;
      }

      // Convert drawn layers to GeoJSON format
      const geoJsonFeatures = drawnLayers.map((layerData, index) => {
        const feature = layerData.geoJson;
        
        // Enhance properties with measurements
        const enhancedProperties = {
          ...feature.properties,
          shapeType: layerData.type,
          createdAt: new Date().toISOString(),
          ...layerData.measurements
        };

        return {
          ...feature,
          properties: enhancedProperties
        };
      });

      const geoJson = {
        type: 'FeatureCollection',
        features: geoJsonFeatures
      };

      // Convert to KML
      const kmlContent = geoJsonToKml(geoJson, 'Drawn Shapes Export');
      
      // Create and download file
      const blob = new Blob([kmlContent], {
        type: 'application/vnd.google-earth.kml+xml'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `drawn-shapes-${Date.now()}.kml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting drawn shapes:', error);
      alert('Error exporting drawn shapes');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Export map as screenshot - Note: This requires html2canvas library to be installed
  const exportMapScreenshot = async () => {
  setIsExporting(true);
  setExportType('screenshot');
  
  try {
    // Dynamic import of leaflet-image
    const leafletImage = await import('leaflet-image');
    
    // Capture the map using leaflet-image
    leafletImage.default(map, (err, canvas) => {
      if (err) {
        throw new Error('Failed to capture map: ' + err.message);
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `map-screenshot-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    });
    
  } catch (error) {
    console.error('Error capturing map screenshot:', error);
    alert('Error capturing map screenshot: ' + error.message);
  } finally {
    setIsExporting(false);
    setExportType(null);
  }
};

  const exportOptions = [
    {
      id: 'boundary',
      name: 'Boundary Data',
      description: 'Export current boundary as GeoJSON',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      action: exportBoundaryGeoJSON,
      available: currentLevel !== 'search' && getCurrentBoundaryData() !== null
    },
    {
      id: 'shapes',
      name: 'Drawn Shapes',
      description: 'Export annotations as KML',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      action: exportDrawnShapesKML,
      available: drawnLayers && drawnLayers.length > 0
    },
    {
      id: 'screenshot',
      name: 'Map Screenshot',
      description: 'Save current view as PNG',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: exportMapScreenshot,
      available: true
    }
  ];

  const getCurrentLevelInfo = () => {
    switch (currentLevel) {
      case 'india':
        return 'All Indian States';
      case 'state':
        return `${selectedState} Districts`;
      case 'district':
        return `${selectedDistrict} Subdistricts`;
      case 'subdistrict':
        return `${selectedSubdistrict} Boundary`;
      default:
        return 'Current View';
    }
  };

  return (
    <div className="absolute top-3 right-18 z-[1004]" ref={controlRef}>
      {/* Export Status Indicator */}
      {isExporting && (
        <div className="absolute -top-12 left-0 bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg animate-pulse">
          Exporting {exportType}...
        </div>
      )}

      {/* Floating Action Button */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-white rounded-full shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 hover:shadow-xl ${
          isExporting ? 'ring-4 ring-green-400 ring-opacity-50' : ''
        } ${isExpanded ? 'rotate-180' : ''}`}
        style={{ 
          width: '48px', 
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Export Tools"
      >
        <svg 
          className={`w-5 h-5 transition-colors duration-300 ${
            isExporting ? 'text-green-600' : 'text-gray-600'
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
              : "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            }
          />
        </svg>
      </div>

      {/* Expanded Panel */}
      <div className={`absolute top-14 right-0 transition-all duration-300 ease-in-out transform ${
        isExpanded 
          ? 'opacity-100 translate-y-0 scale-100 z-[1010]' 
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none z-[1004]'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" style={{ width: '320px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm">Export Tools</h3>
                <p className="text-green-100 text-xs">{getCurrentLevelInfo()}</p>
              </div>
            </div>
          </div>
          
          {/* Export Options */}
          <div className="p-4 space-y-3">
            {exportOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.action}
                disabled={isExporting || !option.available}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  exportType === option.id 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : option.available
                      ? 'border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 cursor-pointer'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                } ${isExporting && exportType !== option.id ? 'opacity-50' : ''}`}
              >
                <div className={`${option.available ? 'text-green-600' : 'text-gray-400'}`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{option.name}</div>
                  <div className="text-xs opacity-75">{option.description}</div>
                  {!option.available && option.id === 'boundary' && (
                    <div className="text-xs text-red-500 mt-1">No boundary selected</div>
                  )}
                  {!option.available && option.id === 'shapes' && (
                    <div className="text-xs text-red-500 mt-1">No shapes drawn</div>
                  )}
                </div>
                {option.id === 'shapes' && drawnLayers && drawnLayers.length > 0 && (
                  <div className="text-xs text-green-600 font-semibold">
                    ({drawnLayers.length})
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Info Footer */}
          <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Files will be downloaded to your device
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportControl;