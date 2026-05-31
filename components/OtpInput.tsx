'use client';

import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function OtpInput({ value, onChange }: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, ' ').split('').slice(0, 6);

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, i) => (i === index ? char : d === ' ' ? '' : d)).join('').replace(/ /g, '');
    onChange(next.slice(0, 6));
    if (char && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (!digits[index] || digits[index] === ' ') {
        if (index > 0) {
          inputs.current[index - 1]?.focus();
          const next = digits.map((d, i) => (i === index - 1 ? '' : d === ' ' ? '' : d)).join('');
          onChange(next.slice(0, 6));
        }
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste) {
      onChange(paste);
      const focusIdx = Math.min(paste.length, 5);
      inputs.current[focusIdx]?.focus();
    }
    e.preventDefault();
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] === ' ' || digits[i] === undefined ? '' : digits[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors bg-white"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
