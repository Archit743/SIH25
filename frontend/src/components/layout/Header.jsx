import React from 'react';
import { MapContext } from '../../context/MapContext';

const Header = () => {
  const { filters, setFilters } = React.useContext(MapContext);

  const resetToCountry = () => setFilters({ state: '', district: '', village: '', tribalGroup: '', claimStatuses: [] });

  const resetToState = () => setFilters((prev) => ({ ...prev, district: '', village: '', tribalGroup: '' }));

  const resetToDistrict = () => setFilters((prev) => ({ ...prev, village: '', tribalGroup: '' }));

  return (
    <header className="bg-blue-600 text-white p-4 flex items-center">
      <h1 className="text-xl font-bold mr-4">FRA WebGIS DSS Prototype</h1>
      <div className="text-sm">
        <span className="cursor-pointer underline" onClick={resetToCountry}>
          India
        </span>
        {filters.state && (
          <>
            {' > '}
            <span className="cursor-pointer underline" onClick={resetToState}>
              {filters.state}
            </span>
          </>
        )}
        {filters.district && (
          <>
            {' > '}
            <span className="cursor-pointer underline" onClick={resetToDistrict}>
              {filters.district}
            </span>
          </>
        )}
        {filters.village && <> {' > '} {filters.village}</>}
      </div>
    </header>
  );
};

export default Header;