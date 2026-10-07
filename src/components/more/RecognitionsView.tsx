import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  UserRound,
  Briefcase,
  Clock3,
  CalendarDays,
  PenTool,
  MessageSquareQuote,
  Presentation,
  HeartHandshake,
  Lightbulb,
  BookOpenCheck,
} from 'lucide-react';
import { SegmentedTabs } from '../../design-system/components/SegmentedTabs';
import { avatarTint, initialsOf } from '../home/celebrationUtils';
import { Recognition, RecognitionTag } from '../../data/recognitionsData';

const TAG_META: Record<RecognitionTag, { icon: React.ElementType; chip: string }> = {
  'Content Developers': { icon: PenTool, chip: 'bg-indigo-50 text-indigo-600' },
  'Feedback Provider': { icon: MessageSquareQuote, chip: 'bg-sky-50 text-sky-600' },
  Trainer: { icon: Presentation, chip: 'bg-emerald-50 text-emerald-600' },
  Mentor: { icon: HeartHandshake, chip: 'bg-rose-50 text-rose-500' },
  'Quiz Master': { icon: Lightbulb, chip: 'bg-amber-50 text-amber-700' },
  'Knowledge Sharer': { icon: BookOpenCheck, chip: 'bg-violet-50 text-violet-600' },
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });


type Scope = 'my' | 'team';

/* ------------------------------ Illustration ------------------------------ */

const TrophyIllustration: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-44 h-auto" role="img" aria-label="A trophy waiting for its first name">
    <defs>
      <linearGradient id="rec-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#F5F3FF" />
      </linearGradient>
      <linearGradient id="rec-cup" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5B7BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="78" rx="80" ry="60" fill="url(#rec-bg)" />
    <ellipse cx="100" cy="134" rx="46" ry="5" fill="#E0E7FF" />
    {/* Handles */}
    <path d="M70 46c-14 0-18 22 4 30" fill="none" stroke="#A5B4FC" strokeWidth="5" strokeLinecap="round" />
    <path d="M130 46c14 0 18 22-4 30" fill="none" stroke="#C4B5FD" strokeWidth="5" strokeLinecap="round" />
    {/* Cup */}
    <path d="M68 38h64v18c0 20-14 34-32 34S68 76 68 56V38Z" fill="url(#rec-cup)" />
    <path d="M100 52l3.5 7.2 8 1.1-5.8 5.6 1.4 7.9-7.1-3.8-7.1 3.8 1.4-7.9-5.8-5.6 8-1.1L100 52Z" fill="#FFFFFF" opacity="0.92" />
    {/* Stem + base */}
    <rect x="94" y="90" width="12" height="16" rx="2" fill="#A78BFA" />
    <rect x="78" y="106" width="44" height="12" rx="4" fill="#FFFFFF" stroke="#E0E7FF" strokeWidth="2" />
    <rect x="90" y="110" width="20" height="4" rx="2" fill="#E0E7FF" />
    {/* Sparkles */}
    <path d="M40 40l1.8 4.2L46 46l-4.2 1.8L40 52l-1.8-4.2L34 46l4.2-1.8L40 40Z" fill="#A78BFA" opacity="0.75" />
    <path d="M160 70l1.4 3.2L165 74.6l-3.6 1.4L160 79l-1.4-3-3.6-1.4 3.6-1.4L160 70Z" fill="#818CF8" opacity="0.8" />
    <circle cx="34" cy="98" r="2.5" fill="#C4B5FD" />
    <circle cx="170" cy="36" r="2" fill="#A5B4FC" />
  </svg>
);

/* --------------------------------- Screen --------------------------------- */

interface RecognitionsViewProps {
  firstName: string;
  recognitions: Recognition[];
  /** Signed-in user's staff code ("My" list) */
  myCode: string;
  /** Managers also get a Team's tab with every staff member's recognitions */
  isManager: boolean;
  onBack: () => void;
}

/** L&D › Recognitions: staff see only their own; managers switch between their own and all staff (branch is a filter) */
export const RecognitionsView: React.FC<RecognitionsViewProps> = ({ firstName, recognitions, myCode, isManager, onBack }) => {
  const [tab, setTab] = useState<Scope>('my');
  const scope: Scope = isManager ? tab : 'my';

  const scoped = useMemo(
    () => recognitions.filter((r) => (scope === 'my' ? r.staffCode === myCode : r.staffCode !== myCode)),
    [recognitions, scope, myCode]
  );
  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4 relative">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold screen-title">Recognitions</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-8 space-y-3.5">
        {isManager && (
          <SegmentedTabs
            ariaLabel="Recognition view"
            value={tab}
            onChange={setTab}
            options={[
              { id: 'my', label: 'My Recognitions' },
              { id: 'team', label: "Team's" },
            ]}
          />
        )}

        {scoped.length === 0 ? (
          <div className="pt-6 flex flex-col items-center text-center px-4">
            <TrophyIllustration />
            <h2 className="mt-5 text-lg font-extrabold tracking-tight text-[#1E1B4B]">The spotlight's warming up, {firstName} ✨</h2>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              {scope === 'my'
                ? "You haven't been recognized yet. Training, mentoring or building content? The L&D team will add it here."
                : 'No one in your team has been recognized yet. The L&D team adds recognitions here as they come in.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
                {scoped.map((r) => {
                  const { icon: TagIcon, chip } = TAG_META[r.tag];
                  const avatarIdx = r.staffName.length + r.staffCode.charCodeAt(r.staffCode.length - 1);
                  return (
                    <article key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-3.5">
                      <div className="flex items-start gap-3">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(avatarIdx)}`}>
                          {initialsOf(r.staffName)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold truncate">
                            {r.staffName} <span className="font-medium text-slate-400">({r.staffCode})</span>
                          </p>
                          <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold ${chip}`}>
                            <TagIcon className="w-3 h-3" />
                            {r.tag}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`block text-base font-extrabold tabular-nums leading-none ${r.hours ? 'text-[#D97706]' : 'text-slate-300'}`}>
                            {r.hours ?? '—'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">{r.hours === 1 ? 'hour' : 'hours'}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                        <div className="min-w-0">
                          <span className="flex items-center gap-1 text-slate-400">
                            <UserRound className="w-3 h-3" />
                            Reporting Manager
                          </span>
                          <span className="block mt-0.5 font-semibold text-slate-700 truncate">
                            {r.reportingManager} <span className="font-medium text-slate-400">({r.reportingManagerCode})</span>
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Briefcase className="w-3 h-3" />
                            CTM
                          </span>
                          <span className="block mt-0.5 font-semibold text-slate-700 truncate">
                            {r.ctm} <span className="font-medium text-slate-400">({r.ctmCode})</span>
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1 text-slate-400">
                          <CalendarDays className="w-3 h-3" />
                          Recognized on {formatDate(r.recognizedOn)}
                          {r.hours === null && (
                            <span className="ml-auto flex items-center gap-1">
                              <Clock3 className="w-3 h-3" />
                              Hours not tracked
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
          </div>
        )}
      </div>

    </div>
  );
};
