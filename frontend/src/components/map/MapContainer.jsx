import React, { useContext, useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapContext } from '../../context/MapContext';
import { getSpatialData, getMockBounds } from '../../services/mapService';
import LayerControl from './LayerControl';
import MapLegend from './MapLegend';
import DrawingTools from './DrawingTools';
import FilterPanel from './FilterPanel';
import SearchControl from './SearchControl';
import PopupContent from './PopupContent';
import 'leaflet/dist/leaflet.css';
import ReactDOMServer from 'react-dom/server';

const MapLayers = ({ claims, filteredClaims }) => {
  const map = useMap();
  const { layers, addLayer, filters } = useContext(MapContext);

  useEffect(() => {
    if (claims.length > 0 && !layers.claims) {
      const geoJsonLayer = L.geoJSON(claims, {
        style: (feature) => ({
          color: getLayerColor(feature.properties.status),
          weight: 4,
          fillOpacity: 0.3,
          fillColor: getLayerColor(feature.properties.status),
        }),
        onEachFeature: (feature, layer) => {
          const popupContent = ReactDOMServer.renderToString(<PopupContent feature={feature} />);
          layer.bindPopup(popupContent);
        },
      });
      geoJsonLayer.addTo(map);
      addLayer('claims', geoJsonLayer);

      if (!filters.state && !filters.district && !filters.village) {
        const bounds = L.geoJSON(claims).getBounds();
        map.fitBounds(bounds, { animate: true, duration: 0.8 });
      }
    }
  }, [map, claims, layers, addLayer, filters]);

  useEffect(() => {
    let term = '';
    if (filters.village) term = filters.village;
    else if (filters.district) term = filters.district;
    else if (filters.state) term = filters.state;
    else return;

    const bounds = getMockBounds(term);
    if (bounds) {
      map.fitBounds(bounds, { animate: true, duration: 0.8 });
    }
  }, [map, filters]);

  const getLayerColor = (status) => {
    const colors = {
      Approved: '#90EE90', // Light green
      Pending: '#FFFFE0', // Light yellow
      'Under Review': '#FFFFE0', // Light yellow
      Rejected: '#FFB6B6' // Light red
    };
    return colors[status] || '#FFFFE0';
  };

  return (
    <GeoJSON
      data={filteredClaims}
      style={(feature) => ({
        color: getLayerColor(feature.properties.status),
        weight: 4,
        fillOpacity: 0.3,
        fillColor: getLayerColor(feature.properties.status),
      })}
      onEachFeature={(feature, layer) => {
        const popupContent = ReactDOMServer.renderToString(<PopupContent feature={feature} />);
        layer.bindPopup(popupContent);
      }}
    />
  );
};

const MapContainer = () => {
  const { mapCenter, zoom, setMapInstance, filters } = useContext(MapContext);
  const spatialData = getSpatialData();
  const claims = spatialData.claims?.features || [];

  const filteredClaims = claims.filter((claim) => {
    const props = claim.properties;
    const passesFilter =
      (!filters.state || props.state.toLowerCase().includes(filters.state.toLowerCase())) &&
      (!filters.district || props.district?.toLowerCase().includes(filters.district.toLowerCase())) &&
      (!filters.village || props.village?.toLowerCase().includes(filters.village.toLowerCase())) &&
      (!filters.tribalGroup || props.tribalGroup?.toLowerCase().includes(filters.tribalGroup.toLowerCase())) &&
      (filters.claimStatuses.length === 0 || filters.claimStatuses.includes(props.status)) &&
      (!filters.featureType || props.featureType === filters.featureType);
    return passesFilter;
  });

  return (
    <LeafletMap
      center={mapCenter}
      zoom={zoom}
      className="map-container"
      whenCreated={(map) => {
        setMapInstance(map);
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapLayers claims={claims} filteredClaims={filteredClaims} />
      <LayerControl />
      <MapLegend />
      <DrawingTools />
      <FilterPanel />
      <SearchControl />
    </LeafletMap>
  );
};

export default MapContainer;