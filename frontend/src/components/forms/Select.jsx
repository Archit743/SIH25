import React from 'react';

const Select = ({ label, options, value, onChange }) => {
  return (
    <div className="mb-4">
      <label>{label}</label>
      <select value={value} onChange={onChange} className="border p-2 w-full">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

export default Select;