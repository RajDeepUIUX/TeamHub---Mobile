import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, ChevronDown, ClipboardList, Download, Eye, Loader2, MessageSquarePlus, RotateCcw, Send } from 'lucide-react';
import {
  ClientSurvey,
  SURVEY_TYPE_LABEL,
  SurveyAnswerValue,
  SurveyAnswers,
  SurveyQuestion,
  SurveySection,
  daysLeft,
  formatSurveyDate,
  isAnswered,
  requiredKeys,
  surveySections,
  surveyStatus,
  todayIso,
} from '../data/clientFeedbackData';
import { textareaClass } from '../../profile/reviewFormParts';
import { Card, ConfirmSheet, EmptyCard, FieldGrid } from '../staff/tabs/StaffTabParts';
import { NpsScale, RatingChip, RatingOptions, SurveyScreenHeader, SurveyStatusPill, SurveySubmittedModal, useSurveyToast } from './SurveyParts';

interface SurveyFormViewProps {
  survey: ClientSurvey;
  /** `view` = read-only (completed, expired or assigned to another contact) */
  mode: 'edit' | 'view';
  /** Why the survey is read-only (shown in the footer) */
  viewNote?: string;
  onBack: () => void;
  /** Desktop saves each answer as soon as it changes */
  onAnswer: (answers: SurveyAnswers) => void;
  onSubmit: () => void;
}

const keysOf = (q: SurveyQuestion) => (q.kind === 'ratingGroup' || q.kind === 'textGroup' ? q.items.map((i) => i.id) : [q.id]);

const NotAnswered = () => <p className="text-[11px] italic text-slate-400">Not answered</p>;

export const SurveyFormView: React.FC<SurveyFormViewProps> = ({ survey, mode, viewNote, onBack, onAnswer, onSubmit }) => {
  const readOnly = mode === 'view';
  // Non-breaking space keeps the * on the same line as the last word
  const required = readOnly ? null : <span className="text-rose-500">{' '}*</span>;
  const sections = surveySections(survey);
  const answers = survey.answers;
  const keys = requiredKeys(sections, answers);
  const missing = keys.filter((k) => !isAnswered(answers[k]));
  const done = keys.length - missing.length;
  const pct = keys.length ? Math.round((done / keys.length) * 100) : 0;

  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [openComments, setOpenComments] = useState<string[]>([]);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState<{ answered: string } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [notice, showNotice] = useSurveyToast('bottom-[88px]');
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const set = (key: string, value: SurveyAnswerValue) => {
    onAnswer({ ...answers, [key]: value });
    setSaving('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaving('saved'), 450);
  };

  const scrollToKey = (key: string) => {
    scrollRef.current?.querySelector<HTMLElement>(`[data-q~="${key}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Desktop re-checks expiry on final submit (status 4 = expired)
  const expired = () => {
    if (daysLeft(survey) > 0) return false;
    showNotice('This survey has expired and can no longer be submitted.');
    return true;
  };

  const trySubmit = () => {
    if (expired()) return;
    if (missing.length) {
      setShowErrors(true);
      scrollToKey(missing[0]);
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSubmit = () => {
    setConfirmOpen(false);
    if (expired()) return;
    setSubmitted({ answered: `${done} / ${keys.length}` });
    onSubmit();
  };

  const download = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      showNotice('Survey report (PDF) downloaded.');
    }, 700);
  };

  const subtitle = [survey.staffName, survey.period].filter(Boolean).join(' · ') || 'Northwind CPA';
  const invalid = (key: string) => showErrors && !isAnswered(answers[key]);
  const hasAnswers = Object.keys(answers).length > 0;

  /* ---------- Question bodies ---------- */
  const commentBox = (q: Extract<SurveyQuestion, { kind: 'rating' }>) => {
    const key = `${q.id}_comment`;
    const value = (answers[key] as string | undefined) ?? '';
    if (readOnly) {
      return value ? (
        <p className="mt-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">“{value}”</p>
      ) : null;
    }
    const open = openComments.includes(q.id) || value.length > 0;
    return open ? (
      <textarea
        value={value}
        onChange={(e) => set(key, e.target.value)}
        placeholder="Please write if you have any comment"
        aria-label={`Comment on ${q.title}`}
        className={`${textareaClass} mt-2.5 min-h-20 select-text`}
      />
    ) : (
      <button
        type="button"
        onClick={() => setOpenComments((prev) => [...prev, q.id])}
        className="mt-2 h-9 px-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#2F68FE] rounded-lg active:bg-blue-50/50 transition-colors cursor-pointer"
      >
        <MessageSquarePlus className="w-4 h-4" /> Add a comment (optional)
      </button>
    );
  };

  const textBox = (key: string, label: string) => {
    const value = (answers[key] as string | undefined) ?? '';
    if (readOnly) return value ? <p className="text-xs text-slate-700 leading-relaxed">“{value}”</p> : <NotAnswered />;
    return (
      <textarea
        value={value}
        onChange={(e) => set(key, e.target.value)}
        placeholder="Please write your answer"
        aria-label={label}
        aria-invalid={invalid(key)}
        className={`${textareaClass} select-text ${invalid(key) ? 'border-rose-300' : ''}`}
      />
    );
  };

  const body = (q: SurveyQuestion) => {
    switch (q.kind) {
      case 'rating': {
        const v = answers[q.id] as number | undefined;
        return (
          <>
            {readOnly ? (
              v !== undefined ? <RatingChip value={v} /> : <NotAnswered />
            ) : (
              <RatingOptions name={q.title} value={v} allowNA={q.allowNA} invalid={invalid(q.id)} onChange={(n) => set(q.id, n)} />
            )}
            {commentBox(q)}
          </>
        );
      }
      case 'ratingGroup':
        return (
          <ol className="space-y-3">
            {q.items.map((item, i) => {
              const v = answers[item.id] as number | undefined;
              return (
                <li key={item.id} data-q={item.id} className={i > 0 ? 'pt-3 border-t border-slate-100' : ''}>
                  <p className="mb-2 text-xs font-semibold text-slate-700 leading-snug">
                    {['i', 'ii', 'iii', 'iv', 'v'][i]}. {item.label}
                    {required}
                  </p>
                  {readOnly ? (
                    v !== undefined ? <RatingChip value={v} /> : <NotAnswered />
                  ) : (
                    <RatingOptions name={item.label} value={v} invalid={invalid(item.id)} hint={i === 0} onChange={(n) => set(item.id, n)} />
                  )}
                </li>
              );
            })}
          </ol>
        );
      case 'text':
        return (
          <>
            {q.hint && <p className="mb-2 text-[11px] text-slate-500">{q.hint}</p>}
            {textBox(q.id, q.title)}
          </>
        );
      case 'textGroup':
        return (
          <ol className="space-y-3">
            {q.items.map((item, i) => (
              <li key={item.id} data-q={item.id}>
                <p className="mb-1.5 text-xs font-semibold text-slate-700 leading-snug">
                  {['i', 'ii', 'iii'][i]}. {item.label}
                  {required}
                </p>
                {textBox(item.id, item.label)}
              </li>
            ))}
          </ol>
        );
      case 'nps':
        return <NpsScale value={answers[q.id] as number | undefined} invalid={invalid(q.id)} readOnly={readOnly} onChange={(n) => set(q.id, n)} />;
      case 'tags': {
        const selected = (answers[q.id] as string[] | undefined) ?? [];
        if (readOnly && selected.length === 0) return <NotAnswered />;
        return (
          <div className="flex flex-wrap gap-1.5">
            {(readOnly ? selected : q.options).map((o) => {
              const on = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={on}
                  disabled={readOnly}
                  onClick={() => set(q.id, on ? selected.filter((x) => x !== o) : [...selected, o])}
                  className={`min-h-9 px-3 py-1.5 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-default ${
                    on
                      ? 'bg-blue-50 border-[#2F68FE] text-[#2F68FE]'
                      : `bg-white text-slate-600 active:bg-slate-50 ${invalid(q.id) ? 'border-rose-200' : 'border-slate-200'}`
                  }`}
                >
                  {on && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  {o}
                </button>
              );
            })}
          </div>
        );
      }
    }
  };

  const questionError = (q: SurveyQuestion) => {
    if (!showErrors || readOnly) return null;
    const left = keysOf(q).filter((k) => !isAnswered(answers[k])).length;
    if (!left) return null;
    const msg =
      q.kind === 'rating' || q.kind === 'nps'
        ? 'Please select a rating.'
        : q.kind === 'tags'
          ? 'Please select at least one option.'
          : q.kind === 'text'
            ? 'Please enter your answer.'
            : `${left} ${left === 1 ? 'answer' : 'answers'} still needed.`;
    return (
      <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-rose-500">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        {msg}
      </p>
    );
  };

  const renderSection = (sec: SurveySection) => {
    const na = Boolean(sec.naToggle && answers[sec.naToggle.id] === true);
    return (
      <section key={sec.id} className="space-y-2.5">
        {(sec.title || sec.prompt) && (
          <div className="px-1 pt-1">
            {sec.title && <h3 className="text-sm font-bold text-[#1E293B]">{sec.title}</h3>}
            {sec.prompt && <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">{sec.prompt}</p>}
          </div>
        )}
        {sec.naToggle && (
          <Card className="p-3">
            <p className="px-1 text-[11px] text-slate-500 leading-relaxed">{sec.naToggle.hint}</p>
            <button
              type="button"
              role="checkbox"
              aria-checked={na}
              disabled={readOnly}
              onClick={() => sec.naToggle && set(sec.naToggle.id, !na)}
              className={`mt-2 w-full min-h-11 px-3 py-2 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer disabled:cursor-default ${
                na ? 'bg-blue-50/70' : 'active:bg-slate-50'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  na ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {na && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span className={`text-[13px] ${na ? 'font-semibold text-[#1E293B]' : 'font-medium text-slate-700'}`}>Not Applicable</span>
            </button>
          </Card>
        )}
        {na ? (
          <p className="px-1 text-[11px] text-slate-400">These questions are skipped because you selected “Not Applicable”.</p>
        ) : (
          sec.questions.map((q, i) => {
            const qKeys = keysOf(q);
            const answered = qKeys.every((k) => isAnswered(answers[k]));
            const hasError = showErrors && !readOnly && !answered;
            return (
              <Card key={q.id} className={`p-4 scroll-mt-3 ${hasError ? 'border-rose-300!' : ''}`}>
                <div data-q={qKeys.join(' ')} className="scroll-mt-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#2F68FE] text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {i + 1}
                    </span>
                    <h4 className="flex-1 text-[13px] font-bold leading-snug pt-0.5">
                      {q.title}
                      {required}
                    </h4>
                    {!readOnly && answered && <CheckCircle2 className="w-4.5 h-4.5 text-[#10B981] shrink-0 mt-0.5" aria-label="Answered" />}
                  </div>
                  {q.kind === 'rating' && q.bullets && (
                    <ul className="mt-2 ml-1 space-y-1">
                      {q.bullets.map((b) => (
                        <li key={b} className="flex gap-2 text-[11px] text-slate-500 leading-relaxed">
                          <span className="w-1 h-1 rounded-full bg-slate-300 mt-[7px] shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3">{body(q)}</div>
                  {questionError(q)}
                </div>
              </Card>
            );
          })
        )}
      </section>
    );
  };

  const status = surveyStatus(survey);

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <SurveyScreenHeader
        title={SURVEY_TYPE_LABEL[survey.type]}
        backLabel="Back to Feedback & Evaluation"
        onBack={onBack}
        action={
          !readOnly && hasAnswers ? (
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              aria-label="Reset form"
              title="Reset Form"
              className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-slate-600 active:bg-slate-100 cursor-pointer"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>
          ) : (
            <span className="w-9 h-9 block" />
          )
        }
      />

      {/* Progress (desktop "00 / 00" bar) */}
      {!readOnly && (
        <div className="shrink-0 bg-white border-b border-[#EBF0F7] px-4 py-2.5">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="min-w-0 truncate text-slate-500">
              <strong className="text-[#1E293B] tabular-nums">
                {done} / {keys.length}
              </strong>{' '}
              answered · {subtitle}
            </span>
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold" aria-live="polite">
              {saving === 'saving' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                  <span className="text-slate-400">Saving…</span>
                </>
              ) : saving === 'saved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-slate-500">Saved</span>
                </>
              ) : null}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#2F68FE] rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {readOnly ? (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Survey details</span>
              <SurveyStatusPill status={status} />
            </div>
            <FieldGrid
              compact
              fields={[
                { label: 'Staff Name', value: survey.staffName },
                { label: 'Assigned To', value: survey.assignedTo },
                { label: 'Period', value: survey.period },
                { label: 'Assigned On', value: formatSurveyDate(survey.assignedOn) },
                { label: 'Submitted On', value: survey.submittedOn ? formatSurveyDate(survey.submittedOn) : null },
                { label: 'Answered', value: `${done} / ${keys.length}` },
              ]}
            />
          </Card>
        ) : (
          <div className="flex gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-[#2F68FE] leading-relaxed">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Your answers save automatically. Questions marked * are required.</span>
          </div>
        )}

        {readOnly && !hasAnswers ? (
          <EmptyCard
            icon={ClipboardList}
            title="No answers yet"
            text={`${survey.assignedTo} hasn’t started this survey yet. Answers will show here once they do.`}
          />
        ) : (
          sections.map(renderSection)
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0 z-20">
        {readOnly ? (
          <>
            {viewNote && (
              <p className="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 text-center">
                <Eye className="w-3.5 h-3.5 shrink-0" />
                {viewNote}
              </p>
            )}
            {survey.completed ? (
              <button
                type="button"
                disabled={downloading}
                onClick={download}
                className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors disabled:cursor-wait cursor-pointer"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? 'Preparing PDF…' : 'Download PDF'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="w-full h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 transition-colors cursor-pointer"
              >
                Back to Surveys
              </button>
            )}
          </>
        ) : (
          <>
            {missing.length > 0 && (
              <button
                type="button"
                onClick={() => scrollToKey(missing[0])}
                className="mb-2 w-full flex items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer"
              >
                <span className={showErrors ? 'text-rose-500' : 'text-slate-500'}>
                  {missing.length} {missing.length === 1 ? 'answer' : 'answers'} left
                </span>
                <span className="text-[#2F68FE] font-bold flex items-center">
                  · Next unanswered <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={trySubmit}
              className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              Submit Survey <Send className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {notice}

      <ConfirmSheet
        isOpen={resetOpen}
        title="Reset Form?"
        message="Are you sure you want to reset form?"
        note="All answers and comments in this survey will be cleared."
        confirmLabel="Yes, Reset"
        danger
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false);
          setShowErrors(false);
          setOpenComments([]);
          onAnswer({});
          setSaving('idle');
          scrollRef.current?.scrollTo({ top: 0 });
          showNotice('Form has been successfully reset.');
        }}
      />
      <ConfirmSheet
        isOpen={confirmOpen}
        title="Want to submit this Survey?"
        message="Once submitted, you won’t be able to make any changes. Are you sure you want to submit?"
        confirmLabel="Submit"
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSubmit}
      />
      <SurveySubmittedModal
        open={Boolean(submitted)}
        title={SURVEY_TYPE_LABEL[survey.type]}
        subtitle={subtitle}
        answered={submitted?.answered ?? ''}
        submittedOn={formatSurveyDate(todayIso())}
        onDone={onBack}
      />
    </div>
  );
};
