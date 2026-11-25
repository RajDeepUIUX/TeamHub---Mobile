import React from 'react';
import { Battery, Bell, Bookmark, BookOpen, Star, Wifi } from 'lucide-react';
import { McButton, McGrid } from '../common/McUi';
import { ONBOARDING_ACTIVE, ONBOARDING_COURSES, ONBOARDING_FADED_COURSES, ONBOARDING_SLIDE, ONBOARDING_TOTAL } from '../data/mycpeAuthData';

const FADE = 'linear-gradient(to bottom, #000 260px, rgba(0,0,0,0.5) 302px, transparent 352px)';

/** Short screens: the phone fades out above the buttons instead of being cut off */
const EDGE = 'linear-gradient(to top, transparent, #000 40px)';

const SIDE_BUTTONS = ['-left-0.5 top-[88px] h-5', '-left-0.5 top-[121px] h-9', '-left-0.5 top-[164px] h-9', '-right-0.5 top-[145px] h-14'];

/** Phone illustration: 216 × 352, fading out at the bottom */
const PhoneMockup: React.FC = () => (
  <div className="relative w-[216px] h-[352px] mx-auto" aria-hidden="true">
    {/* Glow: cyan on the left, violet on the right */}
    <div className="absolute -left-14 top-4 w-44 h-72 rounded-full blur-[38px] bg-linear-to-b from-[#63B5FF]/45 via-[#5E7BFF]/40 to-[#B07BFF]/25" />
    <div className="absolute -right-14 top-4 w-44 h-72 rounded-full blur-[38px] bg-linear-to-b from-[#8E86FF]/35 via-[#6F63FF]/45 to-[#8E86FF]/20" />

    {SIDE_BUTTONS.map((pos) => (
      <span key={pos} className={`absolute w-1 rounded-sm bg-[#6C6762] ${pos}`} />
    ))}

    {/* White behind the fade so the glow doesn't show through the phone */}
    <div className="absolute inset-0 rounded-t-[40px] bg-linear-to-b from-white via-white to-white" />
    <div className="absolute inset-0 rounded-t-[40px] bg-[#6C6762] p-0.5 pb-0" style={{ maskImage: FADE, WebkitMaskImage: FADE }}>
      <div className="w-full h-full rounded-t-[38px] bg-[#1F1F1F] p-[6px] pb-0">
        <div className="w-full h-full rounded-t-[32px] bg-[#E9EAF1] overflow-hidden">
          <div className="relative h-[52px] bg-[#F9FAFC]">
            <span className="absolute left-4 top-[7px] text-[7.5px] font-semibold text-mc-ink-2">9:41</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-[5px] w-16 h-[18px] rounded-full bg-[#1F2020]" />
            <span className="absolute right-4 top-[7px] flex items-center gap-0.5 text-mc-ink-2">
              <Wifi className="w-2 h-2 stroke-[3]" />
              <Battery className="w-3 h-3 fill-current" />
            </span>
            <img src="/brand/Icon.png" alt="" className="absolute left-[7px] top-[29px] h-[17px]" draggable={false} />
            <span className="absolute right-[7px] top-[27px] w-[21px] h-[21px] rounded-full bg-[#E9EAF1] flex items-center justify-center text-mc-ink-2">
              <Bell className="w-3 h-3 stroke-[1.6]" />
            </span>
          </div>
          <div className="px-[7px] pt-[9px] grid grid-cols-2 gap-x-[9px] gap-y-2">
            {ONBOARDING_COURSES.map((c) => (
              <div key={c.title} className="h-[108px] rounded-[4px] bg-[#F8F9FC] overflow-hidden">
                <img src={c.image} alt="" className="w-full h-[51px] object-cover" draggable={false} />
                <div className="px-[3px] pt-[5px]">
                  <div className="flex items-center gap-1 text-[5.5px] text-mc-muted">
                    <BookOpen className="w-[7px] h-[7px] text-mc-indigo" />
                    E-Books
                    <Bookmark className="ml-auto w-2 h-2.5 text-mc-primary stroke-[2]" />
                  </div>
                  <p className="mt-[3px] text-[6.5px] leading-[9.5px] tracking-[-0.01em] font-semibold text-mc-ink-2 line-clamp-2">{c.title}</p>
                  <p className="mt-[3px] flex items-center gap-1 text-[6.5px] leading-[9px] text-mc-text">
                    8 Credits <span className="text-[5px]">•</span>
                    <Star className="w-2 h-2 fill-[#EAAA08] text-[#EAAA08]" />
                    4.8
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Third row: the artwork is already faded, so it sits outside the mask */}
    <div className="absolute left-[15px] right-[15px] top-[302px] grid grid-cols-2 gap-x-[9px]">
      {ONBOARDING_FADED_COURSES.map((src) => (
        <img key={src} src={src} alt="" className="w-full h-[49px] rounded-t-[4px] object-cover" draggable={false} />
      ))}
    </div>
  </div>
);

export const McOnboarding: React.FC<{ onGetStarted: () => void; onHaveAccount: () => void }> = ({ onGetStarted, onHaveAccount }) => (
  <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-linear-to-b from-[#F3F5FF] via-[#FAFBFF] to-white">
    <McGrid height={570} mask="linear-gradient(to bottom, #000 120px, #000 480px, transparent 570px)" />
    <div className="relative flex-1 min-h-0 overflow-y-auto no-scrollbar" style={{ paddingTop: 'calc(var(--safe-top) + 12px)', maskImage: EDGE, WebkitMaskImage: EDGE }}>
      <p className="text-center text-sm leading-5 font-semibold text-mc-primary">{ONBOARDING_SLIDE.eyebrow}</p>
      <h1 className="mt-2 mx-auto max-w-[330px] text-center text-[30px] leading-[38px] font-semibold text-mc-ink">
        <span className="text-mc-deep">{ONBOARDING_SLIDE.highlight}</span>
        {ONBOARDING_SLIDE.title}
      </h1>
      <div className="mt-13">
        <PhoneMockup />
      </div>
    </div>
    <div className="relative shrink-0 px-4 pt-8" style={{ paddingBottom: 'calc(var(--safe-bottom) + 28px)' }}>
      <div className="flex justify-center gap-2" aria-hidden="true">
        {Array.from({ length: ONBOARDING_TOTAL }, (_, i) => (
          <span key={i} className={`w-2 h-2 rounded-full ${i === ONBOARDING_ACTIVE ? 'bg-mc-ink-2' : 'bg-[#EEF0F4]'}`} />
        ))}
      </div>
      <McButton onClick={onGetStarted} className="mt-8">
        Get Started
      </McButton>
      <button type="button" onClick={onHaveAccount} className="mt-2.5 w-full h-14 text-base font-semibold text-mc-primary active:text-mc-primary-pressed cursor-pointer">
        I already have an account
      </button>
    </div>
  </div>
);
