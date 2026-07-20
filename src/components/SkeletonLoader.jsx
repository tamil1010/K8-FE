import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white p-6 rounded border border-gray-200 shadow-sm animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-3 flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
      </div>
      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden animate-pulse">
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex gap-4">
      {Array.from({ length: cols }).map((_, idx) => (
        <div key={idx} className="h-4 bg-gray-200 rounded flex-1"></div>
      ))}
    </div>
    <div className="divide-y divide-gray-100 px-6">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="py-4 flex gap-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div key={cIdx} className="h-3 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white p-6 rounded border border-gray-200 shadow-sm animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
    <div className="h-64 bg-gray-100 rounded w-full flex items-end justify-between p-4 gap-2">
      {Array.from({ length: 12 }).map((_, idx) => (
        <div
          key={idx}
          className="bg-gray-200 rounded-t flex-1"
          style={{ height: `${Math.floor(Math.random() * 60) + 20}%` }}
        ></div>
      ))}
    </div>
  </div>
);
