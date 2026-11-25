import React, { useEffect, useRef, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { McPageHeader } from '../common/McPage';
import { McButton } from '../common/McUi';
import { Allocation, allocationHasData, formatDate, QUALIFICATIONS, Session, sessionErrors, sessionKey, withQualifications } from './certModel';
import { CourseHeader } from './CertificateTabs';
import { scrollToError, useKeyboardRoom } from './formScroll';
import { McConfirm, McDateSheet, McMultiSheet, McPickField, McSheetHandle, McSheetHeader, McTextField, removeQualifications, useFloating, useStack } from './McFormControls';
import { QualificationCredits } from './QualificationCredits';

/** Demo: compare a new screen (UI-1) with a bottom sheet (UI-2) */
export type SessionUi = 'UI-1' | 'UI-2';

interface SessionPageProps {
  ui: SessionUi;
  session: Session;
  number: number;
  total: number;
  /** The course and certificate it belongs to */
  title: string;
  meta?: string;
  /** Just added: its name gets the focus */
  isNew: boolean;
  /** Opened because this field is missing */
  errorKey: string | null;
  errors: Record<string, string>;
  /** Viewing the certificate over this page */
  covered: boolean;
  onChange: (s: Session) => void;
  onRemove: () => void;
  onView: () => void;
  onConfirm: (c: McConfirm) => void;
  /** Save Session with something missing: show it */
  onInvalid: (keys: string[]) => void;
  onClose: () => void;
}

/** One course session, over its certificate: a page or a bottom sheet with the same form. Entries are kept as they're made, so Back never loses anything. */
export const SessionPage: React.FC<SessionPageProps> = ({
  ui,
  session: s,
  number,
  total,
  title,
  meta,
  isNew,
  errorKey,
  errors,
  covered,
  onChange,
  onRemove,
  onView,
  onConfirm,
  onInvalid,
  onClose,
}) => {
  const root = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sheet, setSheet] = useState<'date' | 'quals' | null>(null);
  const [leaving, setLeaving] = useState(false);
  const floating = useFloating();
  const stack = useStack();
  useKeyboardRoom(scrollRef);

  useEffect(() => {
    if (!isNew) root.current?.focus({ preventScroll: true });
    if (errorKey) scrollToError(scrollRef, errorKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(onClose, ui === 'UI-2' ? 260 : 200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  // The certificate opens on the screen behind the sheet; the sheet comes back as it was
  useEffect(() => {
    const layer = document.getElementById('mobile-sheet-portal');
    if (ui !== 'UI-2' || !covered || !layer) return;
    layer.style.visibility = 'hidden';
    return () => {
      layer.style.visibility = '';
    };
  }, [ui, covered]);

  const setAllocations = (allocations: Allocation[]) => onChange({ ...s, allocations });
  const chooseQualifications = (selected: string[]) => {
    setSheet(null);
    const dropped = s.allocations.filter((a) => !selected.includes(a.qualification) && allocationHasData(a));
    const apply = () => setAllocations(withQualifications(s.allocations, selected));
    if (dropped.length) onConfirm(removeQualifications(dropped, apply));
    else apply();
  };
  const save = () => {
    const found = sessionErrors(s);
    if (!found.length) return setLeaving(true);
    onInvalid(found.map((e) => e.key));
    scrollToError(scrollRef, found[0].key);
  };

  const heading = `Session ${number} of ${total}`;
  const form = (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-6">
      <div className={`${floating ? 'pt-6' : 'pt-4'} ${stack}`}>
        <McTextField
          label="Session Name"
          required
          value={s.name}
          placeholder="Enter session name"
          autoFocus={isNew}
          error={errors[sessionKey(s.id, 'name')]}
          errorKey={sessionKey(s.id, 'name')}
          onChange={(name) => onChange({ ...s, name })}
        />
        <McPickField
          label="Date of Completion"
          required
          icon="calendar"
          value={formatDate(s.date)}
          placeholder="Select date"
          error={errors[sessionKey(s.id, 'date')]}
          errorKey={sessionKey(s.id, 'date')}
          onOpen={() => setSheet('date')}
        />
        <McPickField
          label="Qualifications"
          required
          value={s.allocations.length ? `${s.allocations.length} selected` : ''}
          placeholder="Select qualifications"
          error={errors[sessionKey(s.id, 'quals')]}
          errorKey={sessionKey(s.id, 'quals')}
          onOpen={() => setSheet('quals')}
        />
        <QualificationCredits
          allocations={s.allocations}
          multipleFields
          errors={errors}
          onChange={(a) => setAllocations(s.allocations.map((x) => (x.id === a.id ? a : x)))}
          onRemove={(a) => {
            const apply = () => setAllocations(s.allocations.filter((x) => x.id !== a.id));
            if (allocationHasData(a)) onConfirm(removeQualifications([a], apply));
            else apply();
          }}
        />
      </div>
      {total > 1 && (
        <button type="button" onClick={onRemove} className="mt-3 w-full min-h-12 text-sm font-semibold text-mc-error flex items-center justify-center gap-1.5 cursor-pointer">
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          Remove Session
        </button>
      )}
    </div>
  );
  const pickers = (
    <>
      <McDateSheet
        isOpen={sheet === 'date'}
        value={s.date}
        onClose={() => setSheet(null)}
        onApply={(date) => {
          onChange({ ...s, date });
          setSheet(null);
        }}
      />
      <McMultiSheet
        isOpen={sheet === 'quals'}
        title="Qualifications"
        options={QUALIFICATIONS}
        selected={s.allocations.map((a) => a.qualification)}
        onClose={() => setSheet(null)}
        onDone={chooseQualifications}
      />
    </>
  );

  if (ui === 'UI-2')
    return (
      <>
        <BottomSheet isOpen={!leaving} onClose={() => setLeaving(true)} maxHeight="max-h-[92%]" className="font-mc text-mc-ink">
          <McSheetHandle />
          <McSheetHeader
            title={heading}
            onClose={() => setLeaving(true)}
            action={
              <button type="button" onClick={onView} className="w-12 h-12 -mr-2 flex items-center justify-center text-mc-primary cursor-pointer" aria-label="View Certificate">
                <Eye className="w-[22px] h-[22px] stroke-[1.7]" />
              </button>
            }
          />
          <p className="shrink-0 px-4 pb-3 border-b border-mc-line text-[13px] leading-[18px] text-mc-text line-clamp-2">{title}</p>
          {form}
          <footer className="shrink-0 px-4 pt-3 pb-6 bg-white border-t border-mc-line">
            <McButton onClick={save}>Save Session</McButton>
          </footer>
        </BottomSheet>
        {pickers}
      </>
    );

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      tabIndex={-1}
      inert={leaving || covered}
      className={`absolute inset-0 z-10 flex flex-col bg-white outline-hidden ${leaving ? 'mc-page-out' : 'mc-page-in'}`}
    >
      <McPageHeader title={heading} onBack={() => setLeaving(true)} />
      <CourseHeader title={title} meta={meta} onView={onView} />
      {form}
      <footer className="shrink-0 px-4 pt-3 bg-white border-t border-mc-line" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        <McButton onClick={save}>Save Session</McButton>
      </footer>
      {pickers}
    </div>
  );
};
