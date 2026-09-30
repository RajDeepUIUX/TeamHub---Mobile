import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Info,
  X,
  Briefcase,
  GraduationCap,
  Clock3,
  Sparkles,
  Users,
  BookMarked,
  ShieldCheck,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { Dropdown } from '../../design-system/components/Dropdown';
import {
  LEARNING_HOURS_BY_YEAR,
  LEARNING_HOURS_INFO,
  REVIEW_PERIOD,
  REVIEW_SECTIONS,
  REVIEW_SNAPSHOT,
  ReviewInfo,
  ReviewMetric,
  ReviewMetricGroup,
  ReviewSection,
  TRAINING_CONTRIBUTIONS,
} from '../../data/staffReviewData';

interface StaffReviewViewProps {
  onBack: () => void;
  onStartEvaluation: () => void;
}

const SECTION_ICONS: Record<string, { icon: React.ElementType; tint: string }> = {
  client: { icon: Briefcase, tint: 'bg-blue-50 text-blue-600' },
  experience: { icon: Clock3, tint: 'bg-violet-50 text-violet-600' },
  availability: { icon: CalendarDays, tint: 'bg-teal-50 text-teal-600' },
  skills: { icon: Sparkles, tint: 'bg-amber-50 text-amber-600' },
  behavioral: { icon: Users, tint: 'bg-sky-50 text-sky-600' },
  learning: { icon: GraduationCap, tint: 'bg-indigo-50 text-indigo-600' },
  conduct: { icon: ShieldCheck, tint: 'bg-rose-50 text-rose-500' },
};

const SNAPSHOT_TONES = {
  emerald: 'bg-emerald-50 text-emerald-600',
  indigo: 'bg-indigo-50 text-[#4F46E5]',
  rose: 'bg-rose-50 text-rose-500',
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

const YEARS = Object.keys(LEARNING_HOURS_BY_YEAR)
  .map(Number)
  .sort((a, b) => a - b);

type InfoTopic = { title: string; info: ReviewInfo };

/** Renders **bold** spans from the help copy */
const RichText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
      i % 2 ? (
        <strong key={i} className="font-semibold text-[#1E293B]">
          {part}
        </strong>
      ) : (
        part
      )
    )}
  </>
);

const InfoButton: React.FC<{ topic: InfoTopic; onOpen: (t: InfoTopic) => void }> = ({ topic, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(topic)}
    className="w-5 h-5 -m-0.5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 active:bg-slate-100 shrink-0 cursor-pointer"
    aria-label={`About ${topic.title}`}
  >
    <Info className="w-3.5 h-3.5" />
  </button>
);

const MetricValue: React.FC<{ value: string; className?: string }> = ({ value, className = '' }) =>
  value ? (
    <span className={`font-bold text-[#1E293B] tabular-nums ${className}`}>{value}</span>
  ) : (
    <span className={`font-semibold text-slate-300 ${className}`} title="Not rated yet">
      —
    </span>
  );

const GroupCard: React.FC<{ group: ReviewMetricGroup; onInfo: (t: InfoTopic) => void }> = ({ group, onInfo }) => (
  <div className="rounded-xl border border-slate-100 p-3">
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-bold text-[#1E293B]">{group.title}</span>
      {group.info && <InfoButton topic={{ title: group.title, info: group.info }} onOpen={onInfo} />}
    </div>
    <div className={`mt-2 grid gap-2 ${group.items.length === 3 ? 'grid-cols-3' : group.items.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {group.items.map((m) => (
        <div key={m.label} className="rounded-lg bg-slate-50 px-2.5 py-2 min-w-0">
          <span className="block text-[10.5px] text-slate-500 leading-tight">{m.label}</span>
          <MetricValue value={m.value} className="block mt-1 text-[13.5px]" />
        </div>
      ))}
    </div>
  </div>
);

const MetricRows: React.FC<{ metrics: ReviewMetric[]; onInfo: (t: InfoTopic) => void }> = ({ metrics, onInfo }) => (
  <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
    {metrics.map((m) => (
      <div key={m.label} className="flex items-center gap-3 px-3 py-2.5">
        <span className="flex-1 min-w-0 flex items-start gap-1.5">
          <span className="text-[11.5px] text-slate-600 leading-snug">{m.label}</span>
          {m.info && (
            <span className="mt-px">
              <InfoButton topic={{ title: m.label, info: m.info }} onOpen={onInfo} />
            </span>
          )}
        </span>
        <MetricValue value={m.value} className="text-[13px] shrink-0 text-right" />
      </div>
    ))}
  </div>
);

const LearningExtras: React.FC<{ onInfo: (t: InfoTopic) => void }> = ({ onInfo }) => {
  const [year, setYear] = useState(YEARS[YEARS.length - 1]);
  const hours = LEARNING_HOURS_BY_YEAR[year] ?? 0;
  return (
    <>
      <div className="rounded-xl border border-slate-100 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#1E293B]">Learning Hours Completed</span>
            <InfoButton topic={{ title: 'Learning Hours Completed', info: LEARNING_HOURS_INFO }} onOpen={onInfo} />
          </span>
          <span className="w-24 shrink-0">
            <Dropdown
              value={year}
              options={YEARS.map((y) => ({ value: y, label: String(y) }))}
              onChange={setYear}
              ariaLabel="Learning hours year"
              sheetTitle="Select year"
            />
          </span>
        </div>
        <div className="mt-2 rounded-lg bg-indigo-50/70 px-3 py-2.5 flex items-baseline gap-1">
          <span className="text-lg font-extrabold text-[#4F46E5] tabular-nums leading-none">{hours}</span>
          <span className="text-[11px] font-semibold text-indigo-400">{hours === 1 ? 'hour' : 'hours'} in {year}</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 p-3">
        <span className="text-xs font-bold text-[#1E293B]">Training Material Contribution</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TRAINING_CONTRIBUTIONS.map((c) => (
            <span
              key={c.role}
              className="h-7 pl-2.5 pr-1 rounded-full bg-indigo-50 text-[#4F46E5] text-[11px] font-semibold flex items-center gap-1.5"
            >
              <BookMarked className="w-3.5 h-3.5" />
              {c.role}
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-white text-[10px] font-bold flex items-center justify-center">
                ×{c.count}
              </span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

const SectionAccordion: React.FC<{
  section: ReviewSection;
  open: boolean;
  onToggle: () => void;
  onInfo: (t: InfoTopic) => void;
}> = ({ section, open, onToggle, onInfo }) => {
  const meta = SECTION_ICONS[section.id];
  const Icon = meta.icon;
  const count =
    (section.groups?.reduce((n, g) => n + g.items.length, 0) ?? 0) +
    (section.metrics?.length ?? 0) +
    (section.id === 'learning' ? 2 : 0);

  return (
    <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-3.5 text-left active:bg-slate-50 cursor-pointer"
      >
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.tint}`}>
          <Icon className="w-4.5 h-4.5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold text-[#1E293B] leading-snug">{section.title}</span>
          <span className="block text-[11px] text-slate-400">{count} metrics</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 space-y-2.5">
          {section.groups?.map((g) => (
            <GroupCard key={g.title} group={g} onInfo={onInfo} />
          ))}
          {section.id === 'learning' && <LearningExtras onInfo={onInfo} />}
          {section.metrics && <MetricRows metrics={section.metrics} onInfo={onInfo} />}
        </div>
      )}
    </section>
  );
};

const InfoSheet: React.FC<{ topic: InfoTopic | null; onClose: () => void }> = ({ topic, onClose }) => {
  // Keep the last topic while the sheet animates closed
  const [shown, setShown] = useState<InfoTopic | null>(topic);
  if (topic && topic !== shown) setShown(topic);
  const info = shown?.info;
  const meta = info
    ? ([
        ['Source', info.source],
        ['Updated By', info.updatedBy],
        [info.logic?.label, info.logic?.text],
        ['Applicability', info.applicability],
      ].filter(([, v]) => v) as [string, string][])
    : [];

  return (
    <BottomSheet isOpen={Boolean(topic)} onClose={onClose} maxHeight="max-h-[80%]">
      <div className="pt-3 pb-1 flex justify-center shrink-0">
        <div className="w-10 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="px-5 pt-2 pb-3 flex items-start gap-2.5 shrink-0 border-b border-slate-100">
        <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </span>
        <h2 className="flex-1 min-w-0 text-sm font-bold text-[#1E293B] leading-snug pt-1.5">{shown?.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 shrink-0 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>
      {info && (
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pt-3.5 pb-6 space-y-3.5 text-[12px] text-slate-600 leading-relaxed">
          <p className="text-[12.5px]">
            <RichText text={info.summary} />
          </p>

          {info.rows && info.rows.length > 0 && (
            <div>
              <span className="block mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Guideline / Help Information
              </span>
              <dl className="rounded-xl border border-slate-100 divide-y divide-slate-100">
                {info.rows.map((r) => (
                  <div key={r.label} className="px-3 py-2.5">
                    <dt className="text-[12px] font-bold text-[#1E293B]">{r.label}</dt>
                    <dd className="mt-0.5">
                      <RichText text={r.text} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {meta.length > 0 && (
            <dl className="rounded-xl bg-slate-50 px-3 py-2.5 space-y-2">
              {meta.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
                  {value.split('\n').map((line) => (
                    <dd key={line} className="text-[12px] text-slate-600">
                      <RichText text={line} />
                    </dd>
                  ))}
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </BottomSheet>
  );
};

const InstructionsSheet: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[85%]">
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-slate-300 rounded-full" />
    </div>
    <div className="px-5 pt-2 pb-3 flex items-start justify-between gap-3 shrink-0 border-b border-slate-100">
      <div>
        <h2 className="text-base font-bold text-[#1E293B]">Guideline / Help Information</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Performance Report</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 cursor-pointer"
        aria-label="Close"
      >
        <X className="w-4.5 h-4.5" />
      </button>
    </div>
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4 text-[12.5px] text-slate-600 leading-relaxed">
      <section className="space-y-2">
        <h3 className="text-[13px] font-bold text-[#1E293B]">Report Purpose</h3>
        <p>
          This report helps me understand the performance of a selected staff member for the selected period. Using this
          report, I can review how the staff member has performed across different areas such as{' '}
          <strong className="text-[#1E293B]">Client &amp; Profiling</strong>, <strong className="text-[#1E293B]">Experience</strong>,{' '}
          <strong className="text-[#1E293B]">Availability</strong>, <strong className="text-[#1E293B]">Skill Set</strong>,{' '}
          <strong className="text-[#1E293B]">L&amp;D, Upskilling &amp; Qualifications</strong>, and{' '}
          <strong className="text-[#1E293B]">Conduct &amp; Compliance</strong>.
        </p>
        <p>
          The report gives me a complete snapshot of the staff member's performance by showing details such as escalations,
          appreciations, billing contribution, work mode, overtime contribution, learning progress, certifications,
          assessments, warnings, attendance edit requests, leaves, SOP contribution, and other important performance-related
          data.
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="text-[13px] font-bold text-[#1E293B]">Tenure of the Profile &amp; Client</h3>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F68FE] mt-2 shrink-0" />
            <span>
              <strong className="text-[#1E293B]">Present:</strong> This section displays the current profile and client tenure
              information when the staff member is actively mapped as a{' '}
              <strong className="text-[#1E293B]">Face, EA, or Timesheet Holder</strong>.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F68FE] mt-2 shrink-0" />
            <span>
              <strong className="text-[#1E293B]">Past:</strong> This section displays the staff member's previous profile and
              client tenure details based on past timesheet records. The <strong className="text-[#1E293B]">Past Timesheet</strong>{' '}
              table will be displayed only when the relevant past timesheet is active. If the timesheet is inactive, the table
              will not be available.
            </span>
          </li>
        </ul>
      </section>
    </div>
    <div className="shrink-0 p-4 pb-5 border-t border-slate-100">
      <button
        type="button"
        onClick={onClose}
        className="w-full h-11 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold active:bg-blue-50 cursor-pointer"
      >
        Got it
      </button>
    </div>
  </BottomSheet>
);

export const StaffReviewView: React.FC<StaffReviewViewProps> = ({ onBack, onStartEvaluation }) => {
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set([REVIEW_SECTIONS[0].id]));
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [infoTopic, setInfoTopic] = useState<InfoTopic | null>(null);

  const allOpen = openSections.size === REVIEW_SECTIONS.length;
  const toggle = (id: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-[#EBF0F7]">
        <div className="flex items-center h-14 px-4">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold ml-2 flex-1">Staff Review</h1>
          <button
            type="button"
            onClick={() => setInstructionsOpen(true)}
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[#2F68FE] text-[11.5px] font-bold active:bg-blue-50 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            Instructions
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {/* Report period + snapshot */}
        <section className="bg-white border border-[#EBF0F7] rounded-2xl shadow-2xs p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Performance Report</span>
              <h2 className="text-[15px] font-extrabold text-[#1E293B] leading-snug mt-0.5">{REVIEW_PERIOD.label}</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10.5px] font-bold shrink-0">Form 180d open</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: 'From', value: REVIEW_PERIOD.from },
              { label: 'To', value: REVIEW_PERIOD.to },
            ].map((d) => (
              <div key={d.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[10px] text-slate-400 leading-none">{d.label}</span>
                  <span className="block text-xs font-semibold text-slate-700 mt-0.5">{formatDate(d.value)}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {REVIEW_SNAPSHOT.map((s) => (
              <div key={s.label} className={`rounded-xl px-2.5 py-2 ${SNAPSHOT_TONES[s.tone]}`}>
                <span className="block text-lg font-extrabold leading-none tabular-nums">{s.value}</span>
                <span className="block text-[10.5px] font-semibold mt-1 opacity-80">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Instructions entry point */}
        <button
          type="button"
          onClick={() => setInstructionsOpen(true)}
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-linear-to-r from-[#EEF2FF] to-[#F5F3FF] border border-indigo-100 text-left active:opacity-90 cursor-pointer"
        >
          <span className="w-9 h-9 rounded-xl bg-white text-[#4F46E5] flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-4.5 h-4.5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-[#1E1B4B]">Before you start</span>
            <span className="block text-[11px] text-slate-500 leading-snug">See what this report covers and how to read it.</span>
          </span>
          <ChevronRight className="w-4 h-4 text-[#4F46E5] shrink-0" />
        </button>

        <div className="flex items-center justify-between px-1 pt-1">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Report Details</h3>
          <button
            type="button"
            onClick={() => setOpenSections(allOpen ? new Set() : new Set(REVIEW_SECTIONS.map((s) => s.id)))}
            className="text-[11px] font-bold text-[#2F68FE] cursor-pointer"
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>

        {REVIEW_SECTIONS.map((s) => (
          <SectionAccordion
            key={s.id}
            section={s}
            open={openSections.has(s.id)}
            onToggle={() => toggle(s.id)}
            onInfo={setInfoTopic}
          />
        ))}
      </div>

      {/* Sticky CTA */}
      <div className="shrink-0 p-4 pb-5 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={onStartEvaluation}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer"
        >
          <ClipboardCheck className="w-4 h-4" />
          Start Evaluation
        </button>
      </div>

      <InstructionsSheet isOpen={instructionsOpen} onClose={() => setInstructionsOpen(false)} />

      <InfoSheet topic={infoTopic} onClose={() => setInfoTopic(null)} />
    </div>
  );
};
