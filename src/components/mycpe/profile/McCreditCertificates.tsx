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
      <div className="mt-8 space-y-4">
        {OPTIONS.map(({ title, text, icon: Icon, recommended }) => (
          <button
            key={title}
            type="button"
            onClick={() => onOpen(title)}
            className="w-full pl-[7px] pr-3 py-2 rounded-md bg-white border border-mc-line flex items-center gap-3 text-left active:bg-mc-page cursor-pointer"
          >
            <span className="w-[42px] h-[42px] rounded-lg bg-mc-primary-tint text-mc-primary flex items-center justify-center shrink-0">
              <Icon className="w-[22px] h-[22px] stroke-[1.5]" />
            </span>
            <span className="flex-1 min-w-0">
              {recommended && <span className="inline-block px-1 h-[18px] leading-[18px] rounded-[3px] bg-[#FEF0C7] text-[10px] text-[#93370D]">RECOMMENDED</span>}
              <span className="block text-base leading-6 font-semibold text-mc-ink-2">{title}</span>
              <span className="block text-sm leading-5 text-[#98A2B3]">{text}</span>
            </span>
            <ChevronRight className="w-6 h-6 stroke-[1.4] text-[#98A2B3] shrink-0" />
          </button>
        ))}
      </div>
    </div>
  </div>
);
