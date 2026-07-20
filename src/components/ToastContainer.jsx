import React from 'react';
import { useToast } from '../context/ToastContext';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bgColor = 'bg-white border-blue-500';
        let textColor = 'text-blue-800';
        let Icon = Info;

        if (toast.type === 'success') {
          bgColor = 'bg-green-50 border-green-500';
          textColor = 'text-green-800';
          Icon = CheckCircle;
        } else if (toast.type === 'warning') {
          bgColor = 'bg-yellow-50 border-yellow-500';
          textColor = 'text-yellow-800';
          Icon = AlertCircle;
        } else if (toast.type === 'error') {
          bgColor = 'bg-red-50 border-red-500';
          textColor = 'text-red-800';
          Icon = XCircle;
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start p-4 rounded border-l-4 shadow-md ${bgColor} pointer-events-auto transition-all duration-300 transform translate-y-0`}
          >
            <div className="flex-shrink-0 mr-3">
              <Icon className={`w-5 h-5 ${textColor}`} />
            </div>
            <div className="flex-1 text-sm font-medium pr-4 break-words">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
