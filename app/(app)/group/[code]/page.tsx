'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GroupMemberCard from '@/components/GroupMemberCard';
import ProgressRing from '@/components/ProgressRing';
import { formatWeekRange, getWeekStart } from '@/lib/utils';

interface Member {
  id: string;
  name: string;
  phone: string;
  isYou: boolean;
  totalItems: number;
  doneItems: number;
  progress: number;
  hasStartedWeek: boolean;
}

interface Group {
  id: string;
  name: string;
  inviteCode: string;
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
        if (data.error) {
          setError(data.error);
        } else {
          setGroup(data.group);
          setMembers(data.members);
        }
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
  const avgProgress =
    activeMembers.length === 0
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
        <button
          onClick={() => router.back()}
          className="text-indigo-600 font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 mb-4"
      >
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

      {/* Invite code */}
      <button
        onClick={copyCode}
        className="w-full flex items-center gap-2 bg-indigo-50 rounded-xl px-4 py-2.5 mb-6"
      >
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

      {/* Members */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Members ({members.length})
      </h2>

      <div className="space-y-3">
        {members.map((member) => (
          <GroupMemberCard
            key={member.id}
            name={member.name}
            totalItems={member.totalItems}
            doneItems={member.doneItems}
            progress={member.progress}
            isYou={member.isYou}
            hasStartedWeek={member.hasStartedWeek}
          />
        ))}
      </div>
    </div>
  );
}
