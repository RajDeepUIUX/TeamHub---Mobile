import React from 'react';
import { Check } from 'lucide-react';

interface ChoiceTilesProps {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Single choice behaves like radio tiles (tap again keeps it); multi toggles each tile */
  multiple?: boolean;
}

/**
 * Side-by-side tiles for filters with only a couple of options (used instead of chips or a dropdown).
 * Multi-select tiles show a checkbox; single-select tiles show a radio.
 */
export const ChoiceTiles: React.FC<ChoiceTilesProps> = ({ options, selected, onChange, multiple = true }) => (
  <div className={`grid gap-2 ${options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`} role={multiple ? 'group' : 'radiogroup'}>
    {options.map((option) => {
      const on = selected.includes(option);
      return (
        <button
          key={option}
          type="button"
          role={multiple ? 'checkbox' : 'radio'}
          aria-checked={on}
          onClick={() =>
            onChange(multiple ? (on ? selected.filter((v) => v !== option) : [...selected, option]) : [option])
          }
          className={`h-11 px-3 rounded-xl border flex items-center gap-2.5 text-left text-xs transition-colors cursor-pointer ${
            on ? 'border-[#2F68FE] bg-blue-50/70 font-semibold text-[#1E293B]' : 'border-slate-200 bg-white font-medium text-slate-600 active:bg-slate-50'
          }`}
        >
          {multiple ? (
            <span
              className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                on ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
              }`}
            >
              {on && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
          ) : (
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-[#2F68FE]' : 'border-slate-300'}`}>
              {on && <span className="w-2 h-2 rounded-full bg-[#2F68FE]" />}
            </span>
          )}
          <span className="truncate">{option}</span>
        </button>
      );
    })}
  </div>
);
