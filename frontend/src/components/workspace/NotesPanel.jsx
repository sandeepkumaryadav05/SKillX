import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../api/apiClient';

const NotesPanel = ({ workspaceId, initialNotes }) => {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const debounceRef = useRef(null);

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  const saveNotes = useCallback(
    async (content) => {
      try {
        setSaveStatus('saving');
        const res = await apiFetch(`/api/workspace/notes/${workspaceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: content }),
        });
        if (!res.ok) throw new Error('Save failed');
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to save notes', err);
        setSaveStatus('unsaved');
      }
    },
    [workspaceId]
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setNotes(value);
    setSaveStatus('unsaved');

    // Debounce: auto-save after 1.5s of inactivity
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveNotes(value);
    }, 1500);
  };

  const statusLabel = {
    saved: <span className="text-green-500 text-[10px] font-medium">✓ Saved</span>,
    saving: <span className="text-indigo-400 text-[10px] font-medium animate-pulse">Saving...</span>,
    unsaved: <span className="text-gray-400 text-[10px] font-medium">Unsaved</span>,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-[var(--bg-card)]/50">
        <p className="text-xs font-semibold text-gray-600">📝 Collaborative Notes</p>
        {statusLabel[saveStatus]}
      </div>

      {/* Notes textarea */}
      <div className="flex-1 p-4">
        <textarea
          value={notes}
          onChange={handleChange}
          placeholder="Start typing session notes, key learnings, or anything worth remembering...&#10;&#10;• Learn useEffect&#10;• Revise APIs&#10;• Complete Dashboard"
          className="w-full h-full min-h-[300px] resize-none bg-transparent text-sm text-gray-700 placeholder-gray-300 leading-relaxed focus:outline-none"
          style={{ fontFamily: 'inherit' }}
        />
      </div>

      <div className="px-4 py-2 border-t border-gray-100 bg-[var(--bg-card)]/30">
        <p className="text-[10px] text-gray-400">Notes are auto-saved 1.5s after you stop typing.</p>
      </div>
    </div>
  );
};

export default NotesPanel;
