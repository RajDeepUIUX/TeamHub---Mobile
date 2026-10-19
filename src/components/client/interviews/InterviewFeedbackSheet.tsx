import React, { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, FileText, Info, Loader2, Lock, User } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import {
  CandidateFeedback,
  FeedbackResult,
  RATING_LABELS,
  ShortlistedCandidate,
  criteriaFor,
  formatShortDate,
  isoOfDate,
  resultsFor,
} from '../data/clientInterviewsData';

interface Props {
  isOpen: boolean;
  candidate: ShortlistedCandidate | null;
  /** `add` permission: without it the form is view-only */
  canSubmit: boolean;
  onClose: () => void;
  onSave: (candidateId: string, feedback: CandidateFeedback) => void;
}

const SAVE_MS = 700;
const REQUIRED = 'This field is required.';

const errorText = (e?: string) => (e ? <p className="px-0.5 text-[11px] font-medium text-rose-500">{e}</p> : null);

/**
 * Desktop "Interview Feedback" offcanvas. Hub candidates: 5 ratings + feedback + Interview Result (Hired / Not Selected;
 * hidden while the interview is only scheduled, locked to the status once decided). Recruiter candidates: 8 ratings +
 * feedback + Status (Selected / Rejected). Saved feedback is read-only.
 */
export const InterviewFeedbackSheet: React.FC<Props> = ({ isOpen, candidate, canSubmit, onClose, onSave }) => {
  const [ratings, setRatings] = useState<number[]>([]);
  const [comment, setComment] = useState('');
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [errors, setErrors] = useState<{ ratings: boolean[]; comment: string; result: string }>({ ratings: [], comment: '', result: '' });
  const [hintOpen, setHintOpen] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const source = candidate?.source ?? 'hub';
  const criteria = criteriaFor(source);
  const saved = candidate?.feedback ?? null;
  const readOnly = Boolean(saved) || !canSubmit;
  const decided = candidate?.status === 'Hired' || candidate?.status === 'Not Selected';
  // Hub: no result while the interview is only scheduled; recruiter: always asked
  const resultShown = source === 'recruiter' || candidate?.status !== 'Interview Scheduled';
  const resultLocked = source === 'hub' && decided && !saved;
  const resultLabel = source === 'hub' ? 'Interview Result' : 'Status';
  const rated = ratings.filter((r) => r > 0).length;
  const average = rated ? (ratings.reduce((a, b) => a + b, 0) / rated).toFixed(1) : '';

  useEffect(() => {
    if (!isOpen || !candidate) return;
    const fb = candidate.feedback;
    setRatings(fb ? fb.ratings : criteria.map(() => 0));
    setComment(fb?.comment ?? '');
    setResult(fb ? fb.result : source === 'hub' && decided ? (candidate.status as FeedbackResult) : null);
    setErrors({ ratings: [], comment: '', result: '' });
    setHintOpen(null);
    setSaving(false);
  }, [isOpen, candidate?.id]);

  const setRating = (i: number, v: number) => {
    setRatings((r) => r.map((x, idx) => (idx === i ? v : x)));
    setErrors((e) => ({ ...e, ratings: e.ratings.map((x, idx) => (idx === i ? false : x)) }));
  };

  const submit = () => {
    if (!candidate || readOnly || saving) return;
    const next = {
      ratings: ratings.map((r) => r < 1),
      comment: comment.trim() ? '' : REQUIRED,
      result: resultShown && !result ? REQUIRED : '',
    };
    setErrors(next);
    if (next.ratings.some(Boolean) || next.comment || next.result) return;
    setSaving(true);
    setTimeout(() => {
      onSave(candidate.id, { ratings, comment: comment.trim(), result: resultShown ? result : null, submittedOn: isoOfDate(new Date()) });
    }, SAVE_MS);
  };

  const close = saving ? () => undefined : onClose;

  return (
    <BottomSheet isOpen={isOpen} onClose={close} maxHeight="max-h-[92%]">
      <SheetHeader title="Interview Feedback" subtitle={candidate ? `${candidate.name} · ${candidate.profile}` : undefined} onClose={close} />

      {candidate && (
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
          {saved ? (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#E8F8F0] border border-[#A7F3D0]">
              <span className="w-8 h-8 shrink-0 rounded-full bg-white flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-800">Feedback submitted</p>
                <p className="mt-0.5 text-[11px] font-medium text-emerald-700 leading-snug">
                  Submitted on {formatShortDate(saved.submittedOn)}. It can’t be edited.
                </p>
              </div>
            </div>
          ) : !canSubmit ? (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-100">
              <span className="w-8 h-8 shrink-0 rounded-full bg-white flex items-center justify-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <p className="self-center text-[11.5px] font-semibold text-slate-600 leading-snug">Your role can view feedback but not add it.</p>
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-px rounded-2xl bg-slate-100 border border-slate-100 overflow-hidden">
            <div className="min-w-0 p-3.5 bg-slate-50">
              <dt className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-400">
                {source === 'hub' ? <FileText className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {source === 'hub' ? 'Resume ID' : 'Candidate'}
              </dt>
              <dd className="mt-1 text-[13px] font-bold text-[#1E293B] truncate">{source === 'hub' ? candidate.resumeId : candidate.name}</dd>
            </div>
            <div className="min-w-0 p-3.5 bg-slate-50">
              <dt className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-400">
                <Briefcase className="w-3 h-3" />
                Applied Position
              </dt>
              <dd className="mt-1 text-[13px] font-bold text-[#1E293B] truncate">{candidate.profile}</dd>
            </div>
          </dl>

          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#1D4ED8]">Interview Evaluation</h3>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10.5px] font-bold text-slate-600 tabular-nums">
                {readOnly && average ? `Avg ${average}` : `${rated}/${criteria.length} rated`}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#2F68FE] transition-all duration-300" style={{ width: `${(rated / Math.max(criteria.length, 1)) * 100}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 leading-snug">
              {RATING_LABELS.map((l, i) => `${i + 1} ${l}`).join(' · ')}
            </p>
          </div>

          <div className="space-y-3">
            {criteria.map((c, i) => {
              const value = ratings[i] || 0;
              const invalid = Boolean(errors.ratings[i]);
              return (
                <div
                  key={c.label}
                  role="radiogroup"
                  aria-label={c.label}
                  aria-invalid={invalid || undefined}
                  className={`p-3.5 rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${invalid ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-bold tabular-nums ${
                        value ? 'bg-[#EFF6FF] text-[#2F68FE]' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0 text-[13px] font-bold text-[#1E293B] leading-tight">
                      {c.label}
                      {!readOnly && <span className="text-rose-500"> *</span>}
                    </span>
                    {value > 0 && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[10.5px] font-bold text-[#2F68FE]">
                        {RATING_LABELS[value - 1]}
                      </span>
                    )}
                    {c.hint && (
                      <button
                        type="button"
                        onClick={() => setHintOpen(hintOpen === i ? null : i)}
                        aria-expanded={hintOpen === i}
                        aria-label={`About ${c.label}`}
                        className={`w-7 h-7 shrink-0 -mr-1 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                          hintOpen === i ? 'bg-[#EFF6FF] text-[#2F68FE]' : 'text-slate-400 active:bg-slate-100'
                        }`}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {hintOpen === i && c.hint && (
                    <p className="mt-2.5 px-3 py-2 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] text-[#1D4ED8] leading-snug">{c.hint}</p>
                  )}
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((v) => {
                      const on = value === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          aria-label={`${v} (${RATING_LABELS[v - 1]})`}
                          disabled={readOnly}
                          onClick={() => setRating(i, v)}
                          className={`h-11 rounded-xl text-sm font-bold tabular-nums transition-all border ${
                            on
                              ? 'bg-[#2F68FE] border-[#2F68FE] text-white shadow-[0_4px_10px_rgba(47,104,254,0.3)]'
                              : readOnly
                                ? 'bg-slate-50 border-transparent text-slate-300'
                                : invalid
                                  ? 'bg-white border-rose-200 text-slate-500'
                                  : 'bg-slate-50 border-slate-100 text-slate-500 active:bg-slate-100'
                          } ${readOnly ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-1.5 flex justify-between px-0.5 text-[10px] font-medium text-slate-400">
                    <span>{RATING_LABELS[0]}</span>
                    <span>{RATING_LABELS[4]}</span>
                  </div>
                  {invalid && <div className="mt-1">{errorText(REQUIRED)}</div>}
                </div>
              );
            })}
          </div>

          <label className="block space-y-1.5">
            <span className="block text-xs font-bold text-[#1E293B]">
              Interview Feedback{!readOnly && <span className="text-rose-500"> *</span>}
            </span>
            <textarea
              rows={5}
              value={comment}
              readOnly={readOnly}
              onChange={(e) => {
                setComment(e.target.value);
                setErrors((x) => ({ ...x, comment: '' }));
              }}
              placeholder="Enter your feedback for this interview"
              aria-invalid={Boolean(errors.comment)}
              className={`w-full px-3.5 py-3 bg-white border rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text resize-none leading-relaxed ${
                errors.comment ? 'border-rose-300' : 'border-slate-200'
              } ${readOnly ? 'bg-slate-50' : ''}`}
            />
            {errorText(errors.comment)}
          </label>

          {resultShown && (
            <div role="radiogroup" aria-label={resultLabel} className="space-y-1.5">
              <span className="block text-xs font-bold text-[#1E293B]">
                {resultLabel}
                {!readOnly && !resultLocked && <span className="text-rose-500"> *</span>}
              </span>
              <div className="grid grid-cols-2 gap-3">
                {resultsFor(source).map((r) => {
                  const on = result === r;
                  const positive = r === 'Hired' || r === 'Selected';
                  const disabled = readOnly || resultLocked;
                  return (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={disabled}
                      onClick={() => {
                        setResult(r);
                        setErrors((x) => ({ ...x, result: '' }));
                      }}
                      className={`h-11 rounded-xl border text-xs font-bold transition-colors ${
                        on
                          ? positive
                            ? 'bg-[#E8F8F0] border-[#10B981] text-[#059669]'
                            : 'bg-[#FEF2F2] border-rose-400 text-rose-600'
                          : 'bg-white border-slate-200 text-slate-600'
                      } ${disabled ? 'cursor-default' : 'cursor-pointer active:bg-slate-50'} ${disabled && !on ? 'opacity-50' : ''}`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              {resultLocked && (
                <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Lock className="w-3 h-3" />
                  Locked to the candidate’s current status.
                </p>
              )}
              {errorText(errors.result)}
            </div>
          )}
        </div>
      )}

      {candidate && !readOnly ? (
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
            disabled={saving}
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer disabled:opacity-80 disabled:cursor-wait"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save Feedback'}
          </button>
        </div>
      ) : (
        <div className="p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
          <button type="button" onClick={onClose} className="w-full h-12 rounded-xl bg-slate-100 text-[#1E293B] text-xs font-bold active:bg-slate-200 cursor-pointer">
            Close
          </button>
        </div>
      )}
    </BottomSheet>
  );
};
