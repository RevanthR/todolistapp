'use client';

import { getWeekStart } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (date: string) => void;
  weekStart?: string;
  extendToNextWeek?: boolean;
}

export default function DeadlinePicker({ value, onChange, weekStart: weekStartProp, extendToNextWeek = false }: Props) {
  const weekStart = new Date((weekStartProp ?? getWeekStart()) + 'T00:00:00');
  const totalDays = extendToNextWeek ? 14 : 7;

  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return {
      dateStr,
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      num: d.getDate(),
      isNextWeek: i >= 7,
    };
  });

  const thisWeekDays = days.filter((d) => !d.isNextWeek);
  const nextWeekDays = days.filter((d) => d.isNextWeek);

  function DayButton({ day }: { day: typeof days[0] }) {
    const selected = value === day.dateStr;
    return (
      <button
        key={day.dateStr}
        type="button"
        onClick={() => onChange(selected ? '' : day.dateStr)}
        className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-colors min-w-[48px] ${
          selected
            ? 'bg-indigo-600 border-indigo-600 text-white'
            : 'bg-white border-gray-200 text-gray-700'
        }`}
      >
        <span className="text-xs font-medium">{day.label}</span>
        <span className="text-sm font-bold mt-0.5">{day.num}</span>
      </button>
    );
  }

  return (
    <div>
      <label className="text-xs text-gray-700 font-medium block mb-2">
        Deadline <span className="text-red-400">*</span>
      </label>
      {!extendToNextWeek ? (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {days.map((day) => <DayButton key={day.dateStr} day={day} />)}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {thisWeekDays.map((day) => <DayButton key={day.dateStr} day={day} />)}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Next week</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {nextWeekDays.map((day) => <DayButton key={day.dateStr} day={day} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
