'use client';

import { useEffect, useState } from 'react';

interface Profile {
  id: string;
  phone: string;
  name: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name ?? '');
        setLoading(false);
      });
  }, []);

  async function saveName() {
    if (name.trim().length < 2) return;
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setProfile((p) => p ? { ...p, name: name.trim() } : p);
      setEditing(false);
    }
    setSaving(false);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (profile?.name ?? profile?.phone ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Profile</h1>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
          <span className="text-2xl font-bold text-indigo-700">{initials}</span>
        </div>
        {!editing ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">
              {profile?.name ?? 'No name set'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">+91 {profile?.phone}</p>
            <button
              onClick={() => setEditing(true)}
              className="mt-3 text-sm text-indigo-600 font-medium"
            >
              Edit name
            </button>
          </>
        ) : (
          <div className="w-full max-w-xs mt-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              className="w-full px-4 py-3 rounded-xl border-2 border-indigo-300 focus:border-indigo-500 focus:outline-none text-center text-base font-medium"
              placeholder="Your name"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={saveName}
                disabled={saving || name.trim().length < 2}
                className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-40 text-sm"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setEditing(false); setName(profile?.name ?? ''); }}
                className="flex-1 bg-gray-100 text-gray-600 font-medium py-2.5 rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="space-y-3 mb-8">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Mobile number</p>
          <p className="text-sm font-medium text-gray-900">+91 {profile?.phone}</p>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-semibold text-sm active:scale-95 transition-transform"
      >
        Log out
      </button>
    </div>
  );
}
