import React, { useState } from 'react';
import { CircleAlert, CircleX, Eye, Trash2, TriangleAlert } from 'lucide-react';
import {
  AiField,
  Allocation,
  allocationHasData,
  asksSessions,
  Certificate,
  CertFile,
  DELIVERY_METHODS,
  formatDate,
  formatSize,
  isSessionMode,
  learningMethodsFor,
  losesSessions,
  plural,
  PROVIDERS,
  QUALIFICATIONS,
  setDelivery,
  setLearning,
  setMultiple,
  stillUnidentified,
  withQualifications,
} from './certModel';
import { FAIL_TEXT } from './AnalyzeStep';
import { FileBadge } from './CertificateViewer';
import { CourseSessions } from './CourseSessions';
import { McConfirm, McDateSheet, McErrorText, McMultiSheet, McPickField, McSingleSheet, McTextField, McYesNo, removeQualifications, useFloating, useStack } from './McFormControls';
import { QualificationCredits } from './QualificationCredits';

const RemoveCertificate: React.FC<{ onRemove: () => void }> = ({ onRemove }) => (
  <button type="button" onClick={onRemove} className="w-full min-h-12 text-sm font-semibold text-mc-error flex items-center justify-center gap-1.5 cursor-pointer">
    <Trash2 className="w-4 h-4" aria-hidden="true" />
    Remove Certificate
  </button>
);

/** Analysis failed: Retry is the button at the bottom of the screen */
export const FailedCertificate: React.FC<{ certificate: Certificate; retrying: boolean; onManual: () => void; onRemove: () => void }> = ({
  certificate: c,
  retrying,
  onManual,
  onRemove,
}) => (
  <div className="space-y-3">
    <p className="p-3 rounded-xl border border-mc-line-strong flex items-start gap-2 text-sm leading-5 text-mc-text">
      <CircleX className="w-5 h-5 shrink-0 text-mc-error" aria-hidden="true" />
      {FAIL_TEXT[c.failReason ?? 'failed']}
    </p>
    <button
      type="button"
      disabled={retrying}
      onClick={onManual}
      className="w-full h-12 rounded-xl border border-mc-primary text-[15px] font-semibold text-mc-primary active:bg-mc-primary-tint disabled:opacity-60 cursor-pointer"
    >
      Enter Details Manually
    </button>
    <RemoveCertificate onRemove={onRemove} />
  </div>
);

interface CertificateFormProps {
  certificate: Certificate;
  file: CertFile;
  /** Field key → message, once Confirm & Continue has been tapped */
  errors: Record<string, string>;
  /** Sessions with something missing at that tap */
  errorSessions: string[];
  /** The new certificate and which AI-filled fields the learner has now edited */
  onChange: (next: Certificate, edited?: AiField) => void;
  onOpenSession: (id: string) => void;
  onAddSession: () => void;
  onView: () => void;
  onRemove: () => void;
  onConfirm: (c: McConfirm) => void;
}

export const CertificateForm: React.FC<CertificateFormProps> = ({
  certificate: c,
  file,
  errors,
  errorSessions,
  onChange,
  onOpenSession,
  onAddSession,
  onView,
  onRemove,
  onConfirm,
}) => {
  const [sheet, setSheet] = useState<'date' | 'delivery' | 'learning' | 'provider' | 'quals' | null>(null);
  const close = () => setSheet(null);
  const floating = useFloating();
  const stack = useStack();
  // Only on a value that's really there
  const has: Record<AiField, boolean> = {
    title: Boolean(c.title),
    date: Boolean(c.date),
    delivery: Boolean(c.delivery),
    learning: Boolean(c.learning),
    multiple: c.multiple !== null,
    provider: Boolean(c.provider),
    quals: c.allocations.length > 0,
  };
  const ai = (f: AiField) => has[f] && c.aiFilled.includes(f);
  const unidentified = stillUnidentified(c);
  const learning = learningMethodsFor(c.delivery);
  const sessions = isSessionMode(c);
  const setAllocations = (allocations: Allocation[]) => onChange({ ...c, allocations }, 'quals');

  /** Method / learning / sessions changes that would remove entered session details ask first; Cancel keeps everything */
  const restructure = (next: Certificate, edited: AiField) => {
    if (!losesSessions(c, next)) return onChange(next, edited);
    onConfirm({
      title: 'Change the certificate structure?',
      text: `This certificate will no longer have course sessions. The ${plural(c.sessions.length, 'session')} you've entered, with their dates, qualifications and credits, will be removed.`,
      confirmLabel: 'Change',
      cancelLabel: 'Keep Sessions',
      onConfirm: () => onChange(next, edited),
    });
  };

  const chooseQualifications = (selected: string[]) => {
    close();
    const dropped = c.allocations.filter((a) => !selected.includes(a.qualification) && allocationHasData(a));
    const apply = () => setAllocations(withQualifications(c.allocations, selected));
    if (dropped.length) onConfirm(removeQualifications(dropped, apply));
    else apply();
  };

  return (
    <div className={`space-y-6 ${floating ? 'pt-2' : ''}`}>
      {c.nameMismatch && (
        <p className="p-3 rounded-xl bg-[#FFFAEB] border border-[#FEDF89] flex items-start gap-2 text-[13px] leading-[18px] text-[#93370D]">
          <TriangleAlert className="w-4 h-4 mt-px shrink-0" aria-hidden="true" />
          The certificate holder's name doesn't match your name.
        </p>
      )}
      {unidentified.length > 0 && (
        <p className="p-3 rounded-xl bg-white border border-mc-line-strong flex items-start gap-2 text-[13px] leading-[18px] text-mc-text">
          <CircleAlert className="w-4 h-4 mt-px shrink-0 text-mc-muted" aria-hidden="true" />
          AI couldn't identify: {unidentified.join(', ')}. Please enter these details.
        </p>
      )}

      <div className={stack}>
        <McTextField
          label="Course Title"
          required
          ai={ai('title')}
          value={c.title}
          placeholder="Enter course title"
          error={errors.title}
          errorKey="title"
          onChange={(title) => onChange({ ...c, title }, 'title')}
        />
        {!sessions && (
          <McPickField
            label="Date of Completion"
            required
            ai={ai('date')}
            icon="calendar"
            value={formatDate(c.date)}
            placeholder="Select date"
            error={errors.date}
            errorKey="date"
            onOpen={() => setSheet('date')}
          />
        )}
        <McPickField
          label="Method of Delivery"
          required
          ai={ai('delivery')}
          value={c.delivery ?? ''}
          placeholder="Select method of delivery"
          error={errors.delivery}
          errorKey="delivery"
          onOpen={() => setSheet('delivery')}
        />
        {learning.length > 0 && (
          <McPickField
            label="Learning Method"
            required
            ai={ai('learning')}
            value={c.learning ?? ''}
            placeholder="Select learning method"
            error={errors.learning}
            errorKey="learning"
            onOpen={() => setSheet('learning')}
          />
        )}
        {asksSessions(c) && (
          <McYesNo
            label="Does this certificate include multiple sessions?"
            required
            ai={ai('multiple')}
            value={c.multiple}
            error={errors.multiple}
            errorKey="multiple"
            onChange={(v) => restructure(setMultiple(c, v), 'multiple')}
          />
        )}
        <McPickField
          label="Continuing Education Provider"
          required
          ai={ai('provider')}
          value={c.provider ?? ''}
          placeholder="Select provider"
          error={errors.provider}
          errorKey="provider"
          onOpen={() => setSheet('provider')}
        />
        {!sessions && (
          <McPickField
            label="License Selection"
            required
            ai={ai('quals')}
            value={c.allocations.length ? `${c.allocations.length} selected` : ''}
            placeholder="Select qualification(s)"
            error={errors.quals}
            errorKey="quals"
            onOpen={() => setSheet('quals')}
          />
        )}
      </div>

      {sessions ? (
        <CourseSessions sessions={c.sessions} errorIds={errorSessions} onOpen={onOpenSession} onAdd={onAddSession} />
      ) : (
        <section aria-label="Qualification & Credits">
          <h3 className="mb-2 text-[15px] leading-5 font-semibold text-mc-ink">Qualification &amp; Credits</h3>
          <QualificationCredits
            allocations={c.allocations}
            multipleFields={false}
            errors={errors}
            onChange={(a) => setAllocations(c.allocations.map((x) => (x.id === a.id ? a : x)))}
            onRemove={(a) => {
              const apply = () => setAllocations(c.allocations.filter((x) => x.id !== a.id));
              if (allocationHasData(a)) onConfirm(removeQualifications([a], apply));
              else apply();
            }}
          />
        </section>
      )}

      <section data-error-key="file" aria-label="Uploaded Certificate">
        <h3 className="mb-2 text-[15px] leading-5 font-semibold text-mc-ink">Uploaded Certificate</h3>
        <button
          type="button"
          onClick={onView}
          aria-label={`View Certificate: ${file.name}`}
          className="w-full p-3 rounded-xl border border-mc-line-strong bg-white flex items-center gap-3 text-left active:bg-mc-page cursor-pointer"
        >
          <FileBadge file={file} />
          <span className="flex-1 min-w-0">
            <span className="block text-sm leading-5 font-medium text-mc-ink-2 [overflow-wrap:anywhere]">{file.name}</span>
            <span className="block text-xs leading-4 text-mc-muted">
              {file.kind} · {formatSize(file.size)}
            </span>
          </span>
          <Eye className="w-5 h-5 mx-1 shrink-0 stroke-[1.7] text-mc-text" aria-hidden="true" />
        </button>
        <McErrorText message={errors.file} />
      </section>

      <RemoveCertificate onRemove={onRemove} />

      <McDateSheet
        isOpen={sheet === 'date'}
        value={c.date}
        onClose={close}
        onApply={(date) => {
          close();
          onChange({ ...c, date }, 'date');
        }}
      />
      <McSingleSheet
        isOpen={sheet === 'delivery'}
        title="Method of Delivery"
        options={DELIVERY_METHODS}
        value={c.delivery}
        onClose={close}
        onSelect={(v) => {
          close();
          if (v !== c.delivery) restructure(setDelivery(c, v), 'delivery');
        }}
      />
      <McSingleSheet
        isOpen={sheet === 'learning'}
        title="Learning Method"
        options={learning}
        value={c.learning}
        onClose={close}
        onSelect={(v) => {
          close();
          if (v !== c.learning) restructure(setLearning(c, v), 'learning');
        }}
      />
      <McSingleSheet
        isOpen={sheet === 'provider'}
        title="Continuing Education Provider"
        options={PROVIDERS}
        value={c.provider}
        onClose={close}
        onSelect={(v) => {
          close();
          if (v !== c.provider) onChange({ ...c, provider: v }, 'provider');
        }}
      />
      <McMultiSheet isOpen={sheet === 'quals'} title="License Selection" options={QUALIFICATIONS} selected={c.allocations.map((a) => a.qualification)} onClose={close} onDone={chooseQualifications} />
    </div>
  );
};
