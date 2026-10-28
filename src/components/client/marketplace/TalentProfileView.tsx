import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Award,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Clock3,
  Columns2,
  Copy,
  CreditCard,
  Download,
  FileText,
  House,
  Info,
  Laptop,
  ListChecks,
  Lock,
  Mail,
  MessageSquareText,
  Phone,
  Play,
  Send,
  Shuffle,
  TrendingUp,
  UserRound,
  UsersRound,
  Video,
  WandSparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { Card, InfoSheet, SheetHeader } from '../staff/tabs/StaffTabParts';
import { BottomSheet } from '../../common/BottomSheet';
import { FileButton } from '../interviews/CandidateResumeView';
import { CLIENT_IS_MOS } from '../data/clientTimesheetsData';
import { CLIENT_ACCOUNT_MANAGER } from '../data/clientDashboardData';
import { CLIENT_TZ, formatExperience, formatMonthYear, formatShortDate } from '../data/clientInterviewsData';
import {
  HubProfile,
  UPSKILL_BANNER_MINUTES,
  aiCourses,
  costBreakdownOf,
  cpeLabel,
  cpeMinutes,
  currentYearCpeMinutes,
  experienceLabel,
  experiencePills,
  joiningLabel,
  priceParts,
} from '../data/clientStaffHubData';
import { CountryFlag, DomainTile } from './MarketplaceParts';

interface Props {
  profile: HubProfile;
  /** Where Back returns (Talent Marketplace / Saved Resumes / Dashboard) */
  backLabel: string;
  shortlisted: boolean;
  saved: boolean;
  /** "% AI Match" when opened from an AI Smart Search result */
  aiMatch?: number | null;
  /** `add`: Request to Hire and Save */
  canAdd: boolean;
  /** `download`: resume, psychometric test, assessment reports */
  canDownload: boolean;
  /** Profiles picked for comparison (shared with the list) */
  compareCount: number;
  inCompare: boolean;
  onToggleCompare: () => void;
  onOpenCompare: () => void;
  onClearCompare: () => void;
  onBack: () => void;
  onToggleSave: () => void;
  onRequestToHire: () => void;
  onOpenShortlisted?: () => void;
  onNotice: (text: string, error?: boolean) => void;
}

const COURSES_SHOWN = 5;

const WORK_ICON: Record<string, React.ElementType> = { WFH: House, Hybrid: Shuffle, WFO: Building2 };

const monthsBetween = (from: string, to: string | null) => {
  const a = new Date(`${from}T00:00:00`);
  const b = to ? new Date(`${to}T00:00:00`) : new Date();
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));
};

/** Desktop `formatExperienceBetween` */
const durationLabel = (from: string, to: string | null) => {
  const m = monthsBetween(from, to);
  return formatExperience([Math.floor(m / 12), m % 12]);
};

/** Section card: one flat icon tile for every section (redesign.md §4) */
const Section: React.FC<{ icon: React.ElementType; title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ icon: Icon, title, action, children }) => (
  <Card className="p-4">
    <div className="flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
        <Icon className="w-4 h-4" />
      </span>
      <h3 className="flex-1 min-w-0 text-sm font-bold text-[#1E293B]">{title}</h3>
      {action}
    </div>
    <div className="mt-3">{children}</div>
  </Card>
);

const InfoButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-haspopup="dialog"
    aria-label={label}
    className="w-8 h-8 -my-1 -mr-1 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
  >
    <Info className="w-4 h-4" />
  </button>
);

/** Label / value row with a small neutral icon (desktop `tp-detlist`) */
const DetailRow: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode; action?: React.ReactNode }> = ({ icon: Icon, label, children, action }) => (
  <li className="flex items-center gap-3 py-2.5">
    <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0" aria-hidden="true">
      <Icon className="w-4 h-4" />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[11px] text-slate-400">{label}</span>
      <span className="block text-xs font-semibold text-[#1E293B] leading-snug break-words">{children}</span>
    </span>
    {action}
  </li>
);

const Chips: React.FC<{ items: string[]; label: string }> = ({ items, label }) => (
  <ul className="flex flex-wrap gap-1.5" aria-label={label}>
    {items.map((s) => (
      <li key={s} className="px-2.5 py-1 rounded-full bg-white ring-1 ring-inset ring-slate-200 text-[11px] font-semibold text-slate-600 leading-snug">
        {s}
      </li>
    ))}
  </ul>
);

/** Copy button that turns into a check for a moment (desktop `tp-copy-btn`) */
const CopyButton: React.FC<{ value: string; label: string; onCopied: () => void }> = ({ value, label, onCopied }) => {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1500);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          /* clipboard can be blocked in the prototype frame; the confirmation still shows */
        }
        setDone(true);
        onCopied();
      }}
      aria-label={label}
      className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
    >
      {done ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

/**
 * Desktop Talent Profile (`staffingMarketplace&task=viewDetails`, 2026-10 redesign). Summary card (domain, AI match, level,
 * pre-vetted, experience / joining / work mode / country, Save · Download Resume), AI-Upskilled Professional, At a Glance (myCPE banner, Talent
 * Cost, facts), Availability, Your Account Manager, Hiring Details, Psychometric Test, Professional
 * Summary, Total Experience, Technical / Software Skills, evaluation notes, Certificate (locked until an interview is scheduled),
 * myCPE Courses & Learning, Assessments Completed and the Video Profile (unlocked by Request to Hire).
 */
export const TalentProfileView: React.FC<Props> = ({
  profile: p,
  backLabel,
  shortlisted,
  saved,
  aiMatch,
  canAdd,
  canDownload,
  compareCount,
  onOpenCompare,
  onClearCompare,
  onBack,
  onToggleSave,
  onRequestToHire,
  onOpenShortlisted,
  onNotice,
}) => {
  const r = p.resume;
  const [costOpen, setCostOpen] = useState(false);
  const [info, setInfo] = useState<'cost' | 'availability' | 'buyout' | null>(null);
  const [allCourses, setAllCourses] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const experience = experienceLabel(p);
  const pills = experiencePills(p);
  const minutes = cpeMinutes(p);
  const ai = aiCourses(p);
  const upskilling = currentYearCpeMinutes(p) >= UPSKILL_BANNER_MINUTES;
  const cost = CLIENT_IS_MOS ? costBreakdownOf(p) : null;
  const price = priceParts(p);
  const buyout = p.buyoutDays && p.buyoutDays > 0 ? p.buyoutDays : 0;
  const location = [p.location, p.country].filter(Boolean).join(', ');
  const WorkIcon = WORK_ICON[p.workMode] ?? Building2;
  const courses = allCourses ? p.cpeCourses : p.cpeCourses.slice(0, COURSES_SHOWN);
  const proctored = r.assessments.filter((a) => a.hasProctoring).length;
  const canRequest = canAdd && !shortlisted;
  const showVideoLock = r.hasVideo && !shortlisted;
  const notes = [
    ...(r.backgroundVerified && r.backgroundNote ? [{ title: 'Background Verification', text: r.backgroundNote }] : []),
    { title: 'Psychometric Evaluations', text: r.psychometric },
    { title: 'Communication Skills', text: r.communication },
    { title: 'Technical Skills', text: r.technicalNote },
  ].filter((n): n is { title: string; text: string } => Boolean(n.text));

  const facts: { label: string; value: React.ReactNode; tone?: string }[] = [
    ...(experience ? [{ label: 'Experience', value: experience }] : []),
    { label: 'Availability', value: joiningLabel(p.noticeDays), tone: 'text-[#10B981]' },
    { label: 'Work mode', value: p.workMode },
    ...(location
      ? [
          {
            label: 'Location',
            value: (
              <span className="inline-flex items-center gap-1.5 justify-end">
                {p.country && <CountryFlag country={p.country} />}
                {location}
              </span>
            ),
          },
        ]
      : []),
    { label: 'Domain', value: p.domain },
    ...(r.qualifications.length ? [{ label: 'Qualification', value: r.qualifications.join(', ') }] : []),
    ...(p.cpeCourses.length
      ? [{ label: 'Learning Hours', value: `${cpeLabel(minutes)} · ${p.cpeCourses.length} ${p.cpeCourses.length === 1 ? 'course' : 'courses'}` }]
      : []),
  ];

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
        <button
          type="button"
          onClick={onBack}
          aria-label={`Back to ${backLabel}`}
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold screen-title">Talent Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-6 space-y-3">
        {/* Summary */}
        <Card className="p-3.5">
          <div className="flex items-start gap-3">
            <DomainTile domain={p.domain} vetted={r.backgroundVerified} size="sm" />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-[#1E293B] leading-snug">
                {p.profile} <span className="text-xs font-semibold text-slate-400 tabular-nums">({p.resumeId})</span>
              </h2>
              <ul className="mt-1 flex flex-wrap items-center gap-1" aria-label="Profile badges">
                <li className="px-1.5 py-0.5 rounded-md bg-blue-50 text-[10px] font-semibold text-[#2F68FE]">{p.domain}</li>
                {aiMatch ? (
                  <li className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#F5F3FF] text-[10px] font-bold text-[#7C3AED] tabular-nums">
                    <WandSparkles className="w-2.5 h-2.5" aria-hidden="true" />
                    {aiMatch}% AI Match
                  </li>
                ) : null}
                <li className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">{r.level}</li>
                {r.backgroundVerified && (
                  <li className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#E8F8F0] text-[10px] font-bold text-[#10B981]">
                    <CircleCheck className="w-2.5 h-2.5" aria-hidden="true" />
                    Pre-vetted
                  </li>
                )}
              </ul>
            </div>
            <div className="flex items-center -mt-1 -mr-1.5 shrink-0">
              {canRequest && (
                <button
                  type="button"
                  onClick={onToggleSave}
                  aria-pressed={saved}
                  aria-label={saved ? 'Remove from saved resumes' : 'Save this profile'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] ${
                    saved ? 'text-[#2F68FE] bg-blue-50' : 'text-slate-500 active:bg-slate-100'
                  }`}
                >
                  {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
              )}
              {canDownload && (
                <button
                  type="button"
                  onClick={() => onNotice('Resume downloaded.')}
                  aria-label="Download Resume"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <ul className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600" aria-label="Highlights">
            {experience && (
              <li className="inline-flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-slate-400" aria-hidden="true" />
                <strong className="font-bold text-[#1E293B]">{experience}</strong>
              </li>
            )}
            <li className="inline-flex items-center gap-1">
              <Clock3 className="w-3 h-3 text-slate-400" aria-hidden="true" />
              {joiningLabel(p.noticeDays)}
            </li>
            <li className="inline-flex items-center gap-1">
              <WorkIcon className="w-3 h-3 text-slate-400" aria-hidden="true" />
              {p.workMode}
            </li>
            <li className="inline-flex items-center gap-1">
              <CountryFlag country={p.country} />
              {p.country || 'Not specified'}
            </li>
          </ul>
        </Card>

        {/* AI-Upskilled Professional (compact — full detail opens in a bottom sheet) */}
        {ai.length > 0 && (
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            aria-haspopup="dialog"
            className="relative isolate overflow-hidden w-full p-3.5 rounded-2xl bg-linear-to-r from-[#5B7BFA] to-[#7C5CFA] text-white text-left flex items-center gap-3 shadow-[0_12px_24px_-10px_rgba(99,91,250,0.6)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
          >
            <span aria-hidden="true" className="absolute -z-10 -top-14 -right-10 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
            <span className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center shrink-0" aria-hidden="true">
              <WandSparkles className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-white">
                AI-Upskilled Professional
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold text-white">
                  <Zap className="w-3 h-3" aria-hidden="true" />
                  AI Ready
                </span>
              </span>
              <span className="block mt-0.5 text-[11px] text-white/80">
                {ai.length} AI &amp; automation course{ai.length === 1 ? '' : 's'} completed
              </span>
            </span>
            <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0" aria-hidden="true">
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        )}

        {/* At a Glance */}
        <Section icon={ListChecks} title="At a Glance">
          {upskilling && (
            <p className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs font-semibold text-[#2F68FE]">
              <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
              Continuously Upskilling on myCPE
            </p>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1">
              <h4 className="flex-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Talent Cost</h4>
              {cost ? (
                <InfoButton label="About talent cost" onClick={() => setInfo('cost')} />
              ) : (
                <p className="tabular-nums" aria-label={`Talent cost ${price.amount} ${price.unit}`}>
                  <span className="text-lg font-extrabold text-[#1E293B]">{price.amount}</span>{' '}
                  <span className="text-xs font-semibold text-slate-400">{price.unit}</span>
                </p>
              )}
            </div>
            {cost && (
              <>
                <button
                  type="button"
                  onClick={() => setCostOpen((o) => !o)}
                  aria-expanded={costOpen}
                  className="mt-1.5 w-full flex items-center gap-3 text-left cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                >
                  <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
                    <CreditCard className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] text-slate-500">Compensation Package</span>
                    <span className="block text-base font-extrabold text-[#1E293B] tabular-nums">USD {p.monthlyCost.toLocaleString('en-US')}/Mo.</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#2F68FE] transition-transform ${costOpen ? 'rotate-180' : ''}`} />
                </button>
                {costOpen && (
                  <dl className="mt-3 pt-3 border-t border-slate-200/70 space-y-1.5 text-xs">
                    <div className="flex justify-between gap-3 font-bold text-[#1E293B]">
                      <dt>Total Fixed Cost</dt>
                      <dd className="tabular-nums">${cost.fixed.toLocaleString('en-US')}</dd>
                    </div>
                    <div className="pt-1.5">
                      <dt className="font-bold text-[#1E293B]">Variable Components</dt>
                      <dd className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                        Variable pay components shown here are indicative only and calculated on estimated figures. Actual payouts may differ based on individual
                        performance, attendance, and applicable company policy.
                      </dd>
                    </div>
                    {[
                      ['Night Allowance', cost.night],
                      ['Productivity Bonus', cost.bonus],
                      ['PTO Encashment', cost.pto],
                      ['OT Encashment', cost.ot],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-3 text-slate-600">
                        <dt>{label}</dt>
                        <dd className="font-semibold text-[#1E293B] tabular-nums">${Number(value).toLocaleString('en-US')}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-3 font-bold text-[#1E293B]">
                      <dt>Total Variable Cost</dt>
                      <dd className="tabular-nums">${cost.variable.toLocaleString('en-US')}</dd>
                    </div>
                    <div className="mt-1 px-2.5 py-2 rounded-lg bg-blue-50 flex justify-between gap-3 font-bold text-[#1E293B]">
                      <dt>Total Talent Cost</dt>
                      <dd className="text-[#2F68FE] tabular-nums">${cost.total.toLocaleString('en-US')}</dd>
                    </div>
                  </dl>
                )}
              </>
            )}
          </div>

          <dl className="mt-1 divide-y divide-slate-100">
            {facts.map((f) => (
              <div key={f.label} className="flex items-start justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-xs text-slate-500">{f.label}</dt>
                <dd className={`min-w-0 text-right text-xs font-semibold leading-snug break-words ${f.tone ?? 'text-[#1E293B]'}`}>{f.value}</dd>
              </div>
            ))}
            {showVideoLock && canAdd && (
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-xs text-slate-500">Introduction Video</dt>
                <dd>
                  <button
                    type="button"
                    onClick={onRequestToHire}
                    className="h-8 px-2.5 rounded-lg bg-blue-50 border border-blue-100 text-[11px] font-semibold text-[#2F68FE] flex items-center gap-1.5 active:bg-blue-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                  >
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    Visible once shortlisted
                  </button>
                </dd>
              </div>
            )}
          </dl>
        </Section>

        {/* Availability */}
        <Section icon={Clock3} title="Availability" action={<InfoButton label="About availability" onClick={() => setInfo('availability')} />}>
          <ul className="-my-2.5 divide-y divide-slate-100">
            <DetailRow icon={Clock3} label="Available Till">
              <span className="tabular-nums">
                {p.availableTill} ({CLIENT_TZ})
              </span>
            </DetailRow>
            <DetailRow icon={Clock3} label="Availability (per week)">
              <span className="tabular-nums">{r.availableHoursPerDay * 5} Hours/Week</span>
            </DetailRow>
            {p.overtimeRoundYear || p.overtimeSeasonal ? (
              <DetailRow icon={Clock3} label="Overtime Availability (per week)">
                {p.overtimeRoundYear ? <span className="block tabular-nums">{p.overtimeRoundYear} Hours/Week (Round the Year)</span> : null}
                {p.overtimeSeasonal ? <span className="block tabular-nums">{p.overtimeSeasonal} Hours/Week (Seasonal)</span> : null}
              </DetailRow>
            ) : null}
          </ul>
        </Section>

        {/* Your Account Manager */}
        <Section icon={UserRound} title="Your Account Manager">
          <ul className="-my-2.5 divide-y divide-slate-100">
            <DetailRow icon={UserRound} label="Name">
              {CLIENT_ACCOUNT_MANAGER.name}
            </DetailRow>
            <DetailRow
              icon={Mail}
              label="Email"
              action={<CopyButton value={CLIENT_ACCOUNT_MANAGER.email} label="Copy email" onCopied={() => onNotice('Email copied.')} />}
            >
              <a href={`mailto:${CLIENT_ACCOUNT_MANAGER.email}`} className="text-[#2F68FE] break-all">
                {CLIENT_ACCOUNT_MANAGER.email}
              </a>
            </DetailRow>
            <DetailRow icon={Phone} label="Phone No. (US)">
              <a href={`tel:${CLIENT_ACCOUNT_MANAGER.phone.replace(/[^\d+]/g, '')}`} className="tabular-nums">
                {CLIENT_ACCOUNT_MANAGER.phone}
              </a>
            </DetailRow>
            <DetailRow
              icon={UsersRound}
              label="Teams ID"
              action={<CopyButton value={CLIENT_ACCOUNT_MANAGER.email} label="Copy Teams ID" onCopied={() => onNotice('Teams ID copied.')} />}
            >
              <a
                href={`https://teams.microsoft.com/l/chat/0/0?users=${CLIENT_ACCOUNT_MANAGER.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2F68FE] break-all"
              >
                {CLIENT_ACCOUNT_MANAGER.email}
              </a>
            </DetailRow>
          </ul>
        </Section>

        {/* Hiring Details (notice buyout) */}
        {buyout > 0 && (
          <Section icon={Briefcase} title="Hiring Details" action={<InfoButton label="About notice buyout eligibility" onClick={() => setInfo('buyout')} />}>
            <ul className="-my-2.5">
              <DetailRow icon={CreditCard} label="Notice Buyout Eligibility">
                {p.noticeDays > 0 ? `${p.noticeDays} Days | ` : ''}Buyout: {buyout} {buyout === 1 ? 'Day' : 'Days'}
              </DetailRow>
            </ul>
          </Section>
        )}

        {p.hasPsychometricFile && canDownload && (
          <FileButton icon={Download} label="Download Psychometric Test" onClick={() => onNotice('Psychometric test downloaded.')} />
        )}

        {r.summary && (
          <Section icon={FileText} title="Professional Summary">
            <p className="text-xs text-slate-600 leading-relaxed">{r.summary}</p>
          </Section>
        )}

        {(pills.length > 0 || r.jobs.length > 0) && (
          <Section icon={Briefcase} title="Total Experience">
            {pills.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Experience by country">
                {pills.map((e) => (
                  <li key={e.country} className="px-2.5 py-1 rounded-full bg-blue-50 text-[11px] font-semibold text-[#2F68FE] tabular-nums">
                    {e.value} <span className="text-[#2F68FE]/60">·</span> {e.country}
                  </li>
                ))}
              </ul>
            )}
            {r.jobs.length > 0 && (
              <ul className={`${pills.length ? 'mt-3' : ''} space-y-3`}>
                {r.jobs.map((j) => {
                  const duration = durationLabel(j.from, j.to);
                  return (
                    <li key={`${j.company}-${j.from}`} className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0" aria-hidden="true">
                        <Building2 className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-500">{j.company}</p>
                        <p className="text-[13px] font-bold text-[#1E293B] leading-snug">{j.designation}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
                          {formatMonthYear(j.from)} - {j.to ? formatMonthYear(j.to) : 'Present'}
                          {duration ? ` (${duration})` : ''}
                        </p>
                        {j.skills && (
                          <>
                            <p className="mt-2 text-[11px] font-bold text-[#1E293B]">Roles &amp; Responsibilities</p>
                            <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{j.skills}</p>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        )}

        {r.technicalSkills.length > 0 && (
          <Section icon={Wrench} title="Technical Skills">
            <Chips items={r.technicalSkills} label="Technical Skills" />
          </Section>
        )}

        {r.softwareSkills.length > 0 && (
          <Section icon={Laptop} title="Software Skills">
            <Chips items={r.softwareSkills} label="Software Skills" />
          </Section>
        )}

        {notes.length > 0 && (
          <Section icon={MessageSquareText} title="Evaluation Notes">
            <ul className="-my-2.5 divide-y divide-slate-100">
              {notes.map((n) => (
                <li key={n.title} className="py-2.5">
                  <h4 className="text-xs font-bold text-[#1E293B]">{n.title}</h4>
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{n.text}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {r.certificates.length > 0 && (
          <Section icon={Award} title="Certificate">
            <ul className="-my-2.5 divide-y divide-slate-100">
              {r.certificates.map((c) => (
                <li key={c} className="py-2.5 flex items-start gap-2.5">
                  <Award className="w-4 h-4 mt-px text-[#2F68FE] shrink-0" aria-hidden="true" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-[#1E293B] leading-snug">{c}</span>
                    <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                      <Lock className="w-2.5 h-2.5" aria-hidden="true" />
                      On Interview Scheduled
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {p.cpeCourses.length > 0 && (
          <Section icon={Award} title="myCPE Courses & Learning">
            <p className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-[#2F68FE]">
              <span className="text-lg font-extrabold tabular-nums">{p.cpeCourses.length}</span>
              <span className="leading-snug">
                myCPE course certification{p.cpeCourses.length === 1 ? '' : 's'}
                {minutes > 0 && (
                  <>
                    {' '}
                    · <strong className="font-bold">{cpeLabel(minutes)} learning</strong> completed
                  </>
                )}
              </span>
            </p>
            {ai.length > 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F3FF] text-[11px] text-[#7C3AED]">
                <WandSparkles className="w-3 h-3" aria-hidden="true" />
                <strong className="font-bold tabular-nums">{ai.length}</strong>
                AI-focused course{ai.length === 1 ? '' : 's'} completed
              </p>
            )}
            <ul className="mt-2 divide-y divide-slate-100" id="tm-profile-courses">
              {courses.map((c) => (
                <li key={c.name} className="py-2.5 flex items-start gap-2.5">
                  {c.ai ? (
                    <WandSparkles className="w-4 h-4 mt-px text-[#7C3AED] shrink-0" aria-hidden="true" />
                  ) : (
                    <CircleCheck className="w-4 h-4 mt-px text-[#2F68FE] shrink-0" aria-hidden="true" />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-[#1E293B] leading-snug">
                      {c.name}
                      {c.ai && <span className="ml-1.5 px-1.5 py-px rounded bg-[#F5F3FF] text-[10px] font-bold text-[#7C3AED] align-[1px]">AI</span>}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400 tabular-nums">
                      {formatShortDate(c.completedOn)} · {cpeLabel(c.minutes)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {p.cpeCourses.length > COURSES_SHOWN && (
              <button
                type="button"
                onClick={() => setAllCourses((v) => !v)}
                aria-expanded={allCourses}
                aria-controls="tm-profile-courses"
                className="mt-1 h-8 px-1 -ml-1 rounded-lg inline-flex items-center gap-1 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50/50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
              >
                {allCourses ? 'Show less' : `View all ${p.cpeCourses.length}`}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${allCourses ? 'rotate-180' : ''}`} />
              </button>
            )}
          </Section>
        )}

        {r.assessments.length > 0 && (
          <Section icon={ClipboardCheck} title="Assessments Completed">
            <p className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#E8F8F0] border border-emerald-200/50 text-xs text-emerald-700">
              <span className="text-lg font-extrabold tabular-nums text-[#10B981]">{r.assessments.length}</span>
              <span className="leading-snug">
                Pre-hire assessment{r.assessments.length === 1 ? '' : 's'} completed
                {proctored > 0 && (
                  <>
                    {' '}
                    · <strong className="font-bold">{proctored} proctored</strong>
                  </>
                )}
              </span>
            </p>
            <ul className="mt-2 divide-y divide-slate-100">
              {r.assessments.map((a) => (
                <li key={a.name} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1E293B] leading-snug">
                      {a.name} <span className="ml-1 px-1.5 py-px rounded bg-slate-100 text-[10px] font-bold text-slate-500 align-[1px]">{a.type}</span>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-slate-400">
                      <span className="tabular-nums">{formatShortDate(a.lastAssessedOn)}</span>
                      {a.hasProctoring && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Video className="w-3 h-3" aria-hidden="true" />
                            Proctored
                          </span>
                        </>
                      )}
                      {a.hasReport && canDownload && (
                        <>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={() => onNotice(`${a.name} report opened.`)}
                            className="font-bold text-[#2F68FE] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE] rounded"
                          >
                            View Report
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="block text-lg font-extrabold text-[#1E293B] tabular-nums leading-none">
                      {a.scorePct}
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </span>
                    <span className="block mt-0.5 text-[10px] font-medium text-slate-400">Score</span>
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Video Profile */}
        {showVideoLock ? (
          <section className="relative isolate overflow-hidden p-4 rounded-2xl bg-linear-to-r from-[#5B7BFA] to-[#7C5CFA] text-white text-center shadow-[0_12px_24px_-10px_rgba(99,91,250,0.6)]">
            <span aria-hidden="true" className="absolute -z-10 -top-14 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
            <span aria-hidden="true" className="absolute -z-10 -bottom-16 -left-10 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
            <span className="mx-auto w-11 h-11 rounded-full bg-white/15 border border-white/20 text-white flex items-center justify-center" aria-hidden="true">
              <Lock className="w-5 h-5" />
            </span>
            <h3 className="mt-2.5 text-sm font-bold text-white">Video Profile — Unlock by Requesting to Hire</h3>
            <p className="mt-1 text-xs text-white/80 leading-relaxed">
              To protect candidates&apos; time, video introductions are revealed only to firms that have requested to hire them. Request to hire this candidate to
              unlock the video walkthrough of their experience and screening interview.
            </p>
            {canAdd && (
              <button
                type="button"
                onClick={onRequestToHire}
                className="mt-3.5 w-full h-11 rounded-xl bg-white text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_8px_18px_-12px_rgba(15,23,42,0.5)] active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Send className="w-4 h-4" />
                Request to Hire to Unlock Video
              </button>
            )}
          </section>
        ) : (
          r.hasVideo && (
            <Section icon={Video} title="Video Profile">
              <button
                type="button"
                onClick={() => onNotice('Playing the video profile.')}
                aria-label="Play video profile"
                className="relative w-full aspect-video rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center active:bg-slate-200/70 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                <span className="w-14 h-14 rounded-full bg-[#2F68FE] text-white flex items-center justify-center ring-8 ring-white">
                  <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                </span>
                <span className="absolute left-3 bottom-2.5 text-[11px] font-semibold text-slate-500">Candidate introduction &amp; screening interview</span>
              </button>
            </Section>
          )
        )}
      </div>

      {(compareCount > 0 || canRequest || shortlisted) && (
        <div className="shrink-0 px-4 pt-3 pb-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          {compareCount > 0 && (
            <div className={`flex items-center gap-2 h-11 pl-3 pr-1.5 rounded-xl bg-slate-50 border border-slate-100 ${canRequest || shortlisted ? 'mb-3' : ''}`}>
              <Columns2 className="w-4 h-4 text-[#2F68FE] shrink-0" aria-hidden="true" />
              <p className="flex-1 min-w-0 text-xs font-bold text-[#1E293B] truncate" role="status">
                <span className="tabular-nums">{compareCount}</span> {compareCount === 1 ? 'profile selected' : 'profiles selected'}
              </p>
              <button
                type="button"
                onClick={onClearCompare}
                className="h-8 px-2 rounded-lg text-[11px] font-bold text-[#2F68FE] active:bg-blue-50/50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={onOpenCompare}
                disabled={compareCount < 2}
                className="h-8 px-3 rounded-lg bg-[#2F68FE] text-white text-[11px] font-bold active:bg-[#1D4ED8] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                Compare
              </button>
            </div>
          )}
          {shortlisted ? (
            <div className="flex items-center gap-2.5">
              <span className="flex-1 h-12 rounded-xl bg-blue-50 text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5" role="status">
                <Check className="w-4 h-4" />
                Shortlisted
              </span>
              {onOpenShortlisted && (
                <button
                  type="button"
                  onClick={onOpenShortlisted}
                  className="flex-1 h-12 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                >
                  <UsersRound className="w-4 h-4" />
                  View Shortlisted
                </button>
              )}
            </div>
          ) : (
            canRequest && (
              <button
                type="button"
                onClick={onRequestToHire}
                className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                <Send className="w-4 h-4" />
                Request to Hire
              </button>
            )
          )}
        </div>
      )}

      <BottomSheet isOpen={aiOpen} onClose={() => setAiOpen(false)} maxHeight="max-h-[70%]">
        <SheetHeader title="AI-Upskilled Professional" onClose={() => setAiOpen(false)} />
        <div className="px-5 pt-4 pb-8 overflow-y-auto no-scrollbar">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0" aria-hidden="true">
              <WandSparkles className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[10px] font-bold text-[#7C3AED]">
                <Zap className="w-3 h-3" aria-hidden="true" />
                AI Ready
              </span>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Has completed{' '}
                <strong className="font-bold text-[#1E293B]">
                  {ai.length} AI &amp; automation course{ai.length === 1 ? '' : 's'}
                </strong>{' '}
                on the myCPE platform, trained to work alongside your firm&apos;s AI tools and accelerate research, review &amp; documentation.
              </p>
            </div>
          </div>
          <h4 className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">AI Courses</h4>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="AI courses">
            {ai.map((c) => (
              <li key={c.name} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-600">
                <Check className="w-3 h-3 text-[#7C3AED]" aria-hidden="true" />
                {c.name}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setAiOpen(false)}
            className="mt-5 w-full h-11 rounded-xl bg-[#2F68FE] text-white text-[13px] font-bold active:bg-[#1D4ED8] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
          >
            Got it
          </button>
        </div>
      </BottomSheet>
      <InfoSheet isOpen={info === 'cost'} title="Talent Cost" onClose={() => setInfo(null)}>
        Talent costs shown are indicative only. Actual amounts may differ as they are subject to currency conversion rate variations.
      </InfoSheet>
      <InfoSheet isOpen={info === 'availability'} title="Availability" onClose={() => setInfo(null)}>
        The &quot;Available Till&quot; time displayed represents the candidate&apos;s standard working hours during non-tax season. During tax season, the candidate may
        extend their availability based on your project&apos;s specific needs.
      </InfoSheet>
      <InfoSheet isOpen={info === 'buyout'} title="Hiring Details" onClose={() => setInfo(null)}>
        The candidate is eligible for a notice buyout of up to {buyout} {buyout === 1 ? 'day' : 'days'}, allowing for earlier onboarding if required.
      </InfoSheet>
    </div>
  );
};
