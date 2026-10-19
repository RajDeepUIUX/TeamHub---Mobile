import React, { useEffect, useState } from 'react';
import { ChevronDown, ClipboardCheck, ExternalLink, Info, Loader2, Plus, Trash2, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { Pill, SearchField, SheetHeader } from '../staff/tabs/StaffTabParts';
import {
  ASSESSMENT_MAX,
  AssessmentOption,
  ShortlistedCandidate,
  activeAssignments,
  assessmentsForDomain,
  formatShortDate,
  remainingAssessmentSlots,
} from '../data/clientInterviewsData';
import { InterviewConfirmSheet } from './InterviewParts';

const SAVE_MS = 800;

const LevelTags: React.FC<{ levels: string[] }> = ({ levels }) => (
  <>
    {levels.map((l) => (
      <span key={l} className="px-1.5 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold">
        {l}
      </span>
    ))}
  </>
);

const metaOf = (a: AssessmentOption) => `${a.questions} Qs (${a.questionTypes}) · ${a.duration}`;

interface AssignProps {
  isOpen: boolean;
  /** Candidates picked on the list (one for the row "Assign" button, several for "Request Assessment") */
  candidates: ShortlistedCandidate[];
  onClose: () => void;
  /** candidate id → chosen assessment ids (candidates with no pick are left out) */
  onAssign: (picks: Record<string, string[]>) => void;
}

/**
 * Desktop "Assign Assessments" offcanvas: up to {ASSESSMENT_MAX} assessments per candidate, searchable list, assigned /
 * completed ones locked, "Remove candidate" when several are selected, one Assign button at the end.
 */
export const AssessmentAssignSheet: React.FC<AssignProps> = ({ isOpen, candidates, onClose, onAssign }) => {
  const [ids, setIds] = useState<string[]>([]);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIds(candidates.map((c) => c.id));
    setPicked({});
    setOpenId(candidates.length === 1 ? candidates[0].id : null);
    setQuery('');
    setRemoveId(null);
    setSaving(false);
  }, [isOpen]);

  const list = ids.map((id) => candidates.find((c) => c.id === id)).filter((c): c is ShortlistedCandidate => Boolean(c));
  const total = list.reduce((s, c) => s + (picked[c.id]?.length ?? 0), 0);

  const toggle = (c: ShortlistedCandidate, assessmentId: string) =>
    setPicked((p) => {
      const cur = p[c.id] ?? [];
      if (cur.includes(assessmentId)) return { ...p, [c.id]: cur.filter((x) => x !== assessmentId) };
      if (cur.length >= remainingAssessmentSlots(c)) return p;
      return { ...p, [c.id]: [...cur, assessmentId] };
    });

  const submit = () => {
    if (!total || saving) return;
    setSaving(true);
    setTimeout(() => onAssign(Object.fromEntries(Object.entries(picked).filter(([, v]) => v.length > 0))), SAVE_MS);
  };

  const close = saving ? () => undefined : onClose;
  const removing = list.find((c) => c.id === removeId) ?? null;

  const card = (c: ShortlistedCandidate) => {
    const remaining = remainingAssessmentSlots(c);
    const mine = picked[c.id] ?? [];
    const options = assessmentsForDomain(c.domain);
    const taken = new Map(activeAssignments(c).map((a) => [a.assessmentId, a.status]));
    const isOpenCard = openId === c.id;
    const q = query.trim().toLowerCase();
    const shown = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;
    const full = mine.length >= remaining;

    return (
      <section key={c.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-3.5 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#1E293B] truncate">{c.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{c.profile}</p>
            <p className="mt-1.5 text-[11px] font-semibold text-[#2F68FE] tabular-nums">
              {mine.length}/{remaining} Assessments Selected
            </p>
          </div>
          {mine.length > 0 && (
            <button
              type="button"
              onClick={() => setPicked((p) => ({ ...p, [c.id]: [] }))}
              aria-label={`Clear selection for ${c.name}`}
              className="w-9 h-9 rounded-full flex items-center justify-center text-rose-500 active:bg-rose-50 cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {list.length > 1 && (
            <button
              type="button"
              onClick={() => setRemoveId(c.id)}
              aria-label={`Remove ${c.name}`}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-3.5 pb-3.5">
          <button
            type="button"
            onClick={() => {
              setOpenId(isOpenCard ? null : c.id);
              setQuery('');
            }}
            aria-expanded={isOpenCard}
            className={`w-full h-11 px-3.5 rounded-xl border bg-white flex items-center justify-between text-xs font-medium cursor-pointer ${
              isOpenCard ? 'border-[#2F68FE] ring-4 ring-blue-50' : 'border-slate-200'
            }`}
          >
            <span className={mine.length ? 'font-semibold text-slate-700' : 'text-slate-400'}>
              {mine.length ? `${mine.length} ${mine.length === 1 ? 'Assessment' : 'Assessments'} Selected` : 'Select Assessments'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpenCard ? 'rotate-180' : ''}`} />
          </button>

          {isOpenCard && (
            <div className="mt-2.5 space-y-2">
              <SearchField variant="sheet" value={query} onChange={setQuery} placeholder="Search assessments" />
              {shown.length === 0 ? (
                <p className="px-3 py-4 rounded-xl bg-slate-50 text-center text-[11.5px] text-slate-500">No assessments available.</p>
              ) : (
                <ul className="rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden" role="listbox" aria-multiselectable="true">
                  {shown.map((o) => {
                    const state = taken.get(o.id);
                    const on = mine.includes(o.id);
                    const disabled = Boolean(state) || (!on && full);
                    return (
                      <li key={o.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={on}
                          disabled={disabled}
                          onClick={() => toggle(c, o.id)}
                          className={`w-full px-3 py-2.5 flex items-start gap-3 text-left cursor-pointer disabled:cursor-not-allowed ${on ? 'bg-[#EFF6FF]' : 'bg-white active:bg-slate-50'} ${disabled ? 'opacity-55' : ''}`}
                        >
                          <span
                            className={`mt-0.5 w-[18px] h-[18px] rounded-md border flex items-center justify-center shrink-0 ${
                              on ? 'bg-[#2F68FE] border-[#2F68FE]' : 'border-slate-300 bg-white'
                            }`}
                            aria-hidden="true"
                          >
                            {on && <span className="block w-2 h-1 -mt-0.5 border-l-2 border-b-2 border-white -rotate-45" />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[12.5px] font-bold text-[#1E293B]">{o.name}</span>
                              {state && <Pill tone={state === 'Completed' ? 'green' : 'indigo'}>{state === 'Completed' ? 'Completed' : 'Assigned'}</Pill>}
                            </span>
                            <span className="mt-1 flex items-center gap-1.5 flex-wrap text-[10.5px] text-slate-500">
                              <LevelTags levels={o.level} />
                              <span>{metaOf(o)}</span>
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {full && remaining > 0 && (
                <p className="px-0.5 text-[10.5px] text-slate-400">You can assign up to {remaining} more {remaining === 1 ? 'assessment' : 'assessments'} to this candidate.</p>
              )}
            </div>
          )}

          {mine.length > 0 && (
            <ul className="mt-2.5 space-y-2">
              {mine.map((id) => {
                const o = options.find((x) => x.id === id);
                if (!o) return null;
                return (
                  <li key={id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12px] font-bold text-[#1E293B]">{o.name}</span>
                      <span className="mt-1 flex items-center gap-1.5 flex-wrap text-[10.5px] text-slate-500">
                        <LevelTags levels={o.level} />
                        <span>{metaOf(o)}</span>
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(c, id)}
                      aria-label={`Remove ${o.name}`}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-200 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    );
  };

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={close} maxHeight="max-h-[94%]">
        <SheetHeader title="Assign Assessments" subtitle={list.length > 1 ? `${list.length} candidates` : list[0]?.name} onClose={close} />
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-3.5">
          <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-[#1D4ED8] leading-snug">
            <Info className="w-4 h-4 shrink-0 mt-px" />
            Select and assign specialized technical assessments to evaluate candidate proficiency. You may assign up to {ASSESSMENT_MAX === 2 ? 'two' : ASSESSMENT_MAX} assessments per
            candidate to ensure a comprehensive skill validation tailored to their specific job profile.
          </p>
          {list.map(card)}
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={total === 0 || saving}
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Assigning…' : total > 0 ? `Assign (${total})` : 'Assign'}
          </button>
        </div>
      </BottomSheet>

      <InterviewConfirmSheet
        isOpen={Boolean(removing)}
        title="Remove Candidate?"
        message="You are about to remove this candidate from the assessment list. Their pending assessment selections will be cleared."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) {
            setIds((x) => x.filter((id) => id !== removeId));
            setPicked((p) => {
              const { [removeId]: _drop, ...rest } = p;
              return rest;
            });
          }
          setRemoveId(null);
        }}
      />
    </>
  );
};

interface ProgressProps {
  isOpen: boolean;
  candidate: ShortlistedCandidate | null;
  /** `add` permission and a free assessment slot */
  canAssignMore: boolean;
  /** `download` permission: report and proctored video links */
  canOpenFiles: boolean;
  onClose: () => void;
  onAssignMore: () => void;
  onOpenFile: (label: string) => void;
}

/** Desktop "Assessment Progress Details": Staff, Resume ID, Applied Profile + one row per assessment */
export const AssessmentProgressSheet: React.FC<ProgressProps> = ({ isOpen, candidate, canAssignMore, canOpenFiles, onClose, onAssignMore, onOpenFile }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[92%]">
    <SheetHeader title="Assessment Progress Details" subtitle={candidate?.name} onClose={onClose} />
    {candidate && (
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-3.5">
        <dl className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="min-w-0">
            <dt className="text-[10.5px] text-slate-400">Staff</dt>
            <dd className="mt-0.5 text-[12px] font-bold text-[#1E293B] break-words">{candidate.name}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10.5px] text-slate-400">Resume ID</dt>
            <dd className="mt-0.5 text-[12px] font-bold text-[#1E293B] break-words tabular-nums">{candidate.resumeId}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10.5px] text-slate-400">Applied Profile</dt>
            <dd className="mt-0.5 text-[12px] font-bold text-[#1E293B] break-words">{candidate.profile}</dd>
          </div>
        </dl>

        {candidate.assessments.length === 0 ? (
          <p className="px-3 py-8 rounded-2xl bg-slate-50 text-center text-[12px] text-slate-500">No assessments assigned yet.</p>
        ) : (
          <ul className="space-y-3">
            {candidate.assessments.map((a) => (
              <li key={a.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-start gap-2">
                  <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold text-[#1E293B]">{a.name}</span>
                    <span className="block text-[11px] text-slate-500">Assigned on {formatShortDate(a.assignedOn)}</span>
                  </span>
                  <Pill tone={a.status === 'Completed' ? 'green' : 'amber'}>{a.status}</Pill>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-[10.5px] text-slate-400">Score (%)</dt>
                    <dd className="mt-0.5 text-[13px] font-bold text-[#1E293B] tabular-nums">{a.scorePct !== undefined ? `${a.scorePct}%` : '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] text-slate-400">Result</dt>
                    <dd className="mt-0.5">{a.result ? <Pill tone={a.result === 'Pass' ? 'green' : 'rose'}>{a.result}</Pill> : <span className="text-[13px] font-bold text-slate-400">-</span>}</dd>
                  </div>
                </dl>
                {canOpenFiles && (a.hasReport || a.hasVideo) && (
                  <div className="mt-3 flex items-center gap-2">
                    {a.hasReport && (
                      <button
                        type="button"
                        onClick={() => onOpenFile(`${a.name} report`)}
                        className="h-8 px-3 rounded-lg border border-slate-200 text-[11px] font-bold text-[#2F68FE] flex items-center gap-1.5 active:bg-slate-50 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Report
                      </button>
                    )}
                    {a.hasVideo && (
                      <button
                        type="button"
                        onClick={() => onOpenFile(`${a.name} proctored video`)}
                        className="h-8 px-3 rounded-lg border border-slate-200 text-[11px] font-bold text-[#2F68FE] flex items-center gap-1.5 active:bg-slate-50 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Proctored Video
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="px-0.5 text-[11px] text-slate-400">
          {ASSESSMENT_MAX} assessments can be active per candidate. Assessments completed more than a year ago free up a slot.
        </p>
      </div>
    )}
    <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0 space-y-2.5">
      {candidate && canAssignMore && (
        <button
          type="button"
          onClick={onAssignMore}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Assign more ({remainingAssessmentSlots(candidate)} left)
        </button>
      )}
      <button type="button" onClick={onClose} className="w-full h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
        Close
      </button>
    </div>
  </BottomSheet>
);
