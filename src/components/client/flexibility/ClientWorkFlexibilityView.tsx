import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronRight, Info, Lock, Pencil, Plus, Send, Sparkles, TrendingUp, X } from 'lucide-react';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { BottomSheet } from '../../common/BottomSheet';
import { Card, ConfirmSheet, DesignVersion, DesignVersionSwitch, SheetHeader } from '../staff/tabs/StaffTabParts';
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
  WorkFlexItem,
  WorkFlexMode,
  WorkFlexPreferences,
  WorkFlexStaff,
  YesNo,
  emptyArrangements,
  flexCounts,
  modeStaffCount,
} from '../data/clientWorkFlexData';
import { AllowChoice, AllowPills } from './WorkFlexParts';
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

/** V1 status accents: green = allowed, slate = not allowed, amber = still to answer */
const toneV1 = (v: YesNo | null) =>
  v === 'yes'
    ? {
        rail: 'bg-[#10B981]',
        pill: 'bg-[#E8F8F0] text-[#059669]',
        dot: 'bg-[#10B981]',
        wash: 'bg-[#F0FDF7] border-[#D1FAE5]',
        chip: 'bg-white border-[#A7F3D0] text-[#059669]',
      }
    : v === 'no'
    ? {
        rail: 'bg-[#94A3B8]',
        pill: 'bg-slate-100 text-slate-500',
        dot: 'bg-[#94A3B8]',
        wash: 'bg-[#F8FAFC] border-[#EEF2F7]',
        chip: 'bg-white border-[#DCE3ED] text-slate-500',
      }
    : {
        rail: 'bg-[#FBBF24]',
        pill: 'bg-[#FFF7E6] text-[#B45309]',
        dot: 'bg-[#F59E0B]',
        wash: 'bg-[#FFFBEB] border-[#FEF3C7]',
        chip: 'bg-white border-[#FDE68A] text-[#B45309]',
      };

/** V2 status accents: green = allowed, slate = not allowed, amber = still to answer */
const toneV2 = (v: YesNo | null) =>
  v === 'yes'
    ? { bar: 'bg-[#10B981]', text: 'text-[#059669]', dot: 'bg-[#10B981]' }
    : v === 'no'
    ? { bar: 'bg-[#94A3B8]', text: 'text-slate-500', dot: 'bg-[#94A3B8]' }
    : { bar: 'bg-[#F59E0B]', text: 'text-[#B45309]', dot: 'bg-[#F59E0B]' };

const DESIGN_VERSIONS = ['V1', 'V2'] as const;

/** V2: first few assigned staff as overlapping initials */
const AvatarStack: React.FC<{ list: WorkFlexStaff[] }> = ({ list }) => (
  <span className="flex -space-x-2 shrink-0" aria-hidden="true">
    {list.slice(0, 4).map((x) => (
      <span key={x.id} className={`w-7 h-7 rounded-full ring-2 ring-white text-[9px] font-bold flex items-center justify-center ${avatarTint(x.tint)}`}>
        {initialsOf(x.name)}
      </span>
    ))}
    {list.length > 4 && (
      <span className="w-7 h-7 rounded-full ring-2 ring-white bg-slate-100 text-slate-500 text-[9px] font-bold flex items-center justify-center">
        +{list.length - 4}
      </span>
    )}
  </span>
);

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
  const [version, setVersion] = useState<DesignVersion>('V1');
  const v2 = version === 'V2';
  const [openArr, setOpenArr] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  // Intro + "Please note" open in a bottom drawer
  const [introSheet, setIntroSheet] = useState<'about' | 'note' | null>(null);
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
  const dirty = Boolean(prefs.unsubmitted);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    const tone = toneV1(s.offer);
    const Icon = m.icon;
    return (
      <div key={m.key} id={`wf-q-${m.key}`}>
      <Card className="overflow-hidden">
        <div className={`px-4 py-3 border-b flex items-center gap-2.5 transition-colors ${tone.wash}`}>
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm ${m.tint}`}>
            <Icon className="w-5 h-5" />
          </span>
          <h2 className="flex-1 min-w-0 text-[15px] font-bold text-[#1E293B] leading-tight truncate">{m.title}</h2>
          <span className={`shrink-0 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border text-[10.5px] font-bold whitespace-nowrap ${tone.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
            {isOpen ? (count === 0 ? 'Active — no staff yet' : `Configured for ${count} staff`) : s.offer === 'no' ? 'Not offering' : 'Needs your answer'}
          </span>
        </div>
        <div className="px-4 pt-3.5 pb-4">
          <p className="text-[13px] font-semibold text-[#1E293B] leading-snug">{m.question}</p>
          <div className="mt-3">
            <AllowPills value={s.offer} onChange={(v) => setOffer(m.key, v)} label={m.title} disabled={readOnly} />
          </div>
        </div>

        {isOpen && (
          <div className="px-4 pb-4 pt-3.5 border-t border-slate-100 bg-[#F8FAFC] animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="flex gap-1.5 text-[11.5px] text-slate-500 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-[#2F68FE] shrink-0 mt-0.5" />
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
                  <li
                    key={a.key}
                    className={`rounded-2xl border bg-white transition-colors ${
                      has ? 'border-[#BFDBFE] shadow-[0_2px_8px_-2px_rgba(47,104,254,0.15)]' : 'border-[#EBF0F7]'
                    }`}
                  >
                    <div className="p-3 flex items-center gap-2.5">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.tint}`}>
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
    const tone = toneV1(c.default);
    const Icon = f.icon;
    const descOpen = openDesc === f.key;
    return (
      <li
        key={f.key}
        id={`wf-q-${f.key}`}
        className="overflow-hidden rounded-2xl border border-[#DCE3ED] bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.10)]"
      >
        <div className={`px-3.5 py-2.5 border-b flex items-center gap-2.5 transition-colors ${tone.wash}`}>
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm ${f.tint}`}>
            <Icon className="w-4 h-4" />
          </span>
          <h3 className="flex-1 min-w-0 text-[13.5px] font-bold text-[#1E293B] leading-tight">{f.name}</h3>
          <span
            aria-hidden="true"
            className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${tone.chip}`}
          >
            {c.default === 'yes' ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : c.default === 'no' ? (
              <X className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
            )}
          </span>
        </div>

        <div className="px-3.5 pt-3 pb-3.5">
          <p className={`text-[12px] text-slate-600 leading-snug ${descOpen ? '' : 'line-clamp-2'}`}>{f.desc}</p>
          <button
            type="button"
            onClick={() => setOpenDesc(descOpen ? null : f.key)}
            aria-expanded={descOpen}
            className="mt-0.5 h-6 text-[11px] font-bold text-[#2F68FE] cursor-pointer"
          >
            {descOpen ? 'Show less' : 'Read more'}
          </button>

          {c.default === 'yes' && (
            <div className="mt-2 p-2 pl-2.5 rounded-xl bg-[#F0FDF7] border border-[#D1FAE5] flex flex-wrap items-center gap-1.5">
              {counts.byTiming ? (
                WORK_FLEX_TIMINGS.map((t) => (
                  <span key={t.key} className="h-[22px] px-2.5 rounded-full bg-white border border-[#E0E7FF] text-[#4F46E5] text-[10.5px] font-bold inline-flex items-center tabular-nums">
                    {t.tag} · {counts.byTiming![t.key]}
                  </span>
                ))
              ) : (
                <span className="h-[22px] px-2.5 rounded-full bg-white border border-[#A7F3D0] text-[#059669] text-[10.5px] font-bold inline-flex items-center gap-1 tabular-nums">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  {counts.allowed} allowed
                </span>
              )}
              <span className="h-[22px] px-2.5 rounded-full bg-white border border-slate-200 text-slate-500 text-[10.5px] font-bold inline-flex items-center tabular-nums">
                {counts.notAllowed} not allowed
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => openFlex(f.key)}
                  className="ml-auto h-7 pl-2.5 pr-1.5 rounded-full bg-white border border-[#BFDBFE] text-[11px] font-bold text-[#2F68FE] flex items-center gap-0.5 cursor-pointer active:bg-[#EFF6FF]"
                >
                  Edit per staff <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {c.default === 'no' && (
            <p className="mt-2 h-8 px-3 rounded-xl bg-[#F8FAFC] border border-[#EEF2F7] flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <X className="w-3.5 h-3.5" />
              Not allowed for any staff
            </p>
          )}

          <div className="mt-3">
            <AllowPills
              value={c.default}
              label={f.name}
              disabled={readOnly}
              onChange={(v) => (v === 'yes' ? openFlex(f.key) : setFlexNotAllowed(f))}
            />
          </div>
        </div>
      </li>
    );
  };

  /* ------------------------------ V2 design ------------------------------ */

  const renderModeV2 = (m: WorkFlexMode) => {
    const s = prefs.modes[m.key];
    const isOpen = s.offer === 'yes';
    const count = modeStaffCount(s);
    const tone = toneV2(s.offer);
    const Icon = m.icon;
    return (
      <section
        key={m.key}
        id={`wf-q-${m.key}`}
        className="relative bg-white rounded-2xl border border-[#DCE3ED] shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)] overflow-hidden"
      >
        <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${tone.bar} transition-colors`} />
        <div className="p-4 pt-5">
          <div className="flex items-center gap-3">
            <span className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] ${m.tint}`}>
              <Icon className="w-6 h-6" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-bold text-[#1E293B] leading-tight">{m.title}</h2>
              <p className={`mt-1 flex items-center gap-1.5 text-[11.5px] font-bold ${tone.text}`}>
                <span className="relative flex w-2 h-2 shrink-0">
                  {s.offer === null && <span className={`absolute inset-0 rounded-full ${tone.dot} opacity-60 animate-ping`} />}
                  <span className={`relative w-2 h-2 rounded-full ${tone.dot}`} />
                </span>
                {isOpen ? (count === 0 ? 'Active — no staff yet' : `Configured for ${count} staff`) : s.offer === 'no' ? 'Not offering' : 'Needs your answer'}
              </p>
            </div>
          </div>
          <div className="mt-3.5 p-3 rounded-2xl bg-[#F6F8FC] border border-[#EEF2F7]">
            <p className="px-0.5 text-[12.5px] font-semibold text-[#334155] leading-snug">{m.question}</p>
            <div className="mt-3">
              <AllowChoice value={s.offer} onChange={(v) => setOffer(m.key, v)} label={m.title} disabled={readOnly} />
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="flex gap-1.5 text-[11.5px] text-slate-500 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-[#2F68FE] shrink-0 mt-0.5" />
              Assign your staff to the arrangement that applies. Each staff member can be in one arrangement per mode.
            </p>
            <ul className="mt-3 space-y-2">
              {WORK_FLEX_ARRANGEMENTS.map((a) => {
                const map = s.arrangements[a.key];
                const members = Object.keys(map)
                  .map((id) => staffById(id))
                  .filter((x): x is WorkFlexStaff => Boolean(x));
                const has = members.length > 0;
                const rowKey = `${m.key}-${a.key}`;
                const expanded = Boolean(openArr[rowKey]);
                const ArrIcon = a.icon;
                const groups =
                  m.key === 'hyb'
                    ? [
                        { label: 'Split by Days', dot: 'bg-[#2F68FE]', list: members.filter((x) => map[x.id] === 'days') },
                        { label: 'Split by Hours', dot: 'bg-[#A855F7]', list: members.filter((x) => map[x.id] === 'hours') },
                      ].filter((g) => g.list.length > 0)
                    : [{ label: '', dot: '', list: members }];
                return (
                  <li
                    key={a.key}
                    className={`rounded-2xl border transition-colors ${has ? 'border-[#C7DAFE] bg-gradient-to-b from-[#F5F8FF] to-white' : 'border-dashed border-[#D6DEEA] bg-white'}`}
                  >
                    <div className="p-3 flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.tint}`}>
                        <ArrIcon className="w-[18px] h-[18px]" />
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
                          className={`shrink-0 h-8 px-3 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
                            has ? 'bg-white border border-[#C7DAFE] text-[#2F68FE]' : 'bg-[#2F68FE] text-white shadow-[0_4px_10px_rgba(47,104,254,0.3)]'
                          }`}
                        >
                          {has ? <Pencil className="w-3 h-3" /> : <Plus className="w-3.5 h-3.5" />}
                          {has ? `Edit · ${members.length}` : 'Assign'}
                        </button>
                      )}
                    </div>
                    {has && (
                      <div className="px-3 pb-3">
                        <button
                          type="button"
                          onClick={() => setOpenArr((o) => ({ ...o, [rowKey]: !expanded }))}
                          aria-expanded={expanded}
                          className="w-full h-10 px-2 rounded-xl bg-white border border-[#EEF2F7] flex items-center gap-2.5 cursor-pointer active:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                        >
                          <AvatarStack list={members} />
                          <span className="flex-1 text-left text-[11px] font-semibold text-slate-500">Assigned Staff · {members.length}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                        {expanded && (
                          <div className="mt-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
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
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    );
  };

  const renderFlexV2 = (f: WorkFlexItem) => {
    const c = prefs.flex[f.key];
    const counts = flexCounts(f, c, staff);
    const tone = toneV2(c.default);
    const Icon = f.icon;
    const descOpen = openDesc === f.key;
    return (
      <li
        key={f.key}
        id={`wf-q-${f.key}`}
        className="relative bg-white rounded-2xl border border-[#DCE3ED] shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)] overflow-hidden"
      >
        <span aria-hidden="true" className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${tone.bar} transition-colors`} />
        <div className="p-4 pl-5">
          <div className="flex items-start gap-3">
            <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${f.tint}`}>
              <Icon className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-[#1E293B] leading-tight">{f.name}</p>
              <p className={`mt-1 text-[11.5px] text-slate-500 leading-snug ${descOpen ? '' : 'line-clamp-2'}`}>{f.desc}</p>
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
            <div className="mt-3 rounded-2xl border border-[#D1FAE5] bg-[#F3FCF7] overflow-hidden">
              <div className="p-2.5 flex flex-wrap items-center gap-1.5">
                {counts.byTiming ? (
                  WORK_FLEX_TIMINGS.map((t) => (
                    <span key={t.key} className="h-6 px-2.5 rounded-full bg-white border border-[#E0E7FF] text-[#4F46E5] text-[10.5px] font-bold inline-flex items-center tabular-nums">
                      {t.tag} · {counts.byTiming![t.key]}
                    </span>
                  ))
                ) : (
                  <span className="h-6 px-2.5 rounded-full bg-[#10B981] text-white text-[10.5px] font-bold inline-flex items-center tabular-nums">
                    {counts.allowed} allowed
                  </span>
                )}
                <span className="h-6 px-2.5 rounded-full bg-white border border-[#E2E8F0] text-slate-500 text-[10.5px] font-bold inline-flex items-center tabular-nums">
                  {counts.notAllowed} not allowed
                </span>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => openFlex(f.key)}
                  className="w-full h-9 px-3 border-t border-[#D1FAE5] bg-white/70 text-[11.5px] font-bold text-[#2F68FE] flex items-center justify-between cursor-pointer active:bg-white"
                >
                  Edit per staff <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          {c.default === 'no' && (
            <p className="mt-3 h-9 px-3 rounded-xl bg-[#F6F8FC] flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <X className="w-3.5 h-3.5" />
              Not allowed for any staff
            </p>
          )}

          <div className="mt-3">
            <AllowChoice
              value={c.default}
              label={f.name}
              disabled={readOnly}
              compact
              onChange={(v) => (v === 'yes' ? openFlex(f.key) : setFlexNotAllowed(f))}
            />
          </div>
        </div>
      </li>
    );
  };

  const contentV2 = (
      <div className="px-4 mt-4 space-y-3.5">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setIntroSheet('about')}
            aria-haspopup="dialog"
            className="min-w-0 p-3 rounded-2xl border border-[#DBEAFE] bg-gradient-to-br from-[#EEF3FF] to-white shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)] flex flex-col text-left active:from-[#E2EBFF] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
          >
            <span className="flex items-center justify-between gap-1">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2F68FE] to-[#5B8CFF] text-white flex items-center justify-center shrink-0 shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)]">
                <Info className="w-[18px] h-[18px]" />
              </span>
              <span className="flex -space-x-1.5" aria-hidden="true">
                {WORK_FLEX_MODES.map((m) => {
                  const MIcon = m.icon;
                  return (
                    <span key={m.key} className={`w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center ${m.tint}`}>
                      <MIcon className="w-3 h-3" />
                    </span>
                  );
                })}
              </span>
            </span>
            <span className="mt-2.5 flex-1 text-[11.5px] text-slate-600 leading-snug line-clamp-3">
              Define your organizational preferences for <strong className="text-[#1E293B]">Hybrid Working</strong> and{' '}
              <strong className="text-[#1E293B]">Work From Home</strong> arrangements. The preferences you authorize here will allow your staff to submit
              requests within these specific bounds.
            </span>
            <span className="mt-2.5 self-end w-7 h-7 rounded-full bg-[#2F68FE] text-white flex items-center justify-center" aria-hidden="true">
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIntroSheet('note')}
            aria-haspopup="dialog"
            className="min-w-0 p-3 rounded-2xl border border-[#FDE68A] bg-gradient-to-br from-[#FFF7E0] to-[#FFFDF5] shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)] flex flex-col text-left active:from-[#FEF3C7] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B45309]"
          >
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] text-white flex items-center justify-center shrink-0 shadow-[0_6px_14px_-6px_rgba(245,158,11,0.7)]">
              <AlertTriangle className="w-[18px] h-[18px]" />
            </span>
            <span className="mt-2.5 flex-1 text-[11.5px] text-[#78350F] leading-snug line-clamp-3">
              <strong className="text-[#92400E]">Please note:</strong> This is not a policy change, simply a reference we keep on file.
            </span>
            <span className="mt-2.5 self-end w-7 h-7 rounded-full bg-[#F59E0B] text-white flex items-center justify-center" aria-hidden="true">
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        {WORK_FLEX_MODES.map(renderModeV2)}

        <section id="wf-q-flex" className="bg-white border border-[#DCE3ED] rounded-2xl shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)] p-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2F68FE] to-[#7C9CFF] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-[#1E293B]">Additional Flexibilities</h2>
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8F8F0] text-[#059669] text-[10.5px] font-bold">
                <TrendingUp className="w-3 h-3" />
                {FLEX_ADOPTION_PCT}% clients offer these to their staff
              </span>
            </div>
          </div>
          <p className="mt-3 text-[11.5px] text-slate-500 leading-relaxed">
            A few common perks you can offer to all your staff.{' '}
            <strong className="text-slate-700">These apply regardless of whether someone is on Work From Office, Hybrid Working, or Work From Home.</strong>
          </p>
        </section>
        <ul className="space-y-2.5">{WORK_FLEX_ITEMS.map(renderFlexV2)}</ul>
      </div>
  );

  const footerV2 = readOnly ? (
    <div className="px-4 py-3 bg-white border-t border-[#EBF0F7] shrink-0">
      <p className="h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-slate-500">
        <Lock className="w-3.5 h-3.5 text-slate-400" />
        View only — your role can't change these preferences
      </p>
    </div>
  ) : (
    <div className="px-4 py-3 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
      <div className="flex items-center gap-3">
        <p className="flex-1 min-w-0 flex items-center gap-1.5 text-[11px] font-semibold" aria-live="polite">
          {dirty ? (
            <>
              <span className="relative flex w-2 h-2 shrink-0">
                <span className="absolute inset-0 rounded-full bg-[#F59E0B] opacity-60 animate-ping" />
                <span className="relative w-2 h-2 rounded-full bg-[#F59E0B]" />
              </span>
              <span className="text-amber-700 truncate">Unsaved changes</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span className="text-slate-500 truncate">All changes saved</span>
            </>
          )}
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => setReviewOpen(true)}
          className="shrink-0 h-12 px-4 rounded-xl bg-gradient-to-r from-[#2F68FE] to-[#5B8CFF] shadow-[0_6px_16px_rgba(47,104,254,0.35)] text-white text-[13px] font-bold flex items-center gap-2 active:scale-[0.97] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] disabled:bg-none disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
        >
          Submit Preferences <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const offKey = confirmOff ? WORK_FLEX_MODES.find((m) => m.key === confirmOff) : null;

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Dashboard"
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-96px)] flex items-center gap-1.5">
          <h1 className="min-w-0 text-[14px] font-bold truncate">Work Flexibility Preferences</h1>
          <DesignVersionSwitch versions={DESIGN_VERSIONS} value={version} onChange={setVersion} />
        </div>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {loading ? (
          <PageSkeleton />
        ) : v2 ? (
          contentV2
        ) : (
          <div className="px-4 mt-4 space-y-3">
            <Card className="p-2 space-y-1.5">
              <button
                type="button"
                onClick={() => setIntroSheet('about')}
                aria-haspopup="dialog"
                className="w-full p-2 rounded-xl flex items-center gap-3 text-left active:bg-slate-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
              >
                <span className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                  <Info className="w-[18px] h-[18px]" />
                </span>
                <span className="flex-1 min-w-0 text-[12px] text-slate-600 leading-snug line-clamp-2">
                  Define your organizational preferences for <strong className="text-[#1E293B]">Hybrid Working</strong> and{' '}
                  <strong className="text-[#1E293B]">Work From Home</strong> arrangements. The preferences you authorize here will allow your staff to submit
                  requests within these specific bounds.
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setIntroSheet('note')}
                aria-haspopup="dialog"
                className="w-full p-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center gap-3 text-left active:bg-[#FEF3C7] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B45309]"
              >
                <span className="w-9 h-9 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#B45309]" />
                </span>
                <span className="flex-1 min-w-0 text-[11.5px] text-[#78350F] leading-snug line-clamp-2">
                  <strong className="text-[#92400E]">Please note:</strong> This is not a policy change, simply a reference we keep on file.
                </span>
                <ChevronRight className="w-4 h-4 text-[#B45309] shrink-0" />
              </button>
            </Card>

            {WORK_FLEX_MODES.map(renderMode)}

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2F68FE] to-[#7C9CFF] text-white flex items-center justify-center shrink-0 shadow-[0_6px_14px_-6px_rgba(47,104,254,0.6)]">
                  <Sparkles className="w-6 h-6" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-[#1E293B]">Additional Flexibilities</h2>
                  <span className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F8F0] text-[#059669] text-[10.5px] font-bold">
                    <TrendingUp className="w-3 h-3" />
                    {FLEX_ADOPTION_PCT}% clients offer these to their staff
                  </span>
                </div>
              </div>
              <p className="mt-3.5 pt-3.5 border-t border-dashed border-slate-200 text-[11.5px] text-slate-500 leading-relaxed">
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
      {v2 ? (
        footerV2
      ) : readOnly ? (
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
          className={`absolute left-4 right-4 ${v2 ? 'bottom-[84px]' : 'bottom-[108px]'} z-20 flex items-center gap-3 p-2.5 pl-3 rounded-2xl bg-white border border-[#D1FAE5] shadow-[0_12px_32px_-8px_rgba(15,23,42,0.28)] animate-in fade-in slide-in-from-bottom-2 duration-200`}
        >
          <span className="w-8 h-8 rounded-full bg-[#E8F8F0] flex items-center justify-center shrink-0" aria-hidden="true">
            <CheckCircle2 className="w-[18px] h-[18px] text-[#10B981]" />
          </span>
          <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-[#1E293B] leading-snug">{toast}</span>
          <button
            type="button"
            onClick={() => {
              clearTimeout(toastTimer.current);
              setToast(null);
            }}
            aria-label="Dismiss"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
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
      <BottomSheet isOpen={introSheet !== null} onClose={() => setIntroSheet(null)} maxHeight="max-h-[70%]">
        <SheetHeader title={introSheet === 'note' ? 'Please note' : 'Work Flexibility Preferences'} onClose={() => setIntroSheet(null)} />
        <div className="px-5 pt-4 pb-8 overflow-y-auto">
          {introSheet === 'note' ? (
            <div className="flex gap-3 p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]">
              <span className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#B45309]" />
              </span>
              <p className="text-[13px] text-[#78350F] leading-relaxed">
                <strong className="text-[#92400E]">Please note:</strong> This is not a policy change, simply a reference we keep on file. In situations outside
                our control — such as health emergencies or operational disruptions — knowing your flexibility preferences helps us respond faster and more
                effectively on your behalf. Of course, we will always communicate with you before taking any action.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 p-4 rounded-2xl bg-[#F5F8FF] border border-[#DBEAFE]">
              <span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </span>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Define your organizational preferences for <strong className="text-[#1E293B]">Hybrid Working</strong> and{' '}
                <strong className="text-[#1E293B]">Work From Home</strong> arrangements. The preferences you authorize here will allow your staff to submit
                requests within these specific bounds.
              </p>
            </div>
          )}
        </div>
      </BottomSheet>
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
