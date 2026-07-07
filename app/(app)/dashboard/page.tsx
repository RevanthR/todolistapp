'use client';

import { useEffect, useState } from 'react';
import ProgressRing from '@/components/ProgressRing';
import TodoItemCard, { TodoItemData } from '@/components/TodoItemCard';
import DeadlinePicker from '@/components/DeadlinePicker';
import { formatWeekRange, getWeekStart } from '@/lib/utils';

interface WeeklyTodo {
  id: string;
  weekStart: string;
}

function offsetWeek(base: string, weeks: number): string {
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + weeks * 7);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function Dashboard() {
  const currentWeek = getWeekStart();
  const nextWeek = offsetWeek(currentWeek, 1);
  const [viewWeek, setViewWeek] = useState(currentWeek);
  const isCurrentWeek = viewWeek === currentWeek;
  const isNextWeek = viewWeek === nextWeek;
  const isPastWeek = viewWeek < currentWeek;
  const canEdit = isCurrentWeek || isNextWeek;

  const [todo, setTodo] = useState<WeeklyTodo | null>(null);
  const [items, setItems] = useState<TodoItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  const [spillovers, setSpillovers] = useState<TodoItemData[]>([]);

  const pending = items.filter((i) => i.status !== 'done');
  const completed = items.filter((i) => i.status === 'done');
  const progress = items.length === 0 ? 0 : Math.round((completed.length / items.length) * 100);

  useEffect(() => {
    setLoading(true);
    setShowAddForm(false);
    setNewTitle(''); setNewDeadline(''); setNewNote('');
    fetch(`/api/todos${viewWeek !== currentWeek ? `?week=${viewWeek}` : ''}`)
      .then((r) => r.json())
      .then((data) => {
        setTodo(data.todo);
        setItems(data.items ?? []);
        setLoading(false);
        // Auto-open add form when navigating to next week with no goals yet
        if (data.todo === null && viewWeek > currentWeek) {
          setShowAddForm(true);
        }
      });
  }, [viewWeek]);

  useEffect(() => {
    if (!isCurrentWeek) {
      setSpillovers([]);
      return;
    }
    fetch('/api/todos/spillovers')
      .then((r) => r.json())
      .then((data) => setSpillovers(data.spillovers ?? []));
  }, [isCurrentWeek]);

  async function addItem() {
    if (!newTitle.trim() || !newDeadline) return;
    setAdding(true);
    const res = await fetch('/api/todos/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), deadline: newDeadline, note: newNote.trim() || null, weekStart: viewWeek }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => [...prev, data.item]);
      setNewTitle(''); setNewDeadline(''); setNewNote('');
      setShowAddForm(false);
    }
    setAdding(false);
  }

  // Spillover items live in last week's record — update or drop them from the
  // spillovers list in place rather than the current week's items list.
  function applyItemUpdate(id: string, updated: TodoItemData | null, isSpilloverItem: boolean) {
    if (isSpilloverItem) {
      setSpillovers((prev) =>
        updated && updated.status !== 'done'
          ? prev.map((i) => (i.id === id ? updated : i))
          : prev.filter((i) => i.id !== id)
      );
    } else {
      setItems((prev) =>
        updated ? prev.map((i) => (i.id === id ? updated : i)) : prev.filter((i) => i.id !== id)
      );
    }
  }

  async function cycleStatus(id: string) {
    const isSpilloverItem = spillovers.some((s) => s.id === id);
    const res = await fetch(`/api/todos/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycleStatus: true }),
    });
    const data = await res.json();
    if (res.ok) applyItemUpdate(id, data.item, isSpilloverItem);
  }

  async function deleteItem(id: string) {
    const isSpilloverItem = spillovers.some((s) => s.id === id);
    const res = await fetch(`/api/todos/items/${id}`, { method: 'DELETE' });
    if (res.ok) applyItemUpdate(id, null, isSpilloverItem);
  }

  async function updateItem(id: string, changes: Partial<TodoItemData>) {
    const isSpilloverItem = spillovers.some((s) => s.id === id);
    const res = await fetch(`/api/todos/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    const data = await res.json();
    if (res.ok) applyItemUpdate(id, data.item, isSpilloverItem);
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
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setViewWeek((w) => offsetWeek(w, -1))} className="p-2 text-gray-400">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
            {isCurrentWeek ? 'This Week' : isNextWeek ? 'Next Week' : 'Past Week'}
          </p>
          <p className="text-sm text-gray-500">{formatWeekRange(viewWeek)}</p>
          {!isCurrentWeek && (
            <button onClick={() => setViewWeek(currentWeek)} className="text-xs text-indigo-500 font-medium mt-0.5">
              Back to current week
            </button>
          )}
        </div>
        <button
          onClick={() => setViewWeek((w) => offsetWeek(w, 1))}
          disabled={isNextWeek}
          className="p-2 text-gray-400 disabled:opacity-30"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* No week started, and nothing carried over from last week */}
      {!todo && spillovers.length === 0 && (
        <div className="text-center py-16">
          {canEdit ? (
            <>
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {isNextWeek ? 'Plan next week!' : 'Start your week!'}
              </h2>
              <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
                {isNextWeek ? 'Get ahead by setting your goals for next week.' : 'Set your goals and track progress with your group.'}
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-indigo-600 text-white font-semibold px-8 py-3.5 rounded-2xl active:scale-95 transition-transform"
              >
                {isNextWeek ? '📅 Plan next week' : '🚀 Start this week'}
              </button>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No goals recorded for this week.</p>
          )}
        </div>
      )}

      {/* Progress summary — only when week started with items */}
      {todo && items.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-5">
          <div className="flex items-center gap-4">
            <ProgressRing progress={progress} size={64} strokeWidth={6} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {progress === 100 ? 'All done! 🎉' : `${completed.length} of ${items.length} completed`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {pending.length > 0
                  ? `${pending.length} task${pending.length > 1 ? 's' : ''} remaining`
                  : 'Great work this week!'}
              </p>
              <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending items — this week's own goals plus any unfinished carried over from last week */}
      {(pending.length > 0 || spillovers.length > 0) && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pending · {pending.length + spillovers.length}
          </p>
          <div className="space-y-3">
            {spillovers.map((item) => (
              <TodoItemCard
                key={item.id}
                item={item}
                onStatusCycle={cycleStatus}
                onDelete={deleteItem}
                onUpdate={updateItem}
                extendDeadline
                isSpillover
              />
            ))}
            {pending.map((item) => (
              <TodoItemCard
                key={item.id}
                item={item}
                onStatusCycle={cycleStatus}
                onDelete={deleteItem}
                onUpdate={updateItem}
                readOnly={isPastWeek}
                extendDeadline={isCurrentWeek}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state when week started but no items */}
      {todo && items.length === 0 && spillovers.length === 0 && !showAddForm && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No goals yet — add your first one!</p>
        </div>
      )}

      {/* Add form — shown for current and next week, regardless of todo */}
      {canEdit && showAddForm && (
        <div className="mt-1 mb-5 bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
          <input
            autoFocus
            className="w-full text-sm font-medium border-b border-gray-200 pb-2 mb-4 focus:outline-none focus:border-indigo-400"
            placeholder="What do you want to accomplish?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <div className="mb-4">
            <DeadlinePicker value={newDeadline} onChange={setNewDeadline} weekStart={viewWeek} extendToNextWeek={isCurrentWeek} />
          </div>
          <textarea
            className="w-full text-sm text-gray-500 resize-none focus:outline-none border-t border-gray-100 pt-3"
            rows={2}
            placeholder="Note (optional)"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={addItem}
              disabled={adding || !newTitle.trim() || !newDeadline}
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
      {canEdit && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-500 font-medium text-sm active:scale-95 transition-transform mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Add goal
        </button>
      )}

      {/* Completed section */}
      {todo && completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-2 w-full mb-3"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Completed · {completed.length}
            </p>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showCompleted ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCompleted && (
            <div className="space-y-3">
              {completed.map((item) => (
                <TodoItemCard
                  key={item.id}
                  item={item}
                  onStatusCycle={cycleStatus}
                  onDelete={deleteItem}
                  onUpdate={updateItem}
                  readOnly={isPastWeek}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {isPastWeek && (
        <p className="text-center text-xs text-gray-400 mt-4">Past week — read only</p>
      )}
    </div>
  );
}
