import ProgressRing from './ProgressRing';

interface Props {
  name: string;
  totalItems: number;
  doneItems: number;
  progress: number;
  isYou: boolean;
  hasStartedWeek: boolean;
}

export default function GroupMemberCard({ name, totalItems, doneItems, progress, isYou, hasStartedWeek }: Props) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 ${isYou ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'}`}>
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-indigo-700">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {name}
          {isYou && <span className="ml-1 text-xs text-indigo-500 font-normal">(you)</span>}
        </p>
        {hasStartedWeek ? (
          <p className="text-xs text-gray-400 mt-0.5">
            {doneItems}/{totalItems} done this week
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5">Hasn&apos;t started this week</p>
        )}
      </div>

      {/* Progress ring */}
      {hasStartedWeek && totalItems > 0 ? (
        <ProgressRing progress={progress} size={52} strokeWidth={5} />
      ) : (
        <div className="w-13 h-13 flex items-center justify-center">
          <span className="text-xs text-gray-300 font-medium">—</span>
        </div>
      )}
    </div>
  );
}
