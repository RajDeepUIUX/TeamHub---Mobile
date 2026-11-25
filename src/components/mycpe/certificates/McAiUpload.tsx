import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useQuickFill } from '../../../hooks/useQuickFill';
import { McPageHeader } from '../common/McPage';
import { McButton } from '../common/McUi';
import { Analysis, AnalyzeStep } from './AnalyzeStep';
import { blankCertificate, Certificate, certificateHasData, CertFile, MAX_BYTES, MAX_FILES, toPayload, uid, UploadError } from './certModel';
import { analyzeCertificate, SAMPLE_FILES, submitCertificates, uploadCertificate } from './certService';
import { CertificateViewer } from './CertificateViewer';
import { McConfirm, McConfirmSheet } from './McFormControls';
import { ReviewStep } from './ReviewStep';
import { SessionUi } from './SessionPage';
import { UploadStep } from './UploadStep';

type Step = 'upload' | 'analyze' | 'review' | 'success';

/** Shown on Credit Certificates after a submission */
export interface SubmittedCertificate {
  id: string;
  title: string;
  delivery: string;
  provider: string;
}

interface McAiUploadProps {
  /** Leave the flow, back to Credit Certificates */
  onClose: () => void;
  onSubmitted: (certificates: SubmittedCertificate[]) => void;
}

const kindOf = (f: File): CertFile['kind'] => {
  const ext = f.name.toLowerCase().split('.').pop();
  if (f.type === 'application/pdf' || ext === 'pdf') return 'PDF';
  if (f.type === 'image/jpeg' || ext === 'jpg' || ext === 'jpeg') return 'JPG';
  if (f.type === 'image/png' || ext === 'png') return 'PNG';
  return 'FILE';
};

/** Profile › Credit Certificates › Upload & Autofill with AI: upload, analyze, review, submitted */
export const McAiUpload: React.FC<McAiUploadProps> = ({ onClose, onSubmitted }) => {
  const [step, setStep] = useState<Step>('upload');
  const [files, setFiles] = useState<CertFile[]>([]);
  const [overLimit, setOverLimit] = useState(false);
  // Keyed by file, so each certificate stands on its own
  const [certificates, setCertificates] = useState<Record<string, Certificate>>({});
  const [analysis, setAnalysis] = useState<Record<string, Analysis>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [sessionUi, setSessionUi] = useState<SessionUi>('UI-2');
  const [viewing, setViewing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<McConfirm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedCertificate[]>([]);

  const submitLock = useRef(false);
  const run = useRef<AbortController | null>(null);
  const urls = useRef<string[]>([]);
  const gone = useRef(false);
  useEffect(
    () => {
      gone.current = false;
      return () => {
        gone.current = true;
        run.current?.abort();
        urls.current.forEach((u) => URL.revokeObjectURL(u));
      };
    },
    []
  );

  const valid = files.filter((f) => f.status === 'uploaded');
  const reviewList = valid.map((f) => certificates[f.id]).filter((c): c is Certificate => Boolean(c));
  const allAnalyzed = valid.length > 0 && valid.every((f) => certificates[f.id]);

  /* ---------------------------------- Files ----------------------------------- */

  const upload = (f: CertFile, index: number) =>
    void uploadCertificate(f, index).then((error) => {
      if (gone.current) return;
      setFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, status: error ? 'error' : 'uploaded', error: error ?? undefined } : x)));
    });

  /** `replaceId`: the file with an error that these take the place of */
  const addFiles = (incoming: (File | Omit<CertFile, 'id' | 'status'>)[], replaceId?: string) => {
    if (!incoming.length) return;
    const room = MAX_FILES - files.filter((f) => f.status !== 'error').length;
    const added: CertFile[] = [];
    let taken = 0;
    let over = false;
    incoming.forEach((f) => {
      const base = f instanceof File ? { id: uid('file'), name: f.name, size: f.size, kind: kindOf(f) } : { ...f, id: uid('file') };
      const error: UploadError | null = base.kind === 'FILE' ? 'format' : base.size > MAX_BYTES ? 'size' : null;
      if (error) return void added.push({ ...base, status: 'error', error });
      if (taken >= room) {
        over = true;
        return;
      }
      taken++;
      const url = f instanceof File ? URL.createObjectURL(f) : undefined;
      if (url) urls.current.push(url);
      added.push({ ...base, url, status: 'uploading' });
    });
    setOverLimit(over);
    setFiles((prev) => [...prev.filter((f) => f.id !== replaceId), ...added]);
    added.filter((f) => f.status === 'uploading').forEach(upload);
  };
  const retryUpload = (id: string) => {
    const f = files.find((x) => x.id === id);
    if (!f) return;
    setFiles((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'uploading', error: undefined } : x)));
    upload(f, 0);
  };

  const drop = <T,>(rec: Record<string, T>, id: string) => {
    const { [id]: _gone, ...rest } = rec;
    return rest;
  };
  const removeNow = (id: string) => {
    const url = files.find((f) => f.id === id)?.url;
    if (url) URL.revokeObjectURL(url);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setCertificates((prev) => drop(prev, id));
    setAnalysis((prev) => drop(prev, id));
    setOverLimit(false);
    if (openId === id) setOpenId(null);
    if (step === 'review' && reviewList.every((c) => c.id === id)) setStep('upload');
  };
  const removeFile = (id: string) => {
    const c = certificates[id];
    if (!c || !certificateHasData(c)) return removeNow(id);
    setConfirm({
      title: 'Remove this certificate?',
      text: 'The uploaded file and its details will be removed. Your other certificates stay as they are.',
      confirmLabel: 'Remove',
      onConfirm: () => removeNow(id),
    });
  };

  /* --------------------------------- Analysis --------------------------------- */

  const setOne = (id: string, a: Analysis) => setAnalysis((prev) => ({ ...prev, [id]: a }));
  const put = (c: Certificate) => setCertificates((prev) => ({ ...prev, [c.id]: c }));

  /** All at the same time; a failure never affects the others */
  const analyze = (targets: CertFile[], signal: AbortSignal) =>
    targets.forEach(async (f) => {
      try {
        const result = await analyzeCertificate(f, {
          index: valid.findIndex((x) => x.id === f.id),
          onStage: (stage) => setOne(f.id, { state: 'analyzing', stage }),
          signal,
        });
        if (signal.aborted) return;
        if (result.ok) {
          put(result.certificate);
          setOne(f.id, { state: 'done', stage: 0 });
        } else {
          put(blankCertificate(f.id, { source: 'failed', failReason: result.reason }));
          setOne(f.id, { state: 'failed', stage: 0, reason: result.reason });
        }
      } catch {
        if (signal.aborted) return;
        put(blankCertificate(f.id, { source: 'failed', failReason: 'failed' }));
        setOne(f.id, { state: 'failed', stage: 0, reason: 'failed' });
      }
    });

  const toReview = () => {
    setStep('review');
    setOpenId((id) => id ?? valid.find((f) => !certificates[f.id]?.reviewed)?.id ?? null);
  };

  const start = () => {
    const targets = valid.filter((f) => !certificates[f.id]);
    if (!targets.length) return toReview();
    run.current?.abort();
    run.current = new AbortController();
    setAnalysis((prev) => ({ ...prev, ...Object.fromEntries(targets.map((f) => [f.id, { state: 'analyzing', stage: 0 } as Analysis])) }));
    setStep('analyze');
    analyze(targets, run.current.signal);
  };

  const retry = (id: string) => {
    const f = files.find((x) => x.id === id);
    if (!f) return;
    if (!run.current || run.current.signal.aborted) run.current = new AbortController();
    setOne(id, { state: 'analyzing', stage: 0 });
    analyze([f], run.current.signal);
  };

  const enterManually = (id: string) => {
    put(blankCertificate(id, { source: 'manual' }));
    setOne(id, { state: 'manual', stage: 0 });
  };

  /* ---------------------------------- Submit ---------------------------------- */

  const submit = async () => {
    // Guards against a second tap before the button disables
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setSubmitFailed(false);
    try {
      await submitCertificates(reviewList.map((c) => toPayload(c, files.find((f) => f.id === c.id)!)));
      const done = reviewList.map((c) => ({ id: c.id, title: c.title.trim(), delivery: c.delivery ?? '', provider: c.provider ?? '' }));
      setSubmitted(done);
      onSubmitted(done);
      setStep('success');
    } catch {
      setSubmitFailed(true);
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  const startOver = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
    setFiles([]);
    setCertificates({});
    setAnalysis({});
    setOpenId(null);
    setOverLimit(false);
    setSubmitFailed(false);
    setStep('upload');
  };

  /* -------------------------------- Navigation -------------------------------- */

  const back = () => {
    if (submitting) return;
    // Review and analysis go back to the uploads; nothing is lost
    if (step === 'review') return setStep('upload');
    if (step === 'analyze') {
      run.current?.abort();
      setAnalysis((prev) => Object.fromEntries(Object.entries(prev).filter(([, a]) => a.state !== 'analyzing')));
      return setStep('upload');
    }
    if (step === 'success' || !files.length) return onClose();
    setConfirm({
      title: 'Discard your changes?',
      text: "Your certificates and the details you've entered haven't been submitted.",
      confirmLabel: 'Discard',
      cancelLabel: 'Keep Editing',
      onConfirm: onClose,
    });
  };

  // Studio Quick Fill: three sample certificates, where there are none yet
  useQuickFill(
    step === 'upload'
      ? () => {
          if (!files.length) addFiles(SAMPLE_FILES);
        }
      : undefined
  );

  const viewed = files.find((f) => f.id === viewing);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col bg-white">
      {(step === 'upload' || step === 'analyze') && <McPageHeader title="Upload & Autofill with AI" onBack={back} />}

      {step === 'upload' && (
        <UploadStep
          files={files}
          allAnalyzed={allAnalyzed}
          overLimit={overLimit}
          onAddFiles={addFiles}
          onRemoveFile={removeFile}
          onRetryUpload={retryUpload}
          onPreview={setViewing}
          onAnalyze={start}
        />
      )}
      {step === 'analyze' && <AnalyzeStep files={valid} analysis={analysis} onRetry={retry} onManual={enterManually} onReview={toReview} />}
      {step === 'review' && (
        <ReviewStep
          certificates={reviewList}
          files={files}
          openId={openId}
          retrying={Object.keys(analysis).filter((id) => analysis[id].state === 'analyzing')}
          submitting={submitting}
          submitFailed={submitFailed}
          viewing={viewing !== null}
          sessionUi={sessionUi}
          onSessionUi={setSessionUi}
          onBack={back}
          onOpen={setOpenId}
          onChange={(c) => {
            put(c);
            setSubmitFailed(false);
          }}
          onView={setViewing}
          onRemove={removeNow}
          onRetry={retry}
          onManual={enterManually}
          onConfirm={setConfirm}
          onSubmit={submit}
        />
      )}
      {step === 'success' && <Success certificates={submitted} onView={onClose} onAddMore={startOver} />}

      {viewed && <CertificateViewer file={viewed} onClose={() => setViewing(null)} />}
      <McConfirmSheet confirm={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
};

const Success: React.FC<{ certificates: SubmittedCertificate[]; onView: () => void; onAddMore: () => void }> = ({ certificates, onView, onAddMore }) => (
  <>
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-6" style={{ paddingTop: 'calc(var(--safe-top) + 56px)' }}>
      <span className="w-16 h-16 mx-auto rounded-full bg-[#ECFDF3] text-[#067647] flex items-center justify-center">
        <Check className="w-8 h-8 stroke-[2.5]" aria-hidden="true" />
      </span>
      <div role="status">
        <h1 className="mt-5 text-center text-[22px] leading-7 font-semibold text-mc-ink">Certificates submitted successfully</h1>
        <p className="mt-2 mx-auto max-w-[330px] text-center text-sm leading-5 text-mc-text">
          Your certificate details have been submitted and will be processed according to the existing credit certificate workflow.
        </p>
      </div>
      <dl className="mt-6 rounded-xl border border-mc-line-strong divide-y divide-mc-line text-sm">
        <div className="px-4 py-3 flex justify-between gap-4">
          <dt className="text-mc-text">Certificates submitted</dt>
          <dd className="font-semibold text-mc-ink tabular-nums">{certificates.length}</dd>
        </div>
        <div className="px-4 py-3 flex justify-between gap-4">
          <dt className="text-mc-text">Submission status</dt>
          <dd className="font-semibold text-[#067647] flex items-center gap-1">
            <Check className="w-4 h-4" aria-hidden="true" />
            Successful
          </dd>
        </div>
      </dl>
      <ul className="mt-3 rounded-xl border border-mc-line-strong divide-y divide-mc-line">
        {certificates.map((c) => (
          <li key={c.id} className="px-4 py-3">
            <p className="text-sm leading-5 font-medium text-mc-ink-2">{c.title}</p>
            <p className="text-xs leading-[18px] text-mc-muted">
              {c.delivery} · {c.provider}
            </p>
          </li>
        ))}
      </ul>
    </div>
    <footer className="shrink-0 px-4 pt-3 bg-white border-t border-mc-line" style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}>
      <McButton onClick={onView}>View Credit Certificates</McButton>
      <button type="button" onClick={onAddMore} className="mt-1 w-full h-12 text-[15px] font-semibold text-mc-primary cursor-pointer">
        Add More Certificates
      </button>
    </footer>
  </>
);
