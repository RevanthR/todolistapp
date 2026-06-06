'use client';

import { useState } from 'react';
import { formatDeadline } from '@/lib/utils';
import DeadlinePicker from './DeadlinePicker';

export type Status = 'pending' | 'in_progress' | 'done';

export interface TodoItemData {
  id: string;
  title: string;
  deadline: string | null;
  status: string;
  note: string | null;
}

interface Props {
  item: TodoItemData;
  onStatusCycle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<TodoItemData>) => void;
  readOnly?: boolean;
  extendDeadline?: boolean;
}

export default function TodoItemCard({ item, onStatusCycle, onDelete, onUpdate, readOnly = false, extendDeadline = false }: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editNote, setEditNote] = useState(item.note ?? '');
  const [editDeadline, setEditDeadline] = useState(item.deadline ?? '');
  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    if (!editTitle.trim() || !editDeadline) return;
    setSaving(true);
    await onUpdate(item.id, {
      title: editTitle.trim(),
      note: editNote.trim() || null,
      deadline: editDeadline || null,
    });
    setSaving(false);
    setEditing(false);
  }

  const actionButton = {
    pending: { label: 'Mark In Progress', style: 'bg-amber-50 text-amber-700 border border-amber-200' },
    in_progress: { label: 'Mark as Done', style: 'bg-green-50 text-green-700 border border-green-200' },
    done: { label: 'Completed ✓', style: 'bg-green-500 text-white' },
  }[item.status] ?? { label: 'Update', style: 'bg-gray-100 text-gray-600' };

  if (editing) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
        <input
          className="w-full text-sm font-medium border-b border-gray-200 pb-2 mb-3 focus:outline-none focus:border-indigo-400"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="What do you want to get done?"
          autoFocus
        />
        <div className="mb-3">
          <DeadlinePicker value={editDeadline} onChange={setEditDeadline} extendToNextWeek={extendDeadline} />
        </div>
        <textarea
          className="w-full text-sm text-gray-500 resize-none focus:outline-none"
          rows={2}
          placeholder="Add a note (optional)"
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={saveEdit}
            disabled={saving || !editTitle.trim() || !editDeadline}
            className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border ${item.status === 'done' ? 'border-green-100' : 'border-gray-100'}`}>
      {/* Top row: title + edit/delete */}
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {item.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {item.deadline && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                Due {formatDeadline(item.deadline)}
              </span>
            )}
          </div>
          {item.note && (
            <p className="text-xs text-gray-400 mt-1 leading-snug">{item.note}</p>
          )}
        </div>

        {!readOnly && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => {
                setEditTitle(item.title);
                setEditNote(item.note ?? '');
                setEditDeadline(item.deadline ?? '');
                setEditing(true);
              }}
              className="p-1.5 text-gray-300 hover:text-indigo-500 transition-colors"
              aria-label="Edit"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
              aria-label="Delete"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline strokeLinecap="round" strokeLinejoin="round" points="3 6 5 6 21 6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Action button — hidden on past weeks */}
      {!readOnly && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStatusCycle(item.id)}
            className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-all active:scale-95 ${actionButton.style}`}
          >
            {actionButton.label}
          </button>
          {item.status === 'done' && (
            <button
              onClick={() => onStatusCycle(item.id)}
              className="text-xs text-gray-400 underline px-2"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
