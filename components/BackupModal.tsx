import React, { useState, useRef } from 'react';
import { CloseIcon, DownloadIcon, UploadIcon } from './Icons';
import { backupDatabase } from '../services/backupService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (file: File) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose, onRestore }) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackupClick = async () => {
    await backupDatabase();
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsRestoring(true);
      onRestore(file);
      // Reset file input so the same file can be selected again
      event.target.value = '';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-100 dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <CloseIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Backup & Restore</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Save all your notes to a single JSON file for safekeeping, or restore your notes from a previously created backup file.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleBackupClick}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              <DownloadIcon className="h-5 w-5" />
              <span>Backup All Notes</span>
            </button>
            <button
              onClick={handleRestoreClick}
              disabled={isRestoring}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              <UploadIcon className="h-5 w-5" />
              <span>{isRestoring ? 'Processing...' : 'Restore from JSON File'}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
           <div className="mt-6 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 p-4 rounded-md text-sm">
            <p><strong className="font-bold">Warning:</strong> Restoring will completely replace all current notes in this browser. This action cannot be undone.</p>
           </div>
        </div>
      </div>
    </div>
  );
};