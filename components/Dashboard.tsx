import React, { useMemo } from 'react';
import type { Note } from '../types';
import { StatsChart } from './StatsChart';

interface DashboardProps {
  notes: Note[];
}

export const Dashboard: React.FC<DashboardProps> = ({ notes }) => {
  const totalNotes = notes.length;

  const totalWords = useMemo(() => {
    return notes.reduce((acc, note) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = note.content;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      const words = textContent.trim().split(/\s+/).filter(Boolean);
      return acc + words.length;
    }, 0);
  }, [notes]);

  const avgWords = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;

  return (
    <div className="p-6 bg-white dark:bg-slate-800/50 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Stats</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-md">
          <p className="text-3xl font-bold text-blue-500 dark:text-blue-400">{totalNotes}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Notes</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-md">
          <p className="text-3xl font-bold text-green-500 dark:text-green-400">{totalWords}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Words</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-md">
          <p className="text-3xl font-bold text-purple-500 dark:text-purple-400">{avgWords}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Avg. Words/Note</p>
        </div>
      </div>
      <StatsChart notes={notes} />
    </div>
  );
};