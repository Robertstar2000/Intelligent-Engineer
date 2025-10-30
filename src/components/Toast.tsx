import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ToastMessage } from '../types';

export const Toast = ({ toast, onClose }: { toast: ToastMessage | null, onClose: () => void }) => {
  if (!toast) return null;

  const typeClasses = {
      success: 'text-green-500 bg-green-100 dark:bg-green-800 dark:text-green-200',
      error: 'text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200',
      info: 'text-blue-500 bg-blue-100 dark:bg-blue-800 dark:text-blue-200'
  }
  const icon = {
      success: <CheckCircle className="w-5 h-5" />,
      error: <XCircle className="w-5 h-5" />,
      info: <AlertTriangle className="w-5 h-5" />
  }

  return (
    <div className={`fixed top-5 right-5 flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse divide-x rtl:divide-x-reverse rounded-lg shadow-lg text-gray-400 bg-white dark:text-gray-400 dark:bg-charcoal-800 space-x-3 divide-gray-200 dark:divide-charcoal-700 z-[101]`} role="alert">
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${typeClasses[toast.type]} rounded-lg`}>
        {icon[toast.type]}
      </div>
      <div className="ps-4 text-sm font-normal text-gray-600 dark:text-gray-300">{toast.message}</div>
      <button type="button" onClick={onClose} className="p-1.5 -m-1.5 ms-auto inline-flex items-center justify-center text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-white dark:bg-charcoal-800 dark:hover:bg-charcoal-700" aria-label="Close">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
