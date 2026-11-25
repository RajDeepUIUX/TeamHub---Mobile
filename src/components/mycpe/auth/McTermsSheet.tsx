import React, { useEffect, useRef, useState } from 'react';
import { ChevronsDown } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { McButton } from '../common/McUi';
import { TERMS_HEADING, TERMS_PARAGRAPHS, TERMS_PENDING_BLOCKS, TERMS_TITLE } from '../data/mycpeAuthData';

/** "Go to Bottom" until the end has been reached, then "Accept" */
export const McTermsSheet: React.FC<{ isOpen: boolean; onClose: () => void; onAccept: () => void }> = ({ isOpen, onClose, onAccept }) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    if (isOpen) setAtEnd(false);
  }, [isOpen]);

  const check = () => {
    const el = bodyRef.current;
    // Once the end has been seen, Accept stays
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setAtEnd(true);
  };

  const siteLink = (text: string) => (
    <a href="https://my-cpe.com/" target="_blank" rel="noopener noreferrer" className="text-mc-primary underline underline-offset-[3px]">
      {text}
    </a>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="h-[92%]" className="font-mc overflow-hidden">
      <div className="pt-2.5 flex justify-center shrink-0">
        <span className="w-14 h-1 rounded-full bg-mc-line-strong" />
      </div>
      <div ref={bodyRef} onScroll={check} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-4 pb-4">
        <h2 className="text-2xl leading-8 font-semibold text-mc-ink">{TERMS_TITLE}</h2>
        <h3 className="mt-6 text-lg leading-7 font-semibold text-mc-ink-2">{TERMS_HEADING}</h3>
        {TERMS_PARAGRAPHS.map((p) => (
          <p key={p.slice(0, 20)} className="mt-3.5 text-[14.5px] leading-6 text-mc-ink-2 select-text">
            {p}
          </p>
        ))}
        {/* Stand-in for the rest of the Terms until the text is provided */}
        {TERMS_PENDING_BLOCKS.map((widths, i) => (
          <div key={i} className="mt-5 space-y-3" aria-hidden="true">
            {widths.map((w, j) => (
              <span key={j} className="block h-3 rounded-full bg-mc-page" style={{ width: `${w}%` }} />
            ))}
          </div>
        ))}
        <p className="mt-9 text-xs leading-5 text-mc-muted">
          View all MYCPE ONE {siteLink('Terms of Services')} and {siteLink('Privacy Policy')}.
        </p>
      </div>
      <div className="shrink-0 px-4 pt-3 pb-6 bg-white">
        {atEnd ? (
          <McButton size="md" onClick={onAccept}>
            Accept
          </McButton>
        ) : (
          <McButton size="md" tone="soft" onClick={() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })}>
            Go to Bottom
            <ChevronsDown className="w-5 h-5 text-mc-link" />
          </McButton>
        )}
      </div>
    </BottomSheet>
  );
};
