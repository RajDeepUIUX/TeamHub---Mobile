import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Brain,
  Briefcase,
  CalendarClock,
  ChartColumn,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Globe,
  GraduationCap,
  Info,
  Laptop,
  Lock,
  MapPin,
  MessageSquareText,
  Play,
  ShieldCheck,
  TimerReset,
  UserRound,
  UsersRound,
  Video,
  Wallet,
  Wrench,
} from 'lucide-react';
import { Card, InfoSheet } from '../staff/tabs/StaffTabParts';
import { FileButton } from '../interviews/CandidateResumeView';
import { CLIENT_IS_MOS } from '../data/clientTimesheetsData';
import { formatExperience, formatMonthYear, formatShortDate } from '../data/clientInterviewsData';
import { HubProfile, costBreakdownOf, joiningLabel, rateLabel } from '../data/clientStaffHubData';

interface Props {
  profile: HubProfile;
  /** Tab the resume was opened from (desktop breadcrumb: Available Resumes / Saved Resumes) */
  fromLabel: string;
  shortlisted: boolean;
  saved: boolean;
  /** `add`: Shortlist Candidate and Save */
  canAdd: boolean;
  /** `download`: psychometric test, certificates, assessment reports */
  canDownload: boolean;
  onBack: () => void;
  onToggleSave: () => void;
  onShortlist: () => void;
  onOpenShortlisted?: () => void;
  onNotice: (text: string) => void;
}

const COURSES_SHOWN = 5;
const LOCKED_TEXT = 'Visible once the candidate is shortlisted.';

const InfoToggle: React.FC<{ open: boolean; onToggle: () => void; label: string }> = ({ open, onToggle, label }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-haspopup="dialog"
    aria-label={label}
    className={`w-8 h-8 -my-1 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${open ? 'text-[#2F68FE] bg-[#EFF6FF]' : 'text-[#2F68FE] active:bg-slate-100'}`}
  >
    <Info className="w-4 h-4" />
  </button>
);

/** Desktop shows the monthly talent cost as "$851/Month" in the chip row */
const rateChip = (p: HubProfile) => (CLIENT_IS_MOS ? `$${p.monthlyCost}/Month` : `$${p.resume.hourlyRate}/Hr`);

/* ======================================================================
 * V2 design: dark hero with actions, flat full-width blocks, label / value rows
 * ====================================================================== */

const SKILLS_SHOWN_V2 = 10;

const BlockV2: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, action, children }) => (
  <Card className="mt-3 p-4">
    <div className="mb-3 flex items-center gap-2.5 min-h-6">
      <h3 className="shrink-0 text-sm font-bold text-[#1E293B]">{title}</h3>
      <span className="flex-1 h-px bg-slate-100" aria-hidden="true" />
      {action}
    </div>
    {children}
  </Card>
);

const KeyValueV2: React.FC<{ label: string; aside?: React.ReactNode; children: React.ReactNode }> = ({ label, aside, children }) => (
  <div className="flex items-start justify-between gap-4 py-2.5">
    <dt className="shrink-0 max-w-[50%] flex items-center gap-1 text-xs font-medium text-slate-500 leading-snug">
      {label}
      {aside}
    </dt>
    <dd className="min-w-0 text-right text-[13px] font-semibold text-[#1E293B] leading-snug break-words">{children}</dd>
  </div>
);

/** Money row with a dotted leader between label and amount */
const LeaderRowV2: React.FC<{ label: string; value: number; strong?: boolean }> = ({ label, value, strong }) => (
  <div className={`flex items-baseline gap-2 py-1.5 ${strong ? 'text-[13px] font-bold text-[#1E293B]' : 'text-xs text-slate-600'}`}>
    <span className="shrink-0">{label}</span>
    <span className="flex-1 border-b border-dotted border-slate-300 translate-y-[-3px]" aria-hidden="true" />
    <span className={`shrink-0 tabular-nums text-[#1E293B] ${strong ? 'font-extrabold' : 'font-semibold'}`}>${value.toLocaleString('en-US')}</span>
  </div>
);

/** Wrapping skill tags with a flat icon tile, collapsed after SKILLS_SHOWN_V2 */
const SkillGridV2: React.FC<{ items: string[]; label: string; icon: React.ElementType }> = ({ items, label, icon: Icon }) => {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, SKILLS_SHOWN_V2);
  return (
    <>
      <ul className="flex flex-wrap gap-2" aria-label={label}>
        {shown.map((s) => (
          <li
            key={s}
            className="max-w-full inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-[#1E293B] leading-snug"
          >
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
              <Icon className="w-3.5 h-3.5" />
            </span>
            <span className="min-w-0 break-words">{s}</span>
          </li>
        ))}
      </ul>
      {items.length > SKILLS_SHOWN_V2 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-3 w-full h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-1 text-[11px] font-bold text-[#2F68FE] active:bg-slate-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
        >
          {open ? 'Show Less' : `Show More (${items.length - SKILLS_SHOWN_V2})`}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    </>
  );
};

const CountV2: React.FC<{ n: number }> = ({ n }) => (
  <span className="min-w-6 h-6 px-2 rounded-full bg-[#EFF6FF] text-[11px] font-bold text-[#2F68FE] flex items-center justify-center tabular-nums">{n}</span>
);

/** Circular score for an assessment */
const ScoreRingV2: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 19;
  const c = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, pct));
  return (
    <span className="relative w-12 h-12 shrink-0 flex items-center justify-center">
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#DBEAFE" strokeWidth="5" />
        <circle cx="24" cy="24" r={r} fill="none" stroke="#2F68FE" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
      </svg>
      <span className="relative text-[11px] font-extrabold text-[#1E293B] tabular-nums">{pct}%</span>
    </span>
  );
};

/**
 * Desktop "View Resume" (`staffingMarketplace&task=viewDetails`). Left column: level, profile (Resume ID), Shortlist Candidate +
 * Save, rate / work mode / joining chips, Talent Cost, Availability, Hiring Details. Right column: Professional Summary,
 * Technical Skills, Software Skills, Certificate, Courses, then experience, evaluation notes and assessments. Certificates,
 * course certificates and the video stay locked until the candidate is shortlisted.
 */
export const HubResumeView: React.FC<Props> = ({
  profile,
  fromLabel,
  shortlisted,
  saved,
  canAdd,
  canDownload,
  onBack,
  onToggleSave,
  onShortlist,
  onOpenShortlisted,
  onNotice,
}) => {
  const [costOpen, setCostOpen] = useState(false);
  const [costInfo, setCostInfo] = useState(false);
  const [tillInfo, setTillInfo] = useState(false);
  const [allCourses, setAllCourses] = useState(false);
  const r = profile.resume;

  const experience = [
    { label: 'US', value: formatExperience(r.experience.us) },
    { label: 'India', value: formatExperience(r.experience.india) },
    { label: 'UK', value: formatExperience(r.experience.uk) },
    { label: 'Canada', value: formatExperience(r.experience.canada) },
  ].filter((e) => e.value);
  const hasNotes = (r.backgroundVerified && r.backgroundNote) || r.psychometric || r.communication || r.technicalNote;
  const courses = allCourses ? r.courses : r.courses.slice(0, COURSES_SHOWN);
  const cost = CLIENT_IS_MOS ? costBreakdownOf(profile) : null;
  const buyout = profile.buyoutDays && profile.buyoutDays > 0 ? profile.buyoutDays : 0;
  const unlocked = shortlisted && canDownload;
  const notes = [
    ...(r.backgroundVerified ? [{ title: 'Background Verification', text: r.backgroundNote }] : []),
    { title: 'Psychometric Evaluations', text: r.psychometric },
    { title: 'Communication Skills', text: r.communication },
    { title: 'Technical Skills', text: r.technicalNote },
  ].filter((n): n is { title: string; text: string } => Boolean(n.text));

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
        <button
          type="button"
          onClick={onBack}
          aria-label={`Back to ${fromLabel}`}
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold screen-title">View Resume</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3.5 pb-8">
        {/* Profile highlight */}
        <Card className="p-3.5">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
              <UserRound className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-[#1E293B] leading-snug">{profile.profile}</h2>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400 tabular-nums">({profile.resumeId})</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[11px] font-bold text-[#2F68FE]">{r.level}</span>
                {r.backgroundVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F8F0] border border-emerald-200/50 text-[11px] font-bold text-[#10B981]">
                    <BadgeCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
                {shortlisted && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[11px] font-bold text-[#2F68FE]">
                    <Check className="w-3 h-3" />
                    Shortlisted
                  </span>
                )}
              </div>
            </div>
          </div>

          <ul className="mt-3 grid grid-cols-3 rounded-xl bg-slate-50 border border-slate-100 divide-x divide-slate-100" aria-label="Rate, work mode and joining">
            {[rateChip(profile), profile.workMode, joiningLabel(profile.noticeDays)].map((c) => (
              <li key={c} className="min-w-0 px-2 py-2 text-center text-xs font-bold text-[#1E293B] leading-tight tabular-nums break-words">
                {c}
              </li>
            ))}
          </ul>

          {shortlisted
            ? onOpenShortlisted && (
                <button
                  type="button"
                  onClick={onOpenShortlisted}
                  className="mt-3 w-full h-11 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                >
                  <UsersRound className="w-4 h-4" />
                  View Shortlisted
                </button>
              )
            : canAdd && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onShortlist}
                    className="flex-1 h-11 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
                  >
                    Shortlist Candidate
                  </button>
                  <button
                    type="button"
                    onClick={onToggleSave}
                    aria-pressed={saved}
                    aria-label={saved ? 'Remove from Saved Resumes' : 'Save resume'}
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
                      saved ? 'border-[#2F68FE] bg-blue-50 text-[#2F68FE]' : 'border-[#2F68FE] bg-white text-[#2F68FE] active:bg-blue-50'
                    }`}
                  >
                    {saved ? <BookmarkCheck className="w-4.5 h-4.5" /> : <Bookmark className="w-4.5 h-4.5" />}
                  </button>
                </div>
              )}
        </Card>

        {/* Talent Cost */}
        <BlockV2
          title={cost ? 'Talent Cost' : 'Hourly Charges'}
          action={<InfoToggle open={costInfo} onToggle={() => setCostInfo(true)} label={cost ? 'About talent cost' : 'About hourly charges'} />}
        >
          <InfoSheet isOpen={costInfo} title={cost ? 'Talent Cost' : 'Hourly Charges'} onClose={() => setCostInfo(false)}>
            {cost
              ? 'Talent costs shown are indicative only. Actual amounts may differ as they are subject to currency conversion rate variations.'
              : 'Hourly charges for this resume, billed on the hours worked.'}
          </InfoSheet>
          {cost ? (
            <>
              <button
                type="button"
                onClick={() => setCostOpen((o) => !o)}
                aria-expanded={costOpen}
                className="w-full flex items-end justify-between gap-3 text-left cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium text-slate-500">Compensation Package</span>
                  <span className="block text-lg font-extrabold text-[#1E293B] tabular-nums leading-tight">{rateLabel(profile)}</span>
                </span>
                <span className="mb-1 w-8 h-8 rounded-full bg-blue-50 text-[#2F68FE] flex items-center justify-center shrink-0">
                  <ChevronDown className={`w-4 h-4 transition-transform ${costOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {costOpen && (
                <div className="mt-3 rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="px-3.5 py-1.5">
                    <LeaderRowV2 label="Total Fixed Cost" value={cost.fixed} strong />
                  </div>
                  <div className="px-3.5 py-3 bg-slate-50 border-y border-slate-100">
                    <p className="text-xs font-bold text-[#1E293B]">Variable Components</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                      Variable pay components shown here are indicative only and calculated on estimated figures. Actual payouts may differ based on individual performance.
                    </p>
                    <div className="mt-2">
                      <LeaderRowV2 label="Night Allowance" value={cost.night} />
                      <LeaderRowV2 label="Productivity Bonus" value={cost.bonus} />
                      <LeaderRowV2 label="PTO Encashment" value={cost.pto} />
                      <LeaderRowV2 label="OT Encashment" value={cost.ot} />
                      <LeaderRowV2 label="Total Variable Cost" value={cost.variable} strong />
                    </div>
                  </div>
                  <div className="px-3.5 py-3 bg-blue-50 flex items-center justify-between gap-3">
                    <span className="text-[13px] font-bold text-[#1E293B]">Total Talent Cost</span>
                    <span className="text-base font-extrabold text-[#2F68FE] tabular-nums">${cost.total.toLocaleString('en-US')}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <span className="block text-[11px] font-medium text-slate-500">Hourly Charges</span>
              <span className="block text-lg font-extrabold text-[#1E293B] tabular-nums leading-tight">{rateLabel(profile)}</span>
            </div>
          )}
        </BlockV2>

        {/* Availability */}
        <BlockV2 title="Availability">
          <dl className="-my-2.5 divide-y divide-slate-100">
            <div>
              <KeyValueV2 label="Available Till" aside={<InfoToggle open={tillInfo} onToggle={() => setTillInfo(true)} label="About Available Till" />}>
                <span className="tabular-nums">{profile.availableTill}</span>
              </KeyValueV2>
              <InfoSheet isOpen={tillInfo} title="Available Till" onClose={() => setTillInfo(false)}>
                The latest time the candidate can work each day, shown in your time zone.
              </InfoSheet>
            </div>
            <KeyValueV2 label="Availability (per week)">
              <span className="tabular-nums">{r.availableHoursPerDay * 5} Hours/Week</span>
            </KeyValueV2>
            <KeyValueV2 label="Overtime Availability (per week)">
              <span className="tabular-nums">{profile.overtimeHoursPerWeek ? `${profile.overtimeHoursPerWeek} Hours/Week` : '-'}</span>
            </KeyValueV2>
          </dl>
        </BlockV2>

        {/* Hiring Details */}
        <BlockV2 title="Hiring Details">
          <dl className="-my-2.5 divide-y divide-slate-100">
            <KeyValueV2 label="Domain">{profile.domain}</KeyValueV2>
            <KeyValueV2 label="Qualifications">
              {r.qualifications.map((q) => (
                <span key={q} className="block">
                  {q}
                </span>
              ))}
            </KeyValueV2>
            <KeyValueV2 label="Location">{profile.location}</KeyValueV2>
            {buyout > 0 && (
              <KeyValueV2 label="Notice Buyout Eligibility">
                {profile.noticeDays > 0 ? `${profile.noticeDays} | ` : ''}Buyout: {buyout} {buyout === 1 ? 'Day' : 'Days'}
              </KeyValueV2>
            )}
          </dl>
          {profile.hasPsychometricFile && canDownload && (
            <div className="mt-4">
              <FileButton icon={Download} label="Download Psychometric Test" onClick={() => onNotice('Psychometric test downloaded')} />
            </div>
          )}
        </BlockV2>

        {r.summary && (
          <BlockV2 title="Professional Summary">
            <div className="relative pl-6">
              <span aria-hidden="true" className="absolute left-0 -top-1 text-[32px] font-extrabold leading-none text-[#BFDBFE]">
                &ldquo;
              </span>
              <ClampText text={r.summary} className="text-[13px] text-slate-700 leading-relaxed" />
            </div>
          </BlockV2>
        )}

        {r.technicalSkills.length > 0 && (
          <BlockV2 title="Technical Skills" action={<CountV2 n={r.technicalSkills.length} />}>
            <SkillGridV2 items={r.technicalSkills} label="Technical Skills" icon={Wrench} />
          </BlockV2>
        )}

        {r.softwareSkills.length > 0 && (
          <BlockV2 title="Software Skills" action={<CountV2 n={r.softwareSkills.length} />}>
            <SkillGridV2 items={r.softwareSkills} label="Software Skills" icon={Laptop} />
          </BlockV2>
        )}

        {r.certificates.length > 0 && (
          <BlockV2 title="Certificate">
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr] gap-3 px-3.5 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                <span>Certificate Name</span>
                <span>Certificate</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {r.certificates.map((c) => (
                  <li key={c} className="grid grid-cols-[1fr_1fr] gap-3 items-center px-3.5 py-3 text-xs">
                    <span className="font-semibold text-[#1E293B] leading-snug">{c}</span>
                    {unlocked ? (
                      <span>
                        <FileButton icon={Download} label="Download" onClick={() => onNotice(`${c} certificate downloaded`)} />
                      </span>
                    ) : (
                      <span className="flex items-start gap-1 text-[11px] font-semibold text-[#D97706] leading-snug">
                        <Lock className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                        {LOCKED_TEXT}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </BlockV2>
        )}

        {r.courses.length > 0 && (
          <BlockV2 title="Courses">
            <ul className="-my-3 divide-y divide-slate-100">
              {courses.map((c) => (
                <li key={c.name} className="py-3">
                  <p className="text-[13px] font-bold text-[#1E293B] leading-snug">{c.name}</p>
                  <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                    <div className="flex gap-1">
                      <dt className="text-slate-400">Duration</dt>
                      <dd className="font-semibold text-[#1E293B] tabular-nums">{c.duration || 'NA'}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt className="text-slate-400">Date of Completion</dt>
                      <dd className="font-semibold text-[#1E293B] tabular-nums">{c.completedOn ? formatShortDate(c.completedOn) : 'NA'}</dd>
                    </div>
                    <div className="flex gap-1 items-start">
                      <dt className="text-slate-400 shrink-0">Certificate</dt>
                      <dd>
                        {!c.hasCertificate ? (
                          <span className="font-semibold text-[#1E293B]">NA</span>
                        ) : unlocked ? (
                          <button
                            type="button"
                            onClick={() => onNotice(`${c.name} certificate downloaded`)}
                            className="inline-flex items-center gap-1 font-bold text-[#2F68FE] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        ) : (
                          <span className="inline-flex items-start gap-1 font-semibold text-[#D97706] leading-snug">
                            <Lock className="w-3 h-3 mt-0.5 shrink-0" />
                            {LOCKED_TEXT}
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
            {r.courses.length > COURSES_SHOWN && (
              <button
                type="button"
                onClick={() => setAllCourses((v) => !v)}
                aria-expanded={allCourses}
                className="mt-4 h-8 px-3 rounded-full bg-blue-50 inline-flex items-center gap-1 text-[11px] font-bold text-[#2F68FE] active:bg-blue-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
              >
                {allCourses ? 'Show fewer courses' : `Show all ${r.courses.length} courses`}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${allCourses ? 'rotate-180' : ''}`} />
              </button>
            )}
          </BlockV2>
        )}

        {r.hasVideo && (
          <BlockV2 title="Video Summary">
            {shortlisted ? (
              <button
                type="button"
                onClick={() => onNotice('Playing the introduction video')}
                aria-label="Play introduction video"
                className="relative w-full aspect-video rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden active:bg-slate-200/70 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                <span className="relative w-14 h-14 rounded-full bg-[#2F68FE] text-white flex items-center justify-center ring-8 ring-white">
                  <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                </span>
                <span className="absolute left-3 bottom-2.5 text-[11px] font-semibold text-slate-500">Self introduction</span>
              </button>
            ) : (
              <div className="relative w-full aspect-video rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 px-6 text-center overflow-hidden">
                <span className="w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </span>
                <span className="text-[13px] font-bold text-[#1E293B]">Video is locked</span>
                <span className="text-[11px] text-slate-500 leading-snug">{LOCKED_TEXT}</span>
              </div>
            )}
          </BlockV2>
        )}

        {experience.length > 0 && (
          <BlockV2 title="Total Experience">
            <dl className={`grid ${experience.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} rounded-2xl border border-slate-100 overflow-hidden`}>
              {experience.map((e, i) => (
                <div
                  key={e.label}
                  className={`min-w-0 px-3.5 py-3 ${i % 2 === 1 ? 'border-l border-slate-100' : ''} ${i > 1 ? 'border-t border-slate-100' : ''}`}
                >
                  <dt className="text-[11px] text-slate-500">{e.label}</dt>
                  <dd className="mt-0.5 text-sm font-extrabold text-[#1E293B] leading-snug tabular-nums break-words">{e.value}</dd>
                </div>
              ))}
            </dl>
          </BlockV2>
        )}

        {r.jobs.length > 0 && (
          <BlockV2 title="Work History">
            <ul className="space-y-3">
              {r.jobs.map((j) => (
                <li key={`${j.company}-${j.from}`} className="pl-3 border-l-[3px] border-[#2F68FE]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-[#1E293B] leading-snug">{j.designation}</span>
                      <span className="block mt-0.5 text-xs text-slate-500">{j.company}</span>
                    </span>
                    <span className="shrink-0 text-right text-[11px] font-semibold text-slate-400 tabular-nums leading-snug">
                      {formatMonthYear(j.from)} –<br />
                      {j.to ? formatMonthYear(j.to) : 'Present'}
                    </span>
                  </div>
                  {j.skills && <ClampText text={j.skills} className="mt-1.5 text-xs text-slate-600 leading-relaxed" />}
                </li>
              ))}
            </ul>
          </BlockV2>
        )}

        {hasNotes && (
          <BlockV2 title="Evaluation Notes">
            <ul className="-my-3 divide-y divide-slate-100">
              {notes.map((n) => (
                <li key={n.title} className="py-3">
                  <h4 className="flex items-center gap-2 text-[13px] font-bold text-[#1E293B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2F68FE] shrink-0" aria-hidden="true" />
                    {n.title}
                  </h4>
                  <div className="pl-3.5">
                    <ClampText text={n.text} className="mt-1 text-xs text-slate-600 leading-relaxed" />
                  </div>
                </li>
              ))}
            </ul>
          </BlockV2>
        )}

        {r.assessments.length > 0 && (
          <BlockV2 title="Assessments">
            <ul className="-my-3 divide-y divide-slate-100">
              {r.assessments.map((a) => (
                <li key={a.name} className="py-3 flex items-start gap-3">
                  <ScoreRingV2 pct={a.scorePct} />
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-[13px] font-bold text-[#1E293B] leading-snug">{a.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {a.type} · Last assessed {formatShortDate(a.lastAssessedOn)}
                    </p>
                    {canDownload && (a.hasReport || a.hasProctoring) && (
                      <div className="mt-2.5 flex items-center gap-2">
                        {a.hasReport && <FileButton label="Report" onClick={() => onNotice(`${a.name} report opened`)} />}
                        {a.hasProctoring && <FileButton label="Proctoring" onClick={() => onNotice(`${a.name} proctoring video opened`)} />}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </BlockV2>
        )}
      </div>
    </div>
  );
};

/* ======================================================================
 * V1 design
 * ====================================================================== */

const SKILLS_SHOWN = 8;

/** Long text clamped to 4 lines with Show More / Show Less (toggle only when the text overflows) */
const ClampText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const check = () => setOverflows(el.scrollHeight - el.clientHeight > 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, open]);

  return (
    <div>
      <p ref={ref} className={`${className} ${open ? '' : 'line-clamp-4'}`}>
        {text}
      </p>
      {(overflows || open) && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-1.5 -ml-1 h-7 px-1 rounded-md inline-flex items-center gap-0.5 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
        >
          {open ? 'Show Less' : 'Show More'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
};

/** Section card: one flat icon tile for every section (redesign.md §4: no per-category colour) */
const SectionV1: React.FC<{ icon: React.ElementType; title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ icon: Icon, title, action, children }) => (
  <Card className="mt-3 overflow-hidden">
    <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
      <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
        <Icon className="w-4 h-4" />
      </span>
      <h3 className="flex-1 min-w-0 truncate text-sm font-bold text-[#1E293B]">{title}</h3>
      {action}
    </div>
    <div className="px-4 pb-4">{children}</div>
  </Card>
);

const RowV1: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode; aside?: React.ReactNode }> = ({ icon: Icon, label, children, aside }) => (
  <div className="flex items-start gap-3 py-2.5">
    <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0" aria-hidden="true">
      <Icon className="w-4 h-4" />
    </span>
    <div className="flex-1 min-w-0 pt-px">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <div className="mt-0.5 text-[13px] font-semibold text-[#1E293B] leading-snug">{children}</div>
    </div>
    {aside}
  </div>
);

const MoneyV1: React.FC<{ label: string; value: number; strong?: boolean }> = ({ label, value, strong }) => (
  <div className={`flex items-center justify-between gap-3 py-2 ${strong ? 'text-[13px] font-bold text-[#1E293B]' : 'text-xs text-slate-600'}`}>
    <span>{label}</span>
    <span className={`tabular-nums ${strong ? 'font-extrabold' : 'font-semibold'} text-[#1E293B]`}>${value.toLocaleString('en-US')}</span>
  </div>
);

/** Skill chips, collapsed after SKILLS_SHOWN with Show More / Show Less */
const SkillChips: React.FC<{ items: string[]; label: string }> = ({ items, label }) => {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, SKILLS_SHOWN);
  return (
    <>
      <ul className="flex flex-wrap gap-1.5" aria-label={label}>
        {shown.map((s) => (
          <li key={s} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 ring-1 ring-inset ring-slate-200 text-[11px] font-semibold text-slate-700 leading-snug break-words">
            <Check className="w-3 h-3 shrink-0 text-[#2F68FE]" aria-hidden="true" />
            {s}
          </li>
        ))}
      </ul>
      {items.length > SKILLS_SHOWN && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-2 -ml-1 h-7 px-1 rounded-md inline-flex items-center gap-0.5 text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
        >
          {open ? 'Show Less' : `Show More (${items.length - SKILLS_SHOWN})`}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    </>
  );
};

const NoteV1: React.FC<{ icon: React.ElementType; title: string; text?: string }> = ({ icon: Icon, title, text }) =>
  text ? (
    <div className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <span className="w-8 h-8 rounded-lg bg-white border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-bold text-[#1E293B]">{title}</h4>
        <ClampText text={text} className="mt-0.5 text-xs text-slate-600 leading-relaxed" />
      </div>
    </div>
  ) : null;

export const HubResumeViewV1: React.FC<Props> = ({
  profile,
  fromLabel,
  shortlisted,
  saved,
  canAdd,
  canDownload,
  onBack,
  onToggleSave,
  onShortlist,
  onOpenShortlisted,
  onNotice,
}) => {
  const [costOpen, setCostOpen] = useState(false);
  const [costInfo, setCostInfo] = useState(false);
  const [tillInfo, setTillInfo] = useState(false);
  const [allCourses, setAllCourses] = useState(false);
  const r = profile.resume;

  const experience = [
    { label: 'US', value: formatExperience(r.experience.us) },
    { label: 'India', value: formatExperience(r.experience.india) },
    { label: 'UK', value: formatExperience(r.experience.uk) },
    { label: 'Canada', value: formatExperience(r.experience.canada) },
  ].filter((e) => e.value);
  const hasNotes = (r.backgroundVerified && r.backgroundNote) || r.psychometric || r.communication || r.technicalNote;
  const courses = allCourses ? r.courses : r.courses.slice(0, COURSES_SHOWN);
  const cost = CLIENT_IS_MOS ? costBreakdownOf(profile) : null;
  const buyout = profile.buyoutDays && profile.buyoutDays > 0 ? profile.buyoutDays : 0;
  const unlocked = shortlisted && canDownload;
  const hasActions = shortlisted ? Boolean(onOpenShortlisted) : canAdd;
  const chips = [
    { icon: Wallet, value: rateChip(profile) },
    { icon: Globe, value: profile.workMode },
    { icon: CalendarClock, value: joiningLabel(profile.noticeDays) },
  ];

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
        <button
          type="button"
          onClick={onBack}
          aria-label={`Back to ${fromLabel}`}
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold screen-title">View Resume</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 pt-3.5">
          {/* Profile highlight */}
          <Card className="overflow-hidden">
            <div className="px-4 pt-4 pb-4">
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
                  <UserRound className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-[#1E293B] leading-snug">{profile.profile}</h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 tabular-nums">({profile.resumeId})</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[11px] font-bold text-[#2F68FE]">{r.level}</span>
                    {r.backgroundVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F8F0] border border-emerald-200/50 text-[11px] font-bold text-[#10B981]">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    {shortlisted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[11px] font-bold text-[#2F68FE]">
                        <Check className="w-3 h-3" />
                        Shortlisted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <ul className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100" aria-label="Rate, work mode and joining">
              {chips.map((c) => {
                const CIcon = c.icon;
                return (
                  <li key={c.value} className="min-w-0 px-2 py-3 flex flex-col items-center gap-1 text-center">
                    <CIcon className="w-4 h-4 text-[#2F68FE]" aria-hidden="true" />
                    <span className="max-w-full text-[11px] font-bold text-[#1E293B] leading-tight tabular-nums break-words">{c.value}</span>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Talent Cost */}
          <SectionV1
            icon={Wallet}
            title={cost ? 'Talent Cost' : 'Hourly Charges'}
            action={<InfoToggle open={costInfo} onToggle={() => setCostInfo(true)} label={cost ? 'About talent cost' : 'About hourly charges'} />}
          >
            <InfoSheet isOpen={costInfo} title={cost ? 'Talent Cost' : 'Hourly Charges'} onClose={() => setCostInfo(false)}>
              {cost
                ? 'Talent costs shown are indicative only. Actual amounts may differ as they are subject to currency conversion rate variations.'
                : 'Hourly charges for this resume, billed on the hours worked.'}
            </InfoSheet>
            {cost ? (
              <div className="rounded-xl ring-1 ring-inset ring-blue-100 bg-blue-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCostOpen((o) => !o)}
                  aria-expanded={costOpen}
                  className="w-full px-3.5 py-3 flex items-center gap-3 text-left active:bg-blue-100/60 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE]"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] font-semibold text-slate-500">Compensation Package</span>
                    <span className="mt-0.5 block text-lg font-extrabold text-[#1E293B] tabular-nums">{rateLabel(profile)}</span>
                  </span>
                  <span className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center shrink-0">
                    <ChevronDown className={`w-4 h-4 text-[#2F68FE] transition-transform ${costOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {costOpen && (
                  <div className="px-3.5 pb-3 bg-white border-t border-blue-100">
                    <MoneyV1 label="Total Fixed Cost" value={cost.fixed} strong />
                    <div className="mt-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold text-[#1E293B]">Variable Components</p>
                      <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                        Variable pay components shown here are indicative only and calculated on estimated figures. Actual payouts may differ based on individual performance.
                      </p>
                      <div className="mt-1 divide-y divide-dashed divide-slate-200">
                        <MoneyV1 label="Night Allowance" value={cost.night} />
                        <MoneyV1 label="Productivity Bonus" value={cost.bonus} />
                        <MoneyV1 label="PTO Encashment" value={cost.pto} />
                        <MoneyV1 label="OT Encashment" value={cost.ot} />
                      </div>
                      <div className="border-t border-slate-200">
                        <MoneyV1 label="Total Variable Cost" value={cost.variable} strong />
                      </div>
                    </div>
                    <div className="mt-2 px-3 rounded-xl bg-blue-50">
                      <MoneyV1 label="Total Talent Cost" value={cost.total} strong />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl ring-1 ring-inset ring-blue-100 bg-blue-50 px-3.5 py-3">
                <span className="block text-[11px] font-semibold text-slate-500">Hourly Charges</span>
                <span className="mt-0.5 block text-lg font-extrabold text-[#1E293B] tabular-nums">{rateLabel(profile)}</span>
              </div>
            )}
          </SectionV1>

          {/* Availability */}
          <SectionV1 icon={Clock3} title="Availability">
            <div className="-mt-1 divide-y divide-slate-100">
              <div>
                <RowV1 icon={Clock3} label="Available Till" aside={<InfoToggle open={tillInfo} onToggle={() => setTillInfo(true)} label="About Available Till" />}>
                  <span className="tabular-nums">{profile.availableTill}</span>
                </RowV1>
                <InfoSheet isOpen={tillInfo} title="Available Till" onClose={() => setTillInfo(false)}>
                The latest time the candidate can work each day, shown in your time zone.
              </InfoSheet>
              </div>
              <RowV1 icon={CalendarClock} label="Availability (per week)">
                <span className="tabular-nums">{r.availableHoursPerDay * 5} Hours/Week</span>
              </RowV1>
              <RowV1 icon={TimerReset} label="Overtime Availability (per week)">
                <span className="tabular-nums">{profile.overtimeHoursPerWeek ? `${profile.overtimeHoursPerWeek} Hours/Week` : '-'}</span>
              </RowV1>
            </div>
          </SectionV1>

          {/* Hiring Details */}
          <SectionV1 icon={Briefcase} title="Hiring Details">
            <div className="-mt-1 divide-y divide-slate-100">
              <RowV1 icon={Globe} label="Domain">
                {profile.domain}
              </RowV1>
              <RowV1 icon={GraduationCap} label="Qualifications">
                {r.qualifications.map((q) => (
                  <span key={q} className="block">
                    {q}
                  </span>
                ))}
              </RowV1>
              <RowV1 icon={MapPin} label="Location">
                {profile.location}
              </RowV1>
              {buyout > 0 && (
                <RowV1 icon={CalendarClock} label="Notice Buyout Eligibility">
                  {profile.noticeDays > 0 ? `${profile.noticeDays} | ` : ''}Buyout: {buyout} {buyout === 1 ? 'Day' : 'Days'}
                </RowV1>
              )}
            </div>
            {profile.hasPsychometricFile && canDownload && (
              <div className="mt-2">
                <FileButton icon={Download} label="Download Psychometric Test" onClick={() => onNotice('Psychometric test downloaded')} />
              </div>
            )}
          </SectionV1>

          {r.summary && (
            <SectionV1 icon={FileText} title="Professional Summary">
              <ClampText text={r.summary} className="text-xs text-slate-600 leading-relaxed" />
            </SectionV1>
          )}

          {r.technicalSkills.length > 0 && (
            <SectionV1 icon={Wrench} title="Technical Skills">
              <SkillChips items={r.technicalSkills} label="Technical Skills" />
            </SectionV1>
          )}

          {r.softwareSkills.length > 0 && (
            <SectionV1 icon={Laptop} title="Software Skills">
              <SkillChips items={r.softwareSkills} label="Software Skills" />
            </SectionV1>
          )}

          {r.certificates.length > 0 && (
            <SectionV1 icon={Award} title="Certificate">
              <ul className="space-y-2">
                {r.certificates.map((c) => (
                  <li key={c} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Certificate Name</p>
                      <p className="mt-0.5 text-[13px] font-bold text-[#1E293B] leading-snug">{c}</p>
                      {!unlocked && (
                        <p className="mt-1.5 flex items-start gap-1 text-[11px] font-semibold text-slate-500 leading-snug">
                          <Lock className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                          {LOCKED_TEXT}
                        </p>
                      )}
                    </div>
                    {unlocked && <FileButton icon={Download} label="Download" onClick={() => onNotice(`${c} certificate downloaded`)} />}
                  </li>
                ))}
              </ul>
            </SectionV1>
          )}

          {r.courses.length > 0 && (
            <SectionV1 icon={BookOpen} title="Courses">
              <ul className="space-y-2">
                {courses.map((c) => (
                  <li key={c.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[13px] font-bold text-[#1E293B] leading-snug">{c.name}</p>
                    <dl className="mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold text-slate-400">Duration</dt>
                        <dd className="mt-0.5 font-semibold text-[#1E293B] tabular-nums">{c.duration || 'NA'}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold text-slate-400">Date of Completion</dt>
                        <dd className="mt-0.5 font-semibold text-[#1E293B] tabular-nums">{c.completedOn ? formatShortDate(c.completedOn) : 'NA'}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold text-slate-400">Certificate</dt>
                        <dd className="mt-0.5">
                          {!c.hasCertificate ? (
                            <span className="font-semibold text-[#1E293B]">NA</span>
                          ) : unlocked ? (
                            <button
                              type="button"
                              onClick={() => onNotice(`${c.name} certificate downloaded`)}
                              className="inline-flex items-center gap-1 font-bold text-[#2F68FE] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2F68FE]"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                          ) : (
                            <span className="inline-flex items-start gap-1 font-semibold text-slate-500 leading-snug">
                              <Lock className="w-3 h-3 mt-0.5 shrink-0" />
                              {LOCKED_TEXT}
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
              {r.courses.length > COURSES_SHOWN && (
                <button
                  type="button"
                  onClick={() => setAllCourses((v) => !v)}
                  aria-expanded={allCourses}
                  className="mt-2.5 h-10 w-full rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-[#2F68FE] flex items-center justify-center gap-1 active:bg-slate-50 cursor-pointer"
                >
                  {allCourses ? 'Show fewer courses' : `Show all ${r.courses.length} courses`}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${allCourses ? 'rotate-180' : ''}`} />
                </button>
              )}
            </SectionV1>
          )}

          {r.hasVideo && (
            <SectionV1 icon={Video} title="Video Summary">
              {shortlisted ? (
                <button
                  type="button"
                  onClick={() => onNotice('Playing the introduction video')}
                  aria-label="Play introduction video"
                  className="relative w-full aspect-video rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden active:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  <span className="relative w-14 h-14 rounded-full bg-white border border-blue-100 text-[#2F68FE] flex items-center justify-center shadow-xs">
                    <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                  </span>
                  <span className="absolute left-3 bottom-2.5 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700">Self introduction</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-300">
                  <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-[#1E293B]">Video is locked</span>
                    <span className="block text-[11px] text-slate-500 leading-snug">{LOCKED_TEXT}</span>
                  </span>
                </div>
              )}
            </SectionV1>
          )}

          {experience.length > 0 && (
            <SectionV1 icon={Globe} title="Total Experience">
              <dl className="grid grid-cols-2 gap-2">
                {experience.map((e) => (
                  <div key={e.label} className="min-w-0 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{e.label}</dt>
                    <dd className="mt-0.5 text-[13px] font-bold text-[#1E293B] leading-snug tabular-nums break-words">{e.value}</dd>
                  </div>
                ))}
              </dl>
            </SectionV1>
          )}

          {r.jobs.length > 0 && (
            <SectionV1 icon={Briefcase} title="Work History">
              <ol>
                {r.jobs.map((j, i) => (
                  <li key={`${j.company}-${j.from}`} className="relative pl-7 pb-4 last:pb-0">
                    {i < r.jobs.length - 1 && <span aria-hidden="true" className="absolute left-[7px] top-5 bottom-0 w-0.5 rounded-full bg-slate-200" />}
                    <span aria-hidden="true" className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-[3px] border-[#2F68FE] ring-4 ring-blue-50" />
                    <p className="text-[13px] font-bold text-[#1E293B] leading-snug">{j.designation}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">{j.company}</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600 tabular-nums">
                      <CalendarClock className="w-3 h-3" aria-hidden="true" />
                      {formatMonthYear(j.from)} – {j.to ? formatMonthYear(j.to) : 'Present'}
                    </span>
                    {j.skills && <ClampText text={j.skills} className="mt-2 text-xs text-slate-600 leading-relaxed" />}
                  </li>
                ))}
              </ol>
            </SectionV1>
          )}

          {hasNotes && (
            <SectionV1 icon={ClipboardCheck} title="Evaluation Notes">
              <div className="space-y-2">
                {r.backgroundVerified && <NoteV1 icon={ShieldCheck} title="Background Verification" text={r.backgroundNote} />}
                <NoteV1 icon={Brain} title="Psychometric Evaluations" text={r.psychometric} />
                <NoteV1 icon={MessageSquareText} title="Communication Skills" text={r.communication} />
                <NoteV1 icon={Wrench} title="Technical Skills" text={r.technicalNote} />
              </div>
            </SectionV1>
          )}

          {r.assessments.length > 0 && (
            <SectionV1 icon={ChartColumn} title="Assessments">
              <ul className="space-y-2">
                {r.assessments.map((a) => (
                  <li key={a.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block text-[13px] font-bold text-[#1E293B]">{a.name}</span>
                        <span className="block mt-0.5 text-[11px] text-slate-500">
                          {a.type} · Last assessed {formatShortDate(a.lastAssessedOn)}
                        </span>
                      </span>
                      <span className="text-base font-extrabold text-[#2F68FE] tabular-nums">{a.scorePct}%</span>
                    </div>
                    <div className="mt-2.5 h-1.5 rounded-full bg-slate-200/70 overflow-hidden" aria-hidden="true">
                      <div className="h-full rounded-full bg-linear-to-r from-[#2F68FE] to-[#6366F1]" style={{ width: `${Math.min(100, Math.max(0, a.scorePct))}%` }} />
                    </div>
                    {canDownload && (a.hasReport || a.hasProctoring) && (
                      <div className="mt-3 flex items-center gap-2">
                        {a.hasReport && <FileButton label="Report" onClick={() => onNotice(`${a.name} report opened`)} />}
                        {a.hasProctoring && <FileButton label="Proctoring" onClick={() => onNotice(`${a.name} proctoring video opened`)} />}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </SectionV1>
          )}
        </div>
      </div>

      {hasActions && (
        <div className="shrink-0 z-20 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          {shortlisted ? (
            <button
              type="button"
              onClick={onOpenShortlisted}
              className="w-full h-12 rounded-xl border border-[#2F68FE] bg-white text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
            >
              <UsersRound className="w-4 h-4" />
              View Shortlisted
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onToggleSave}
                aria-pressed={saved}
                aria-label={saved ? 'Remove from Saved Resumes' : 'Save resume'}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE] ${
                  saved ? 'border-[#2F68FE] bg-[#2F68FE] text-white active:bg-[#1D4ED8]' : 'border-[#2F68FE] bg-white text-[#2F68FE] active:bg-blue-50'
                }`}
              >
                {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={onShortlist}
                className="flex-1 h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F68FE]"
              >
                Shortlist Candidate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
