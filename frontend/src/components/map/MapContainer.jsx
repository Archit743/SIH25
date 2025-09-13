import React, { useContext, useEffect, useCallback, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapContext } from '../../context/MapContext';
import LayerControl from './LayerControl';
import MapLegend from './MapLegend';
import SearchControl from './SearchControl'; 
import DrawingTools from './DrawingTools';
import 'leaflet/dist/leaflet.css';

const MapInstanceSetter = () => {
    const map = useMap();
    const { setMapInstance } = useContext(MapContext);
    
    useEffect(() => {
      console.log('Setting map instance in context');
      setMapInstance(map);
      
      return () => {
        setMapInstance(null);
      };
    }, [map, setMapInstance]);
    
    return null;
};
const ScaleControl = () => {
  const map = useMap();
  
  useEffect(() => {
    const scaleControl = L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: false,
      updateWhenIdle: false,
      maxWidth: 150
    });
    
    scaleControl.addTo(map);
    
    return () => {
      map.removeControl(scaleControl);
    };
  }, [map]);
  
  return null;
};
const MapLayers = () => {
  const map = useMap();
  const { 
    filters,
    currentLevel, setCurrentLevel,
    selectedState, setSelectedState,
    selectedDistrict, setSelectedDistrict,
    selectedSubdistrict, setSelectedSubdistrict,
    boundaryLayers, setBoundaryLayers,
    geoJsonData, setGeoJsonData,
    loadingBoundaries, setLoadingBoundaries,
    boundariesEnabled,
  } = useContext(MapContext);

  const districtsLayerRef = useRef(null);
  const subdistrictsLayerRef = useRef(null);

  // Helper function to normalize names
  const normalizeStateName = (name) => {
    if (!name) return '';
    return name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_]/g, '');
  };

  const normalizeDistrictName = (name) => {
    if (!name) return '';
    return name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_]/g, '');
  };

  // Apply filters for zooming
  useEffect(() => {
    let term = '';
    if (filters.village) term = filters.village;
    else if (filters.subdistrict) term = filters.subdistrict;
    else if (filters.district) term = filters.district;
    else if (filters.state) term = filters.state;
    else return;

    console.log('Filter changed to:', term);
  }, [filters.village, filters.subdistrict, filters.district, filters.state]);

  // Load states GeoJSON on mount
  useEffect(() => {
    if (!boundariesEnabled) return;

    const loadStates = async () => {
      if (geoJsonData.states) {
        console.log('States GeoJSON already loaded');
        return;
      }
      setLoadingBoundaries(true);
      try {
        const url = 'https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIA_STATES.geojson';
        console.log('Fetching states:', url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.type !== 'FeatureCollection') {
          throw new Error('Invalid GeoJSON format');
        }
        console.log('States GeoJSON loaded successfully');
        setGeoJsonData((prev) => ({ ...prev, states: data }));
      } catch (error) {
        console.error('Failed to load states GeoJSON:', error);
        alert('Failed to load state boundaries. Please check your network or try again later.');
      } finally {
        setLoadingBoundaries(false);
      }
    };
    loadStates();
  }, [boundariesEnabled, geoJsonData.states, setGeoJsonData, setLoadingBoundaries]);

  // Function to load districts
  const loadDistricts = useCallback(async (stateName) => {
    if (!boundariesEnabled) return;

    const normalized = normalizeStateName(stateName);
    if (geoJsonData.districts[normalized]) {
      console.log(`Districts for ${stateName} already loaded`);
      return;
    }
    setLoadingBoundaries(true);
    try {
      const folderName = getStateFolderName(stateName);
      const encodedFolderName = encodeURIComponent(folderName);
      const fileName = folderName === 'ORISSA' ? 'ODISHA_DISTRICTS' : `${folderName}_DISTRICTS`;
      const encodedFileName = encodeURIComponent(fileName);
      const url = `https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/STATES/${encodedFolderName}/${encodedFileName}.geojson`;
      console.log(`Fetching districts for ${stateName}: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: File not found for ${stateName}`);
      }
      const data = await response.json();
      if (data.type !== 'FeatureCollection') {
        throw new Error('Invalid GeoJSON format');
      }
      console.log(`Districts for ${stateName} loaded successfully`);
      setGeoJsonData((prev) => ({
        ...prev,
        districts: { ...prev.districts, [normalized]: data },
      }));
    } catch (error) {
      console.error(`Failed to load districts for ${stateName}:`, error);
      alert(`Failed to load districts for ${stateName}.`);
    } finally {
      setLoadingBoundaries(false);
    }
  }, [boundariesEnabled, geoJsonData.districts, setGeoJsonData, setLoadingBoundaries]);

  // Function to load subdistricts
  const loadSubdistricts = useCallback(async (stateName, districtName) => {
    if (!boundariesEnabled) return;

    const normalizedState = normalizeStateName(stateName);
    if (geoJsonData.subdistricts[normalizedState]) {
      console.log(`Subdistricts for ${stateName} already loaded`);
      return;
    }
    setLoadingBoundaries(true);
    try {
      const folderName = getStateFolderName(stateName);
      const encodedFolderName = encodeURIComponent(folderName);
      const fileName = folderName === 'ORISSA' ? 'ODISHA_SUBDISTRICTS' : `${folderName}_SUBDISTRICTS`;
      const encodedFileName = encodeURIComponent(fileName);
      const url = `https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/STATES/${encodedFolderName}/${encodedFileName}.geojson`;
      console.log(`Fetching subdistricts for ${stateName}: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: File not found for ${stateName}`);
      }
      const data = await response.json();
      if (data.type !== 'FeatureCollection') {
        throw new Error('Invalid GeoJSON format');
      }
      console.log(`Subdistricts for ${stateName} loaded successfully`);
      setGeoJsonData((prev) => ({
        ...prev,
        subdistricts: { ...prev.subdistricts, [normalizedState]: data },
      }));
    } catch (error) {
      console.error(`Failed to load subdistricts for ${stateName}:`, error);
      alert(`Failed to load subdistricts for ${stateName}. Subdistrict data may not be available.`);
    } finally {
      setLoadingBoundaries(false);
    }
  }, [boundariesEnabled, geoJsonData.subdistricts, setGeoJsonData, setLoadingBoundaries]);

  // Remove all boundary layers when boundaries are disabled
  useEffect(() => {
    if (!boundariesEnabled && currentLevel !== 'search') {
      console.log('Boundaries disabled, removing navigation layers only');
      ['states', 'districts', 'subdistricts'].forEach(layerType => {
        if (boundaryLayers[layerType]) {
          try {
            map.removeLayer(boundaryLayers[layerType]);
          } catch (error) {
            console.error(`Error removing ${layerType} layer:`, error);
          }
        }
      });
      districtsLayerRef.current = null;
      subdistrictsLayerRef.current = null;
      
      // Only update state if necessary to avoid infinite loops
      setBoundaryLayers(prev => {
        if (prev.states || prev.districts || prev.subdistricts) {
          return { states: null, districts: null, subdistricts: null };
        }
        return prev;
      });
      if (selectedState !== null) setSelectedState(null);
      if (selectedDistrict !== null) setSelectedDistrict(null);
      if (selectedSubdistrict !== null) setSelectedSubdistrict(null);
      if (currentLevel !== 'india') setCurrentLevel('india');
    }
  }, [boundariesEnabled, currentLevel, map, setSelectedState, setSelectedDistrict, setSelectedSubdistrict, setCurrentLevel]);

  // Add states layer
  useEffect(() => {
    if (!boundariesEnabled || !geoJsonData.states || boundaryLayers.states) {
      return;
    }

    console.log('Adding states layer to map');
    const statesLayer = L.geoJSON(geoJsonData.states, {
      style: { color: '#3388ff', weight: 2, fillOpacity: 0 },
      onEachFeature: (feature, layer) => {
        const stateName = feature.properties.STNAME || 'Unknown State';
        if (!feature.properties.STNAME) {
          console.warn('No state name in feature properties:', feature.properties);
        }
        layer.on('click', () => {
          if (!stateName || !boundariesEnabled) return;
          console.log(`State clicked: ${stateName}`);
          
          // Remove existing district and subdistrict layers
          if (districtsLayerRef.current) {
            console.log('Removing existing districts layer before state change');
            try {
              map.removeLayer(districtsLayerRef.current);
              districtsLayerRef.current = null;
            } catch (error) {
              console.error('Error removing districts layer:', error);
            }
          }
          if (subdistrictsLayerRef.current) {
            console.log('Removing existing subdistricts layer before state change');
            try {
              map.removeLayer(subdistrictsLayerRef.current);
              subdistrictsLayerRef.current = null;
            } catch (error) {
              console.error('Error removing subdistricts layer:', error);
            }
          }
          
          setBoundaryLayers((prev) => ({ ...prev, districts: null, subdistricts: null }));
          
          try {
            map.fitBounds(layer.getBounds(), { padding: [50, 50] });
          } catch (error) {
            console.error('Error getting bounds:', error);
          }
          
          setSelectedState(stateName);
          setSelectedDistrict(null);
          setSelectedSubdistrict(null);
          setCurrentLevel('state');
          loadDistricts(stateName);
        });
        layer.bindPopup(`State: ${stateName}`);
      },
    }).addTo(map);
    
    setBoundaryLayers((prev) => ({ ...prev, states: statesLayer }));
    console.log('States layer added successfully');
  }, [boundariesEnabled, geoJsonData.states, boundaryLayers.states, map, setBoundaryLayers, setSelectedState, setSelectedDistrict, setSelectedSubdistrict, setCurrentLevel, loadDistricts]);

  // Add districts layer
  useEffect(() => {
    if (currentLevel === 'search' || !boundariesEnabled || !selectedState) {
      if (districtsLayerRef.current) {
        console.log('Removing districts layer due to invalid conditions');
        try {
          map.removeLayer(districtsLayerRef.current);
          districtsLayerRef.current = null;
        } catch (error) {
          console.error('Error removing districts layer:', error);
        }
        setBoundaryLayers((prev) => ({ ...prev, districts: null }));
      }
      return;
    }

    const normalizedState = normalizeStateName(selectedState);
    const districtData = geoJsonData.districts[normalizedState];
    
    if (!districtData || !['state', 'district', 'subdistrict'].includes(currentLevel)) {
      return;
    }

    if (!districtsLayerRef.current) {
      console.log(`Adding districts layer for ${selectedState}`);
      const districtsLayer = L.geoJSON(districtData, {
        style: { color: '#ff7733', weight: 1.5, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          const distName = feature.properties.dtname || 'Unknown District';
          layer.on('click', () => {
            if (!distName || !boundariesEnabled || !selectedState) return;
            console.log(`District clicked: ${distName}`);
            
            if (subdistrictsLayerRef.current) {
              console.log('Removing existing subdistricts layer before district change');
              try {
                map.removeLayer(subdistrictsLayerRef.current);
                subdistrictsLayerRef.current = null;
              } catch (error) {
                console.error('Error removing subdistricts layer:', error);
              }
              setBoundaryLayers((prev) => ({ ...prev, subdistricts: null }));
            }
            
            try {
              map.fitBounds(layer.getBounds());
            } catch (error) {
              console.error('Error getting bounds:', error);
            }
            
            setSelectedDistrict(distName);
            setSelectedSubdistrict(null);
            setCurrentLevel('district');
            loadSubdistricts(selectedState, distName);
          });
          layer.bindPopup(`District: ${distName}`);
        },
      }).addTo(map);
      
      districtsLayerRef.current = districtsLayer;
      setBoundaryLayers((prev) => ({ ...prev, districts: districtsLayer }));
      console.log('Districts layer added successfully');
    }
  }, [boundariesEnabled, selectedState, geoJsonData.districts, currentLevel, map, setBoundaryLayers, setSelectedDistrict, setSelectedSubdistrict, setCurrentLevel, loadSubdistricts]);

  // Add subdistricts layer
  useEffect(() => {
    if (currentLevel === 'search' || !boundariesEnabled || !selectedState || !selectedDistrict) {
      if (subdistrictsLayerRef.current) {
        console.log('Removing subdistricts layer due to invalid conditions');
        try {
          map.removeLayer(subdistrictsLayerRef.current);
          subdistrictsLayerRef.current = null;
        } catch (error) {
          console.error('Error removing subdistrict layer:', error);
        }
        setBoundaryLayers((prev) => ({ ...prev, subdistricts: null }));
      }
      return;
    }

    const normalizedState = normalizeStateName(selectedState);
    const stateSubdistrictsData = geoJsonData.subdistricts[normalizedState];
    
    if (!stateSubdistrictsData || !['district', 'subdistrict'].includes(currentLevel)) {
      return;
    }

    if (!subdistrictsLayerRef.current) {
      console.log(`Adding subdistricts layer for ${selectedDistrict}, ${selectedState}`);
      const filteredFeatures = stateSubdistrictsData.features.filter(feature => {
        const featureDistrictName = feature.properties.dtname;
        return featureDistrictName === selectedDistrict;
      });
      
      console.log(`Found ${filteredFeatures.length} subdistricts for district: ${selectedDistrict}`);
      
      if (filteredFeatures.length === 0) {
        console.warn(`No subdistricts found for district: ${selectedDistrict}`);
        return;
      }
      
      const filteredGeoJSON = {
        type: 'FeatureCollection',
        features: filteredFeatures,
      };
      
      const subdistrictsLayer = L.geoJSON(filteredGeoJSON, {
        style: {
          color: '#ff4500', // Vibrant orange-red for high contrast
          weight: 3, // Thicker lines for better visibility
          opacity: 1, // Full opacity for solid lines
          fillOpacity: 0.1, // Slight fill for better area distinction
          fillColor: '#ff4500', // Match fill color to border
          dashArray: '5, 5' // Dashed pattern for visual distinction
        },
        onEachFeature: (feature, layer) => {
          const subdistName = feature.properties.sdtname || 'Unknown Subdistrict';
          const districtName = feature.properties.dtname || 'Unknown District';
          
          layer.on('click', () => {
            if (!subdistName || !boundariesEnabled || !selectedState || !selectedDistrict) return;
            console.log(`Subdistrict clicked: ${subdistName}`);
            
            try {
              map.fitBounds(layer.getBounds());
            } catch (error) {
              console.error('Error getting bounds:', error);
            }
            
            setSelectedSubdistrict(subdistName);
            setCurrentLevel('subdistrict');
          });
          
          layer.bindPopup(`Subdistrict: ${subdistName}<br>District: ${districtName}`);
        },
      }).addTo(map);
      
      subdistrictsLayerRef.current = subdistrictsLayer;
      setBoundaryLayers((prev) => ({ ...prev, subdistricts: subdistrictsLayer }));
      console.log('Subdistricts layer added successfully');
    }
  }, [boundariesEnabled, selectedState, selectedDistrict, geoJsonData.subdistricts, currentLevel, map, setBoundaryLayers, setSelectedSubdistrict, setCurrentLevel]);

  // Reset to India view
  useEffect(() => {
    if (currentLevel === 'india' && !selectedState && boundariesEnabled && boundaryLayers.states) {
      console.log('Returning to India level - restoring full map view');
      map.setView([20.5937, 78.9629], 5, { animate: true, duration: 1.0 });
    }
  }, [currentLevel, selectedState, boundariesEnabled, boundaryLayers.states, map]);

  // Cleanup effect when selectedState changes
  useEffect(() => {
    return () => {
      if (districtsLayerRef.current) {
        console.log('State changed - removing districts layer');
        try {
          map.removeLayer(districtsLayerRef.current);
          districtsLayerRef.current = null;
        } catch (error) {
          console.error('Error removing districts layer:', error);
        }
        setBoundaryLayers((prev) => ({ ...prev, districts: null }));
      }
      if (subdistrictsLayerRef.current) {
        console.log('State changed - removing subdistricts layer');
        try {
          map.removeLayer(subdistrictsLayerRef.current);
          subdistrictsLayerRef.current = null;
        } catch (error) {
          console.error('Error removing subdistricts layer:', error);
        }
        setBoundaryLayers((prev) => ({ ...prev, subdistricts: null }));
      }
      if (selectedDistrict !== null) setSelectedDistrict(null);
      if (selectedSubdistrict !== null) setSelectedSubdistrict(null);
    };
  }, [selectedState, map, setBoundaryLayers, setSelectedDistrict, setSelectedSubdistrict]);

  // Cleanup effect when selectedDistrict changes
  useEffect(() => {
    if (currentLevel === 'search') return;

    if (!selectedDistrict && subdistrictsLayerRef.current) {
      console.log('District cleared - removing subdistrict layer');
      try {
        map.removeLayer(subdistrictsLayerRef.current);
        subdistrictsLayerRef.current = null;
      } catch (error) {
        console.error('Error removing subdistrict layer:', error);
      }
      setBoundaryLayers((prev) => ({ ...prev, subdistricts: null }));
      if (selectedSubdistrict !== null) setSelectedSubdistrict(null);
    }
  }, [selectedDistrict, currentLevel, map, setBoundaryLayers, setSelectedSubdistrict]);

  const getStateFolderName = (stateName) => {
    const folderMap = {
      ODISHA: 'ORISSA',
      ORISSA: 'ORISSA',
      BIHAR: 'BIHAR',
      MADHYA_PRADESH: 'MADHYA PRADESH',
      JAMMU_AND_KASHMIR: 'JAMMU KASHMIR',
      ANDHRA_PRADESH: 'ANDHRA PRADESH',
      HIMACHAL_PRADESH: 'HIMACHAL PRADESH',
      UTTAR_PRADESH: 'UTTAR PRADESH',
      WEST_BENGAL: 'WEST BENGAL',
      TAMIL_NADU: 'TAMIL NADU',
    };
    const normalized = normalizeStateName(stateName);
    return folderMap[normalized] || normalized;
  };

  if (loadingBoundaries) {
    console.log('Loading boundaries...');
  }

  return null;
};
const MapContainer = () => {
  const { mapCenter, zoom } = useContext(MapContext);

  return (
    <LeafletMap
      center={mapCenter}
      zoom={zoom}
      className="map-container"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapInstanceSetter />
      <MapLayers />
      <LayerControl />
      <SearchControl />
      <MapLegend />
      <DrawingTools />
      <ScaleControl /> 
    </LeafletMap>
  );
};

export default MapContainer;