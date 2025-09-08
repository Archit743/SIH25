import React from 'react';

const Input = ({ label, value, onChange }) => {
  return (
    <div className="mb-4">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="border p-2 w-full"
      />
    </div>
  );
};

export default Input;