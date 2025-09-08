import React from 'react';

const PopupContent = ({ feature }) => {
  const { properties } = feature;
  return (
    <div className="claim-popup p-2 max-w-xs">
      <h3 className="text-lg font-bold mb-2">Claim ID: {properties.claimId || 'N/A'}</h3>
      <p className="mb-1"><strong>Type:</strong> {properties.featureType}</p>
      {properties.claimantName && (
        <p className="mb-1"><strong>Claimant:</strong> {properties.claimantName}</p>
      )}
      {properties.description && (
        <p className="mb-1"><strong>Description:</strong> {properties.description}</p>
      )}
      <p className="mb-1">
        <strong>Status:</strong>
        <span
          className={`inline-block px-2 py-1 ml-1 rounded text-sm ${
            properties.status === 'Approved' ? 'bg-green-100 text-green-800' :
            properties.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
            properties.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }`}
        >
          {properties.status || 'N/A'}
        </span>
      </p>
      {properties.dateFiled && (
        <p className="mb-1"><strong>Date Filed:</strong> {properties.dateFiled}</p>
      )}
      <p className="mb-1">
        <strong>Location:</strong> {properties.village || 'N/A'}, {properties.district || 'N/A'}, {properties.state}
      </p>
      <p className="mb-1"><strong>Tribal Group:</strong> {properties.tribalGroup || 'N/A'}</p>
      <p className="mb-1">
        <strong>Eligible Schemes:</strong> {properties.eligibleSchemes ? properties.eligibleSchemes.join(', ') : 'None'}
      </p>
    </div>
  );
};

export default PopupContent;