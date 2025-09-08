import React from 'react';
import StatsCard from '../../components/dashboard/StatsCard';

const Dashboard = () => {
  // Placeholder boilerplate
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatsCard title="Total FRA Claims" value="Placeholder: 5000" />
      <StatsCard title="Granted Pattas" value="Placeholder: 3000" />
      <StatsCard title="Focused States" value="MP, Tripura, Odisha, Telangana" />
      <StatsCard title="System Status" value="Operational" />
    </div>
  );
};

export default Dashboard;