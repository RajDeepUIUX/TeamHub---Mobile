import React, { useEffect, useRef, useState } from 'react';
import { FileText, Info, UploadCloud, X } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader, TextField } from '../staff/tabs/StaffTabParts';
import { textareaClass } from '../../profile/reviewFormParts';
import {
  ClientNameChangeRequest,
  ID_PROOF_MAX_FILES,
  ID_PROOF_MAX_MB,
  ID_PROOF_TYPES,
  NAME_MAX,
  NAME_REASON_MAX,
} from '../data/clientUserProfileData';
import { AttachmentInput, AttachmentInputHandle } from '../../common/AttachmentInput';

type Errors = Partial<Record<'firstName' | 'lastName' | 'reason' | 'files', string>>;

const nameError = (value: string, label: string) => {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (!/^[a-zA-Z\s]+$/.test(v)) return `${label} should only contain letters.`;
  if (v.length > NAME_MAX) return `${label} can be up to ${NAME_MAX} characters.`;
  return '';
};

/** MyCPE ONE "Request Name Change": new name + reason + official ID proof, reviewed by the MyCPE ONE team */
export const NameChangeSheet: React.FC<{
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSubmit: (req: Omit<ClientNameChangeRequest, 'submittedAt' | 'status'>) => void;
}> = ({ isOpen, currentName, onClose, onSubmit }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<AttachmentInputHandle>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFirstName('');
    setLastName('');
    setReason('');
    setFiles([]);
    setErrors({});
    setSaving(false);
  }, [isOpen]);

  const clear = (key: keyof Errors) => errors[key] && setErrors((e) => ({ ...e, [key]: '' }));

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!picked.length) return;
    const bad = picked.find((f) => !ID_PROOF_TYPES.includes(f.type));
    if (bad) return setErrors((x) => ({ ...x, files: 'Only PDF, JPG or PNG files are allowed.' }));
    const big = picked.find((f) => f.size > ID_PROOF_MAX_MB * 1024 * 1024);
    if (big) return setErrors((x) => ({ ...x, files: `Each file must be ${ID_PROOF_MAX_MB} MB or smaller.` }));
    const next = [...files, ...picked].slice(0, ID_PROOF_MAX_FILES);
    if (files.length + picked.length > ID_PROOF_MAX_FILES) {
      setErrors((x) => ({ ...x, files: `You can attach up to ${ID_PROOF_MAX_FILES} files.` }));
    } else clear('files');
    setFiles(next);
  };

  const submit = () => {
    const found: Errors = {
      firstName: nameError(firstName, 'First name'),
      lastName: nameError(lastName, 'Last name'),
      reason: reason.trim() ? '' : 'Please tell us why you need this change.',
      files: files.length ? '' : 'Attach at least one official ID proof.',
    };
    if (!found.firstName && !found.lastName && `${firstName.trim()} ${lastName.trim()}`.toLowerCase() === currentName.toLowerCase()) {
      found.firstName = 'This is already your name.';
    }
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setSaving(true);
    setTimeout(() => {
      onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), reason: reason.trim(), files: files.map((f) => f.name) });
    }, 600);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[92%]">
      <SheetHeader title="Request Name Change" subtitle={`Current name: ${currentName}`} onClose={onClose} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-[#1D4ED8] leading-relaxed">
          <Info className="w-4 h-4 shrink-0 mt-px" />
          Your name is shared with MyCPE ONE, so changes are verified first. You'll keep your current name until the request is approved.
        </p>
        <TextField
          label="New First Name"
          required
          value={firstName}
          onChange={(v) => {
            setFirstName(v.slice(0, NAME_MAX));
            clear('firstName');
          }}
          error={errors.firstName}
          placeholder="Enter first name"
        />
        <TextField
          label="New Last Name"
          required
          value={lastName}
          onChange={(v) => {
            setLastName(v.slice(0, NAME_MAX));
            clear('lastName');
          }}
          error={errors.lastName}
          placeholder="Enter last name"
        />
        <label className="block space-y-1.5">
          <span className="flex items-center justify-between text-xs font-bold text-[#1E293B]">
            <span>
              Reason<span className="text-rose-500"> *</span>
            </span>
            <span className="text-[10.5px] font-medium text-slate-400 tabular-nums">
              {reason.length}/{NAME_REASON_MAX}
            </span>
          </span>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value.slice(0, NAME_REASON_MAX));
              clear('reason');
            }}
            placeholder="E.g. legal name change after marriage"
            aria-invalid={Boolean(errors.reason)}
            className={`${textareaClass} select-text ${errors.reason ? 'border-rose-300' : ''}`}
          />
          {errors.reason && <p className="px-0.5 text-[11px] font-medium text-rose-500">{errors.reason}</p>}
        </label>

        <div>
          <span className="block text-xs font-bold text-[#1E293B]">
            Official ID Proof<span className="text-rose-500"> *</span>
          </span>
          <AttachmentInput ref={fileInput} title="Official ID Proof" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={addFiles} />
          {files.length < ID_PROOF_MAX_FILES && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className={`mt-1.5 w-full border-2 border-dashed rounded-2xl p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                errors.files ? 'border-rose-300 bg-rose-50/40' : 'border-blue-200 bg-blue-50/20 active:bg-blue-50/60'
              }`}
            >
              <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2F68FE] shrink-0">
                <UploadCloud className="w-4.5 h-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-[#2F68FE]">Add file</span>
                <span className="block text-[11px] text-slate-400">
                  Passport, driver's license or marriage certificate · PDF, JPG, PNG (max {ID_PROOF_MAX_MB} MB)
                </span>
              </span>
            </button>
          )}
          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-2.5 pl-3 pr-1 h-11 rounded-xl bg-slate-50 border border-slate-100">
                  <FileText className="w-4 h-4 text-[#2F68FE] shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-xs font-medium text-[#1E293B]">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((list) => list.filter((_, idx) => idx !== i))}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-200 shrink-0 cursor-pointer"
                    aria-label={`Remove ${f.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors.files && <p className="mt-1.5 px-0.5 text-[11px] font-medium text-rose-500">{errors.files}</p>}
        </div>
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-2.5 p-4 pb-6 border-t border-slate-100 shrink-0">
        <button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </BottomSheet>
  );
};
