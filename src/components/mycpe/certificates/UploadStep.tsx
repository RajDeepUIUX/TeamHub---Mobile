import React, { useRef, useState } from 'react';
import { Camera, ChevronRight, CircleAlert, CircleCheck, CircleHelp, Eye, FolderOpen, Images, Loader2, Plus, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { McButton } from '../common/McUi';
import { ACCEPT, CertFile, formatSize, MAX_FILES } from './certModel';
import { FileBadge } from './CertificateViewer';
import { McSheetHandle, McSheetHeader } from './McFormControls';

const LIMIT_TEXT = `You can upload a maximum of ${MAX_FILES} certificates at a time.`;
const STEPS = [
  ['Upload your certificates', `Add up to ${MAX_FILES} PDF, JPG or PNG files.`],
  ['AI reads the details', 'It finds the course, date, provider, Credits and subject area.'],
  ['Review and submit', 'Choose the qualifications each certificate counts toward.'],
];

interface UploadStepProps {
  files: CertFile[];
  /** Every uploaded certificate has been analyzed already (came back from review) */
  allAnalyzed: boolean;
  overLimit: boolean;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onPreview: (id: string) => void;
  onAnalyze: () => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({ files, allAnalyzed, overLimit, onAddFiles, onRemoveFile, onPreview, onAnalyze }) => {
  const [sheet, setSheet] = useState<'source' | 'how' | null>(null);
  const inputs = { files: useRef<HTMLInputElement>(null), photos: useRef<HTMLInputElement>(null), camera: useRef<HTMLInputElement>(null) };

  const added = files.filter((f) => f.status !== 'error').length;
  const full = added >= MAX_FILES;
  const uploading = files.some((f) => f.status === 'uploading');
  const ready = files.some((f) => f.status === 'uploaded') && !uploading;

  const onPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddFiles([...(e.target.files ?? [])]);
    e.target.value = '';
  };
  // The system picker opens straight from the tap, then the sheet closes
  const pick = (from: keyof typeof inputs) => {
    inputs[from].current?.click();
    setSheet(null);
  };

  return (
    <>
      <input ref={inputs.files} type="file" accept={ACCEPT} multiple className="hidden" onChange={onPicked} aria-hidden="true" tabIndex={-1} />
      <input ref={inputs.photos} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={onPicked} aria-hidden="true" tabIndex={-1} />
      <input ref={inputs.camera} type="file" accept="image/jpeg,image/png" capture="environment" className="hidden" onChange={onPicked} aria-hidden="true" tabIndex={-1} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-3 pb-6 space-y-6">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setSheet('how')}
          className="w-full min-h-12 px-3 rounded-xl bg-mc-primary-tint flex items-center gap-2.5 text-left text-[15px] font-semibold text-mc-ink-2 active:bg-mc-primary-soft cursor-pointer"
        >
          <CircleHelp className="w-5 h-5 shrink-0 stroke-[1.8] text-mc-primary" aria-hidden="true" />
          <span className="flex-1">How to use</span>
          <ChevronRight className="w-5 h-5 shrink-0 text-mc-primary" aria-hidden="true" />
        </button>

        <section>
          <h2 className="text-base leading-6 font-semibold text-mc-ink">Upload Certificates</h2>
          {/* Always here; off once the limit is reached */}
          <div className="mt-2 px-4 py-6 rounded-xl border border-dashed border-mc-line-strong bg-[#F6F7F9] flex flex-col items-center text-center">
            <span className={`w-12 h-12 rounded-full bg-white border border-mc-line flex items-center justify-center ${full ? 'text-[#98A2B3]' : 'text-mc-primary'}`}>
              <UploadCloud className="w-6 h-6 stroke-[1.6]" aria-hidden="true" />
            </span>
            <p className={`mt-3 text-[15px] font-semibold ${full ? 'text-mc-muted' : 'text-mc-ink-2'}`}>Upload up to {MAX_FILES} certificates</p>
            <p className="mt-1 text-[13px] leading-5 text-mc-muted">
              Supported formats: PDF, JPG, PNG
              <br />
              Maximum file size: 20 MB per certificate
            </p>
            <button
              type="button"
              disabled={full}
              onClick={() => setSheet('source')}
              className="mt-4 h-12 px-5 rounded-xl border border-mc-primary bg-white text-[15px] font-semibold text-mc-primary flex items-center gap-2 active:bg-mc-primary-tint cursor-pointer disabled:border-mc-line-strong disabled:bg-mc-line disabled:text-[#98A2B3] disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Add Certificates
            </button>
          </div>
          {(full || overLimit) && (
            <p role="status" className={`mt-2 flex items-start gap-1 text-[13px] leading-5 ${overLimit ? 'font-medium text-mc-error' : 'text-mc-muted'}`}>
              <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {LIMIT_TEXT}
            </p>
          )}
          {files.length > 0 && (
            <>
              <p className="mt-5 text-[13px] leading-5 font-semibold text-mc-ink-2" aria-live="polite">
                {added} of {MAX_FILES} certificates added
              </p>
              <ul className="mt-2 space-y-2">
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
        <McSheetHandle />
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

      <BottomSheet isOpen={sheet === 'how'} onClose={() => setSheet(null)} maxHeight="max-h-[82%]" className="font-mc text-mc-ink">
        <McSheetHandle />
        <McSheetHeader title="How to use" onClose={() => setSheet(null)} />
        <ol className="min-h-0 overflow-y-auto no-scrollbar px-4 pt-2 pb-10">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="relative flex gap-3.5 pb-7 last:pb-0">
              {/* Line to the next step */}
              {i < STEPS.length - 1 && <span className="absolute left-[17px] top-9 bottom-0 w-0.5 bg-mc-primary-soft" aria-hidden="true" />}
              <span className="relative w-9 h-9 rounded-full bg-mc-primary text-[15px] font-semibold text-white flex items-center justify-center shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0 pt-1.5">
                <p className="text-base leading-6 font-semibold text-mc-ink">{title}</p>
                <p className="mt-0.5 text-sm leading-5 text-mc-text">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </BottomSheet>
    </>
  );
};
