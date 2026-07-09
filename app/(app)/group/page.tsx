'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
}

export default function GroupPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list');
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/groups')
      .then((r) => r.json())
      .then((d) => { setGroups(d.groups ?? []); setLoading(false); });
  }, []);

  async function createGroup() {
    if (!newGroupName.trim()) return;
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim() }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setGroups((prev) => [...prev, { ...data.group, memberCount: 1 }]);
      setMode('list');
      setNewGroupName('');
    } else {
      setError(data.error ?? 'Failed to create group');
    }
  }

  async function joinGroup() {
    if (!joinCode.trim()) return;
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: joinCode.trim().toUpperCase() }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      if (!data.alreadyMember) {
        setGroups((prev) => [...prev, { ...data.group, memberCount: (data.group.memberCount ?? 0) + 1 }]);
      }
      setMode('list');
      setJoinCode('');
    } else {
      setError(data.error ?? 'Failed to join group');
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Groups</h1>
        {mode === 'list' && (
          <div className="flex gap-2">
            <button
              onClick={() => { setMode('join'); setError(''); }}
              className="text-sm text-indigo-600 font-medium px-3 py-1.5 rounded-lg bg-indigo-50"
            >
              Join
            </button>
            <button
              onClick={() => { setMode('create'); setError(''); }}
              className="text-sm text-white font-medium px-3 py-1.5 rounded-lg bg-indigo-600"
            >
              + Create
            </button>
          </div>
        )}
      </div>

      {/* Create form */}
      {mode === 'create' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Create a group</h2>
          <input
            autoFocus
            placeholder="Group name (e.g. Study Buddies)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createGroup()}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none text-sm mb-4"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={createGroup}
              disabled={submitting || !newGroupName.trim()}
              className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-xl disabled:opacity-40"
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => { setMode('list'); setNewGroupName(''); setError(''); }}
              className="flex-1 bg-gray-100 text-gray-600 font-medium py-3 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Join form */}
      {mode === 'join' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
          <h2 className="font-semibold text-gray-900 mb-1">Join a group</h2>
          <p className="text-xs text-gray-500 mb-4">Enter the invite code shared by your friend (e.g. ABCD-1234)</p>
          <input
            autoFocus
            placeholder="ABCD-1234"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && joinGroup()}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none text-sm font-mono mb-4 tracking-widest"
            maxLength={9}
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={joinGroup}
              disabled={submitting || !joinCode.trim()}
              className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-xl disabled:opacity-40"
            >
              {submitting ? 'Joining…' : 'Join'}
            </button>
            <button
              onClick={() => { setMode('list'); setJoinCode(''); setError(''); }}
              className="flex-1 bg-gray-100 text-gray-600 font-medium py-3 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Group list */}
      {groups.length === 0 && mode === 'list' && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No groups yet</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Create a group and invite your friends to track progress together.
          </p>
        </div>
      )}

      <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                </p>
              </div>
              <Link
                href={`/group/${group.inviteCode}`}
                className="text-sm text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg"
              >
                View →
              </Link>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <span className="text-xs text-gray-500 flex-1">Invite code:</span>
              <span className="font-mono text-sm font-bold text-gray-800 tracking-widest">
                {group.inviteCode}
              </span>
              <button
                onClick={() => copyCode(group.inviteCode)}
                className="text-indigo-600 ml-1"
                aria-label="Copy invite code"
              >
                {copied === group.inviteCode ? (
                  <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
