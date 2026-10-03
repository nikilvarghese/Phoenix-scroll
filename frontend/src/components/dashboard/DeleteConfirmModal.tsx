import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-paper-bg rounded-2xl p-5 sm:p-6 max-w-md w-full border border-paper-border shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center space-x-3 text-red-700">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-playfair text-xl font-bold text-stone-900">{title}</h3>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed font-sans">{message}</p>

        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 px-4 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-1.5 shadow-sm transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
