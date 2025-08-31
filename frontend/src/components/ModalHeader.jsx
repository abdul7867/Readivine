import React from 'react';

const ModalHeader = ({ selectedRepo, onClose }) => {
  return (
    <div className="bg-gradient-to-r from-amber-100/60 via-yellow-100/40 to-orange-100/60 p-8 rounded-t-3xl border-b border-amber-300/20 shrink-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-amber-800">{selectedRepo}</h2>
            <p className="text-amber-600 text-sm mt-1">Edit your README</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-amber-200/50 hover:bg-amber-300 text-amber-700 hover:text-amber-800 rounded-2xl flex items-center justify-center transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ModalHeader;