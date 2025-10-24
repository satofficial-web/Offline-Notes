export enum NoteMode {
  NOTE = 'Note',
  DIARY = 'Diary',
  TASK = 'Task',
  THESIS = 'Thesis',
  LEDGER = 'Ledger',
}

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  mode: NoteMode;
  createdAt: number;
  updatedAt: number;
}

// Kept for migrating old data
export interface LedgerItem {
  id:string;
  description: string;
  quantity: number | string;
  price: number | string;
  operation: '+' | '-';
}

// New dynamic ledger format
export interface LedgerRow {
  id: string;
  data: string[];
}

export interface LedgerData {
  headers: string[];
  rows: LedgerRow[];
  sumColumnIndices: number[];
}