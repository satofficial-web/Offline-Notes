import React, { useState, useEffect } from 'react';
import { NoteMode } from '../types';
import { CloseIcon, PlusIcon } from './Icons';

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, mode: NoteMode) => void;
  mode: NoteMode;
  setMode: (mode: NoteMode) => void;
}

export const NewNoteModal: React.FC<NewNoteModalProps> = ({ isOpen, onClose, onCreate, mode, setMode }) => {
  const [title, setTitle] = useState('Untitled Note');

  useEffect(() => {
    if (isOpen) {
      setTitle('Untitled Note');
    }
  }, [isOpen]);

  const handleCreate = () => {
    onCreate(title, mode);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-100 dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Note</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <CloseIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          <div>
            <label htmlFor="note-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="note-mode-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note Mode</label>
            <select
              id="note-mode-select"
              value={mode}
              onChange={(e) => setMode(e.target.value as NoteMode)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(NoteMode).map(modeValue => (
                <option key={modeValue} value={modeValue}>{modeValue}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="p-4 bg-gray-200/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleCreate}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create
          </button>
        </div>
      </div>
    </div>
  );
};