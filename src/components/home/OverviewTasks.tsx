import React, { useState } from 'react';
import { BarChart3, FileText, CheckCircle2, GraduationCap, ClipboardList } from 'lucide-react';

export type OverviewLayout = 'grid' | 'unified' | 'scroll';

interface OverviewItem {
  value: number;
  label: string;
  caption: string;
  icon: React.ElementType;
  /** Icon tile background + icon colour */
  tile: string;
  /** Caption colour in the grid layout */
  captionColor: string;
}

const ITEMS: OverviewItem[] = [
  {
    value: 1,
    label: 'Open Tickets',
    caption: 'Active IT issue',
    icon: FileText,
    tile: 'bg-pink-50 text-pink-600',
    captionColor: 'text-pink-600',
  },
  {
    value: 1,
    label: 'Pending Approval',
    caption: 'Leave request',
    icon: CheckCircle2,
    tile: 'bg-emerald-50 text-emerald-600',
    captionColor: 'text-emerald-600',
  },
  {
    value: 0,
    label: 'L&D Hours',
    caption: 'Target: 75h',
    icon: GraduationCap,
    tile: 'bg-blue-50 text-blue-600',
    captionColor: 'text-blue-600',
  },
  {
    value: 50,
    label: 'Policies Updated',
    caption: 'Last 60 days',
    icon: ClipboardList,
    tile: 'bg-violet-50 text-violet-600',
    captionColor: 'text-violet-600',
  },
];

const LAYOUTS: { id: OverviewLayout; label: string }[] = [
  { id: 'grid', label: '2×2 Grid' },
  { id: 'unified', label: 'Unified' },
  { id: 'scroll', label: 'Scroll' },
];

interface OverviewTasksProps {
  onSelect: (label: string) => void;
  initialLayout?: OverviewLayout;
}

export const OverviewTasks: React.FC<OverviewTasksProps> = ({ onSelect, initialLayout = 'grid' }) => {
  const [layout, setLayout] = useState<OverviewLayout>(initialLayout);

  return (
    <section>
      {/* Section header + layout switcher */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5" />
          </span>
          <h3 className="text-sm font-bold text-[#1E293B]">Overview &amp; Tasks</h3>
        </div>
        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/70" role="tablist">
          {LAYOUTS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={layout === id}
              onClick={() => setLayout(id)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                layout === id ? 'bg-white text-[#2F68FE] shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {layout === 'grid' && (
        <div className="grid grid-cols-2 gap-2.5">
          {ITEMS.map(({ value, label, caption, icon: Icon, tile, captionColor }) => (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 flex items-center justify-between gap-2 text-left shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
            >
              <span className="min-w-0">
                <span className="block text-2xl font-extrabold text-[#1E293B] leading-none tabular-nums">{value}</span>
                <span className="block text-xs font-semibold text-slate-700 mt-1.5 truncate">{label}</span>
                <span className={`block text-[10px] font-semibold mt-0.5 truncate ${captionColor}`}>{caption}</span>
              </span>
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tile}`}>
                <Icon className="w-4.5 h-4.5" />
              </span>
            </button>
          ))}
        </div>
      )}

      {layout === 'unified' && (
        <div className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs grid grid-cols-2 overflow-hidden">
          {ITEMS.map(({ value, label, icon: Icon, tile }, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              className={`p-3.5 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                idx % 2 === 0 ? 'border-r border-slate-100' : ''
              } ${idx < 2 ? 'border-b border-slate-100' : ''}`}
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tile}`}>
                <Icon className="w-4.5 h-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xl font-extrabold text-[#1E293B] leading-none tabular-nums">{value}</span>
                <span className="block text-[11px] font-medium text-slate-600 mt-1 truncate">{label}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* scroll-px keeps the 16px inset when a card snaps into place */}
      {layout === 'scroll' && (
        <div className="-mx-4 px-4 scroll-px-4 flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {ITEMS.map(({ value, label, icon: Icon, tile }) => (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              className="snap-start shrink-0 w-[38%] bg-white border border-[#EBF0F7] rounded-2xl p-3.5 text-left shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
            >
              <span className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-[#1E293B] leading-none tabular-nums">{value}</span>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tile}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </span>
              <span className="block text-[11px] font-medium text-slate-600 mt-2.5 truncate">{label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
