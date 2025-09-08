import React from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';

const MapLegend = () => {
  const map = useLeafletMap();

  React.useEffect(() => {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'bg-white p-2 rounded shadow');
      div.style.margin = '10px'; // Add margin to prevent edge clipping
      div.style.zIndex = '1000'; // Ensure legend is above other elements
      div.innerHTML = `
        <h4 class="font-bold text-sm mb-1">Legend</h4>
        <div class="flex items-center mb-1">
          <span style="background-color: #90EE90; width: 12px; height: 12px; display: inline-block; margin-right: 6px;"></span>
          <span class="text-xs">Approved</span>
        </div>
        <div class="flex items-center mb-1">
          <span style="background-color: #FFFFE0; width: 12px; height: 12px; display: inline-block; margin-right: 6px;"></span>
          <span class="text-xs">Pending / Under Review</span>
        </div>
        <div class="flex items-center mb-1">
          <span style="background-color: #FFB6B6; width: 12px; height: 12px; display: inline-block; margin-right: 6px;"></span>
          <span class="text-xs">Rejected</span>
        </div>
      `;
      return div;
    };

    legend.addTo(map);
    return () => legend.remove();
  }, [map]);

  return null;
};

export default MapLegend;