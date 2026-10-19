import React from 'react';
import { ArrowLeft, BadgeCheck, CalendarClock, ChevronRight, Download, ExternalLink, GraduationCap, Play, UserRound } from 'lucide-react';
import { Card, FieldGrid, Pill } from '../staff/tabs/StaffTabParts';
import { useTimesheetNotice } from '../timesheets/TimesheetParts';
import { CLIENT_IS_MOS } from '../data/clientTimesheetsData';
import { ShortlistedCandidate, formatExperience, formatMonthYear, formatShortDate } from '../data/clientInterviewsData';
import { CandidateStatusPill } from './InterviewParts';

interface Props {
  candidate: ShortlistedCandidate;
  /** `download` permission: certificate, assessment report and proctoring links */
  canDownload: boolean;
  onBack: () => void;
}

export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Card className="mt-3 p-4">
    <h3 className="text-sm font-bold text-[#1D4ED8]">{title}</h3>
    <div className="mt-2.5">{children}</div>
  </Card>
);

export const Tags: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="flex flex-wrap gap-1.5">
    {items.map((s) => (
      <li key={s} className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11.5px] font-semibold text-slate-700">
        {s}
      </li>
    ))}
  </ul>
);

export const TextBlock: React.FC<{ title: string; text?: string }> = ({ title, text }) =>
  text ? (
    <div>
      <h4 className="text-[12px] font-bold text-[#1E293B]">{title}</h4>
      <p className="mt-0.5 text-[12.5px] text-slate-600 leading-relaxed">{text}</p>
    </div>
  ) : null;

export const FileButton: React.FC<{ label: string; onClick: () => void; icon?: React.ElementType }> = ({ label, onClick, icon: Icon = ExternalLink }) => (
  <button
    type="button"
    onClick={onClick}
    className="h-8 px-3 rounded-lg border border-slate-200 text-[11px] font-bold text-[#2F68FE] flex items-center gap-1.5 active:bg-slate-50 cursor-pointer whitespace-nowrap"
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

/**
 * Desktop "View Resume" (`interviews&task=viewresume`): profile summary, talent cost, availability, hiring details,
 * experience, skills, background / psychometric / communication notes, certificates, courses and assessments.
 * The candidate's name is not part of this page on desktop (profile + resume ID only).
 */
export const CandidateResumeView: React.FC<Props> = ({ candidate, canDownload, onBack }) => {
  const [notice, showNotice] = useTimesheetNotice();
  const r = candidate.resume;
  if (!r) return null;

  const rate = `$${r.hourlyRate}${CLIENT_IS_MOS ? '/Month' : '/Hr'}`;
  const experience = [
    { label: 'US', value: formatExperience(r.experience.us) },
    { label: 'India', value: formatExperience(r.experience.india) },
    { label: 'UK', value: formatExperience(r.experience.uk) },
    { label: 'Canada', value: formatExperience(r.experience.canada) },
  ].filter((e) => e.value);
  const hasNotes = r.backgroundNote || r.psychometric || r.communication || r.technicalNote;

  return (
    <div className="relative flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <header className="shrink-0 bg-white h-14 px-4 flex items-center border-b border-[#EBF0F7] relative">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Shortlisted Candidates"
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#1E293B] active:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold screen-title">View Resume</h1>
      </header>
      {notice}

      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        <div className="px-4 pt-3">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 min-w-0">
            <span className="shrink-0">Hire New Staff</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <button type="button" onClick={onBack} className="shrink-0 hover:text-[#2F68FE] cursor-pointer">
              Shortlisted Candidates
            </button>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-slate-600 truncate tabular-nums">{candidate.resumeId}</span>
          </p>

          <Card className="mt-2.5 p-4">
            <div className="flex items-start gap-3">
              <span
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${r.gender === 'Female' ? 'bg-[#FDF2F8] text-[#DB2777]' : 'bg-[#EFF6FF] text-[#2F68FE]'}`}
                aria-hidden="true"
              >
                <UserRound className="w-6 h-6" />
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-extrabold text-[#1E293B] leading-snug">{candidate.profile}</h2>
                <p className="mt-0.5 text-[11.5px] text-slate-500 tabular-nums">Resume ID {candidate.resumeId}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Pill tone="indigo">{r.level}</Pill>
                  <CandidateStatusPill status={candidate.status} />
                  {r.backgroundVerified && (
                    <Pill tone="green">
                      <BadgeCheck className="w-3 h-3" />
                      Background verified
                    </Pill>
                  )}
                </div>
              </div>
            </div>
            <FieldGrid
              compact
              fields={[
                { label: CLIENT_IS_MOS ? 'Monthly Charges' : 'Hourly Charges', value: rate },
                { label: 'Work', value: r.workType },
                { label: 'Joining', value: r.joining },
                { label: 'Full Time Availability', value: `${r.availableHoursPerDay * 5} Hours/Week` },
              ]}
            />
          </Card>

          {r.hasVideo && (
            <Section title="Video Summary">
              <button
                type="button"
                onClick={() => showNotice('Playing the introduction video')}
                aria-label="Play introduction video"
                className="relative w-full aspect-video rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden active:opacity-90 cursor-pointer"
              >
                <span className="w-12 h-12 rounded-full bg-white/90 text-[#2F68FE] flex items-center justify-center">
                  <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                </span>
                <span className="absolute left-3 bottom-2.5 text-[11px] font-semibold text-white/80">Self introduction</span>
              </button>
            </Section>
          )}

          <Section title="Hiring Details">
            <FieldGrid
              compact
              fields={[
                { label: 'Domain', value: candidate.domain },
                { label: 'Qualifications', value: r.qualifications.join(', '), wide: true },
              ]}
            />
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
                <TextBlock title="Background Verification" text={r.backgroundNote} />
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
                {r.courses.map((c) => (
                  <li key={c.name} className="py-2.5 flex items-center gap-3">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12.5px] font-bold text-[#1E293B]">{c.name}</span>
                      <span className="block text-[11px] text-slate-500 tabular-nums">
                        {c.duration} · Completed {formatShortDate(c.completedOn)}
                      </span>
                    </span>
                    {canDownload && c.hasCertificate && <FileButton icon={Download} label="Certificate" onClick={() => showNotice(`${c.name} certificate downloaded`)} />}
                  </li>
                ))}
              </ul>
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
                        {a.hasReport && <FileButton label="Report" onClick={() => showNotice(`${a.name} report opened`)} />}
                        {a.hasProctoring && <FileButton label="Proctoring" onClick={() => showNotice(`${a.name} proctoring video opened`)} />}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};
