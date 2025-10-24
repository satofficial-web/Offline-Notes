import { useState, useEffect, useCallback } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Note } from '../types';
import { NoteMode } from '../types';

const DB_NAME = 'OfflineNotesDB';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

interface NotesDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: Note;
    indexes: { 'updatedAt': number };
  };
}

let dbPromise: Promise<IDBPDatabase<NotesDB>> | null = null;

const getDb = (): Promise<IDBPDatabase<NotesDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<NotesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('updatedAt', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
};

export const useNotesDB = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const db = await getDb();
      const allNotes = await db.getAllFromIndex(STORE_NAME, 'updatedAt');
      setNotes(allNotes.reverse());
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (
    title: string,
    mode: NoteMode,
    content: string = ''
  ): Promise<number | undefined> => {
    try {
      const db = await getDb();
      const now = Date.now();
      const newNoteData = {
        title,
        content,
        tags: [],
        mode,
        createdAt: now,
        updatedAt: now,
      };
      const id = await db.add(STORE_NAME, newNoteData as Note);
      const newNoteWithId: Note = { ...newNoteData, id: id as number };
      
      // Optimistically add to state, at the top of the list
      setNotes(prevNotes => [newNoteWithId, ...prevNotes]);
      
      return id as number;
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  };

  const updateNote = async (note: Note) => {
    try {
      const db = await getDb();
      const updatedNoteWithTimestamp = { ...note, updatedAt: Date.now() };
      await db.put(STORE_NAME, updatedNoteWithTimestamp);
      
      // Optimistically update the note in state and re-sort
      setNotes(prevNotes => {
        const index = prevNotes.findIndex(n => n.id === note.id);
        if (index === -1) {
            return prevNotes;
        }
        
        const newNotes = [...prevNotes];
        newNotes[index] = updatedNoteWithTimestamp;
        // The list is sorted by updatedAt descending. Re-sort.
        return newNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      });
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      const db = await getDb();
      await db.delete(STORE_NAME, id);
      // Optimistically remove from state
      setNotes(prevNotes => prevNotes.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  return { notes, loading, addNote, updateNote, deleteNote, fetchNotes };
};