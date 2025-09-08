import { mockClaims } from '../data/mockSpatialData';
import L from 'leaflet';

export const getSpatialData = () => {
  console.log('getSpatialData: mockClaims=', mockClaims);
  if (!mockClaims || !mockClaims.features) {
    console.error('Error: mockClaims is undefined or invalid');
    return { claims: { type: 'FeatureCollection', features: [] } };
  }
  return {
    claims: mockClaims
  };
};

export const getMockBounds = (searchTerm) => {
  console.log('getMockBounds called with:', searchTerm);
  const lowerTerm = searchTerm.toLowerCase();
  const bounds = {
    'madhya pradesh': L.latLngBounds([[21, 74], [26, 83]]),
    'tripura': L.latLngBounds([[23, 91], [24.5, 92.5]]),
    'odisha': L.latLngBounds([[17.5, 81], [22.5, 87]]),
    'telangana': L.latLngBounds([[15.5, 77], [19.5, 81]]),
    'bhopal': L.latLngBounds([[22.5, 77.5], [23.5, 78.5]]),
    'indore': L.latLngBounds([[22.0, 75.5], [23.0, 76.5]]),
    'agartala': L.latLngBounds([[23.5, 91.0], [24.0, 91.5]]),
    'dhalai': L.latLngBounds([[23.5, 91.5], [24.0, 92.0]]),
    'bhubaneswar': L.latLngBounds([[20.0, 85.0], [20.5, 85.5]]),
    'hyderabad': L.latLngBounds([[17.0, 78.0], [17.5, 78.5]]),
    'village a': L.latLngBounds([[22.675, 77.675], [23.125, 78.125]]),
    'village b': L.latLngBounds([[22.175, 75.675], [22.625, 76.125]]),
    'village c': L.latLngBounds([[23.525, 91.025], [23.975, 91.475]]),
    'village d': L.latLngBounds([[23.525, 91.525], [23.975, 91.975]]),
    'village e': L.latLngBounds([[20.025, 85.025], [20.475, 85.475]]),
    'village f': L.latLngBounds([[17.025, 78.025], [17.475, 78.475]])
  };
  const result = bounds[lowerTerm] || L.latLngBounds([[20.5937, 78.9629], [20.5937, 78.9629]]);
  console.log('getMockBounds result:', result);
  return result;
};

export const getSchemeRecommendations = (feature) => {
  const props = feature.properties;
  const recommendations = [];
  if (props.status === 'Approved' || props.featureType === 'Agricultural') {
    recommendations.push('PM-KISAN');
  }
  if (props.density < 0.5 || props.featureType === 'Water') {
    recommendations.push('Jal Jeevan Mission');
  }
  if ((props.featureType === 'CR' || props.featureType === 'CFR') && 
      (props.status === 'Approved' || props.status === 'Pending')) {
    recommendations.push('MGNREGA');
  }
  if (props.tribalGroup) {
    recommendations.push('DAJGUA');
  }
  return recommendations.length > 0 ? recommendations : ['None'];
};