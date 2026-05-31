'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalUsers: number;
  totalGroups: number;
  totalGroupMemberships: number;
  activeThisWeek: number;
  newUsersThisMonth: number;
  totalGoals: number;
  completedGoals: number;
}

interface UserRow {
  id: string;
  name: string;
  phone: string;
  joinedAt: string;
  activeThisWeek: boolean;
  goalsThisWeek: number;
  doneThisWeek: number;
}

interface GroupRow {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
  createdBy: string;
  createdAt: string;
}

type Tab = 'overview' | 'users' | 'groups';

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [userList, setUserList] = useState<UserRow[]>([]);
  const [groupList, setGroupList] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (r.status === 401) { window.location.href = '/admin/login'; return null; }
        return r.json();
      })
      .then((d) => { if (d) setStats(d); setLoading(false); });
  }, []);

  useEffect(() => {
    if (tab === 'users' && userList.length === 0) {
      fetch('/api/admin/users').then((r) => r.json()).then((d) => setUserList(d.users ?? []));
    }
    if (tab === 'groups' && groupList.length === 0) {
      fetch('/api/admin/groups').then((r) => r.json()).then((d) => setGroupList(d.groups ?? []));
    }
  }, [tab]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  const completionRate = stats && stats.totalGoals > 0
    ? Math.round((stats.completedGoals / stats.totalGoals) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold">Grow Together</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
        <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
          Sign out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-6">
        {(['overview', 'users', 'groups'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Overview */}
        {!loading && tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Users" value={stats.totalUsers} />
              <StatCard label="Total Groups" value={stats.totalGroups} />
              <StatCard label="Active This Week" value={stats.activeThisWeek} sub={`of ${stats.totalUsers} users`} />
              <StatCard label="New This Month" value={stats.newUsersThisMonth} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard label="Total Goals Created" value={stats.totalGoals} />
              <StatCard label="Goals Completed" value={stats.completedGoals} />
              <StatCard label="Completion Rate" value={`${completionRate}%`} sub="across all time" />
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">{userList.length} users total</p>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Phone</th>
                      <th className="text-left px-4 py-3">Joined</th>
                      <th className="text-left px-4 py-3">This Week</th>
                      <th className="text-left px-4 py-3">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((user, i) => (
                      <tr key={user.id} className={`border-b border-gray-800/50 ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                        <td className="px-4 py-3 font-medium text-white">{user.name}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono">+91 {user.phone}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(user.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          {user.activeThisWeek
                            ? <span className="text-green-400 text-xs font-medium">Active</span>
                            : <span className="text-gray-600 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {user.activeThisWeek ? `${user.doneThisWeek}/${user.goalsThisWeek} done` : '—'}
                        </td>
                      </tr>
                    ))}
                    {userList.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600">No users yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Groups */}
        {tab === 'groups' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">{groupList.length} groups total</p>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-3">Group Name</th>
                      <th className="text-left px-4 py-3">Invite Code</th>
                      <th className="text-left px-4 py-3">Members</th>
                      <th className="text-left px-4 py-3">Created By</th>
                      <th className="text-left px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupList.map((group, i) => (
                      <tr key={group.id} className={`border-b border-gray-800/50 ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                        <td className="px-4 py-3 font-medium text-white">{group.name}</td>
                        <td className="px-4 py-3 font-mono text-indigo-400 tracking-widest text-xs">{group.inviteCode}</td>
                        <td className="px-4 py-3 text-gray-400">{group.memberCount}</td>
                        <td className="px-4 py-3 text-gray-400">{group.createdBy}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(group.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                    {groupList.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600">No groups yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
