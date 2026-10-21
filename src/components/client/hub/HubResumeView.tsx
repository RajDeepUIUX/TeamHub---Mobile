import React, { useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  Check,
  ChevronDown,
  Clock3,
  Download,
  Globe,
  GraduationCap,
  Info,
  Lock,
  MapPin,
  Play,
  TimerReset,
  UserRound,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { Card, FieldGrid } from '../staff/tabs/StaffTabParts';
import { FileButton, TextBlock } from '../interviews/CandidateResumeView';
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

const Money: React.FC<{ label: string; value: number; strong?: boolean }> = ({ label, value, strong }) => (
  <div className={`flex items-center justify-between gap-3 py-2 ${strong ? 'text-[13px] font-extrabold text-[#1E293B]' : 'text-[12px] text-slate-600'}`}>
    <span>{label}</span>
    <span className="tabular-nums font-semibold text-[#1E293B]">${value.toLocaleString('en-US')}</span>
  </div>
);

/** Section heading strip: blue accent bar + title (action on the right), divided from the content */
const ResumeSection: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, action, children }) => (
  <Card className="mt-3 overflow-hidden">
    <div className="flex items-center gap-2.5 min-h-12 px-4 py-2.5 bg-[#F8FAFF] border-b border-slate-100">
      <span className="w-1 h-4 rounded-full bg-[#2F68FE] shrink-0" aria-hidden="true" />
      <h3 className="flex-1 min-w-0 truncate text-[14px] font-bold text-[#1E293B]">{title}</h3>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </Card>
);

/** Icon + label + value row (desktop left column: Talent Cost, Availability, Hiring Details) */
const IconRow: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode; aside?: React.ReactNode }> = ({ icon: Icon, label, children, aside }) => (
  <div className="flex items-start gap-3 py-2">
    <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0" aria-hidden="true">
      <Icon className="w-[18px] h-[18px]" />
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-slate-500">{label}</p>
      <div className="mt-0.5 text-[13.5px] font-medium text-[#1E293B] leading-snug">{children}</div>
    </div>
    {aside}
  </div>
);

const InfoToggle: React.FC<{ open: boolean; onToggle: () => void; label: string }> = ({ open, onToggle, label }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={open}
    aria-label={label}
    className={`w-8 h-8 -my-1 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${open ? 'text-[#2F68FE] bg-[#EFF6FF]' : 'text-[#2F68FE] active:bg-slate-100'}`}
  >
    <Info className="w-4 h-4" />
  </button>
);

const InfoNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-1 mb-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-600 leading-snug" role="note">
    {children}
  </p>
);

/** Two-column bullet list (desktop Technical / Software Skills) */
const BulletList: React.FC<{ items: string[]; label: string }> = ({ items, label }) => (
  <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 list-disc pl-4 marker:text-slate-400" aria-label={label}>
    {items.map((s) => (
      <li key={s} className="text-[12.5px] text-slate-700 leading-snug break-words">
        {s}
      </li>
    ))}
  </ul>
);

/** Desktop shows the monthly talent cost as "$851/Month" in the chip row */
const rateChip = (p: HubProfile) => (CLIENT_IS_MOS ? `$${p.monthlyCost}/Month` : `$${p.resume.hourlyRate}/Hr`);

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

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
        <button
          type="button"
          onClick={onBack}
          aria-label={`Back to ${fromLabel}`}
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold screen-title">View Resume</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        <div className="px-4 pt-3">
          {/* Profile highlight */}
          <Card className="p-3.5">
            <div className="flex items-start gap-3">
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${r.gender === 'Female' ? 'bg-[#FDF2F8] text-[#DB2777]' : 'bg-[#EFF6FF] text-[#2F68FE]'}`}
                aria-hidden="true"
              >
                <UserRound className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-bold text-[#1E293B] leading-snug">
                  {profile.profile} <span className="tabular-nums">({profile.resumeId})</span>
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded border border-[#C7D2FE] bg-[#EEF2FF] text-[10.5px] font-bold text-[#3730A3] leading-none">{r.level}</span>
                  {r.backgroundVerified && (
                    <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-[#059669]">
                      <BadgeCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                  {shortlisted && (
                    <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-[#D97706]">
                      <Check className="w-3 h-3" />
                      Shortlisted
                    </span>
                  )}
                </div>
              </div>
            </div>

            <ul className="mt-2.5 flex flex-wrap gap-1" aria-label="Rate, work mode and joining">
              {[rateChip(profile), profile.workMode, joiningLabel(profile.noticeDays)].map((c) => (
                <li key={c} className="px-2 py-1 rounded-full bg-slate-100 text-[11px] text-slate-700 leading-none tabular-nums">
                  {c}
                </li>
              ))}
            </ul>

            {shortlisted
              ? onOpenShortlisted && (
                  <button
                    type="button"
                    onClick={onOpenShortlisted}
                    className="mt-3 w-full h-9 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-100 cursor-pointer"
                  >
                    <UsersRound className="w-4 h-4" />
                    View Shortlisted
                  </button>
                )
              : canAdd && (
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={onShortlist} className="flex-1 h-9 rounded-lg bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
                      Shortlist Candidate
                    </button>
                    <button
                      type="button"
                      onClick={onToggleSave}
                      aria-pressed={saved}
                      aria-label={saved ? 'Remove from Saved Resumes' : 'Save resume'}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        saved ? 'border-[#2F68FE] bg-[#EFF6FF] text-[#2F68FE]' : 'border-[#2F68FE] bg-white text-[#2F68FE] active:bg-blue-50'
                      }`}
                    >
                      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                )}
          </Card>

          {/* Talent Cost */}
          <Card className="mt-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-bold text-[#1E293B]">{cost ? 'Talent Cost' : 'Hourly Charges'}</h3>
              <InfoToggle open={costInfo} onToggle={() => setCostInfo((o) => !o)} label={cost ? 'About talent cost' : 'About hourly charges'} />
            </div>
            {costInfo && (
              <InfoNote>
                {cost
                  ? 'Talent costs shown are indicative only. Actual amounts may differ as they are subject to currency conversion rate variations.'
                  : 'Hourly charges for this resume, billed on the hours worked.'}
              </InfoNote>
            )}
            {cost ? (
              <>
                <button type="button" onClick={() => setCostOpen((o) => !o)} aria-expanded={costOpen} className="mt-1 w-full text-left cursor-pointer">
                  <IconRow icon={Wallet} label="Compensation Package" aside={<ChevronDown className={`mt-3 w-4 h-4 text-slate-500 transition-transform ${costOpen ? 'rotate-180' : ''}`} />}>
                    <span className="font-bold tabular-nums">{rateLabel(profile)}</span>
                  </IconRow>
                </button>
                {costOpen && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <Money label="Total Fixed Cost" value={cost.fixed} strong />
                    <div className="mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[12px] font-bold text-[#1E293B]">Variable Components</p>
                      <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                        Variable pay components shown here are indicative only and calculated on estimated figures. Actual payouts may differ based on individual performance.
                      </p>
                      <div className="mt-1 divide-y divide-slate-100">
                        <Money label="Night Allowance" value={cost.night} />
                        <Money label="Productivity Bonus" value={cost.bonus} />
                        <Money label="PTO Encashment" value={cost.pto} />
                        <Money label="OT Encashment" value={cost.ot} />
                      </div>
                      <Money label="Total Variable Cost" value={cost.variable} strong />
                    </div>
                    <Money label="Total Talent Cost" value={cost.total} strong />
                  </div>
                )}
              </>
            ) : (
              <div className="mt-1">
                <IconRow icon={Wallet} label="Hourly Charges">
                  <span className="font-bold tabular-nums">{rateLabel(profile)}</span>
                </IconRow>
              </div>
            )}
          </Card>

          {/* Availability */}
          <Card className="mt-3 p-4">
            <h3 className="text-[15px] font-bold text-[#1E293B]">Availability</h3>
            <div className="mt-1">
              <IconRow
                icon={Clock3}
                label="Available Till"
                aside={<InfoToggle open={tillInfo} onToggle={() => setTillInfo((o) => !o)} label="About Available Till" />}
              >
                <span className="tabular-nums">{profile.availableTill}</span>
              </IconRow>
              {tillInfo && <InfoNote>The latest time the candidate can work each day, shown in your time zone.</InfoNote>}
              <IconRow icon={CalendarClock} label="Availability (per week)">
                <span className="tabular-nums">{r.availableHoursPerDay * 5} Hours/Week</span>
              </IconRow>
              <IconRow icon={TimerReset} label="Overtime Availability (per week)">
                <span className="tabular-nums">{profile.overtimeHoursPerWeek ? `${profile.overtimeHoursPerWeek} Hours/Week` : '-'}</span>
              </IconRow>
            </div>
          </Card>

          {/* Hiring Details */}
          <Card className="mt-3 p-4">
            <h3 className="text-[15px] font-bold text-[#1E293B]">Hiring Details</h3>
            <div className="mt-1">
              <IconRow icon={Globe} label="Domain">
                {profile.domain}
              </IconRow>
              <IconRow icon={GraduationCap} label="Qualifications">
                {r.qualifications.map((q) => (
                  <span key={q} className="block">
                    {q}
                  </span>
                ))}
              </IconRow>
              <IconRow icon={MapPin} label="Location">
                {profile.location}
              </IconRow>
              {buyout > 0 && (
                <IconRow icon={CalendarClock} label="Notice Buyout Eligibility">
                  {profile.noticeDays > 0 ? `${profile.noticeDays} | ` : ''}Buyout: {buyout} {buyout === 1 ? 'Day' : 'Days'}
                </IconRow>
              )}
            </div>
            {profile.hasPsychometricFile && canDownload && (
              <div className="mt-2">
                <FileButton icon={Download} label="Download Psychometric Test" onClick={() => onNotice('Psychometric test downloaded')} />
              </div>
            )}
          </Card>

          {r.summary && (
            <ResumeSection title="Professional Summary">
              <p className="text-[12.5px] text-slate-600 leading-relaxed">{r.summary}</p>
            </ResumeSection>
          )}

          {r.technicalSkills.length > 0 && (
            <ResumeSection title="Technical Skills">
              <BulletList items={r.technicalSkills} label="Technical Skills" />
            </ResumeSection>
          )}

          {r.softwareSkills.length > 0 && (
            <ResumeSection title="Software Skills">
              <BulletList items={r.softwareSkills} label="Software Skills" />
            </ResumeSection>
          )}

          {r.certificates.length > 0 && (
            <ResumeSection title="Certificate">
              <div className="-mx-4 border-y border-slate-100">
                <div className="grid grid-cols-[1fr_1fr] gap-3 px-4 py-2.5 bg-[#EEF2FF] text-[11.5px] font-bold text-[#1E293B]">
                  <span>Certificate Name</span>
                  <span>Certificate</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {r.certificates.map((c) => (
                    <li key={c} className="grid grid-cols-[1fr_1fr] gap-3 items-center px-4 py-2.5 text-[12px]">
                      <span className="text-slate-700 leading-snug">{c}</span>
                      {unlocked ? (
                        <span>
                          <FileButton icon={Download} label="Download" onClick={() => onNotice(`${c} certificate downloaded`)} />
                        </span>
                      ) : (
                        <span className="font-bold text-[#1E293B] leading-snug">{LOCKED_TEXT}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </ResumeSection>
          )}

          {r.courses.length > 0 && (
            <ResumeSection title="Courses">
              <ul className="-mx-4 border-y border-slate-100 divide-y divide-slate-100">
                {courses.map((c) => (
                  <li key={c.name} className="px-4 py-3">
                    <p className="text-[12.5px] font-semibold text-[#1E293B] leading-snug">{c.name}</p>
                    <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <dt className="text-slate-500">Duration</dt>
                        <dd className="mt-0.5 text-[#1E293B] tabular-nums">{c.duration || 'NA'}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Date of Completion</dt>
                        <dd className="mt-0.5 text-[#1E293B] tabular-nums">{c.completedOn ? formatShortDate(c.completedOn) : 'NA'}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Certificate</dt>
                        <dd className="mt-0.5">
                          {!c.hasCertificate ? (
                            <span className="text-[#1E293B]">NA</span>
                          ) : unlocked ? (
                            <button
                              type="button"
                              onClick={() => onNotice(`${c.name} certificate downloaded`)}
                              className="inline-flex items-center gap-1 font-bold text-[#2F68FE] cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                          ) : (
                            <span className="inline-flex items-start gap-1 font-bold text-[#1E293B] leading-snug">
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
                  className="mt-3 h-9 w-full rounded-xl border border-slate-200 text-[11.5px] font-bold text-[#2F68FE] active:bg-slate-50 cursor-pointer"
                >
                  {allCourses ? 'Show fewer courses' : `Show all ${r.courses.length} courses`}
                </button>
              )}
            </ResumeSection>
          )}

          {r.hasVideo && (
            <ResumeSection title="Video Summary">
              {shortlisted ? (
                <button
                  type="button"
                  onClick={() => onNotice('Playing the introduction video')}
                  aria-label="Play introduction video"
                  className="relative w-full aspect-video rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden active:opacity-90 cursor-pointer"
                >
                  <span className="w-14 h-14 rounded-full bg-white/95 text-[#2F68FE] flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                  </span>
                  <span className="absolute left-3 bottom-2.5 text-[11px] font-semibold text-white/80">Self introduction</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <span className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                    <Lock className="w-[18px] h-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-bold text-[#1E293B]">Video is locked</span>
                    <span className="block text-[11.5px] text-slate-500 leading-snug">{LOCKED_TEXT}</span>
                  </span>
                </div>
              )}
            </ResumeSection>
          )}

          {experience.length > 0 && (
            <ResumeSection title="Total Experience">
              <FieldGrid compact fields={experience.map((e) => ({ label: e.label, value: e.value }))} />
            </ResumeSection>
          )}

          {r.jobs.length > 0 && (
            <ResumeSection title="Work History">
              <ul className="space-y-3.5">
                {r.jobs.map((j) => (
                  <li key={`${j.company}-${j.from}`} className="flex gap-3">
                    <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      <CalendarClock className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-bold text-[#1E293B]">{j.designation}</span>
                      <span className="block text-[11.5px] text-slate-500">{j.company}</span>
                      <span className="block text-[11px] text-slate-400 tabular-nums">
                        {formatMonthYear(j.from)} – {j.to ? formatMonthYear(j.to) : 'Present'}
                      </span>
                      <span className="mt-1 block text-[12px] text-slate-600 leading-snug">{j.skills}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </ResumeSection>
          )}

          {hasNotes && (
            <ResumeSection title="Evaluation Notes">
              <div className="space-y-3.5">
                {r.backgroundVerified && <TextBlock title="Background Verification" text={r.backgroundNote} />}
                <TextBlock title="Psychometric Evaluations" text={r.psychometric} />
                <TextBlock title="Communication Skills" text={r.communication} />
                <TextBlock title="Technical Skills" text={r.technicalNote} />
              </div>
            </ResumeSection>
          )}

          {r.assessments.length > 0 && (
            <ResumeSection title="Assessments">
              <ul className="space-y-3">
                {r.assessments.map((a) => (
                  <li key={a.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-bold text-[#1E293B]">{a.name}</span>
                        <span className="block text-[11px] text-slate-500">
                          {a.type} · Last assessed {formatShortDate(a.lastAssessedOn)}
                        </span>
                      </span>
                      <span className="text-[15px] font-extrabold text-[#1E293B] tabular-nums">{a.scorePct}%</span>
                    </div>
                    {canDownload && (a.hasReport || a.hasProctoring) && (
                      <div className="mt-2.5 flex items-center gap-2">
                        {a.hasReport && <FileButton label="Report" onClick={() => onNotice(`${a.name} report opened`)} />}
                        {a.hasProctoring && <FileButton label="Proctoring" onClick={() => onNotice(`${a.name} proctoring video opened`)} />}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </ResumeSection>
          )}
        </div>
      </div>
    </div>
  );
};
