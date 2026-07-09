'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProgressRing from '@/components/ProgressRing';
import { formatWeekRange, getWeekStart, formatDeadline } from '@/lib/utils';

interface GoalItem {
  id: string;
  title: string;
  deadline: string | null;
  status: string;
  note: string | null;
  isSpillover?: boolean;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  isYou: boolean;
  totalItems: number;
  doneItems: number;
  progress: number;
  hasStartedWeek: boolean;
  spilloverCount: number;
  items: GoalItem[];
}

interface Group {
  id: string;
  name: string;
  inviteCode: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
};

function MemberCard({ member }: { member: Member }) {
  const [expanded, setExpanded] = useState(member.isYou);

  const initials = member.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${member.isYou ? 'border-indigo-200' : 'border-gray-100'}`}>
      {/* Summary row — tap to expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4"
      >
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-indigo-700">{initials}</span>
        </div>

        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {member.name}
            {member.isYou && <span className="ml-1 text-xs text-indigo-400 font-normal">(you)</span>}
          </p>
          {member.hasStartedWeek ? (
            <p className="text-xs text-gray-400 mt-0.5">{member.doneItems}/{member.totalItems} done</p>
          ) : member.spilloverCount > 0 ? (
            <p className="text-xs text-gray-400 mt-0.5">
              {member.spilloverCount} carried over from last week
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">Hasn&apos;t started this week</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {member.hasStartedWeek && member.totalItems > 0 && (
            <ProgressRing progress={member.progress} size={44} strokeWidth={4} />
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Goals list */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-2 space-y-2">
          {member.items.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">No goals added yet</p>
          ) : (
            member.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 py-2.5 px-3 rounded-xl ${item.status === 'done' ? 'bg-green-50' : 'bg-gray-50'}`}
              >
                {/* Status dot */}
                <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  item.status === 'done' ? 'bg-green-500' :
                  item.status === 'in_progress' ? 'bg-amber-400' : 'bg-gray-300'
                }`} />

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.isSpillover && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                        Spillover
                      </span>
                    )}
                    {item.deadline && (
                      <span className="text-xs text-gray-400">Due {formatDeadline(item.deadline)}</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                  {item.note && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function GroupDetailPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const weekLabel = formatWeekRange(getWeekStart());

  useEffect(() => {
    if (!code) return;
    fetch(`/api/groups/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else { setGroup(data.group); setMembers(data.members); }
        setLoading(false);
      });
  }, [code]);

  function copyCode() {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const activeMembers = members.filter((m) => m.hasStartedWeek && m.totalItems > 0);
  const avgProgress = activeMembers.length === 0
    ? 0
    : Math.round(activeMembers.reduce((sum, m) => sum + m.progress, 0) / activeMembers.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={() => router.back()} className="text-indigo-600 font-medium">Go back</button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Groups
      </button>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{group?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{weekLabel}</p>
        </div>
        {activeMembers.length > 0 && (
          <div className="text-center">
            <ProgressRing progress={avgProgress} size={56} strokeWidth={5} />
            <p className="text-xs text-gray-400 mt-1">Avg</p>
          </div>
        )}
      </div>

      <button onClick={copyCode} className="w-full flex items-center gap-2 bg-indigo-50 rounded-xl px-4 py-2.5 mb-6">
        <span className="text-xs text-indigo-500 flex-1 text-left">Invite code (tap to copy)</span>
        <span className="font-mono text-sm font-bold text-indigo-700 tracking-widest">{group?.inviteCode}</span>
        {copied ? (
          <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Members ({members.length})
      </h2>

      <div className="space-y-3">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
