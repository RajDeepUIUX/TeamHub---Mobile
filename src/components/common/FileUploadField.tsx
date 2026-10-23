import React, { useRef } from 'react';
import { CheckCircle2, FileText, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { AttachmentInput, AttachmentInputHandle } from './AttachmentInput';

/**
 * Shared file picker: a dashed "Upload … / Browse" drop zone, and once a file is chosen a file tile
 * (type badge, name, ✓ Uploaded) with Replace and remove. Opens the shared attachment source sheet.
 */
export const FileUploadField: React.FC<{
  /** Chosen file name, or null */
  fileName: string | null;
  onChange: (fileName: string | null) => void;
  /** Drop-zone label, e.g. "Upload receipt" */
  label?: string;
  /** Line under the label */
  hint?: string;
  /** Title of the source sheet (Camera / Gallery / Files) */
  sheetTitle?: string;
  accept?: string;
  /** Shows the drop zone in red */
  invalid?: boolean;
}> = ({
  fileName,
  onChange,
  label = 'Upload file',
  hint = 'PDF, JPG or PNG',
  sheetTitle = 'Add Attachment',
  accept = '.pdf,.jpg,.jpeg,.png',
  invalid = false,
}) => {
  const ref = useRef<AttachmentInputHandle>(null);
  const isPdf = Boolean(fileName && /\.pdf$/i.test(fileName));

  return (
    <>
      {fileName ? (
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <span
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 ${
              isPdf ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-600'
            }`}
          >
            {isPdf ? <FileText className="w-4.5 h-4.5" /> : <ImageIcon className="w-4.5 h-4.5" />}
            <span className="text-[8px] font-extrabold uppercase leading-none mt-0.5">{fileName.split('.').pop()?.slice(0, 4)}</span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-semibold text-[#1E293B] truncate">{fileName}</span>
            <span className="mt-0.5 flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600">
              <CheckCircle2 className="w-3 h-3" />
              Uploaded
            </span>
          </span>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="h-8 px-2.5 rounded-lg text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 cursor-pointer"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 active:bg-rose-50 active:text-rose-500 cursor-pointer"
            aria-label="Remove file"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={`w-full p-3 rounded-xl border-2 border-dashed flex items-center gap-3 text-left transition-colors active:scale-[0.99] cursor-pointer ${
            invalid ? 'border-rose-300 bg-rose-50/40' : 'border-blue-200 bg-gradient-to-br from-blue-50/70 to-white active:bg-blue-50'
          }`}
        >
          <span
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              invalid ? 'bg-white text-rose-500' : 'bg-white text-[#2F68FE] border border-blue-100'
            }`}
          >
            <Upload className="w-4.5 h-4.5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className={`block text-xs font-bold truncate ${invalid ? 'text-rose-600' : 'text-[#2F68FE]'}`}>{label}</span>
            <span className="block mt-0.5 text-[10.5px] text-slate-400">{hint}</span>
          </span>
          <span className="h-7 px-2.5 rounded-lg bg-[#2F68FE] text-white text-[10.5px] font-bold flex items-center shrink-0">Browse</span>
        </button>
      )}
      <AttachmentInput
        ref={ref}
        title={sheetTitle}
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file.name);
          e.target.value = '';
        }}
      />
    </>
  );
};
