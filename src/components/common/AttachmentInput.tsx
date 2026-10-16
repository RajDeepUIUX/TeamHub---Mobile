import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Camera, ChevronRight, FileText, Image as ImageIcon, Video, X } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

/** What a parent can do with the picker: `click()` opens the source sheet (drop-in for an <input type="file"> ref) */
export interface AttachmentInputHandle {
  click: () => void;
}

interface AttachmentInputProps {
  /** Same as <input accept>; also decides whether Gallery / Camera are offered */
  accept?: string;
  multiple?: boolean;
  /** Receives the real input's change event, so existing handlers work unchanged */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Sheet title, e.g. "Upload Receipt" */
  title?: string;
  /** Front camera for selfies / profile photos */
  cameraFacing?: 'environment' | 'user';
}

type Source = 'gallery' | 'camera' | 'files';

const LABELS: [RegExp, string][] = [
  [/pdf/, 'PDF'],
  [/jpe?g/, 'JPG'],
  [/png/, 'PNG'],
  [/webp/, 'WEBP'],
  [/docx?|msword|wordprocessing/, 'DOC'],
  [/pptx?|powerpoint|presentation/, 'PPT'],
  [/xlsx?|excel|spreadsheet/, 'XLS'],
  [/mp4/, 'MP4'],
  [/mov|quicktime/, 'MOV'],
];

/** ".pdf,image/png" → ["PDF", "PNG"] for the "Supported" line */
const formatsOf = (accept?: string) =>
  accept ? Array.from(new Set(accept.toLowerCase().split(',').flatMap((t) => LABELS.filter(([re]) => re.test(t)).map(([, l]) => l)))) : [];

/**
 * Every attachment in the app goes through this: tapping upload opens a sheet to choose
 * Gallery, Take Photo (or Record Video) or Files, each backed by its own hidden input.
 */
export const AttachmentInput = forwardRef<AttachmentInputHandle, AttachmentInputProps>(
  ({ accept, multiple, onChange, title = 'Add Attachment', cameraFacing = 'environment' }, ref) => {
    const [open, setOpen] = useState(false);
    const inputs = { gallery: useRef<HTMLInputElement>(null), camera: useRef<HTMLInputElement>(null), files: useRef<HTMLInputElement>(null) };

    useImperativeHandle(ref, () => ({ click: () => setOpen(true) }), []);

    const lower = (accept ?? '').toLowerCase();
    const isVideo = lower.includes('video');
    const takesImages = !accept || /image|jpe?g|png|webp|heic/.test(lower);
    const mediaAccept = isVideo ? 'video/*' : 'image/*';
    const formats = formatsOf(accept);

    const options: { id: Source; title: string; text: string; icon: React.ReactNode; tone: string }[] = [
      ...(takesImages || isVideo
        ? [
            {
              id: 'gallery' as const,
              title: 'Choose from Gallery',
              text: isVideo ? 'Pick a video from your library' : multiple ? 'Pick one or more photos' : 'Pick a photo or screenshot',
              icon: <ImageIcon className="w-5 h-5" />,
              tone: 'bg-violet-50 text-violet-600 border-violet-100',
            },
            {
              id: 'camera' as const,
              title: isVideo ? 'Record Video' : 'Take Photo',
              text: isVideo ? 'Record a new video now' : 'Use your camera to capture it now',
              icon: isVideo ? <Video className="w-5 h-5" /> : <Camera className="w-5 h-5" />,
              tone: 'bg-blue-50 text-[#2F68FE] border-blue-100',
            },
          ]
        : []),
      {
        id: 'files',
        title: 'Choose from Files',
        text: 'Browse documents saved on your device',
        icon: <FileText className="w-5 h-5" />,
        tone: 'bg-amber-50 text-amber-600 border-amber-100',
      },
    ];

    // Open the system picker straight from the tap (keeps the browser's user-gesture), then close the sheet
    const pick = (source: Source) => {
      inputs[source].current?.click();
      setOpen(false);
    };

    return (
      <>
        <input ref={inputs.gallery} type="file" accept={mediaAccept} multiple={multiple} className="hidden" onChange={onChange} />
        <input ref={inputs.camera} type="file" accept={mediaAccept} capture={cameraFacing} className="hidden" onChange={onChange} />
        <input ref={inputs.files} type="file" accept={accept} multiple={multiple} className="hidden" onChange={onChange} />

        <BottomSheet isOpen={open} onClose={() => setOpen(false)} maxHeight="max-h-[80%]">
          <div className="pt-3 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>
          <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 shrink-0">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#1E293B]">{title}</h2>
              {formats.length > 0 && (
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Supported: {formats.join(', ')}
                  {multiple ? ' · multiple files allowed' : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ul className="px-4 pb-8 space-y-2">
            {options.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => pick(o.id)}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 bg-white shadow-2xs text-left active:scale-[0.98] active:bg-slate-50 transition-transform cursor-pointer"
                >
                  <span className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${o.tone}`}>{o.icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold text-[#1E293B]">{o.title}</span>
                    <span className="block mt-0.5 text-[11px] text-slate-500 truncate">{o.text}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </BottomSheet>
      </>
    );
  }
);
AttachmentInput.displayName = 'AttachmentInput';
