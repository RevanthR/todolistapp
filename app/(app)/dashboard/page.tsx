'use client';

import { useEffect, useState } from 'react';
import ProgressRing from '@/components/ProgressRing';
import TodoItemCard, { TodoItemData } from '@/components/TodoItemCard';
import { formatWeekRange, getWeekStart } from '@/lib/utils';

interface WeeklyTodo {
  id: string;
  weekStart: string;
}

export default function Dashboard() {
  const [todo, setTodo] = useState<WeeklyTodo | null>(null);
  const [items, setItems] = useState<TodoItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  const weekLabel = formatWeekRange(getWeekStart());
  const doneCount = items.filter((i) => i.status === 'done').length;
  const progress = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);

  useEffect(() => {
    fetch('/api/todos')
      .then((r) => r.json())
      .then((data) => {
        setTodo(data.todo);
        setItems(data.items ?? []);
        setLoading(false);
      });
  }, []);

  async function startWeek() {
    setStarting(true);
    const res = await fetch('/api/todos', { method: 'POST' });
    const data = await res.json();
    setTodo(data.todo);
    setStarting(false);
  }

  async function addItem() {
    if (!newTitle.trim()) return;
    setAdding(true);
    const res = await fetch('/api/todos/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), deadline: newDeadline || null, note: newNote.trim() || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => [...prev, data.item]);
      setNewTitle('');
      setNewDeadline('');
      setNewNote('');
      setShowAddForm(false);
    }
    setAdding(false);
  }

  async function cycleStatus(id: string) {
    const res = await fetch(`/api/todos/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycleStatus: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? data.item : i)));
    }
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/todos/items/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  async function updateItem(id: string, changes: Partial<TodoItemData>) {
    const res = await fetch(`/api/todos/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? data.item : i)));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">This Week</h1>
          <p className="text-sm text-gray-500 mt-0.5">{weekLabel}</p>
        </div>
        {todo && items.length > 0 && (
          <ProgressRing progress={progress} size={60} strokeWidth={6} />
        )}
      </div>

      {/* No week started */}
      {!todo && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Start your week!</h2>
          <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
            Set your goals for this week and track your progress with your friend group.
          </p>
          <button
            onClick={startWeek}
            disabled={starting}
            className="bg-indigo-600 text-white font-semibold px-8 py-3.5 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            {starting ? 'Starting…' : '🚀 Start this week'}
          </button>
        </div>
      )}

      {/* Week started */}
      {todo && (
        <>
          {/* Summary bar */}
          {items.length > 0 && (
            <div className="flex gap-3 mb-5">
              <div className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 text-center">
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                <p className="text-xs text-gray-500">Goals</p>
              </div>
              <div className="flex-1 bg-white rounded-2xl p-3 border border-green-100 text-center">
                <p className="text-2xl font-bold text-green-600">{doneCount}</p>
                <p className="text-xs text-gray-500">Done</p>
              </div>
              <div className="flex-1 bg-white rounded-2xl p-3 border border-amber-100 text-center">
                <p className="text-2xl font-bold text-amber-500">{items.length - doneCount}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          )}

          {/* Item list */}
          <div className="space-y-3">
            {items.length === 0 && !showAddForm && (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">No goals yet. Add your first one!</p>
              </div>
            )}
            {items.map((item) => (
              <TodoItemCard
                key={item.id}
                item={item}
                onStatusCycle={cycleStatus}
                onDelete={deleteItem}
                onUpdate={updateItem}
              />
            ))}
          </div>

          {/* Add item form */}
          {showAddForm && (
            <div className="mt-3 bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
              <input
                autoFocus
                className="w-full text-sm font-medium border-b border-gray-200 pb-2 mb-3 focus:outline-none focus:border-indigo-400"
                placeholder="What do you want to accomplish?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
              />
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Deadline (optional)</label>
                  <input
                    type="date"
                    className="w-full text-sm text-gray-600 focus:outline-none"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                </div>
              </div>
              <textarea
                className="w-full text-sm text-gray-500 resize-none focus:outline-none"
                rows={2}
                placeholder="Note (optional)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={addItem}
                  disabled={adding || !newTitle.trim()}
                  className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40"
                >
                  {adding ? 'Adding…' : 'Add goal'}
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewTitle(''); setNewDeadline(''); setNewNote(''); }}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-indigo-300 text-indigo-600 font-medium text-sm active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              Add goal
            </button>
          )}
        </>
      )}
    </div>
  );
}
