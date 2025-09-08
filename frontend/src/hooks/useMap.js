import { getSpatialData } from '../services/mapService';

const useMap = () => {
  const fetchSpatialData = async () => {
    return getSpatialData();
  };

  return { fetchSpatialData };
};

export default useMap;