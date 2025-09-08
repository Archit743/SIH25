import React from 'react';
import MapContainer from '../../components/map/MapContainer';
import Loading from '../../components/common/Loading';

const MapView = () => {
  return (
    <div className="relative h-full w-full">
      <React.Suspense fallback={<Loading />}>
        <MapContainer />
      </React.Suspense>
    </div>
  );
};

export default MapView;