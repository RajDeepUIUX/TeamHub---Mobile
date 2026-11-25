import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Certificate, creditSummary, formatCredits, formatDate, isSessionMode, learningMethodsFor, plural } from './certModel';
import { StatusText } from './CertificateTabs';

/** Everything that's about to be submitted; tap a certificate to edit it */
export const FinalCheck: React.FC<{ certificates: Certificate[]; onEdit: (id: string) => void }> = ({ certificates, onEdit }) => (
  <ul className="space-y-3">
    {certificates.map((c, i) => (
      <li key={c.id}>
        <button
          type="button"
          onClick={() => onEdit(c.id)}
          aria-label={`Edit certificate ${i + 1}: ${c.title.trim()}`}
          className="w-full rounded-xl border border-mc-line-strong bg-white text-left active:bg-mc-page cursor-pointer"
        >
          <span className="pl-3.5 pr-2 py-3 flex items-center gap-2">
            <span className="flex-1 min-w-0">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-xs leading-4 font-medium text-mc-muted">Certificate {i + 1}</span>
                <StatusText status="Reviewed" />
              </span>
              <span className="mt-1 block text-base leading-[22px] font-semibold text-mc-ink break-words">{c.title.trim()}</span>
              <span className="mt-0.5 block text-[13px] leading-[18px] text-mc-text">{c.provider}</span>
              <span className="block text-[13px] leading-[18px] text-mc-muted">
                {[c.delivery, learningMethodsFor(c.delivery).length ? c.learning : null, isSessionMode(c) ? plural(c.sessions.length, 'Session') : formatDate(c.date)].filter(Boolean).join(' · ')}
              </span>
            </span>
            <ChevronRight className="w-5 h-5 mx-1 shrink-0 text-mc-muted" aria-hidden="true" />
          </span>
          <span className="block mx-3.5 py-2.5 border-t border-mc-line space-y-1">
            {creditSummary(c).map((q) => (
              <span key={q.qualification} className="flex justify-between gap-3 text-[13px] leading-5">
                <span className="min-w-0 text-mc-text break-words">{q.qualification}</span>
                <span className="shrink-0 font-semibold text-mc-ink-2 tabular-nums">{formatCredits(q.credits)}</span>
              </span>
            ))}
          </span>
        </button>
      </li>
    ))}
  </ul>
);
