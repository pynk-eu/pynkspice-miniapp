import React from 'react';

interface SpicyLevelPickerProps {
  value: number;
  onChange: (level: number) => void;
  max?: number;
}

// Accessible pepper rating (0..max) with keyboard & ARIA support
export default function SpicyLevelPicker({ value, onChange, max = 5 }: SpicyLevelPickerProps) {
  const peppers = Array.from({ length: max + 1 }, (_, i) => i); // include 0

  function set(level: number) {
    if (level < 0) level = 0;
    if (level > max) level = max;
    onChange(level);
  }

  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      set(value + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      set(value - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      set(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      set(max);
    }
  }

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Spicy level" onKeyDown={onKey}>
      {peppers.map(lvl => {
        const active = lvl === value;
        return (
          <button
            type="button"
            key={lvl}
            role="radio"
            aria-checked={active}
            aria-label={`Spicy level ${lvl}`}
            onClick={() => set(lvl)}
            className={
              'w-8 h-8 flex items-center justify-center rounded-md border transition ' +
              (active
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-600')
            }
          >
            {lvl === 0 ? (
              <span className="text-xs font-medium">0</span>
            ) : (
              <span className="text-lg leading-none" aria-hidden>
                🌶️
              </span>
            )}
          </button>
        );
      })}
      <input type="hidden" name="spicy_level" value={value} />
    </div>
  );
}
