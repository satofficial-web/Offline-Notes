import { openDB } from 'idb';
import type { Note } from '../types';

const DB_NAME = 'OfflineNotesDB';
const STORE_NAME = 'notes';

export async function backupDatabase() {
  try {
    const db = await openDB(DB_NAME, 1);
    const allNotes = await db.getAll(STORE_NAME);
    const blob = new Blob([JSON.stringify(allNotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.href = url;
    a.download = `sat18_notes_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Backup failed:", error);
    alert("Backup failed. See console for details.");
  }
}

export async function restoreDatabase(file: File): Promise<void> {
    const text = await file.text();
    const notesToRestore = JSON.parse(text) as Note[];

    if (!Array.isArray(notesToRestore)) {
        throw new Error("Invalid backup file format: not an array.");
    }

    const db = await openDB(DB_NAME, 1);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await store.clear();

    // Use Promise.all for more efficient bulk insertion
    await Promise.all(
        notesToRestore.map(note => {
            // The backup might contain 'id', which we need to remove for auto-increment to work
            const { id, ...noteWithoutId } = note;
            return store.add(noteWithoutId as Note);
        })
    );

    await tx.done;
}
