import React, { useState, useEffect } from 'react';
import { useNotesDB } from './hooks/useNotesDB';
import type { Note } from './types';
import { NoteMode } from './types';
import { NoteList } from './components/NoteList';
import { Editor } from './components/Editor';
import { Dashboard } from './components/Dashboard';
import { NewNoteModal } from './components/NewNoteModal';
import { AboutModal } from './components/AboutModal';
import { ConfirmModal } from './components/ConfirmModal';
import { BackupModal } from './components/BackupModal';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { restoreDatabase } from './services/backupService';
import { InfoIcon, MoonIcon, SunIcon } from './components/Icons';

type View = 'editor' | 'dashboard' | 'architecture';

const App: React.FC = () => {
  const { notes, loading, addNote, updateNote, deleteNote, fetchNotes } = useNotesDB();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [newNoteMode, setNewNoteMode] = useState<NoteMode>(NoteMode.NOTE);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [fileToRestore, setFileToRestore] = useState<File | null>(null);
  const [noteToDeleteId, setNoteToDeleteId] = useState<number | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setView('editor');
    if (window.innerWidth < 768) {
      setIsMobileListVisible(false);
    }
  };

  const handleCreateNote = async (title: string, mode: NoteMode) => {
    const newNoteId = await addNote(title, mode);
    if (newNoteId) {
      // After adding, refetch to get the full note object and then select it.
      // This is safer than constructing it manually if the DB adds more defaults.
      await fetchNotes(); 
      // The hook will update `notes`, so we find it in the next render cycle.
    }
    setIsNewNoteModalOpen(false);
  };
  
  // Effect to select the new note after it appears in the `notes` state
  useEffect(() => {
      if(notes.length > 0 && !selectedNote) {
        const latestNote = notes[0]; // notes are sorted by updatedAt descending
        if(Date.now() - latestNote.createdAt < 2000) { // crude check for a "new" note
             handleSelectNote(latestNote);
        }
      }
  }, [notes]);


  const handleUpdateNote = (note: Note) => {
    updateNote(note);
    if(selectedNote && selectedNote.id === note.id) {
        setSelectedNote(note);
    }
  };

  const handleDeleteNote = (id: number) => {
    setNoteToDeleteId(id);
  };
  
  const confirmDeleteNote = () => {
    if (noteToDeleteId) {
      deleteNote(noteToDeleteId);
      if (selectedNote && selectedNote.id === noteToDeleteId) {
        setSelectedNote(null);
        setView('dashboard');
      }
      setNoteToDeleteId(null);
    }
  };

  const handleBackToList = () => {
    setSelectedNote(null);
    setIsMobileListVisible(true);
  }

  const handleRestore = (file: File) => {
    setFileToRestore(file);
    setIsRestoreConfirmOpen(true);
    setIsBackupModalOpen(false);
  };

  const confirmRestore = async () => {
    if (fileToRestore) {
      try {
        await restoreDatabase(fileToRestore);
        alert('Restore successful! The application will now reload.');
        window.location.reload();
      } catch (error) {
        console.error('Restore failed:', error);
        alert(`Restore failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsRestoreConfirmOpen(false);
        setFileToRestore(null);
      }
    }
  };

  useEffect(() => {
    if (!selectedNote && notes.length > 0) {
        // setView('dashboard');
    } else if (notes.length === 0) {
        setView('dashboard');
    }
  }, [selectedNote, notes]);
  
  const mainContent = () => {
    if (view === 'dashboard' && !selectedNote) {
        return <Dashboard notes={notes} />;
    }
    if (view === 'architecture' && !selectedNote) {
        return <ArchitectureDiagram />;
    }
    if (view === 'editor' || selectedNote) {
        return <Editor note={selectedNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} onBack={handleBackToList} />;
    }
    return <Dashboard notes={notes} />;
  }
  

  return (
    <>
      <div className="h-screen w-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        <header className="flex-shrink-0 bg-slate-100 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm z-10">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Offline Notes</h1>
                <nav className="hidden md:flex items-center space-x-4">
                    <button onClick={() => { setSelectedNote(null); setView('dashboard'); }} className={`px-3 py-2 text-sm font-medium rounded-md ${view === 'dashboard' && !selectedNote ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Dashboard</button>
                    <button onClick={() => { setSelectedNote(null); setView('architecture'); }} className={`px-3 py-2 text-sm font-medium rounded-md ${view === 'architecture' && !selectedNote ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Architecture</button>
                </nav>
                <div className="flex items-center space-x-2">
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                    </button>
                    <button onClick={() => setIsAboutModalOpen(true)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <InfoIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>

        <div className="flex-grow flex overflow-hidden">
          <aside className={`w-full md:w-80 flex-shrink-0 ${isMobileListVisible ? 'block' : 'hidden'} md:block`}>
            {loading ? (
                <div className="p-4 text-center">Loading notes...</div>
            ) : (
                <NoteList notes={notes} selectedNoteId={selectedNote?.id || null} onSelectNote={handleSelectNote} onNewNote={() => setIsNewNoteModalOpen(true)} />
            )}
          </aside>
          <main className={`flex-grow ${isMobileListVisible ? 'hidden' : 'block'} md:block min-w-0`}>
            {mainContent()}
          </main>
        </div>
      </div>

      <NewNoteModal 
        isOpen={isNewNoteModalOpen} 
        onClose={() => setIsNewNoteModalOpen(false)} 
        onCreate={handleCreateNote}
        mode={newNoteMode}
        setMode={setNewNoteMode}
      />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} onOpenBackup={() => { setIsAboutModalOpen(false); setIsBackupModalOpen(true); }} />
      <BackupModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} onRestore={handleRestore} />

      <ConfirmModal
        isOpen={isRestoreConfirmOpen}
        onClose={() => setIsRestoreConfirmOpen(false)}
        onConfirm={confirmRestore}
        title="Confirm Restore"
        message="This will replace all your current notes. This action cannot be undone. Are you sure you want to proceed?"
        confirmText="Yes, Restore"
        confirmColor="bg-yellow-600 hover:bg-yellow-700"
      />
      
      <ConfirmModal
        isOpen={noteToDeleteId !== null}
        onClose={() => setNoteToDeleteId(null)}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
      />
    </>
  );
};

export default App;