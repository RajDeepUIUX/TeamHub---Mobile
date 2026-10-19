import React, { useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  GraduationCap,
  Info,
  Laptop,
  Lock,
  Play,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Card, FieldGrid, Pill } from '../staff/tabs/StaffTabParts';
import { FileButton, Section, Tags, TextBlock } from '../interviews/CandidateResumeView';
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

const Money: React.FC<{ label: string; value: number; strong?: boolean }> = ({ label, value, strong }) => (
  <div className={`flex items-center justify-between gap-3 py-2 ${strong ? 'text-[13px] font-extrabold text-[#1E293B]' : 'text-[12px] text-slate-600'}`}>
    <span>{label}</span>
    <span className="tabular-nums font-semibold text-[#1E293B]">${value.toLocaleString('en-US')}</span>
  </div>
);

/**
 * Desktop "View Resume" (`staffingMarketplace&task=viewDetails`): profile highlight, talent cost, hiring details, psychometric
 * download, summary, experience, skills, evaluation notes, certificates, courses and assessments. The video is locked until
 * the candidate is shortlisted. Actions: Shortlist Candidate and Save / Remove from Saved Resumes.
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
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 min-w-0">
            <span className="shrink-0">Hire New Staff</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <button type="button" onClick={onBack} className="shrink-0 hover:text-[#2F68FE] cursor-pointer">
              {fromLabel}
            </button>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-slate-600 truncate tabular-nums">{profile.resumeId}</span>
          </p>

          <Card className="mt-2.5 overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-[#2F68FE] to-[#6366F1]" aria-hidden="true" />
            <div className="px-4 pb-4 -mt-8">
              <span
                className={`w-16 h-16 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center ${r.gender === 'Female' ? 'bg-[#FDF2F8] text-[#DB2777]' : 'bg-[#EFF6FF] text-[#2F68FE]'}`}
                aria-hidden="true"
              >
                <UserRound className="w-7 h-7" />
              </span>
              <h2 className="mt-2.5 text-[17px] font-extrabold text-[#1E293B] leading-snug">{profile.profile}</h2>
              <p className="mt-0.5 text-[11.5px] text-slate-500 tabular-nums">Resume ID {profile.resumeId}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Pill tone="indigo">{r.level}</Pill>
                {r.backgroundVerified && (
                  <Pill tone="green">
                    <BadgeCheck className="w-3 h-3" />
                    Background verified
                  </Pill>
                )}
                {shortlisted && (
                  <Pill tone="amber">
                    <Check className="w-3 h-3" />
                    Shortlisted
                  </Pill>
                )}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2.5">
                {[
                  { label: CLIENT_IS_MOS ? 'Talent Cost' : 'Hourly Charges', value: rateLabel(profile), icon: Banknote, tint: 'bg-[#EEF2FF] text-[#4F46E5]' },
                  { label: 'Work', value: r.workType, icon: Briefcase, tint: 'bg-[#E8F8F0] text-[#10B981]' },
                  { label: 'Work Mode', value: profile.workMode, icon: Laptop, tint: 'bg-[#EFF6FF] text-[#2F68FE]' },
                  { label: 'Joining', value: joiningLabel(profile.noticeDays), icon: CalendarClock, tint: 'bg-[#FEF8E7] text-[#D97706]' },
                ]
                  .filter((f) => f.value)
                  .map(({ label, value, icon: Icon, tint }) => (
                    <div key={label} className="min-w-0 flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <dt className="text-[10.5px] text-slate-400">{label}</dt>
                        <dd className="text-[12.5px] font-bold text-[#1E293B] leading-snug tabular-nums">{value}</dd>
                      </span>
                    </div>
                  ))}
              </dl>
            </div>
          </Card>

          {r.hasVideo && (
            <Section title="Video Summary">
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
                    <span className="block text-[11.5px] text-slate-500 leading-snug">Visible once the candidate is shortlisted.</span>
                  </span>
                </div>
              )}
            </Section>
          )}

          <Section title="Talent Cost">
            {cost ? (
              <div>
                <button
                  type="button"
                  onClick={() => setCostOpen((o) => !o)}
                  aria-expanded={costOpen}
                  className="w-full flex items-center gap-3 text-left cursor-pointer"
                >
                  <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] text-slate-400">Compensation Package</span>
                    <span className="block text-[13px] font-bold text-[#1E293B] tabular-nums">{rateLabel(profile)}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${costOpen ? 'rotate-180' : ''}`} />
                </button>
                {costOpen && (
                  <div className="mt-3 pt-2 border-t border-slate-100">
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
                <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-slate-500 leading-snug">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-px text-[#2F68FE]" />
                  Talent costs shown are indicative only. Actual amounts may differ as they are subject to currency conversion rate variations.
                </p>
              </div>
            ) : (
              <FieldGrid compact fields={[{ label: 'Hourly Charges', value: rateLabel(profile) }]} />
            )}
          </Section>

          <Section title="Hiring Details">
            <FieldGrid
              compact
              fields={[
                { label: 'Domain', value: profile.domain },
                { label: 'Location', value: profile.location },
                { label: 'Qualifications', value: r.qualifications.join(', '), wide: true },
                {
                  label: 'Notice Buyout Eligibility',
                  value: buyout ? `${profile.noticeDays > 0 ? `${profile.noticeDays} | ` : ''}Buyout: ${buyout} ${buyout === 1 ? 'Day' : 'Days'}` : null,
                  wide: true,
                },
              ]}
            />
            {buyout > 0 && (
              <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-slate-500 leading-snug">
                <Info className="w-3.5 h-3.5 shrink-0 mt-px text-[#2F68FE]" />
                The candidate is eligible for a notice buyout of up to {buyout} {buyout === 1 ? 'day' : 'days'}.
              </p>
            )}
            {profile.hasPsychometricFile && canDownload && (
              <div className="mt-3">
                <FileButton icon={Download} label="Download Psychometric Test" onClick={() => onNotice('Psychometric test downloaded')} />
              </div>
            )}
          </Section>

          {r.summary && (
            <Section title="Professional Summary">
              <p className="text-[12.5px] text-slate-600 leading-relaxed">{r.summary}</p>
            </Section>
          )}

          {experience.length > 0 && (
            <Section title="Total Experience">
              <FieldGrid compact fields={experience.map((e) => ({ label: e.label, value: e.value }))} />
            </Section>
          )}

          {r.jobs.length > 0 && (
            <Section title="Work History">
              <ul className="space-y-3.5">
                {r.jobs.map((j) => (
                  <li key={`${j.company}-${j.from}`} className="flex gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
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
            </Section>
          )}

          {r.technicalSkills.length > 0 && (
            <Section title="Technical Skills">
              <Tags items={r.technicalSkills} />
            </Section>
          )}
          {r.softwareSkills.length > 0 && (
            <Section title="Software Skills">
              <Tags items={r.softwareSkills} />
            </Section>
          )}

          {hasNotes && (
            <Section title="Evaluation Notes">
              <div className="space-y-3.5">
                {r.backgroundVerified && <TextBlock title="Background Verification" text={r.backgroundNote} />}
                <TextBlock title="Psychometric Evaluations" text={r.psychometric} />
                <TextBlock title="Communication Skills" text={r.communication} />
                <TextBlock title="Technical Skills" text={r.technicalNote} />
              </div>
            </Section>
          )}

          {r.certificates.length > 0 && (
            <Section title="Certificate">
              <ul className="space-y-2">
                {r.certificates.map((c) => (
                  <li key={c} className="flex items-center gap-2.5 text-[12.5px] font-semibold text-[#1E293B]">
                    <GraduationCap className="w-4 h-4 text-[#2F68FE] shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {r.courses.length > 0 && (
            <Section title="Courses">
              <ul className="divide-y divide-slate-100 -my-2">
                {courses.map((c) => (
                  <li key={c.name} className="py-2.5 flex items-center gap-3">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12.5px] font-bold text-[#1E293B]">{c.name}</span>
                      <span className="block text-[11px] text-slate-500 tabular-nums">
                        {c.duration} · Completed {formatShortDate(c.completedOn)}
                      </span>
                    </span>
                    {canDownload && c.hasCertificate && <FileButton icon={Download} label="Certificate" onClick={() => onNotice(`${c.name} certificate downloaded`)} />}
                  </li>
                ))}
              </ul>
              {r.courses.length > COURSES_SHOWN && (
                <button
                  type="button"
                  onClick={() => setAllCourses((v) => !v)}
                  aria-expanded={allCourses}
                  className="mt-2.5 h-9 w-full rounded-xl border border-slate-200 text-[11.5px] font-bold text-[#2F68FE] active:bg-slate-50 cursor-pointer"
                >
                  {allCourses ? 'Show fewer courses' : `Show all ${r.courses.length} courses`}
                </button>
              )}
            </Section>
          )}

          {r.assessments.length > 0 && (
            <Section title="Assessments">
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
            </Section>
          )}
        </div>
      </div>

      {shortlisted ? (
        <div className="shrink-0 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-4 py-3 flex items-center gap-3">
          <span className="flex-1 min-w-0 flex items-center gap-2 text-[12.5px] font-bold text-[#059669]">
            <span className="w-8 h-8 rounded-full bg-[#E8F8F0] flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" strokeWidth={3} />
            </span>
            Shortlisted
          </span>
          {onOpenShortlisted && (
            <button
              type="button"
              onClick={onOpenShortlisted}
              className="h-12 px-4 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center gap-1.5 active:bg-blue-100 cursor-pointer"
            >
              <UsersRound className="w-4 h-4" />
              View Shortlisted
            </button>
          )}
        </div>
      ) : (
        canAdd && (
          <div className="shrink-0 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-4 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSave}
              aria-pressed={saved}
              aria-label={saved ? 'Remove from Saved Resumes' : 'Save resume'}
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                saved ? 'border-[#2F68FE] bg-[#EFF6FF] text-[#2F68FE]' : 'border-slate-200 bg-white text-slate-500 active:bg-slate-50'
              }`}
            >
              {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button type="button" onClick={onShortlist} className="flex-1 h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] cursor-pointer">
              Shortlist Candidate
            </button>
          </div>
        )
      )}
    </div>
  );
};
