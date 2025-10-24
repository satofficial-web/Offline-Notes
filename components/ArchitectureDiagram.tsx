import React from 'react';

const DiagramBox: React.FC<{ title: string; icon: React.ReactNode; items: string[] }> = ({ title, icon, items }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 w-full flex items-start space-x-4">
    <div className="flex-shrink-0 w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{title}</h3>
      <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  </div>
);

const Arrow: React.FC = () => (
  <div className="flex justify-center items-center my-2">
    <svg className="w-6 h-6 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  </div>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const LogicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const StorageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
);
const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto my-4">
      <div className="flex flex-col items-center">
        <DiagramBox
          title="User Interface & Editor"
          icon={<UserIcon />}
          items={[
            "Dashboard with notes list & search",
            "Mode selection (Diary, Task, etc.)",
            "Rich text editor with auto-save",
          ]}
        />
        <Arrow />
        <DiagramBox
          title="Business Logic Layer"
          icon={<LogicIcon />}
          items={[
            "Create, Edit, Delete notes",
            "Manage tags and folders",
            "Calculate stats like word count",
          ]}
        />
        <Arrow />
        <DiagramBox
          title="Local Storage Layer"
          icon={<StorageIcon />}
          items={[
            "All data saved in IndexedDB (in-browser)",
            "Fully functional offline",
            "Data persists until you clear browser data",
          ]}
        />
        <Arrow />
        <DiagramBox
          title="Export & Backup"
          icon={<ExportIcon />}
          items={[
            "User-controlled export to PDF or Markdown",
            "Backup files can be saved anywhere",
            "No cloud server involved for your data",
          ]}
        />
      </div>
    </div>
  );
};