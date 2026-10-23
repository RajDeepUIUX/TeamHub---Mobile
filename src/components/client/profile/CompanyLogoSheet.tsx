import React, { useEffect, useRef, useState } from 'react';
import { Building2, Check, ImagePlus, Trash2 } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { COMPANY_LOGO_MAX_KB, COMPANY_LOGO_TYPES } from '../data/clientCompanyProfileData';
import { AttachmentInput, AttachmentInputHandle } from '../../common/AttachmentInput';

/**
 * B "Company Logo" modal: pick PNG / JPG (≤800 KB, no crop) → preview → Save; remove the saved logo;
 * Save without a change shows B's "Please upload company logo first."
 */
export const CompanyLogoSheet: React.FC<{
  isOpen: boolean;
  logoUrl: string | null;
  onClose: () => void;
  onSave: (url: string | null) => void;
}> = ({ isOpen, logoUrl, onClose, onSave }) => {
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<AttachmentInputHandle>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPreview(logoUrl);
    setError('');
    setSaving(false);
  }, [isOpen, logoUrl]);

  const changed = preview !== logoUrl;

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!COMPANY_LOGO_TYPES.includes(file.type)) return setError('Please upload PNG or JPG image only.');
    if (file.size > COMPANY_LOGO_MAX_KB * 1024) return setError(`Company logo size should be ${COMPANY_LOGO_MAX_KB}KB or less.`);
    setError('');
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!changed) return setError('Please upload company logo first.');
    setSaving(true);
    setTimeout(() => onSave(preview), 600);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[80%]">
      <SheetHeader title="Company Logo" subtitle="Appears across your organization profile" onClose={onClose} />
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        <div className="flex flex-col items-center gap-3 pt-1">
          <div className="relative">
            <span className="w-28 h-28 rounded-3xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
              {preview ? (
                <img src={preview} alt="Company logo preview" className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 className="w-10 h-10 text-slate-300" aria-hidden />
              )}
            </span>
            {preview && (
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setError('');
                }}
                aria-label="Remove logo"
                className="absolute -right-3 -top-3 w-11 h-11 flex items-center justify-center cursor-pointer group"
              >
                <span className="w-7.5 h-7.5 rounded-full bg-white border border-slate-200 text-rose-500 flex items-center justify-center shadow-xs group-active:bg-rose-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="h-10 px-4 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] text-xs font-bold flex items-center gap-1.5 active:bg-blue-100 cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            {preview ? 'Choose another image' : 'Upload logo'}
          </button>
        </div>
        {error && (
          <p role="alert" className="px-3 py-2.5 rounded-xl bg-[#FEF2F2] border border-rose-200 text-[12px] font-semibold text-rose-600">
            {error}
          </p>
        )}
        <p className="px-3 py-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 leading-relaxed">
          Recommended: horizontal logo with clear spacing, high resolution (PNG preferred). Max size {COMPANY_LOGO_MAX_KB} KB.
        </p>
      </div>
      <div className="shrink-0 p-4 pb-5 border-t border-[#EBF0F7]">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <AttachmentInput ref={fileInput} title="Company Logo" accept=".png,.jpg,.jpeg" onChange={pick} />
    </BottomSheet>
  );
};
