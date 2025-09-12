import React from 'react';
import { MapContext } from '../../context/MapContext';

const Header = () => {
  const { 
    currentLevel, 
    selectedState, 
    selectedDistrict, 
    resetToIndia, 
    setCurrentLevel, 
    setSelectedState, 
    setSelectedDistrict,
    setFilters 
  } = React.useContext(MapContext);

  // Reset to India level
  const handleResetToCountry = () => {
    console.log('Navigating back to India level');
    resetToIndia();
  };

  // Reset to state level
  const handleResetToState = () => {
    if (selectedState) {
      console.log(`Navigating back to state: ${selectedState}`);
      setCurrentLevel('state');
      setSelectedDistrict(null);
      setFilters((prev) => ({ ...prev, district: '', village: '', tribalGroup: '' }));
    }
  };

  // Reset to district level
  const handleResetToDistrict = () => {
    if (selectedDistrict) {
      console.log(`Navigating back to district: ${selectedDistrict}`);
      setCurrentLevel('district');
      setFilters((prev) => ({ ...prev, village: '', tribalGroup: '' }));
    }
  };

  return (
    <header className="bg-blue-600 text-white p-4 flex items-center">
      <h1 className="text-xl font-bold mr-4">FRA WebGIS DSS Prototype</h1>
      <div className="text-sm">
        <span 
          className={`cursor-pointer ${currentLevel === 'india' ? 'font-bold' : 'underline'}`} 
          onClick={handleResetToCountry}
        >
          India
        </span>
        {selectedState && (
          <>
            {' > '}
            <span 
              className={`cursor-pointer ${currentLevel === 'state' ? 'font-bold' : 'underline'}`} 
              onClick={handleResetToState}
            >
              {selectedState}
            </span>
          </>
        )}
        {selectedDistrict && (
          <>
            {' > '}
            <span 
              className={`cursor-pointer ${currentLevel === 'district' ? 'font-bold' : 'underline'}`} 
              onClick={handleResetToDistrict}
            >
              {selectedDistrict}
            </span>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;