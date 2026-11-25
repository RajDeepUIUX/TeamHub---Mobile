import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { CircleAlert, Loader2 } from 'lucide-react';
import { useQuickFill } from '../../../hooks/useQuickFill';
import { McPageHeader } from '../common/McPage';
import { McButton } from '../common/McUi';
import { AiField, Certificate, CertFile, certificateHasData, learningMethodsFor, newSession, reviewStatus, Session, sessionHasData, validateCertificate } from './certModel';
import { CertificateForm, FailedCertificate } from './CertificateForm';
import { CertificateTabs, CourseHeader } from './CertificateTabs';
import { fillBlanks } from './certQuickFill';
import { FinalCheck } from './FinalCheck';
import { scrollToError, useKeyboardRoom } from './formScroll';
import { McConfirm } from './McFormControls';
import { SessionPage, SessionUi } from './SessionPage';

interface ReviewStepProps {
  certificates: Certificate[];
  files: CertFile[];
  openId: string | null;
  retrying: string[];
  submitting: boolean;
  submitFailed: boolean;
  /** The certificate is being viewed over this screen */
  viewing: boolean;
  sessionUi: SessionUi;
  onSessionUi: (ui: SessionUi) => void;
  onBack: () => void;
  onOpen: (id: string | null) => void;
  onChange: (c: Certificate) => void;
  onView: (id: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onManual: (id: string) => void;
  onConfirm: (c: McConfirm) => void;
  onSubmit: () => void;
}

/** One certificate at a time with the tabs as a map, then a final check. A single certificate submits straight from its form. */
export const ReviewStep: React.FC<ReviewStepProps> = (p) => {
  const { certificates } = p;
  const total = certificates.length;
  const panelId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolls = useRef<Record<string, number>>({});
  const [checking, setChecking] = useState(false);
  const [openSession, setOpenSession] = useState<{ id: string; isNew?: boolean; errorKey?: string } | null>(null);
  useKeyboardRoom(scrollRef);

  const fileOf = (id: string) => p.files.find((f) => f.id === id)!;
  const current = certificates.find((x) => x.id === p.openId) ?? certificates.find((x) => !x.reviewed) ?? certificates[0];
  const currentId = current?.id;
  const reviewed = certificates.filter((x) => x.reviewed).length;
  const ready = total > 0 && certificates.every((x) => x.reviewed && x.source !== 'failed' && validateCertificate(x, fileOf(x.id)).length === 0);
  const final = checking && ready && total > 1;

  // Each certificate keeps its place
  const place = final ? 'final' : (currentId ?? '');
  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = place === 'final' ? 0 : (scrolls.current[place] ?? 0);
  }, [place]);
  // Removed the last certificate left to review
  useEffect(() => {
    if (checking && !ready) setChecking(false);
  }, [checking, ready]);

  // Back from a session: its card has the focus and is in view
  const lastSession = useRef<string | null>(null);
  useEffect(() => {
    if (openSession) lastSession.current = openSession.id;
    else if (lastSession.current) {
      const box = scrollRef.current;
      const el = box?.querySelector<HTMLElement>(`[data-session="${CSS.escape(lastSession.current)}"]`);
      lastSession.current = null;
      if (!box || !el) return;
      el.focus({ preventScroll: true });
      const b = box.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      if (r.top < b.top || r.bottom > b.bottom) scrollToError(scrollRef, el.dataset.errorKey!);
    }
  }, [openSession]);

  // Studio Quick Fill: blanks of the certificate on screen
  useQuickFill(current && current.source !== 'failed' && !final ? () => change(fillBlanks(current)) : undefined);

  if (!current) return null;
  const c = current;
  const file = fileOf(c.id);
  const failed = c.source === 'failed';
  const retrying = p.retrying.includes(c.id);

  const invalid = c.flagged.length ? validateCertificate(c, file).filter((e) => c.flagged.includes(e.key)) : [];
  const errors = Object.fromEntries(invalid.map((e) => [e.key, e.message]));
  const errorSessions = [...new Set(invalid.flatMap((e) => e.sessionId ?? []))];
  const titleOf = (x: Certificate) => x.title.trim() || fileOf(x.id).name;

  function change(next: Certificate, edited?: AiField) {
    const keys = validateCertificate(next, fileOf(next.id)).map((e) => e.key);
    p.onChange({
      ...next,
      reviewed: false,
      flagged: next.flagged.filter((k) => keys.includes(k)),
      aiFilled: edited ? next.aiFilled.filter((f) => f !== edited) : next.aiFilled,
    });
  }

  const open = (id: string) => {
    if (id !== c.id && !c.visited) p.onChange({ ...c, visited: true });
    setChecking(false);
    p.onOpen(id);
  };

  /** True when it can be submitted; otherwise goes to the first thing missing */
  const confirmReview = () => {
    const found = validateCertificate(c, file);
    if (!found.length) {
      p.onChange({ ...c, attempted: false, flagged: [], visited: true, reviewed: true });
      return true;
    }
    p.onChange({ ...c, attempted: true, flagged: found.map((e) => e.key), visited: true, reviewed: false });
    if (found[0].sessionId) setOpenSession({ id: found[0].sessionId, errorKey: found[0].key });
    else scrollToError(scrollRef, found[0].key);
    return false;
  };

  const main = () => {
    if (failed) return p.onRetry(c.id);
    if (final) return p.onSubmit();
    if (!confirmReview()) return;
    if (total === 1) return p.onSubmit();
    // The next one still to review, wrapping round; after the last one, the final check
    const i = certificates.findIndex((x) => x.id === c.id);
    const next = [...certificates.slice(i + 1), ...certificates.slice(0, i)].find((x) => !x.reviewed);
    if (next) {
      delete scrolls.current[next.id];
      p.onOpen(next.id);
    } else setChecking(true);
  };
  const submitLabel = total === 1 ? 'Submit Certificate' : `Submit ${total} Certificates`;
  const label = failed ? (retrying ? 'Analyzing' : 'Retry') : p.submitting ? 'Submitting' : final || total === 1 ? submitLabel : 'Confirm & Continue';
  const busy = p.submitting || (failed && retrying);

  /* --------------------------------- Sessions --------------------------------- */

  const session = c.sessions.find((s) => s.id === openSession?.id);
  const setSessions = (sessions: Session[]) => change({ ...c, sessions });
  const closeSession = () => {
    // Added by mistake and left untouched
    if (session && openSession?.isNew && !session.date && !sessionHasData(session) && c.sessions.length > 1) setSessions(c.sessions.filter((s) => s.id !== session.id));
    setOpenSession(null);
  };

  const meta = failed ? undefined : [c.delivery, learningMethodsFor(c.delivery).length ? c.learning : null].filter(Boolean).join(' · ');

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col" inert={Boolean(session) || p.viewing}>
        <McPageHeader
          title={final ? 'Final Check' : 'Review Certificates'}
          onBack={() => {
            if (p.submitting) return;
            if (final) setChecking(false);
            else p.onBack();
          }}
        />
        {!final && (
          <>
            {total > 1 && (
              <CertificateTabs
                tabs={certificates.map((x) => ({ id: x.id, title: titleOf(x), status: reviewStatus(x, fileOf(x.id), x.id === c.id) }))}
                activeId={c.id}
                panelId={panelId}
                onSelect={open}
              />
            )}
            <CourseHeader title={titleOf(c)} meta={meta} joined={total > 1} onView={() => p.onView(c.id)} />
          </>
        )}

        <div
          ref={scrollRef}
          id={panelId}
          role={total > 1 && !final ? 'tabpanel' : undefined}
          aria-labelledby={total > 1 && !final ? `${panelId}-${c.id}` : undefined}
          inert={p.submitting}
          onScroll={(e) => {
            if (!final) scrolls.current[c.id] = e.currentTarget.scrollTop;
          }}
          className={`flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-6 ${final ? 'pt-4 bg-mc-page' : 'pt-3'}`}
        >
          {!final && <p className="mb-4 text-sm leading-5 text-mc-text">Review and confirm the details of your uploaded certificates.</p>}
          {final ? (
            <FinalCheck certificates={certificates} onEdit={open} />
          ) : failed ? (
            <FailedCertificate certificate={c} retrying={retrying} onManual={() => p.onManual(c.id)} onRemove={() => p.onRemove(c.id)} />
          ) : (
            <CertificateForm
              key={c.id}
              certificate={c}
              file={file}
              errors={errors}
              errorSessions={errorSessions}
              sessionUi={p.sessionUi}
              onSessionUi={p.onSessionUi}
              onChange={change}
              onOpenSession={(id) => setOpenSession({ id })}
              onAddSession={() => {
                const s = newSession();
                setSessions([...c.sessions, s]);
                setOpenSession({ id: s.id, isNew: true });
              }}
              onView={() => p.onView(c.id)}
              onRemove={() => {
                if (!certificateHasData(c)) return p.onRemove(c.id);
                p.onConfirm({
                  title: 'Remove this certificate?',
                  text: 'The uploaded file and its details will be removed. Your other certificates stay as they are.',
                  confirmLabel: 'Remove',
                  onConfirm: () => p.onRemove(c.id),
                });
              }}
              onConfirm={p.onConfirm}
            />
          )}
        </div>

        <footer className="shrink-0 px-4 pt-3 bg-white border-t border-mc-line" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          {p.submitFailed && (final || total === 1) && (
            <p role="alert" className="mb-2 flex items-start gap-1.5 text-[13px] leading-[18px] font-medium text-mc-error">
              <CircleAlert className="w-4 h-4 mt-px shrink-0" aria-hidden="true" />
              Your certificates couldn't be submitted. Your details are saved here. Please try again.
            </p>
          )}
          {total > 1 && (
            <div className="mb-2.5 flex items-center gap-3">
              <p className="text-[13px] leading-5 font-medium text-mc-text whitespace-nowrap" aria-live="polite">
                {reviewed === total ? 'All certificates reviewed' : `${reviewed} of ${total} certificates reviewed`}
              </p>
              <span className="flex-1 flex gap-1" aria-hidden="true">
                {certificates.map((x) => (
                  <span key={x.id} className={`flex-1 h-1 rounded-full ${x.reviewed ? 'bg-[#17B26A]' : 'bg-mc-line'}`} />
                ))}
              </span>
            </div>
          )}
          <McButton disabled={busy} aria-busy={busy} onClick={main}>
            {busy && <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {label}
          </McButton>
        </footer>
      </div>

      {session && (
        <SessionPage
          key={session.id}
          ui={p.sessionUi}
          session={session}
          number={c.sessions.indexOf(session) + 1}
          total={c.sessions.length}
          title={titleOf(c)}
          meta={total > 1 ? `Certificate ${certificates.indexOf(c) + 1}` : undefined}
          isNew={Boolean(openSession?.isNew)}
          errorKey={openSession?.errorKey ?? null}
          errors={errors}
          covered={p.viewing}
          onChange={(s) => setSessions(c.sessions.map((x) => (x.id === s.id ? s : x)))}
          onRemove={() => {
            const remove = () => {
              setOpenSession(null);
              setSessions(c.sessions.filter((x) => x.id !== session.id));
            };
            if (!sessionHasData(session)) return remove();
            p.onConfirm({
              title: `Remove Session ${c.sessions.indexOf(session) + 1}?`,
              text: 'The details and credits entered for this session will be removed.',
              confirmLabel: 'Remove',
              onConfirm: remove,
            });
          }}
          onView={() => p.onView(c.id)}
          onConfirm={p.onConfirm}
          onInvalid={(keys) => p.onChange({ ...c, flagged: [...new Set([...c.flagged, ...keys])] })}
          onClose={closeSession}
        />
      )}
    </>
  );
};
