import React from 'react';

const TemplateSelector = ({ templates, selectedTemplate, onTemplateChange }) => {
  return (
    <div className="bg-gradient-to-r from-amber-100/60 via-yellow-100/40 to-orange-100/60 backdrop-blur-xl rounded-3xl p-8 border border-amber-300/20 shadow-xl">
      <div className="flex items-center space-x-6 mb-6">
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full animate-pulse"></div>
        </div>
        <div>
          <label htmlFor="template-select" className="block text-2xl font-bold text-amber-800">
            Template
          </label>
          <p className="text-amber-700 text-lg">Choose your README style</p>
        </div>
      </div>
      <select
        id="template-select"
        value={selectedTemplate}
        onChange={(e) => onTemplateChange(e.target.value)}
        className="w-full bg-white/80 text-amber-900 p-4 rounded-2xl border-2 border-amber-300/30 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-300 text-lg font-medium shadow-lg"
      >
        {templates.map(template => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TemplateSelector;
