import React from 'react';
import { ChevronRight, CircleAlert, CircleCheck, Plus } from 'lucide-react';
import { formatDate, plural, Session, sessionErrors } from './certModel';

interface CourseSessionsProps {
  sessions: Session[];
  /** Something was missing at the last Confirm & Continue */
  errorIds: string[];
  onOpen: (id: string) => void;
  onAdd: () => void;
}

/** The certificate's sessions; each one opens on its own page */
export const CourseSessions: React.FC<CourseSessionsProps> = ({ sessions, errorIds, onOpen, onAdd }) => (
  <section aria-label="Course Sessions">
    <h3 className="text-[15px] leading-5 font-semibold text-mc-ink">Course Sessions ({sessions.length})</h3>
    <p className="mt-0.5 text-[13px] leading-[18px] text-mc-muted">Add each session included in this certificate and allocate its credits.</p>
    <div className="mt-3 space-y-2.5">
      {sessions.map((s, i) => {
        const complete = sessionErrors(s).length === 0;
        const error = errorIds.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            data-session={s.id}
            data-error-key={`session/${s.id}`}
            aria-haspopup="dialog"
            onClick={() => onOpen(s.id)}
            className={`w-full min-h-[60px] pl-3 pr-2 py-2.5 rounded-xl border bg-white flex items-center gap-2.5 text-left active:bg-mc-page cursor-pointer ${error ? 'border-mc-error' : 'border-mc-line-strong'}`}
          >
            <span className="w-7 h-7 rounded-full bg-mc-primary-tint text-[13px] font-semibold text-mc-indigo flex items-center justify-center shrink-0" aria-hidden="true">
              {i + 1}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm leading-5 font-semibold text-mc-ink-2 break-words">
                Session {i + 1}
                {s.name.trim() && ` – ${s.name.trim()}`}
              </span>
              <span className="block text-xs leading-[18px] text-mc-muted">{[formatDate(s.date), plural(s.allocations.length, 'Qualification')].filter(Boolean).join(' · ')}</span>
              <span className={`mt-0.5 flex items-center gap-1 text-xs leading-4 font-medium ${complete ? 'text-[#067647]' : error ? 'text-mc-error' : 'text-[#B54708]'}`}>
                {complete ? <CircleCheck className="w-3.5 h-3.5" aria-hidden="true" /> : <CircleAlert className="w-3.5 h-3.5" aria-hidden="true" />}
                {complete ? 'Complete' : 'Incomplete'}
              </span>
            </span>
            <ChevronRight className="w-5 h-5 mx-1 shrink-0 text-mc-muted" aria-hidden="true" />
          </button>
        );
      })}
    </div>
    <button
      type="button"
      onClick={onAdd}
      className="mt-3 w-full min-h-12 rounded-xl border border-mc-primary bg-white text-[15px] font-semibold text-mc-primary flex items-center justify-center gap-2 active:bg-mc-primary-tint cursor-pointer"
    >
      <Plus className="w-5 h-5" aria-hidden="true" />
      Add Session
    </button>
  </section>
);
