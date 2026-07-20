import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorState = ({ message = 'An error occurred while fetching cluster resource data.', onRetry }) => {
  return (
    <div className="bg-white border border-red-200 rounded p-8 text-center shadow-sm max-w-lg mx-auto my-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Resource</h3>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-k8s-blue hover:bg-blue-600 text-white font-medium rounded text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Request
        </button>
      )}
    </div>
  );
};

export const EmptyState = ({ title = 'No resources found', message = 'There are no items matching this criteria.' }) => {
  return (
    <div className="bg-white border border-gray-200 rounded p-12 text-center shadow-sm">
      <div className="text-gray-400 mb-4 text-3xl">📭</div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">{message}</p>
    </div>
  );
};
