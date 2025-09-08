import React from 'react';

const StatsCard = ({ title, value }) => {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold">{title}</h3>
      <p>{value}</p>
    </div>
  );
};

export default StatsCard;