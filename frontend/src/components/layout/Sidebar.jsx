import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-100 p-4">
      <nav>
        <ul>
          <li><Link to="/" className="block py-2">Dashboard</Link></li>
          <li><Link to="/map" className="block py-2">Map View</Link></li>
          {/* Placeholders for other sections */}
          <li><span className="block py-2 text-gray-500">Claims (Placeholder)</span></li>
          <li><span className="block py-2 text-gray-500">Documents (Placeholder)</span></li>
          <li><span className="block py-2 text-gray-500">Analytics (Placeholder)</span></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;