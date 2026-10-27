import React from 'react';
import { Check, Columns2 } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import {
  CARD_SKILL_LIMIT,
  HubProfile,
  MAX_COMPARE,
  cardSkillsOf,
  cpeLabel,
  cpeMinutes,
  experienceLabel,
  joinsLabel,
  rateLabel,
} from '../data/clientStaffHubData';
import { DomainTile } from './MarketplaceParts';

/** Sticky bar while profiles are picked for comparison (desktop `tm-comparebar`) */
export const CompareBar: React.FC<{ count: number; onClear: () => void; onOpen: () => void }> = ({ count, onClear, onOpen }) => (
  <div className="shrink-0 px-4 pt-3 pb-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 animate-in slide-in-from-bottom-2 fade-in duration-200">
    <div className="flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
        <Columns2 className="w-4 h-4" />
      </span>
      <p className="flex-1 min-w-0 text-xs text-slate-500" role="status">
        <span className="font-bold text-[#1E293B] tabular-nums">{count}</span>{' '}
        <span className="font-bold text-[#1E293B]">{count === 1 ? 'profile selected' : 'profiles selected'}</span>
        {count < 2 && <span className="block text-[11px] text-slate-400">Select one more to compare (up to {MAX_COMPARE}).</span>}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="h-9 px-2.5 -mr-1 rounded-lg text-xs font-bold text-[#2F68FE] active:bg-blue-50/50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
      >
        Clear
      </button>
    </div>
    <button
      type="button"
      onClick={onOpen}
      disabled={count < 2}
      className="mt-2.5 w-full h-11 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
    >
      <Columns2 className="w-4 h-4" />
      Compare Side-by-Side
    </button>
  </div>
);

const ROWS: { label: string; value: (p: HubProfile) => React.ReactNode }[] = [
  { label: 'Domain', value: (p) => p.domain },
  { label: 'Total Experience', value: (p) => experienceLabel(p) || '—' },
  { label: 'Learning Hours', value: (p) => (cpeMinutes(p) > 0 ? cpeLabel(cpeMinutes(p)) : '—') },
  { label: 'Talent Cost', value: (p) => rateLabel(p) },
  { label: 'Work Mode', value: (p) => p.workMode },
  { label: 'Availability', value: (p) => joinsLabel(p.noticeDays) },
  { label: 'Qualifications', value: (p) => p.resume.qualifications.join(', ') || '—' },
  {
    label: 'Key Skills',
    value: (p) => {
      const skills = cardSkillsOf(p);
      if (skills.length === 0) return '—';
      const more = skills.length - CARD_SKILL_LIMIT;
      return (
        <span className="flex flex-wrap gap-1">
          {skills.slice(0, CARD_SKILL_LIMIT).map((s) => (
            <span key={s} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600 leading-snug">
              {s}
            </span>
          ))}
          {more > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-[10px] font-bold text-[#2F68FE] leading-snug" title={skills.slice(CARD_SKILL_LIMIT).join(', ')}>
              +{more}
            </span>
          )}
        </span>
      );
    },
  },
];

interface Props {
  isOpen: boolean;
  profiles: HubProfile[];
  /** Profile page: its own column shows "Currently Viewing" instead of View Details */
  currentId?: string | null;
  canView: boolean;
  onView: (profileId: string) => void;
  onClose: () => void;
}

/** Desktop "Compare Profiles" modal: one column per picked profile, attribute rows below a sticky header */
export const CompareSheet: React.FC<Props> = ({ isOpen, profiles, currentId, canView, onView, onClose }) => {
  const cols = profiles.length >= 3 ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[94%]">
      <SheetHeader
        title="Compare Profiles"
        subtitle={`Side-by-side comparison of ${profiles.length} shortlisted profile${profiles.length === 1 ? '' : 's'}.`}
        onClose={onClose}
      />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className={`sticky top-0 z-10 grid ${cols} gap-2 px-4 pt-3 pb-3 bg-white border-b border-slate-100`}>
          {profiles.map((p) => {
            const current = p.id === currentId;
            return (
              <div key={p.id} className={`min-w-0 p-2.5 rounded-xl border ${current ? 'border-[#2F68FE] bg-blue-50/60' : 'border-slate-100 bg-slate-50'}`}>
                <DomainTile domain={p.domain} size="sm" />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 truncate">{p.domain}</p>
                <p className="mt-0.5 text-xs font-bold text-[#1E293B] leading-snug line-clamp-3 break-words">{p.profile}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-400 tabular-nums"># {p.resumeId}</p>
              </div>
            );
          })}
        </div>

        <dl className="px-4 divide-y divide-slate-100">
          {ROWS.map((row) => (
            <div key={row.label} className="py-3">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{row.label}</dt>
              <div className={`mt-1.5 grid ${cols} gap-2`}>
                {profiles.map((p) => (
                  <dd key={p.id} className="min-w-0 text-xs font-semibold text-[#1E293B] leading-snug break-words tabular-nums">
                    {row.value(p)}
                  </dd>
                ))}
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className={`grid ${cols} gap-2 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0`}>
        {profiles.map((p) =>
          p.id === currentId ? (
            <span key={p.id} className="h-10 rounded-xl bg-blue-50 text-[#2F68FE] text-[11px] font-bold flex items-center justify-center gap-1 text-center leading-tight">
              <Check className="w-3.5 h-3.5 shrink-0" />
              Currently Viewing
            </span>
          ) : canView ? (
            <button
              key={p.id}
              type="button"
              onClick={() => onView(p.id)}
              aria-label={`View details of ${p.profile} (${p.resumeId})`}
              className="h-10 rounded-xl bg-[#2F68FE] text-white text-[11px] font-bold active:bg-[#1D4ED8] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
            >
              View Details
            </button>
          ) : (
            <span key={p.id} />
          ),
        )}
      </div>
    </BottomSheet>
  );
};
