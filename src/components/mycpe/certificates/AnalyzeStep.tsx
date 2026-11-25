import React, { useRef } from 'react';
import { Check, CircleCheck, CircleDashed, CircleX, Loader2, PencilLine, RotateCcw, Sparkles } from 'lucide-react';
import { McButton } from '../common/McUi';
import { CertFile, FailReason, formatSize, plural } from './certModel';
import { ANALYSIS_STAGES } from './certService';
import { FileBadge } from './CertificateViewer';
import { AiTag } from './McFormControls';

export interface Analysis {
  state: 'analyzing' | 'done' | 'failed' | 'manual';
  stage: number;
  reason?: FailReason;
}

export const FAIL_TEXT: Record<FailReason, string> = {
  failed: "AI couldn't analyze this certificate.",
  not_certificate: "This document couldn't be identified as a certificate.",
};

/** Document being scanned: a line passes over it while its text lines fill in */
const ScanArt: React.FC<{ active: boolean }> = ({ active }) => (
  <div className={`relative w-28 h-32 mx-auto ${active ? 'mc-scanning' : ''}`} aria-hidden="true">
    <div className="absolute inset-x-2 inset-y-1 rounded-xl border border-mc-line-strong bg-white shadow-[0_6px_16px_-6px_rgba(16,24,40,0.16)] overflow-hidden">
      <div className="p-3.5 space-y-2">
        <span className="block w-8 h-8 rounded-lg bg-mc-primary-tint" />
        {[100, 78, 92, 60].map((w, i) => (
          <span key={w} className="block h-1.5 rounded-full bg-mc-line overflow-hidden" style={{ width: `${w}%` }}>
            <span className="mc-extract block h-full rounded-full bg-mc-primary/55" style={{ animationDelay: `${i * 0.22}s` }} />
          </span>
        ))}
      </div>
      {active && <span className="mc-scan-line absolute inset-x-0 top-0 h-9 bg-linear-to-b from-transparent to-mc-primary/16 border-b-2 border-mc-primary" />}
    </div>
    <Sparkles className="mc-twinkle absolute -top-1 -right-1 w-5 h-5 text-mc-primary" />
    <Sparkles className="mc-twinkle absolute bottom-3 -left-2 w-4 h-4 text-[#A99FF2]" style={{ animationDelay: '0.7s' }} />
  </div>
);

interface AnalyzeStepProps {
  files: CertFile[];
  analysis: Record<string, Analysis>;
  onRetry: (id: string) => void;
  onManual: (id: string) => void;
  onReview: () => void;
}

export const AnalyzeStep: React.FC<AnalyzeStepProps> = ({ files, analysis, onRetry, onManual, onReview }) => {
  const of = (f: CertFile): Analysis => analysis[f.id] ?? { state: 'analyzing', stage: 0 };
  const analyzing = files.filter((f) => of(f).state === 'analyzing');
  const running = analyzing.length > 0;
  const failed = files.filter((f) => of(f).state === 'failed').length;
  const usable = files.length - failed;
  // Everything in this run, until all of it has finished (a retry is just that one)
  const run = useRef<string[]>([]);
  if (!running) run.current = [];
  analyzing.forEach((f) => run.current.includes(f.id) || run.current.push(f.id));
  const batch = files.filter((f) => run.current.includes(f.id));
  // One status for all of them: a stage is done once every certificate has passed it
  const stage = Math.min(...analyzing.map((f) => of(f).stage));

  const title = running ? 'Analyzing your certificates' : usable ? 'Your certificates are ready for review' : "Your certificates couldn't be analyzed";
  const text = running
    ? 'AI is extracting your course details and identifying relevant credit information.'
    : usable
      ? 'Review the extracted information, confirm your qualifications, and make any necessary changes before submitting.'
      : 'Retry the analysis, or enter the details manually.';

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-6 pb-6">
        {running ? (
          <ScanArt active />
        ) : usable ? (
          <span className="w-16 h-16 mx-auto rounded-full bg-[#ECFDF3] text-[#067647] flex items-center justify-center">
            <Check className="w-8 h-8 stroke-[2.5]" aria-hidden="true" />
          </span>
        ) : (
          <ScanArt active={false} />
        )}
        <div role="status" aria-live="polite">
          <h2 className="mt-5 text-center text-xl leading-7 font-semibold text-mc-ink">{title}</h2>
          <p className="mt-1.5 mx-auto max-w-[320px] text-center text-sm leading-5 text-mc-text">{text}</p>
        </div>

        {running && (
          <div role="progressbar" aria-label="Analyzing certificates" className="mt-5 mx-auto w-48 h-1 rounded-full bg-mc-primary-soft overflow-hidden">
            <span className="mc-indeterminate block h-full w-2/5 rounded-full bg-mc-primary" />
          </div>
        )}

        {running && (
          <ol className="mt-6 px-4 py-3 rounded-xl border border-mc-line bg-[#F6F7F9] space-y-2.5">
            {ANALYSIS_STAGES.map((s, i) => (
              <li
                key={s}
                aria-current={i === stage ? 'step' : undefined}
                className={`flex items-center gap-2.5 text-[13px] leading-5 ${i === stage ? 'font-semibold text-mc-ink' : i < stage ? 'text-mc-text' : 'text-mc-muted'}`}
              >
                {i < stage ? (
                  <CircleCheck className="w-4 h-4 text-[#067647] shrink-0" aria-label="Done" />
                ) : i === stage ? (
                  <Loader2 className="w-4 h-4 text-mc-primary animate-spin motion-reduce:animate-none shrink-0" aria-label="In progress" />
                ) : (
                  <CircleDashed className="w-4 h-4 text-[#98A2B3] shrink-0" aria-label="Pending" />
                )}
                {s}
              </li>
            ))}
          </ol>
        )}

        {running ? (
          <section aria-label={plural(batch.length, 'certificate')} className="mt-5">
            <h3 className="text-[13px] leading-5 font-semibold text-mc-ink-2">{plural(batch.length, 'certificate')}</h3>
            <ul className="mt-2 rounded-xl border border-mc-line bg-white divide-y divide-mc-line">
              {batch.map((f) => (
                <li key={f.id} className="px-3 py-2.5 flex items-center gap-3">
                  <FileBadge file={f} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-5 font-medium text-mc-ink-2 truncate">{f.name}</p>
                    <p className="text-xs leading-4 text-mc-muted">{formatSize(f.size)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <ul className="mt-5 rounded-xl border border-mc-line bg-white divide-y divide-mc-line">
            {files.map((f, i) => {
              const a = of(f);
              const row = {
                analyzing: { icon: <Loader2 className="w-5 h-5 text-mc-primary animate-spin motion-reduce:animate-none" />, label: 'Analyzing', tone: 'text-mc-indigo font-medium' },
                done: { icon: <CircleCheck className="w-5 h-5 text-[#067647]" />, label: 'Analysis complete', tone: 'text-[#067647] font-medium' },
                failed: { icon: <CircleX className="w-5 h-5 text-mc-error" />, label: FAIL_TEXT[a.reason ?? 'failed'], tone: 'text-mc-error font-medium' },
                manual: { icon: <PencilLine className="w-5 h-5 text-mc-text" />, label: 'Details to be entered manually', tone: 'text-mc-text' },
              }[a.state];
              return (
                <li key={f.id} className="px-3.5 py-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0" aria-hidden="true">
                      {row.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-5 font-medium text-mc-ink-2">Certificate {i + 1}</p>
                      <p className="text-xs leading-4 text-mc-muted [overflow-wrap:anywhere]">{f.name}</p>
                      <p className={`mt-0.5 text-xs leading-4 ${row.tone}`}>{row.label}</p>
                    </div>
                  </div>
                  {a.state === 'failed' && (
                    <div className="mt-2.5 pl-8 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onRetry(f.id)}
                        className="h-11 px-4 rounded-lg border border-mc-line-strong bg-white text-sm font-semibold text-mc-ink-2 flex items-center gap-1.5 active:bg-mc-page cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => onManual(f.id)}
                        className="h-11 px-3 rounded-lg text-sm font-semibold text-mc-primary active:bg-mc-primary-tint cursor-pointer"
                      >
                        Enter Details Manually
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!running && files.some((f) => of(f).state === 'done') && (
          <p className="mt-4 px-3.5 py-3 rounded-xl bg-mc-primary-tint text-[13px] leading-5 text-mc-text">
            <span className="font-semibold text-mc-ink-2">Note:</span> Fields where AI has successfully fetched the data show an{' '}
            <span className="px-0.5 rounded-full bg-white inline-flex align-middle">
              <AiTag />
            </span>{' '}
            tag.
          </p>
        )}
      </div>

      {!running && usable > 0 && (
        <footer className="shrink-0 px-4 pt-3 bg-white border-t border-mc-line" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          <McButton onClick={onReview}>Review Certificates</McButton>
        </footer>
      )}
    </>
  );
};
