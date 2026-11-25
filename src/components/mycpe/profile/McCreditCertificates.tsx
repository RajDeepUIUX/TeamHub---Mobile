import React from 'react';
import { ChevronRight, Mail, Pencil } from 'lucide-react';
import { CertificateIcon, NoCertificatesArt } from '../common/McIcons';
import { McPageHeader } from '../common/McPage';

const OPTIONS = [
  { title: 'Upload & Auto-Fill with AI', text: "Snap or upload your certificate. We'll read the title, hours, and date for you.", icon: CertificateIcon, recommended: true },
  { title: 'Add Certificate Manually', text: 'Type in course name, No. of credits, and many more.', icon: Pencil },
  { title: 'Forward by email', text: "Forward your certificate to your private MY-CPE inbox and we'll add it automatically.", icon: Mail },
];

/** Empty state: no certificates earned or added yet */
export const McCreditCertificates: React.FC<{ onBack: () => void; onOpen: (title: string) => void }> = ({ onBack, onOpen }) => (
  <div className="flex-1 min-h-0 flex flex-col bg-[#FAFBFC]">
    <McPageHeader title="Credit Certificates" onBack={onBack} />
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-[30px]" style={{ paddingBottom: 'calc(var(--safe-bottom) + 24px)' }}>
      <NoCertificatesArt className="w-[136px] h-[124px] mx-auto" />
      <h2 className="mt-7 text-center text-2xl leading-8 font-semibold text-[#2A3343]">You don’t have any certificates available yet.</h2>
      <p className="mt-4 text-center text-sm leading-5 font-medium text-[#98A2B3]">
        Complete your courses to earn certificates
        <br />
        that will be available for download here. Keep learning and achieve your goals!
      </p>
      <div className="mt-9 space-y-3">
        {OPTIONS.map(({ title, text, icon: Icon, recommended }) => (
          <button
            key={title}
            type="button"
            onClick={() => onOpen(title)}
            className={`relative w-full min-h-[84px] p-3.5 rounded-2xl border bg-white flex items-center gap-3.5 text-left shadow-[0_2px_8px_-2px_rgba(16,24,40,0.06)] transition-transform active:scale-[0.985] cursor-pointer ${
              recommended ? 'border-[#B8B0F5] bg-linear-to-r from-mc-primary-tint to-white' : 'border-mc-line'
            }`}
          >
            {/* Sits on the card's edge so all three cards keep the same layout */}
            {recommended && (
              <span className="absolute -top-2.5 left-4 h-5 px-2 rounded-full bg-[#FEF0C7] border border-[#FEDF89] flex items-center text-[10px] font-semibold tracking-[0.04em] text-[#93370D]">
                RECOMMENDED
              </span>
            )}
            <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${recommended ? 'bg-mc-primary text-white' : 'bg-mc-primary-tint text-mc-primary'}`}>
              <Icon className="w-[22px] h-[22px] stroke-[1.6]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] leading-[22px] font-semibold text-mc-ink-2">{title}</span>
              <span className="mt-0.5 block text-[13px] leading-[18px] text-mc-muted">{text}</span>
            </span>
            <ChevronRight className="w-5 h-5 stroke-[1.8] text-[#98A2B3] shrink-0" />
          </button>
        ))}
      </div>
    </div>
  </div>
);
