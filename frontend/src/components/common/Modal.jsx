import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded">
        {children}
        <button onClick={onClose} className="mt-4 bg-red-500 text-white px-2 py-1">Close</button>
      </div>
    </div>
  );
};

export default Modal;