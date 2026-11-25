import React, { useRef, useState } from 'react';
import { Camera, CircleAlert, CircleCheck, Eye, FolderOpen, Images, Loader2, Plus, Sparkles, Trash2, UploadCloud, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { McButton } from '../common/McUi';
import { ACCEPT, CertFile, formatSize, MAX_FILES, plural, QUALIFICATIONS } from './certModel';
import { FileBadge } from './CertificateViewer';
import { McMultiSheet, McPickField, useBox } from './McFormControls';

const LIMIT_TEXT = `You can upload a maximum of ${MAX_FILES} certificates at a time.`;
const CHIPS_SHOWN = 3;

interface UploadStepProps {
  files: CertFile[];
  qualifications: string[];
  /** Every uploaded certificate has been analyzed already (came back from review) */
  allAnalyzed: boolean;
  overLimit: boolean;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onPreview: (id: string) => void;
  onQualifications: (q: string[]) => void;
  onAnalyze: () => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({ files, qualifications, allAnalyzed, overLimit, onAddFiles, onRemoveFile, onPreview, onQualifications, onAnalyze }) => {
  const [sheet, setSheet] = useState<'source' | 'qualifications' | null>(null);
  const [allChips, setAllChips] = useState(false);
  const inputs = { files: useRef<HTMLInputElement>(null), photos: useRef<HTMLInputElement>(null), camera: useRef<HTMLInputElement>(null) };
  const box = useBox();

  const added = files.filter((f) => f.status !== 'error').length;
  const full = added >= MAX_FILES;
  const uploading = files.some((f) => f.status === 'uploading');
  const ready = files.some((f) => f.status === 'uploaded') && qualifications.length > 0 && !uploading;

  const onPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddFiles([...(e.target.files ?? [])]);
    e.target.value = '';
  };
  // The system picker opens straight from the tap, then the sheet closes
  const pick = (from: keyof typeof inputs) => {
    inputs[from].current?.click();
    setSheet(null);
  };

  const chips = allChips ? qualifications : qualifications.slice(0, CHIPS_SHOWN);
  const hidden = qualifications.length - chips.length;

  return (
    <>
      <input ref={inputs.files} type="file" accept={ACCEPT} multiple className="hidden" onChange={onPicked} aria-hidden="true" tabIndex={-1} />
      <input ref={inputs.photos} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={onPicked} aria-hidden="true" tabIndex={-1} />
      <input ref={inputs.camera} type="file" accept="image/jpeg,image/png" capture="environment" className="hidden" onChange={onPicked} aria-hidden="true" tabIndex={-1} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-3 pb-6 space-y-6">
        <p className="p-3 rounded-xl bg-mc-primary-tint flex gap-2.5 text-[13px] leading-5 text-mc-text">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-mc-primary" aria-hidden="true" />
          Upload your certificates and let AI automatically identify, classify, and organize your course details. Review the information and confirm your qualifications
          before submitting.
        </p>

        <section>
          <McPickField
            label="Select Qualifications"
            required
            value={qualifications.length ? `${plural(qualifications.length, 'qualification')} selected` : ''}
            placeholder="Select qualification(s)"
            onOpen={() => setSheet('qualifications')}
          />
          {qualifications.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2" aria-label="Selected qualifications">
              {chips.map((q) => (
                <li key={q} className="h-9 pl-3 rounded-full bg-mc-primary-tint border border-mc-primary-soft flex items-center text-[13px] font-medium text-mc-indigo">
                  {q}
                  <button
                    type="button"
                    onClick={() => onQualifications(qualifications.filter((x) => x !== q))}
                    className="relative w-9 h-9 flex items-center justify-center cursor-pointer before:absolute before:-inset-1"
                    aria-label={`Remove ${q}`}
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.4]" />
                  </button>
                </li>
              ))}
              {(hidden > 0 || allChips) && qualifications.length > CHIPS_SHOWN && (
                <li>
                  <button type="button" onClick={() => setAllChips((a) => !a)} className="relative h-9 px-3 text-[13px] font-semibold text-mc-primary cursor-pointer before:absolute before:-inset-1">
                    {allChips ? 'Show less' : `+${hidden} more`}
                  </button>
                </li>
              )}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-base leading-6 font-semibold text-mc-ink">Upload Certificates</h2>
          {files.length === 0 ? (
            <div className="mt-2 px-4 py-6 rounded-xl border border-dashed border-mc-line-strong bg-[#F6F7F9] flex flex-col items-center text-center">
              <span className="w-12 h-12 rounded-full bg-white border border-mc-line flex items-center justify-center text-mc-primary">
                <UploadCloud className="w-6 h-6 stroke-[1.6]" aria-hidden="true" />
              </span>
              <p className="mt-3 text-[15px] font-semibold text-mc-ink-2">Upload up to {MAX_FILES} certificates</p>
              <p className="mt-1 text-[13px] leading-5 text-mc-muted">
                Supported formats: PDF, JPG, PNG
                <br />
                Maximum file size: 20 MB per certificate
              </p>
              <button
                type="button"
                onClick={() => setSheet('source')}
                className="mt-4 h-12 px-5 rounded-xl border border-mc-primary bg-white text-[15px] font-semibold text-mc-primary flex items-center gap-2 active:bg-mc-primary-tint cursor-pointer"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                Add Certificates
              </button>
            </div>
          ) : (
            <>
              <p className="mt-0.5 text-[13px] leading-5 text-mc-muted" aria-live="polite">
                {added} of {MAX_FILES} certificates added
              </p>
              <ul className="mt-3 space-y-2">
                {files.map((f) => (
                  <li key={f.id} className={`rounded-xl border bg-white ${f.status === 'error' ? 'border-mc-error' : 'border-mc-line-strong'}`}>
                    <div className="pl-3 pr-1 py-2 flex items-center gap-3">
                      <FileBadge file={f} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-5 font-medium text-mc-ink-2 [overflow-wrap:anywhere] line-clamp-3">{f.name}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs leading-4 text-mc-muted">
                          {formatSize(f.size)}
                          {f.status === 'uploading' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <Loader2 className="w-3 h-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                              Uploading
                            </>
                          )}
                          {f.status === 'uploaded' && (
                            <span className="flex items-center gap-1 font-medium text-[#067647]">
                              <span aria-hidden="true" className="text-mc-muted">
                                ·
                              </span>
                              <CircleCheck className="w-3.5 h-3.5" aria-hidden="true" />
                              Uploaded
                            </span>
                          )}
                        </p>
                      </div>
                      {f.status === 'uploaded' && (
                        <button type="button" onClick={() => onPreview(f.id)} className="w-11 h-12 flex items-center justify-center text-mc-text cursor-pointer" aria-label={`Preview ${f.name}`}>
                          <Eye className="w-5 h-5 stroke-[1.7]" />
                        </button>
                      )}
                      <button type="button" onClick={() => onRemoveFile(f.id)} className="w-11 h-12 flex items-center justify-center text-mc-error cursor-pointer" aria-label={`Remove ${f.name}`}>
                        <Trash2 className="w-5 h-5 stroke-[1.7]" />
                      </button>
                    </div>
                    {f.error && (
                      <p role="alert" className="px-3 pb-2.5 flex items-start gap-1 text-xs leading-4 font-medium text-mc-error">
                        <CircleAlert className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden="true" />
                        {f.error}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={full}
                onClick={() => setSheet('source')}
                className={`${box()} mt-3 border-dashed font-semibold !text-[15px] !text-mc-primary flex items-center justify-center gap-2 active:bg-mc-primary-tint cursor-pointer disabled:cursor-not-allowed disabled:!text-[#98A2B3] disabled:bg-[#F6F7F9]`}
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                Add More Certificates
              </button>
              {(full || overLimit) && (
                <p role="status" className={`mt-2 flex items-start gap-1 text-[13px] leading-5 ${overLimit ? 'font-medium text-mc-error' : 'text-mc-muted'}`}>
                  <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  {LIMIT_TEXT}
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <footer className="shrink-0 px-4 pt-3 bg-white border-t border-mc-line" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        <McButton disabled={!ready} onClick={onAnalyze}>
          {allAnalyzed ? (
            'Continue to Review'
          ) : (
            <>
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              Analyze with AI
            </>
          )}
        </McButton>
      </footer>

      <BottomSheet isOpen={sheet === 'source'} onClose={() => setSheet(null)} maxHeight="max-h-[70%]" className="font-mc text-mc-ink">
        <div className="pt-2.5 flex justify-center shrink-0">
          <span className="w-14 h-1 rounded-full bg-mc-line-strong" />
        </div>
        <h2 className="px-4 pt-3 text-lg leading-7 font-semibold">Add Certificates</h2>
        <p className="px-4 text-[13px] leading-5 text-mc-muted">PDF, JPG or PNG · Max 20 MB</p>
        <ul className="px-4 pt-3 pb-8 space-y-2">
          {(
            [
              ['files', 'Browse Files', FolderOpen],
              ['photos', 'Choose from Photos', Images],
              ['camera', 'Take a Photo', Camera],
            ] as const
          ).map(([id, label, Icon]) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => pick(id)}
                className="w-full min-h-14 px-3 rounded-xl border border-mc-line bg-white flex items-center gap-3 text-left text-base font-medium text-mc-ink-2 active:bg-mc-page cursor-pointer"
              >
                <span className="w-10 h-10 rounded-lg bg-mc-primary-tint text-mc-primary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 stroke-[1.7]" aria-hidden="true" />
                </span>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
      <McMultiSheet
        isOpen={sheet === 'qualifications'}
        title="Select Qualifications"
        options={QUALIFICATIONS}
        selected={qualifications}
        onClose={() => setSheet(null)}
        onDone={(q) => {
          onQualifications(q);
          setSheet(null);
        }}
      />
    </>
  );
};
