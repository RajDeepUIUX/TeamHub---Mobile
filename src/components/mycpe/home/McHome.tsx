import React from 'react';
import { ArrowRight, Bell, Pencil, Plus } from 'lucide-react';
import { EBookIcon, LiveWebinarIcon, OnDemandIcon, PodcastIcon } from '../common/McIcons';
import { McRow } from '../common/McPage';
import { McCourseCard } from './McCourseCard';
import {
  COMPLIANCE_PERCENT,
  CONTINUE_LEARNING,
  FREE_COURSES,
  McCourse,
  McHomeState,
  MYCPE_AVATAR,
  NEWLY_ADDED,
  PERSONALIZED_COURSES,
  PERSONALIZED_TOPICS,
  TRENDING_NOW,
  UPCOMING_WEBINARS,
} from '../data/mycpeHomeData';

interface McHomeProps {
  firstName: string;
  home: McHomeState;
  bookmarks: string[];
  onBookmark: (courseId: string) => void;
  onHomeChange: (patch: Partial<McHomeState>) => void;
  onSubscribe: () => void;
  onOpenProfile: () => void;
  /** Screens without a design yet */
  onOpen: (title: string) => void;
}

const SeeAll: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick} className="text-sm font-semibold text-mc-primary underline underline-offset-[3px] cursor-pointer">
    See all
  </button>
);

const CATEGORIES = [
  { label: 'Live Webinars', icon: LiveWebinarIcon },
  { label: 'On Demand', icon: OnDemandIcon },
  { label: 'E-Books', icon: EBookIcon },
  { label: 'Podcasts', icon: PodcastIcon },
];

const ComplianceRing: React.FC = () => {
  const r = 13.5;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative w-[30px] h-[30px] shrink-0 rounded-full bg-mc-primary-tint">
      <svg viewBox="0 0 30 30" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="15" cy="15" r={r} fill="none" stroke="#D0D5DD" strokeWidth="2.4" />
        <circle cx="15" cy="15" r={r} fill="none" stroke="#7162EA" strokeWidth="2.4" strokeDasharray={`${(c * COMPLIANCE_PERCENT) / 100} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-mc-ink-2 tabular-nums">{COMPLIANCE_PERCENT}%</span>
    </span>
  );
};

export const McHome: React.FC<McHomeProps> = ({ firstName, home, bookmarks, onBookmark, onHomeChange, onSubscribe, onOpenProfile, onOpen }) => {
  const asking = home.personalization === 'ask';

  const section = (title: string, courses: McCourse[], opts: { seeAll?: boolean; before?: React.ReactNode; action?: React.ReactNode } = {}) => (
    <section className="py-6 border-b border-mc-line last:border-b-0">
      <div className="px-4 flex items-center gap-4">
        <h2 className="flex-1 text-base leading-5 font-semibold text-[#2A3343]">{title}</h2>
        {opts.action}
        {opts.seeAll !== false && <SeeAll onClick={() => onOpen(title)} />}
      </div>
      {opts.before}
      <McRow className="mt-6 px-4 gap-4 items-stretch">
        {courses.map((c) => (
          <McCourseCard key={c.id} course={c} bookmarked={bookmarks.includes(c.id)} onBookmark={() => onBookmark(c.id)} onOpen={() => onOpen('Course Details')} />
        ))}
      </McRow>
    </section>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white">
      <header className={`shrink-0 bg-white ${asking ? '' : 'border-b border-mc-line'}`} style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="h-[54px] px-4 flex items-center">
          <img src="/brand/Icon.png" alt="MYCPE ONE" className="h-8" draggable={false} />
          <div className="flex-1 flex justify-end mr-2">
            {home.complianceAdded ? (
              <button
                type="button"
                onClick={() => onOpen('Compliance')}
                className="mr-2 h-[30px] pr-3.5 rounded-full bg-mc-primary-tint flex items-center gap-2 text-[15px] font-semibold text-mc-ink-2 active:bg-mc-primary-soft cursor-pointer"
              >
                <ComplianceRing />
                Compliance
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpen('Add Compliance')}
                className="h-[30px] px-4 rounded-full bg-mc-primary-tint flex items-center gap-2 text-sm font-semibold text-mc-ink-2 active:bg-mc-primary-soft cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[1.6]" />
                Add Compliance
              </button>
            )}
          </div>
          <button type="button" onClick={() => onOpen('Notifications')} className="w-10 h-10 mr-1 flex items-center justify-center text-mc-muted cursor-pointer" aria-label="Notifications">
            <Bell className="w-[22px] h-[22px] stroke-[1.5]" />
          </button>
          <button type="button" onClick={onOpenProfile} className="w-[46px] h-[46px] rounded-full border-2 border-mc-line overflow-hidden cursor-pointer" aria-label="Profile">
            <img src={MYCPE_AVATAR} alt="" className="w-full h-full object-cover" draggable={false} />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-[#F9FAFB]">
        {asking ? (
          <section className="px-4 pt-4 pb-4 bg-linear-to-b from-white to-[#D8D2F5]">
            <h1 className="text-[28px] leading-10 font-semibold text-mc-ink-2">
              Hey {firstName}, welcome
              <br />
              to MYCPE ONE
            </h1>
            <p className="mt-2.5 text-base leading-6 text-[#2A3343]">
              Would you like a personalized Home Screen? Turn it on to see learning recommendations based on your profile.
            </p>
            <p className="mt-4 text-base leading-6 text-mc-muted">You can change this anytime from Profile &gt; Account Settings.</p>
            <div className="mt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => onHomeChange({ personalization: 'on' })}
                className="flex-1 h-11 rounded-xl bg-mc-primary text-white text-base font-semibold flex items-center justify-center gap-2.5 whitespace-nowrap active:bg-mc-primary-pressed cursor-pointer"
              >
                Turn on Personalization
                <ArrowRight className="w-5 h-5 stroke-[1.4]" />
              </button>
              <button
                type="button"
                onClick={() => onHomeChange({ personalization: 'off' })}
                className="shrink-0 w-[min(99px,24.5%)] h-11 rounded-xl bg-mc-primary-tint text-mc-muted text-sm font-medium active:bg-mc-primary-soft cursor-pointer"
              >
                Not Now
              </button>
            </div>
          </section>
        ) : (
          !home.subscribeCardDismissed && (
            <div className="px-4 pt-4 pb-2 bg-mc-page">
              <section className="rounded-[28px] bg-mc-ink px-6 pt-6 pb-4">
                <h1 className="text-xl leading-[30px] font-semibold text-white">Unlock Annual Access to News &amp; CPE Subscription</h1>
                <p className="mt-1.5 text-sm leading-5 text-[#98A2B3]">Subscribe to get access to 15,000+ Hrs of CPE courses.</p>
                <button
                  type="button"
                  onClick={onSubscribe}
                  className="mt-2 w-full h-10 rounded-xl bg-white text-mc-primary text-sm font-semibold active:bg-mc-primary-tint cursor-pointer"
                >
                  Subscribe @ $199/yr
                </button>
                <button
                  type="button"
                  onClick={() => onHomeChange({ subscribeCardDismissed: true })}
                  className="mt-1.5 w-full h-8 text-xs font-medium text-white active:text-mc-line-strong cursor-pointer"
                >
                  Maybe Later
                </button>
              </section>
            </div>
          )
        )}

        <section className="pt-6 pb-6 bg-mc-page border-b border-mc-line">
          <div className="px-4 flex items-center justify-between">
            <h2 className="text-base leading-5 font-semibold text-[#2A3343]">Categories</h2>
            <SeeAll onClick={() => onOpen('Categories')} />
          </div>
          <div className="mt-4 px-2 grid grid-cols-4">
            {CATEGORIES.map(({ label, icon: Icon }) => (
              <button key={label} type="button" onClick={() => onOpen(label)} className="flex flex-col items-center cursor-pointer">
                <span className="w-12 h-12 rounded-full bg-white border border-mc-line flex items-center justify-center text-[#6C7488]">
                  <Icon className="w-[22px] h-[22px]" />
                </span>
                <span className="mt-2 text-xs leading-[18px] text-[#6C7488] whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {home.hasStartedCourses && section('Continue learning', CONTINUE_LEARNING)}
        {section('Free Course for you', FREE_COURSES, { seeAll: false })}
        {home.personalization === 'on' &&
          section('Personalized for you', PERSONALIZED_COURSES, {
            action: (
              <button type="button" onClick={() => onOpen('Learning Preference')} className="-my-2 w-8 h-9 flex items-center justify-center text-mc-muted cursor-pointer" aria-label="Edit preferences">
                <Pencil className="w-[17px] h-[17px] stroke-[1.5]" />
              </button>
            ),
            before: (
              <McRow className="mt-6 px-4 gap-2">
                {PERSONALIZED_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onOpen(t)}
                    className="shrink-0 h-7 px-3 rounded-[10px] border border-mc-line-strong bg-mc-page text-xs text-[#2A3343] whitespace-nowrap active:bg-mc-line cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </McRow>
            ),
          })}
        {section('Upcoming Webinar', UPCOMING_WEBINARS)}
        {section('Trending now', TRENDING_NOW)}
        {section('Newly added', NEWLY_ADDED)}
      </div>
    </div>
  );
};
