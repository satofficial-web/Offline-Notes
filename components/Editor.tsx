import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Note, LedgerData, LedgerRow, LedgerItem } from '../types';
import { NoteMode } from '../types';
import { TrashIcon, MarkdownIcon, PdfIcon, WordIcon, PlusIcon, CloseIcon, ChevronLeftIcon, PencilIcon } from './Icons';
import { exportToMarkdown, exportToPdf, exportToWord } from '../services/exportService';
import { ConfirmModal } from './ConfirmModal';

declare const Quill: any;

interface EditorProps {
  note: Note | null;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: number) => void;
  onBack: () => void;
}

const getDefaultLedgerData = (): LedgerData => ({
    headers: ['Tgl', 'Nama', 'Transport', 'Hasil Kerja', 'Keterangan'],
    rows: [{ id: Date.now().toString(), data: [new Date().toISOString().split('T')[0], '', '', '', ''] }],
    sumColumnIndices: [2, 3],
});

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

export const Editor: React.FC<EditorProps> = ({ note, onUpdateNote, onDeleteNote, onBack }) => {
  const [currentNote, setCurrentNote] = useState<Note | null>(note);
  const [tagsInput, setTagsInput] = useState<string>('');
  const [ledgerData, setLedgerData] = useState<LedgerData>(getDefaultLedgerData());
  const [editingHeaderIndex, setEditingHeaderIndex] = useState<number | null>(null);
  const [columnToDelete, setColumnToDelete] = useState<number | null>(null);


  const quillRef = useRef<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const loadedNoteIdRef = useRef<number | null>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  const debouncedNote = useDebounce(currentNote, 1000);

  // Effect for auto-saving the debounced note
  useEffect(() => {
    if (debouncedNote && note && debouncedNote.id === note.id) {
        const hasChanged = 
            debouncedNote.content !== note.content ||
            debouncedNote.title !== note.title ||
            debouncedNote.mode !== note.mode ||
            JSON.stringify(debouncedNote.tags) !== JSON.stringify(note.tags);

        if (hasChanged) {
            onUpdateNote(debouncedNote);
        }
    }
  }, [debouncedNote, note, onUpdateNote]);
  
  // Effect to load a new note from props into the local state
  useEffect(() => {
    if (note && note.id !== loadedNoteIdRef.current) {
        setCurrentNote(note);
        setTagsInput(note.tags.join(', '));
        loadedNoteIdRef.current = note.id;
    } else if (!note) {
        loadedNoteIdRef.current = null;
    }
  }, [note]);

  // Effect to manage the UI (Quill vs. Ledger) based on the current note's mode
  useEffect(() => {
    if (!currentNote) return;

    if (currentNote.mode === NoteMode.LEDGER) {
        if (quillRef.current) quillRef.current.disable();
        
        try {
            const parsedContent = JSON.parse(currentNote.content || 'null');
            let dataToSet: LedgerData | null = null;
            let needsUpdate = false;
            
            if (!parsedContent) {
                dataToSet = getDefaultLedgerData();
                needsUpdate = true;
            } else if ('headers' in parsedContent && 'rows' in parsedContent) {
                dataToSet = parsedContent as LedgerData;
                 if ('sumColumnIndex' in parsedContent) {
                    const oldData = parsedContent as any;
                    dataToSet.sumColumnIndices = oldData.sumColumnIndex !== null ? [oldData.sumColumnIndex] : [];
                    delete (dataToSet as any).sumColumnIndex;
                    needsUpdate = true;
                }
                if (!dataToSet.sumColumnIndices) {
                    dataToSet.sumColumnIndices = [];
                }
            } else if (Array.isArray(parsedContent)) {
                const oldItems = parsedContent as LedgerItem[];
                const newHeaders = ['Description', 'Value'];
                const newRows: LedgerRow[] = oldItems.map((item: any, index) => {
                    const quantity = parseFloat(String(item.quantity)) || 1;
                    const price = parseFloat(String(item.price)) || 0;
                    const value = (item.operation === '-' ? -1 : 1) * quantity * price;
                    return { id: item.id || `${Date.now()}-${index}`, data: [item.description || item.label || '', value.toString()] };
                });
                dataToSet = { headers: newHeaders, rows: newRows, sumColumnIndices: [1] };
                needsUpdate = true;
            }

            if(dataToSet) {
                setLedgerData(dataToSet);
                if (needsUpdate) {
                    setCurrentNote(prev => prev ? { ...prev, content: JSON.stringify(dataToSet) } : null);
                }
            } else {
                 const defaultData = getDefaultLedgerData();
                 setLedgerData(defaultData);
                 setCurrentNote(prev => prev ? { ...prev, content: JSON.stringify(defaultData) } : null);
            }
        } catch (e) {
            console.error("Failed to parse ledger data, resetting to default:", e);
            const defaultData = getDefaultLedgerData();
            setLedgerData(defaultData);
            setCurrentNote(prev => prev ? { ...prev, content: JSON.stringify(defaultData) } : null);
        }
    } else { // Text-based modes
        if (editorRef.current && !quillRef.current) {
            const toolbarOptions = [
              [{ 'font': ['', 'serif', 'monospace'] }, { 'size': ['small', false, 'large', 'huge'] }],
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'align': [] }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
              ['link', 'image'],
              ['clean']
            ];
            const Font = Quill.import('formats/font');
            Font.whitelist = ['serif', 'monospace'];
            Quill.register(Font, true);
            quillRef.current = new Quill(editorRef.current, {
                theme: 'snow',
                modules: { toolbar: toolbarOptions },
                placeholder: 'Start writing...',
            });
            quillRef.current.on('text-change', (delta: any, oldDelta: any, source: string) => {
                if (source === 'user') {
                    const content = quillRef.current.root.innerHTML;
                    setCurrentNote(prev => {
                        if (!prev) return null;
                        const newContent = content === '<p><br></p>' ? '' : content;
                        if (prev.content === newContent) return prev;
                        return { ...prev, content: newContent };
                    });
                }
            });
        }
        if (quillRef.current) {
            quillRef.current.enable();
            let contentToSet = currentNote.content;
            try {
                if (contentToSet.trim().startsWith('{')) {
                    JSON.parse(contentToSet);
                    contentToSet = '';
                    setCurrentNote(prev => prev ? { ...prev, content: '' } : null);
                }
            } catch (e) { /* Not JSON, do nothing */ }
            if (quillRef.current.root.innerHTML !== contentToSet) {
                 quillRef.current.root.innerHTML = contentToSet;
            }
        }
    }
  }, [currentNote?.id, currentNote?.mode]);

    useEffect(() => {
        if (editingHeaderIndex !== null && headerInputRef.current) {
            headerInputRef.current.focus();
        }
    }, [editingHeaderIndex]);

  useEffect(() => {
    if (currentNote?.mode === NoteMode.LEDGER) {
      const newContent = JSON.stringify(ledgerData);
      if (newContent !== currentNote.content) {
        setCurrentNote(prev => prev ? { ...prev, content: newContent } : null);
      }
    }
  }, [ledgerData, currentNote?.mode]);


  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentNote) setCurrentNote({ ...currentNote, title: e.target.value });
  };
  
  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (currentNote) setCurrentNote({ ...currentNote, mode: e.target.value as NoteMode });
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    if (currentNote) {
        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
        setCurrentNote({ ...currentNote, tags });
    }
  };
  
  const handleDelete = () => { if (note) onDeleteNote(note.id); };

  // --- Ledger Dynamic Table Handlers ---
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setLedgerData(prev => ({
        ...prev,
        rows: prev.rows.map((row, rIdx) => {
            if (rIdx !== rowIndex) return row;
            const newData = [...row.data];
            newData[colIndex] = value;
            return { ...row, data: newData };
        })
    }));
  };

  const handleAddRow = () => {
    const newRowData = Array(ledgerData.headers.length).fill('');
    if (ledgerData.headers.length > 0) {
        newRowData[0] = new Date().toISOString().split('T')[0];
    }
    setLedgerData(prev => ({
        ...prev,
        rows: [...prev.rows, { id: Date.now().toString(), data: newRowData }]
    }));
  };

  const handleRemoveRow = (id: string) => {
    setLedgerData(prev => ({ ...prev, rows: prev.rows.filter(row => row.id !== id) }));
  };
  
  const handleHeaderEditStart = (index: number) => {
    setEditingHeaderIndex(index);
  };
  
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (editingHeaderIndex === null) return;
      const newHeaders = [...ledgerData.headers];
      newHeaders[editingHeaderIndex] = e.target.value;
      setLedgerData(prev => ({ ...prev, headers: newHeaders }));
  };

  const handleHeaderUpdate = () => {
      setEditingHeaderIndex(null);
  };


  const handleAddColumn = () => {
      const newHeader = prompt("Enter new column name:", `Column ${ledgerData.headers.length + 1}`);
      if (newHeader) {
          setLedgerData(prev => ({
              ...prev,
              headers: [...prev.headers, newHeader],
              rows: prev.rows.map(row => ({...row, data: [...row.data, '']}))
          }));
      }
  };

  const handleRemoveColumn = (colIndex: number) => {
    setColumnToDelete(colIndex);
  };

  const confirmRemoveColumn = () => {
    if (columnToDelete === null) return;
    
    setLedgerData(prev => {
        const newHeaders = prev.headers.filter((_, i) => i !== columnToDelete);
        const newRows = prev.rows.map(row => ({
            ...row,
            data: row.data.filter((_, i) => i !== columnToDelete)
        }));
        const newSumColumnIndices = prev.sumColumnIndices
          .filter(i => i !== columnToDelete)
          .map(i => i > columnToDelete ? i - 1 : i);

        return { headers: newHeaders, rows: newRows, sumColumnIndices: newSumColumnIndices };
    });
    
    setColumnToDelete(null);
  };


  const handleToggleSumColumn = (colIndex: number) => {
      setLedgerData(prev => {
          const newSumIndices = prev.sumColumnIndices.includes(colIndex)
            ? prev.sumColumnIndices.filter(i => i !== colIndex)
            : [...prev.sumColumnIndices, colIndex];
          return { ...prev, sumColumnIndices: newSumIndices };
      });
  };

  const ledgerTotals = useMemo(() => {
    if (!ledgerData.sumColumnIndices.length) return [];
    return ledgerData.sumColumnIndices.map(colIndex => {
        const total = ledgerData.rows.reduce((acc, row) => {
            const value = parseFloat(row.data[colIndex] || '0');
            return acc + (isNaN(value) ? 0 : value);
        }, 0);
        return { index: colIndex, total };
    });
  }, [ledgerData]);

  const wordCount = useMemo(() => {
    if (!currentNote?.content || currentNote.mode === NoteMode.LEDGER) return 0;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = currentNote.content;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [currentNote?.content, currentNote?.mode]);

  if (!note || !currentNote) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
        <h2 className="text-2xl">Select a note to start editing</h2>
        <p>Or create a new one from the sidebar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full flex flex-col bg-white dark:bg-slate-800 editor-container">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center flex-grow min-w-0">
            <button onClick={onBack} title="Back to list" className="md:hidden p-2 mr-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <input
              type="text"
              value={currentNote.title}
              onChange={handleTitleChange}
              className="bg-transparent text-3xl font-bold focus:outline-none flex-grow text-slate-900 dark:text-white truncate"
              placeholder="Note Title"
            />
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={() => exportToMarkdown(note)} title="Export to Markdown" className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><MarkdownIcon className="h-5 w-5"/></button>
            <button onClick={() => exportToPdf(note)} title="Export to PDF" className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><PdfIcon className="h-5 w-5"/></button>
            <button onClick={() => exportToWord(note)} title="Export to Word" className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><WordIcon className="h-5 w-5"/></button>
            <button onClick={handleDelete} title="Delete Note" className="p-2 rounded-md hover:bg-red-500/10 dark:hover:bg-red-800/50 text-red-500 transition-colors"><TrashIcon className="h-5 w-5"/></button>
          </div>
        </div>

        <div className="p-2.5 flex items-center space-x-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm">
          <div className="flex items-center">
              <label htmlFor="note-mode" className="mr-2 text-slate-600 dark:text-slate-400 font-medium">Mode:</label>
              <select
                  id="note-mode"
                  value={currentNote.mode}
                  onChange={handleModeChange}
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                  {Object.values(NoteMode).map(modeValue => (
                      <option key={modeValue} value={modeValue}>{modeValue}</option>
                  ))}
              </select>
          </div>
          <div className="flex items-center flex-grow">
              <label htmlFor="note-tags" className="mr-2 text-slate-600 dark:text-slate-400 font-medium">Tags:</label>
              <input
                  id="note-tags"
                  type="text"
                  value={tagsInput}
                  onChange={handleTagsChange}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tag1, tag2, ..."
              />
          </div>
        </div>
        
        {currentNote.mode === NoteMode.LEDGER ? (
          <div className="flex-grow p-2 sm:p-4 md:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
              <div className="max-w-full">
                  <div className="overflow-x-auto relative shadow-md sm:rounded-lg border dark:border-slate-700">
                      <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                          <thead className="text-xs text-slate-700 uppercase bg-slate-200 dark:bg-slate-700 dark:text-slate-400">
                              <tr>
                                  {ledgerData.headers.map((header, colIndex) => (
                                      <th key={colIndex} scope="col" className="py-3 px-4 group whitespace-nowrap">
                                          <div className="flex items-center justify-between">
                                              {editingHeaderIndex === colIndex ? (
                                                  <input
                                                      ref={headerInputRef}
                                                      type="text"
                                                      value={header}
                                                      onChange={handleHeaderChange}
                                                      onBlur={handleHeaderUpdate}
                                                      onKeyDown={(e) => e.key === 'Enter' && handleHeaderUpdate()}
                                                      className="w-full min-w-[150px] px-2 py-1 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-blue-500 rounded shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                                                  />
                                              ) : (
                                                <div className="flex items-center min-w-0">
                                                    <span
                                                        className={`truncate cursor-pointer hover:text-blue-500 ${ledgerData.sumColumnIndices.includes(colIndex) ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}
                                                        onClick={() => handleToggleSumColumn(colIndex)}
                                                        title={`Click to toggle sum for "${header}"`}
                                                    >
                                                        {header}
                                                        {ledgerData.sumColumnIndices.includes(colIndex) && ' (∑)'}
                                                    </span>
                                                    <button 
                                                        onClick={() => handleHeaderEditStart(colIndex)} 
                                                        className="ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-600 transition-opacity flex-shrink-0"
                                                        title="Rename column"
                                                    >
                                                        <PencilIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                                    </button>
                                                </div>
                                              )}
                                              <button onClick={() => handleRemoveColumn(colIndex)} className="opacity-0 group-hover:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity" title="Delete Column">
                                                  <CloseIcon className="w-3 h-3"/>
                                              </button>
                                          </div>
                                      </th>
                                  ))}
                                  <th scope="col" className="py-3 px-2 w-20 text-center">
                                      <button onClick={handleAddColumn} className="font-bold text-lg hover:text-blue-500" title="Add New Column">+</button>
                                  </th>
                              </tr>
                          </thead>
                          <tbody>
                              {ledgerData.rows.map((row, rowIndex) => (
                                  <tr key={row.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                      {row.data.map((cell, colIndex) => (
                                          <td className="px-2 py-1" key={colIndex}>
                                              <input
                                                  type="text"
                                                  value={cell}
                                                  onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                  className={`w-full bg-transparent dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-sm px-2 py-1 ${ledgerData.sumColumnIndices.includes(colIndex) ? 'text-right' : ''}`}
                                                  placeholder="..."
                                              />
                                          </td>
                                      ))}
                                      <td className="px-2 py-1 text-center">
                                          <button onClick={() => handleRemoveRow(row.id)} title="Remove Row" className="p-2 rounded-md text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-colors">
                                              <TrashIcon className="h-5 w-5"/>
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                   <button onClick={handleAddRow} className="mt-4 flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors text-sm">
                      <PlusIcon className="h-4 w-4" />
                      <span>Add Row</span>
                   </button>

                   {ledgerTotals.length > 0 && (
                       <div className="mt-6 pt-4 border-t-2 border-slate-300 dark:border-slate-700 flex justify-end items-center flex-wrap gap-x-8 gap-y-2">
                          {ledgerTotals.map(({ index, total }) => (
                              <div key={index} className="text-right">
                                  <span className="text-md font-medium text-slate-600 dark:text-slate-400">Total {ledgerData.headers[index]}:</span>
                                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>
                          ))}
                       </div>
                   )}
              </div>
          </div>
        ) : (
          <div className="flex-grow relative" style={{ height: '0' }}>
              <div ref={editorRef} className="h-full w-full"></div>
          </div>
        )}

        <div className="p-2 border-t border-slate-200 dark:border-slate-700 text-right text-sm text-slate-500 dark:text-slate-500">
          {currentNote.mode === NoteMode.LEDGER ? (
              <span>Total Rows: {ledgerData.rows.length}</span>
          ) : (
              <span>Word Count: {wordCount}</span>
          )}
          | <span>Last updated: {new Date(note.updatedAt).toLocaleString()}</span>
        </div>
        <style>{`
          .editor-container .ql-toolbar {
            background: #f8fafc; /* slate-50 */
            border-top: none !important;
            border-left: none !important;
            border-right: none !important;
            border-bottom: 1px solid #e2e8f0 !important; /* slate-200 */
            padding: 12px 8px !important;
          }
          .dark .editor-container .ql-toolbar {
            background: #1e293b; /* slate-800 */
            border-bottom: 1px solid #334155 !important; /* slate-700 */
          }
          .dark .editor-container .ql-toolbar .ql-stroke,
          .dark .editor-container .ql-toolbar .ql-picker-label {
            stroke: #cbd5e1; /* slate-300 */
            color: #cbd5e1; /* slate-300 */
          }
          .dark .editor-container .ql-toolbar .ql-fill {
              fill: #cbd5e1; /* slate-300 */
          }
          .dark .editor-container .ql-snow .ql-picker-options {
              background-color: #334155; /* slate-700 */
              border-color: #475569 !important;
          }
          .dark .editor-container .ql-snow .ql-picker-item:hover {
              background-color: #475569;
          }
          .dark .editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-selected {
              background-color: #64748b !important;
          }
          .dark .editor-container .ql-snow.ql-toolbar button:hover,
          .dark .editor-container .ql-snow.ql-toolbar .ql-picker-label:hover {
              background-color: #334155;
          }

          .editor-container .ql-container {
            border: none !important;
            font-size: 1rem;
            line-height: 1.75;
            color: #1e293b; /* slate-800 */
          }
          .dark .editor-container .ql-container {
              color: #cbd5e1; /* slate-300 */
              background-color: #1e293b; /* slate-800 */
          }
          .editor-container .ql-editor {
            padding: 1.5rem;
          }
          .editor-container .ql-editor.ql-blank::before {
              color: rgba(100, 116, 139, 0.7);
              font-style: normal;
          }
          .dark .editor-container .ql-editor.ql-blank::before {
              color: rgba(148, 163, 184, 0.5);
          }
        `}</style>
      </div>

      <ConfirmModal
        isOpen={columnToDelete !== null}
        onClose={() => setColumnToDelete(null)}
        onConfirm={confirmRemoveColumn}
        title="Delete Column"
        message={`Are you sure you want to delete the "${columnToDelete !== null && ledgerData.headers[columnToDelete] ? ledgerData.headers[columnToDelete] : ''}" column and all its data?`}
        confirmText="Delete"
      />
    </>
  );
};
