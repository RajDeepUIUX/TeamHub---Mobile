import React from 'react';
import { POLICIES } from '../../data/policiesData';

// Policies published this year (matches the Policies & Guidelines screen's default filter)
const POLICIES_THIS_YEAR = POLICIES.filter((x) => x.year === new Date().getFullYear()).length;
import { BarChart3, FileText, CheckCircle2, GraduationCap, ClipboardList, CheckSquare, ChevronRight } from 'lucide-react';

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
    value: POLICIES_THIS_YEAR,
    label: 'Policies Updated',
    caption: 'This year',
    icon: ClipboardList,
    tile: 'bg-violet-50 text-violet-600',
    captionColor: 'text-violet-600',
  },
];

/** "Scroll" shows these as the Action Queue list; `key` is what onSelect receives */
const QUEUE: { key: string; count: string; title: string; hint: string; tile: string }[] = [
  { key: 'Staff Review', count: '1', title: 'Staff Review due', hint: 'Form 180d open · Your action', tile: 'bg-amber-50 text-amber-700' },
  { key: 'Open Tickets', count: '1', title: 'Open Tickets', hint: '1 active IT issue', tile: 'bg-pink-50 text-pink-600' },
  { key: 'Pending Approval', count: '1', title: 'Pending Leave Approval', hint: 'Awaiting your manager', tile: 'bg-emerald-50 text-emerald-600' },
  { key: 'L&D Hours', count: '0h', title: 'L&D Hours', hint: '0 of 75h target', tile: 'bg-blue-50 text-blue-600' },
  { key: 'Policies Updated', count: String(POLICIES_THIS_YEAR), title: 'Policies Updated', hint: `Published in ${new Date().getFullYear()}`, tile: 'bg-violet-50 text-violet-600' },
];

/** Items without a screen yet: shown, but not tappable */
const NOT_LINKED = new Set(['L&D Hours']);

/** A button when the item opens something, otherwise a plain (non-interactive) block */
const Tappable: React.FC<{ id: string; onSelect: (id: string) => void; className: string; children: React.ReactNode }> = ({
  id,
  onSelect,
  className,
  children,
}) =>
  NOT_LINKED.has(id) ? (
    <div className={className}>{children}</div>
  ) : (
    <button type="button" onClick={() => onSelect(id)} className={`${className} active:bg-slate-50 transition-colors cursor-pointer`}>
      {children}
    </button>
  );

interface OverviewTasksProps {
  onSelect: (label: string) => void;
  /** Controlled by the dashboard (it hides the separate Action Queue card while "Scroll" is on) */
  layout: OverviewLayout;
  /** No longer shown: the Action Queue list is the final layout */
  onLayoutChange?: (layout: OverviewLayout) => void;
}

export const OverviewTasks: React.FC<OverviewTasksProps> = ({ onSelect, layout }) => {
  const isQueue = layout === 'scroll';

  return (
    <section>
      {/* Section header + layout switcher */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">
            {isQueue ? <CheckSquare className="w-3.5 h-3.5" /> : <BarChart3 className="w-3.5 h-3.5" />}
          </span>
          <h3 className="text-sm font-bold text-[#1E293B]">{isQueue ? 'Action Queue' : 'Overview & Tasks'}</h3>
        </div>
      </div>

      {layout === 'grid' && (
        <div className="grid grid-cols-2 gap-2.5">
          {ITEMS.map(({ value, label, caption, icon: Icon, tile, captionColor }) => (
            <Tappable
              key={label}
              id={label}
              onSelect={onSelect}
              className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 flex items-center justify-between gap-2 text-left shadow-2xs"
            >
              <span className="min-w-0">
                <span className="block text-2xl font-extrabold text-[#1E293B] leading-none tabular-nums">{value}</span>
                <span className="block text-xs font-semibold text-slate-700 mt-1.5 truncate">{label}</span>
                <span className={`block text-[10px] font-semibold mt-0.5 truncate ${captionColor}`}>{caption}</span>
              </span>
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tile}`}>
                <Icon className="w-4.5 h-4.5" />
              </span>
            </Tappable>
          ))}
        </div>
      )}

      {layout === 'unified' && (
        <div className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs grid grid-cols-2 overflow-hidden">
          {ITEMS.map(({ value, label, icon: Icon, tile }, idx) => (
            <Tappable
              key={label}
              id={label}
              onSelect={onSelect}
              className={`p-3.5 flex items-center gap-3 text-left ${idx % 2 === 0 ? 'border-r border-slate-100' : ''} ${
                idx < 2 ? 'border-b border-slate-100' : ''
              }`}
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tile}`}>
                <Icon className="w-4.5 h-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xl font-extrabold text-[#1E293B] leading-none tabular-nums">{value}</span>
                <span className="block text-[11px] font-medium text-slate-600 mt-1 truncate">{label}</span>
              </span>
            </Tappable>
          ))}
        </div>
      )}

      {/* "Scroll" option: Action Queue list */}
      {isQueue && (
        <div className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
          {QUEUE.map(({ key, count, title, hint, tile }, idx) => (
            <Tappable
              key={key}
              id={key}
              onSelect={onSelect}
              className={`w-full flex items-center gap-3 px-3.5 py-3 text-left ${idx < QUEUE.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <span className={`min-w-9 h-9 px-1.5 rounded-xl text-sm font-extrabold flex items-center justify-center shrink-0 tabular-nums ${tile}`}>
                {count}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-[#1E293B] truncate">{title}</span>
                <span className="block text-[11px] text-slate-400 truncate">{hint}</span>
              </span>
              {!NOT_LINKED.has(key) && <ChevronRight className="w-4 h-4 text-[#2F68FE] shrink-0" />}
            </Tappable>
          ))}
        </div>
      )}
    </section>
  );
};
