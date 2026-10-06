import React from 'react';
import { BarChart3, FileText, CheckCircle2, GraduationCap, ClipboardList } from 'lucide-react';

interface OverviewItem {
  value: number;
  label: string;
  icon: React.ElementType;
  /** Icon tile background + icon colour */
  tile: string;
}

const ITEMS: OverviewItem[] = [
  { value: 1, label: 'Open Tickets', icon: FileText, tile: 'bg-pink-50 text-pink-600' },
  { value: 1, label: 'Pending Approval', icon: CheckCircle2, tile: 'bg-emerald-50 text-emerald-600' },
  { value: 0, label: 'L&D Hours', icon: GraduationCap, tile: 'bg-blue-50 text-blue-600' },
  { value: 50, label: 'Policies Updated', icon: ClipboardList, tile: 'bg-violet-50 text-violet-600' },
];

interface OverviewTasksProps {
  onSelect: (label: string) => void;
}

export const OverviewTasks: React.FC<OverviewTasksProps> = ({ onSelect }) => (
  <section>
    {/* Section header */}
    <div className="flex items-center gap-2 mb-2.5 px-0.5">
      <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">
        <BarChart3 className="w-3.5 h-3.5" />
      </span>
      <h3 className="text-sm font-bold text-[#1E293B]">Overview &amp; Tasks</h3>
    </div>

    {/* One card split into a 2×2 grid */}
    <div className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs grid grid-cols-2 overflow-hidden">
      {ITEMS.map(({ value, label, icon: Icon, tile }, idx) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(label)}
          className={`p-3.5 flex items-center gap-3 text-left active:bg-slate-50 transition-colors cursor-pointer ${
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
  </section>
);
