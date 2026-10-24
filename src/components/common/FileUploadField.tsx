import React, { useRef, useState } from 'react';
import { CheckCircle2, FileText, Image as ImageIcon, Plus, Trash2, Upload } from 'lucide-react';
import { AttachmentInput, AttachmentInputHandle } from './AttachmentInput';

/**
 * The one upload UI for the app: a dashed "Upload … / Browse" drop zone that states the allowed types and
 * size limit, and once a file is chosen a file tile (type badge, name, ✓ Uploaded) with Replace and remove.
 * Files over the limit are refused with a message under the field.
 */

const DEFAULT_TYPES = 'PDF, JPG or PNG';
const DEFAULT_MAX_MB = 5;

/** Type badge + name + ✓ Uploaded, with optional Replace and a remove button (shared by single and multi pickers) */
const FileTile: React.FC<{ name: string; onReplace?: () => void; onRemove: () => void; disabled?: boolean }> = ({
  name,
  onReplace,
  onRemove,
  disabled,
}) => {
  const isPdf = /\.pdf$/i.test(name);
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
      <span
        className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 ${
          isPdf ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-600'
        }`}
      >
        {isPdf ? <FileText className="w-4.5 h-4.5" /> : <ImageIcon className="w-4.5 h-4.5" />}
        <span className="text-[8px] font-extrabold uppercase leading-none mt-0.5">{name.split('.').pop()?.slice(0, 4)}</span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold text-[#1E293B] truncate">{name}</span>
        <span className="mt-0.5 flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600">
          <CheckCircle2 className="w-3 h-3" />
          Uploaded
        </span>
      </span>
      {onReplace && (
        <button
          type="button"
          onClick={onReplace}
          disabled={disabled}
          className="h-8 px-2.5 rounded-lg text-[11px] font-bold text-[#2F68FE] active:bg-blue-50 disabled:opacity-50 cursor-pointer"
        >
          Replace
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 active:bg-rose-50 active:text-rose-500 disabled:opacity-50 cursor-pointer"
        aria-label={`Remove ${name}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

/** Dashed "Upload … / Browse" target, with the allowed types and the size limit underneath the label */
const DropZone: React.FC<{ label: string; hint: string; invalid: boolean; disabled?: boolean; onClick: () => void }> = ({
  label,
  hint,
  invalid,
  disabled,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full p-3 rounded-xl border-2 border-dashed flex items-center gap-3 text-left transition-colors active:scale-[0.99] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed ${
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
);

const SizeError: React.FC<{ message: string }> = ({ message }) =>
  message ? (
    <p className="mt-1 px-0.5 text-[11px] font-medium text-rose-500" role="alert">
      {message}
    </p>
  ) : null;

const tooBig = (file: File, maxMB: number) => file.size > maxMB * 1024 * 1024;

interface CommonProps {
  /** Drop-zone label, e.g. "Upload receipt" */
  label?: string;
  /** Allowed types shown under the label, e.g. "PDF, JPG or PNG" (the size limit is added after it) */
  types?: string;
  /** Largest allowed file, in MB (shown, and enforced) */
  maxSizeMB?: number;
  /** Title of the source sheet (Camera / Gallery / Files) */
  sheetTitle?: string;
  accept?: string;
  /** Shows the drop zone in red */
  invalid?: boolean;
  disabled?: boolean;
}

/** One file */
export const FileUploadField: React.FC<
  CommonProps & {
    /** Chosen file name, or null */
    fileName: string | null;
    onChange: (fileName: string | null) => void;
    /** Gets the picked file itself (e.g. to check or read it); when set, the caller decides whether to accept it */
    onFile?: (file: File) => void;
  }
> = ({
  fileName,
  onChange,
  onFile,
  label = 'Upload file',
  types = DEFAULT_TYPES,
  maxSizeMB = DEFAULT_MAX_MB,
  sheetTitle = 'Add Attachment',
  accept = '.pdf,.jpg,.jpeg,.png',
  invalid = false,
  disabled = false,
}) => {
  const ref = useRef<AttachmentInputHandle>(null);
  const [sizeError, setSizeError] = useState('');

  return (
    <div>
      {fileName ? (
        <FileTile
          name={fileName}
          disabled={disabled}
          onReplace={() => ref.current?.click()}
          onRemove={() => {
            setSizeError('');
            onChange(null);
          }}
        />
      ) : (
        <DropZone
          label={label}
          hint={`${types} · up to ${maxSizeMB} MB`}
          invalid={invalid || Boolean(sizeError)}
          disabled={disabled}
          onClick={() => ref.current?.click()}
        />
      )}
      <SizeError message={sizeError} />
      <AttachmentInput
        ref={ref}
        title={sheetTitle}
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          if (onFile) return onFile(file);
          if (tooBig(file, maxSizeMB)) return setSizeError(`${file.name} is larger than ${maxSizeMB} MB.`);
          setSizeError('');
          onChange(file.name);
        }}
      />
    </div>
  );
};

/** Several files: the same tiles in a list, the drop zone when empty, then "Add more files" */
export const MultiFileUploadField: React.FC<
  CommonProps & {
    files: string[];
    /** Gets the picked files themselves (e.g. to check them); when set, the caller decides what to add */
    onFiles?: (files: File[]) => void;
    /** Hide the add button once this many files are attached */
    maxFiles?: number;
    onChange: (files: string[]) => void;
  }
> = ({
  files,
  onFiles,
  maxFiles,
  onChange,
  label = 'Upload files',
  types = DEFAULT_TYPES,
  maxSizeMB = DEFAULT_MAX_MB,
  sheetTitle = 'Add Attachments',
  accept = '.pdf,.jpg,.jpeg,.png',
  invalid = false,
  disabled = false,
}) => {
  const ref = useRef<AttachmentInputHandle>(null);
  const [sizeError, setSizeError] = useState('');

  return (
    <div className="space-y-1.5">
      {files.map((name) => (
        <FileTile key={name} name={name} disabled={disabled} onRemove={() => onChange(files.filter((f) => f !== name))} />
      ))}
      {maxFiles !== undefined && files.length >= maxFiles ? null : files.length === 0 ? (
        <DropZone
          label={label}
          hint={`${types} · up to ${maxSizeMB} MB each`}
          invalid={invalid || Boolean(sizeError)}
          disabled={disabled}
          onClick={() => ref.current?.click()}
        />
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={disabled}
          className="w-full h-10 rounded-xl border border-dashed border-blue-200 text-[#2F68FE] text-xs font-bold flex items-center justify-center gap-1.5 active:bg-blue-50 disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add more files <span className="font-medium text-slate-400">· up to {maxSizeMB} MB each</span>
        </button>
      )}
      <SizeError message={sizeError} />
      <AttachmentInput
        ref={ref}
        multiple
        title={sheetTitle}
        accept={accept}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          if (onFiles) {
            e.target.value = '';
            return onFiles(picked);
          }
          e.target.value = '';
          const ok = picked.filter((f) => !tooBig(f, maxSizeMB));
          const skipped = picked.length - ok.length;
          setSizeError(skipped ? `${skipped} ${skipped === 1 ? 'file was' : 'files were'} larger than ${maxSizeMB} MB and not added.` : '');
          const names = ok.map((f) => f.name).filter((n) => !files.includes(n));
          if (names.length) onChange([...files, ...names]);
        }}
      />
    </div>
  );
};
