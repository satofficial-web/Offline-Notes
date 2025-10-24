import React, { useState, useMemo } from 'react';
import type { Note } from '../types';
import { NoteMode } from '../types';
import { PlusIcon, SearchIcon } from './Icons';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: number | null;
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
}

const getModeStyles = (mode: NoteMode) => {
  switch (mode) {
    case NoteMode.NOTE: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case NoteMode.DIARY: return 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300';
    case NoteMode.TASK: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case NoteMode.THESIS: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
    case NoteMode.LEDGER: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
  }
};

export const NoteList: React.FC<NoteListProps> = ({ notes, selectedNoteId, onSelectNote, onNewNote }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotes = useMemo(() => {
    if (!searchTerm) return notes;
    const lowercasedTerm = searchTerm.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowercasedTerm) ||
      note.content.toLowerCase().includes(lowercasedTerm) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm))
    );
  }, [notes, searchTerm]);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="p-4 flex-shrink-0">
        <button
          onClick={onNewNote}
          className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Note
        </button>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {filteredNotes.length > 0 ? (
          <ul>
            {filteredNotes.map(note => (
              <li key={note.id}>
                <button
                  onClick={() => onSelectNote(note)}
                  className={`w-full text-left p-4 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors ${
                    selectedNoteId === note.id ? 'bg-slate-200/80 dark:bg-slate-800' : ''
                  }`}
                >
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{note.title || 'Untitled Note'}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getModeStyles(note.mode)}`}>
                      {note.mode}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            <p>{searchTerm ? 'No notes found.' : 'Create your first note!'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
