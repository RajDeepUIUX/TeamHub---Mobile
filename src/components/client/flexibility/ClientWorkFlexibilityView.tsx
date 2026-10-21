import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Info, Lock, Pencil, Plus, Send, Sparkles, TrendingUp, X } from 'lucide-react';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { ScreenHeader, Card, ConfirmSheet } from '../staff/tabs/StaffTabParts';
import { StaffSkeleton } from '../staff/ClientStaffParts';
import {
  ArrangementKey,
  ArrangementStaff,
  FLEX_ADOPTION_PCT,
  FlexKey,
  FlexModeKey,
  WORK_FLEX_ARRANGEMENTS,
  WORK_FLEX_ITEMS,
  WORK_FLEX_MODES,
  WORK_FLEX_TIMINGS,
  WORK_FLEX_TOTAL_QUESTIONS,
  WorkFlexItem,
  WorkFlexMode,
  WorkFlexPreferences,
  WorkFlexStaff,
  YesNo,
  answeredCount,
  emptyArrangements,
  flexCounts,
  formatFlexDate,
  modeStaffCount,
} from '../data/clientWorkFlexData';
import { AllowToggle } from './WorkFlexParts';
import { AssignTarget, WorkFlexAssignSheet } from './WorkFlexAssignSheet';
import { WorkFlexAllowSheet } from './WorkFlexAllowSheet';
import { useClientPermission } from '../context/ClientPermissionContext';
import { WorkFlexReviewSheet } from './WorkFlexReviewSheet';

interface Props {
  prefs: WorkFlexPreferences;
  staff: WorkFlexStaff[];
  /** Signed-in client contact (stamped on save) */
  userName: string;
  onChange: React.Dispatch<React.SetStateAction<WorkFlexPreferences>>;
  /** Header back arrow (Dashboard) */
  onBack?: () => void;
}

/** Desktop page loader "Loading preferences…" */
const LOAD_MS = 600;
const SAVED_MESSAGE = 'Preferences saved successfully.';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const PageSkeleton: React.FC = () => (
  <div className="px-4 mt-4 space-y-3" aria-busy="true" aria-label="Loading preferences">
    <StaffSkeleton className="w-full h-20 rounded-2xl" />
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white border border-[#DCE3ED] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <StaffSkeleton className="w-11 h-11 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <StaffSkeleton className="w-32 h-3.5" />
            <StaffSkeleton className="w-full h-3" />
          </div>
        </div>
        <StaffSkeleton className="w-full h-11 rounded-xl" />
      </div>
    ))}
  </div>
);

/** Left accent rail: green = allowed, slate = not allowed, amber = still to answer */
const railClass = (v: YesNo | null) =>
  v === 'yes' ? 'border-[#EBF0F7] border-l-[#10B981]' : v === 'no' ? 'border-[#EBF0F7] border-l-[#94A3B8]' : 'border-[#EBF0F7] border-l-[#FBBF24]';

const StaffTag: React.FC<{ staff: WorkFlexStaff; onRemove?: () => void }> = ({ staff, onRemove }) => (
  <span className={`inline-flex items-center gap-1.5 h-7 pl-1 ${onRemove ? 'pr-0.5' : 'pr-2.5'} rounded-full bg-white border border-[#EBF0F7] max-w-full`}>
    <span className={`w-5 h-5 rounded-full text-[8px] font-bold flex items-center justify-center shrink-0 ${avatarTint(staff.tint)}`} aria-hidden="true">
      {initialsOf(staff.name)}
    </span>
    <span className="text-[11px] font-semibold text-[#1E293B] truncate">{staff.name}</span>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${staff.name}`}
        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 shrink-0 cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </span>
);

export const ClientWorkFlexibilityView: React.FC<Props> = ({ prefs, staff, userName, onChange, onBack }) => {
  // Without `is_edit` the page is view only (desktop shows the form, saves are refused)
  const readOnly = !useClientPermission('work-flexibility').edit;
  const [loading, setLoading] = useState(true);
  const [noteOpen, setNoteOpen] = useState(false);
  const [openDesc, setOpenDesc] = useState<FlexKey | null>(null);

  const [assign, setAssign] = useState<AssignTarget | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [flexKey, setFlexKey] = useState<FlexKey | null>(null);
  const [flexOpen, setFlexOpen] = useState(false);
  const [confirmOff, setConfirmOff] = useState<FlexModeKey | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  const stamp = { savedAt: todayIso(), savedBy: userName || null };
  const staffById = (id: string) => staff.find((s) => s.id === id);
  const answered = answeredCount(prefs);
  const dirty = Boolean(prefs.unsubmitted);
  const allDone = answered === WORK_FLEX_TOTAL_QUESTIONS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const questions = [
    ...WORK_FLEX_MODES.map((m) => ({ id: `wf-q-${m.key}`, label: m.title, value: prefs.modes[m.key].offer })),
    ...WORK_FLEX_ITEMS.map((f) => ({ id: `wf-q-${f.key}`, label: f.name, value: prefs.flex[f.key].default })),
  ];
  const goToQuestion = (id: string) => {
    scrollRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  /* ------------------------------- Modes ------------------------------- */

  const applyOffer = (key: FlexModeKey, value: YesNo | null) => {
    onChange((p) => ({
      ...p,
      unsubmitted: true,
      modes: {
        ...p.modes,
        [key]: { offer: value, arrangements: value === 'no' ? emptyArrangements() : p.modes[key].arrangements },
      },
    }));
  };

  const setOffer = (key: FlexModeKey, v: YesNo) => {
    const current = prefs.modes[key];
    if (current.offer === v) return applyOffer(key, null);
    if (v === 'no' && modeStaffCount(current) > 0) return setConfirmOff(key);
    applyOffer(key, v);
  };

  const removeFromArrangement = (mode: FlexModeKey, arr: ArrangementKey, id: string) => {
    onChange((p) => {
      const nextArr = { ...p.modes[mode].arrangements[arr] };
      delete nextArr[id];
      return {
        ...p,
        unsubmitted: true,
        modes: { ...p.modes, [mode]: { ...p.modes[mode], arrangements: { ...p.modes[mode].arrangements, [arr]: nextArr } } },
      };
    });
  };

  const saveArrangement = (target: AssignTarget, assigned: ArrangementStaff) => {
    onChange((p) => ({
      ...p,
      ...stamp,
      modes: {
        ...p.modes,
        [target.mode]: {
          offer: p.modes[target.mode].offer ?? 'yes',
          arrangements: { ...p.modes[target.mode].arrangements, [target.arrangement]: assigned },
        },
      },
    }));
    setAssignOpen(false);
    showToast(SAVED_MESSAGE);
  };

  /* --------------------------- Flexibilities --------------------------- */

  const openFlex = (key: FlexKey) => {
    setFlexKey(key);
    setFlexOpen(true);
  };

  const setFlexNotAllowed = (item: WorkFlexItem) => {
    onChange((p) => {
      const c = p.flex[item.key];
      const next = c.default === 'no' ? null : 'no';
      const perStaff = next === 'no' && !item.needsTiming ? Object.fromEntries(staff.map((s) => [s.id, 'no' as YesNo])) : c.perStaff;
      return { ...p, unsubmitted: true, flex: { ...p.flex, [item.key]: { ...c, default: next, perStaff } } };
    });
  };

  /* ------------------------------ Render ------------------------------- */

  const renderMode = (m: WorkFlexMode) => {
    const s = prefs.modes[m.key];
    const isOpen = s.offer === 'yes';
    const count = modeStaffCount(s);
    const Icon = m.icon;
    return (
      <div key={m.key} id={`wf-q-${m.key}`}>
      <Card className={`overflow-hidden transition-colors border-l-4 ${railClass(s.offer)}`}>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] ${m.tint}`}>
              <Icon className="w-6 h-6" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-bold text-[#1E293B] leading-tight">{m.title}</h2>
              {isOpen ? (
                <span className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#E8F8F0] text-[#059669] text-[10.5px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  {count === 0 ? 'Active — no staff yet' : `Configured for ${count} staff`}
                </span>
              ) : s.offer === 'no' ? (
                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10.5px] font-bold">Not offering</span>
              ) : (
                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-md bg-[#FFF7E6] text-[#B45309] text-[10.5px] font-bold">Needs your answer</span>
              )}
            </div>
          </div>
          <p className="mt-3 text-[13px] font-medium text-slate-600 leading-snug">{m.question}</p>
          <div className="mt-3">
            <AllowToggle value={s.offer} onChange={(v) => setOffer(m.key, v)} label={m.title} disabled={readOnly} />
          </div>
        </div>

        {isOpen && (
          <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-[#F8FAFC] animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="text-[11.5px] text-slate-500 leading-relaxed">
              Assign your staff to the arrangement that applies. Each staff member can be in one arrangement per mode.
            </p>
            <ul className="mt-2.5 space-y-2">
              {WORK_FLEX_ARRANGEMENTS.map((a) => {
                const map = s.arrangements[a.key];
                const members = Object.keys(map)
                  .map((id) => staffById(id))
                  .filter((x): x is WorkFlexStaff => Boolean(x));
                const has = members.length > 0;
                const ArrIcon = a.icon;
                const groups =
                  m.key === 'hyb'
                    ? [
                        { label: 'Split by Days', dot: 'bg-[#2F68FE]', list: members.filter((x) => map[x.id] === 'days') },
                        { label: 'Split by Hours', dot: 'bg-[#A855F7]', list: members.filter((x) => map[x.id] === 'hours') },
                      ].filter((g) => g.list.length > 0)
                    : [{ label: '', dot: '', list: members }];
                return (
                  <li key={a.key} className={`rounded-2xl border bg-white ${has ? 'border-[#BFDBFE]' : 'border-[#EBF0F7]'}`}>
                    <div className="p-3 flex items-start gap-2.5">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.tint}`}>
                        <ArrIcon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold text-[#1E293B]">{a.name}</span>
                        <span className="block text-[11px] text-slate-500 leading-snug">{a.desc}</span>
                      </span>
                      {!readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setAssign({ mode: m.key, arrangement: a.key });
                          setAssignOpen(true);
                        }}
                        aria-label={has ? `Edit ${a.name} staff` : `Assign staff to ${a.name}`}
                        className={`shrink-0 h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          has
                            ? 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#2F68FE] active:bg-blue-100'
                            : 'bg-[#2F68FE] text-white active:bg-[#1D4ED8]'
                        }`}
                      >
                        {has ? <Pencil className="w-3 h-3" /> : <Plus className="w-3.5 h-3.5" />}
                        {has ? `Edit · ${members.length}` : 'Assign'}
                      </button>
                      )}
                    </div>
                    {has && (
                      <div className="px-3 pb-3 pt-2.5 border-t border-dashed border-slate-200 space-y-2">
                        <p className="text-[11px] font-semibold text-slate-400">Assigned Staff · {members.length}</p>
                        {groups.map((g) => (
                          <div key={g.label || 'all'}>
                            {g.label && (
                              <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
                                <span className={`w-1.5 h-1.5 rounded-full ${g.dot}`} />
                                {g.label} · {g.list.length}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {g.list.map((x) => (
                                <StaffTag key={x.id} staff={x} onRemove={readOnly ? undefined : () => removeFromArrangement(m.key, a.key, x.id)} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>
      </div>
    );
  };

  const renderFlex = (f: WorkFlexItem) => {
    const c = prefs.flex[f.key];
    const counts = flexCounts(f, c, staff);
    const Icon = f.icon;
    const descOpen = openDesc === f.key;
    return (
      <li key={f.key} id={`wf-q-${f.key}`} className={`rounded-2xl border border-l-4 p-3.5 transition-colors ${railClass(c.default)} ${c.default === 'yes' ? 'bg-[#F7FCF9]' : 'bg-white'}`}>
        <div className="flex gap-2.5">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${f.tint}`}>
            <Icon className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#1E293B]">{f.name}</p>
            <p className={`mt-0.5 text-[11.5px] text-slate-500 leading-snug ${descOpen ? '' : 'line-clamp-2'}`}>{f.desc}</p>
            <button
              type="button"
              onClick={() => setOpenDesc(descOpen ? null : f.key)}
              aria-expanded={descOpen}
              className="mt-0.5 text-[11px] font-bold text-[#2F68FE] cursor-pointer"
            >
              {descOpen ? 'Show less' : 'Read more'}
            </button>
          </div>
        </div>

        {c.default === 'yes' && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {counts.byTiming ? (
              WORK_FLEX_TIMINGS.map((t) => (
                <span key={t.key} className="px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-[10.5px] font-bold inline-flex items-center tabular-nums">
                  {t.tag} · {counts.byTiming![t.key]}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-[#E8F8F0] text-[#059669] text-[10.5px] font-bold inline-flex items-center tabular-nums">
                {counts.allowed} allowed
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10.5px] font-bold inline-flex items-center tabular-nums">
              {counts.notAllowed} not allowed
            </span>
            {!readOnly && (
              <button type="button" onClick={() => openFlex(f.key)} className="ml-auto h-6 text-[11px] font-bold text-[#2F68FE] flex items-center gap-0.5 cursor-pointer">
                Edit per staff <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        {c.default === 'no' && <p className="mt-2 text-[11px] font-semibold text-slate-400">Not allowed for any staff</p>}

        <div className="mt-3">
          <AllowToggle
            value={c.default}
            label={f.name}
            disabled={readOnly}
            compact
            onChange={(v) => (v === 'yes' ? openFlex(f.key) : setFlexNotAllowed(f))}
          />
        </div>
      </li>
    );
  };

  const offKey = confirmOff ? WORK_FLEX_MODES.find((m) => m.key === confirmOff) : null;

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <ScreenHeader title="Work Flexibility Preferences" onBack={onBack} />
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-4">
          {prefs.savedAt && (
            <p className="mb-4 inline-flex max-w-full items-center gap-2 h-8 pl-1 pr-3 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] text-slate-500">
              <span className="w-6 h-6 rounded-full bg-[#2F68FE] text-white text-[9px] font-bold flex items-center justify-center shrink-0" aria-hidden="true">
                {prefs.savedBy ? initialsOf(prefs.savedBy) : <CheckCircle2 className="w-3.5 h-3.5" />}
              </span>
              <span className="truncate">
                Saved <span className="font-semibold text-slate-700">{formatFlexDate(prefs.savedAt)}</span>
                {prefs.savedBy && (
                  <>
                    {' '}· <span className="font-semibold text-slate-700">{prefs.savedBy}</span>
                  </>
                )}
              </span>
            </p>
          )}

          {/* Progress (Added by designer) — one segment per question, tap to jump to it */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className={`flex items-center gap-1.5 text-[12.5px] font-bold ${allDone ? 'text-[#059669]' : 'text-[#1E293B]'}`}>
                {allDone && <CheckCircle2 className="w-4 h-4" />}
                {allDone ? 'All preferences answered' : (
                  <>
                    <span className="tabular-nums">{answered} of {WORK_FLEX_TOTAL_QUESTIONS}</span> answered
                  </>
                )}
              </span>
              <span className="flex items-center gap-2.5 text-[10px] font-semibold text-slate-500" aria-hidden="true">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10B981]" />Allowed</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#94A3B8]" />Not allowed</span>
              </span>
            </div>
            <div className="mt-1.5 flex gap-1.5" role="group" aria-label={`${answered} of ${WORK_FLEX_TOTAL_QUESTIONS} preferences answered`}>
              {questions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => goToQuestion(q.id)}
                  aria-label={`${q.label}: ${q.value === 'yes' ? 'allowed' : q.value === 'no' ? 'not allowed' : 'not answered'}. Jump to question`}
                  className="flex-1 h-6 flex items-center cursor-pointer group"
                >
                  <span
                    className={`block w-full h-2 rounded-full transition-all duration-300 group-active:scale-y-150 ${
                      q.value === 'yes' ? 'bg-[#10B981]' : q.value === 'no' ? 'bg-[#94A3B8]' : 'bg-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <PageSkeleton />
        ) : (
          <div className="px-4 mt-4 space-y-3">
            <Card className="p-3.5">
              <div className="flex gap-2.5">
                <Info className="w-4 h-4 text-[#2F68FE] shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  Define your organizational preferences for <strong className="text-[#1E293B]">Hybrid Working</strong> and{' '}
                  <strong className="text-[#1E293B]">Work From Home</strong> arrangements. The preferences you authorize here will allow your staff to submit
                  requests within these specific bounds.
                </p>
              </div>
              <div className="mt-3 flex gap-2 px-3 py-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B45309] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11.5px] text-[#78350F] leading-relaxed">
                    <strong className="text-[#92400E]">Please note:</strong> This is not a policy change, simply a reference we keep on file.
                    {noteOpen &&
                      ' In situations outside our control — such as health emergencies or operational disruptions — knowing your flexibility preferences helps us respond faster and more effectively on your behalf. Of course, we will always communicate with you before taking any action.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setNoteOpen((o) => !o)}
                    aria-expanded={noteOpen}
                    className="mt-0.5 h-6 text-[11px] font-bold text-[#B45309] cursor-pointer"
                  >
                    {noteOpen ? 'Show less' : 'Read more'}
                  </button>
                </div>
              </div>
            </Card>

            {WORK_FLEX_MODES.map(renderMode)}

            <Card className="p-4">
              <div className="flex items-start gap-2">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2F68FE] to-[#7C9CFF] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-[18px] h-[18px]" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#1E293B]">Additional Flexibilities</h2>
                  <span className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F8F0] text-[#059669] text-[10.5px] font-bold">
                    <TrendingUp className="w-3 h-3" />
                    {FLEX_ADOPTION_PCT}% clients offer these to their staff
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[11.5px] text-slate-500 leading-relaxed">
                A few common perks you can offer to all your staff.{' '}
                <strong className="text-slate-700">
                  These apply regardless of whether someone is on Work From Office, Hybrid Working, or Work From Home.
                </strong>
              </p>
              <ul className="mt-3 space-y-2.5">{WORK_FLEX_ITEMS.map(renderFlex)}</ul>
            </Card>
          </div>
        )}
      </div>

      {/* Sticky submit */}
      {readOnly ? (
        <div className="px-4 py-3 bg-white border-t border-[#EBF0F7] shrink-0">
          <p className="flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            View only — your role can't change these preferences
          </p>
        </div>
      ) : (
      <div className="px-4 pt-2.5 pb-3 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold" aria-live="polite">
          {dirty ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
              <span className="text-amber-700">Unsaved changes</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span className="text-slate-500">All changes saved</span>
            </>
          )}
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => setReviewOpen(true)}
          className="mt-2 w-full h-12 rounded-xl bg-gradient-to-r from-[#2F68FE] to-[#5B8CFF] shadow-[0_6px_16px_rgba(47,104,254,0.32)] text-white text-sm font-bold flex items-center justify-center gap-2 active:brightness-90 cursor-pointer disabled:bg-none disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
        >
          Submit Preferences <Send className="w-4 h-4" />
        </button>
      </div>
      )}

      {toast && (
        <div
          role="status"
          className="absolute left-4 right-4 bottom-[108px] z-20 flex items-center gap-2 px-3.5 py-3 rounded-xl bg-[#1E293B] text-white text-[12px] font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
          <span className="flex-1">{toast}</span>
        </div>
      )}

      <WorkFlexAssignSheet
        isOpen={assignOpen}
        target={assign}
        modeState={assign ? prefs.modes[assign.mode] : null}
        staff={staff}
        onClose={() => setAssignOpen(false)}
        onSave={saveArrangement}
      />
      <WorkFlexAllowSheet
        isOpen={flexOpen}
        flexKey={flexKey}
        current={flexKey ? prefs.flex[flexKey] : null}
        staff={staff}
        onClose={() => setFlexOpen(false)}
        onSave={(key, next) => {
          onChange((p) => ({ ...p, ...stamp, flex: { ...p.flex, [key]: next } }));
          setFlexOpen(false);
          showToast(SAVED_MESSAGE);
        }}
      />
      <WorkFlexReviewSheet
        isOpen={reviewOpen}
        prefs={prefs}
        staff={staff}
        onClose={() => setReviewOpen(false)}
        onConfirm={() => {
          onChange((p) => ({ ...p, ...stamp, unsubmitted: false }));
          setReviewOpen(false);
          showToast(SAVED_MESSAGE);
        }}
      />
      <ConfirmSheet
        isOpen={confirmOff !== null}
        title={`Stop offering ${offKey?.title ?? ''}?`}
        message={`${confirmOff ? modeStaffCount(prefs.modes[confirmOff]) : 0} staff assignments under ${offKey?.title ?? 'this mode'} will be cleared.`}
        note="You can allow it again later, but staff will need to be assigned again."
        confirmLabel="Not Allowed"
        danger
        onConfirm={() => {
          if (confirmOff) applyOffer(confirmOff, 'no');
          setConfirmOff(null);
        }}
        onClose={() => setConfirmOff(null)}
      />
    </div>
  );
};
