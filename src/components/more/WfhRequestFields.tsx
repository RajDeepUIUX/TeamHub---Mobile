import React, { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  X,
  Package,
  MapPin,
  Info,
  ShieldCheck,
  Minus,
  Plus,
  Check,
  PcCase,
  Laptop,
  Monitor,
  MousePointer2,
  Keyboard,
  Headphones,
  Video,
} from 'lucide-react';
import { Dropdown } from '../../design-system/components/Dropdown';
import { AddressType, DeliveryAddress } from '../../types/workTiming';
import {
  COUNTRIES,
  INDIAN_STATES,
  MAX_ASSET_QTY,
  SAVED_ADDRESSES,
  WFH_ASSETS,
  WFH_ATTACHMENT_TYPES,
  WFH_REASONS,
  formatFlexDate,
} from '../../data/workTimingData';
import { Declarant } from '../../data/staffDeclaration';
import { StaffDeclarationSheet } from './StaffDeclarationSheet';

/** Form state for the Work From Home sections */
export interface WfhFormState {
  reason: string | null;
  attachments: { name: string; url: string }[];
  assets: Record<string, number>;
  address: DeliveryAddress;
  accepted: boolean;
}

export const emptyWfhForm = (): WfhFormState => ({
  reason: null,
  attachments: [],
  assets: {},
  address: { ...SAVED_ADDRESSES.Current },
  accepted: false,
});

export const assetTotal = (assets: Record<string, number>) => Object.values(assets).reduce((n, q) => n + q, 0);

/** Which sections to show: everything (WFH / Hybrid) or only Request Details (Early Shift) */
export type WfhFieldsVariant = 'full' | 'requestOnly';

/** Field-level errors for the WFH sections (empty object = valid) */
export const validateWfhForm = (f: WfhFormState, variant: WfhFieldsVariant = 'full'): Record<string, string> => {
  const e: Record<string, string> = {};
  if (!f.reason) e.wfhReason = 'Select a reason.';
  if (variant === 'requestOnly') return e;
  // Delivery address is only needed when assets are requested
  if (assetTotal(f.assets) > 0) {
    const a = f.address;
    if (!a.address.trim()) e.address = 'Enter the address.';
    if (!a.landmark.trim()) e.landmark = 'Enter a landmark.';
    if (!a.country) e.country = 'Select a country.';
    if (!a.state) e.state = 'Select a state.';
    if (!a.city.trim()) e.city = 'Enter the city.';
    if (!/^\d{6}$/.test(a.zip.trim())) e.zip = 'Enter a 6-digit PIN code.';
  }
  if (!f.accepted) e.accepted = 'Please accept the Terms and Conditions.';
  return e;
};

// Simple outline icons for the asset list
const ASSET_ICONS: Record<string, React.ElementType> = {
  CPU: PcCase,
  Laptop,
  Monitor,
  Mouse: MousePointer2,
  Keyboard,
  Headphones,
  Webcam: Video,
};

/** Card with an icon + uppercase title, matching the web form's sections */
export const FormSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; right?: React.ReactNode }> = ({
  icon,
  title,
  children,
  right,
}) => (
  <section className="bg-white border border-[#EBF0F7] rounded-2xl p-3.5 shadow-2xs space-y-3">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center">{icon}</span>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#1E293B]">{title}</h3>
      </div>
      {right}
    </div>
    {children}
  </section>
);

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="px-0.5 text-[11px] font-medium text-rose-500">{message}</p> : null;

const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  inputMode?: 'text' | 'numeric';
  maxLength?: number;
}> = ({ label, value, onChange, error, inputMode = 'text', maxLength }) => (
  <div className="space-y-1">
    <label className="block text-[11px] font-semibold text-slate-600">
      {label} <span className="text-rose-500">*</span>
    </label>
    <input
      type="text"
      inputMode={inputMode}
      value={value}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-11 px-3 bg-white border rounded-xl text-xs font-medium text-[#1E293B] focus:outline-hidden focus:border-[#2F68FE] focus:ring-4 focus:ring-blue-50 select-text ${
        error ? 'border-rose-300' : 'border-slate-200'
      }`}
    />
    <FieldError message={error} />
  </div>
);

interface WfhRequestFieldsProps {
  value: WfhFormState;
  onChange: (next: WfhFormState) => void;
  errors: Record<string, string>;
  clearError: (key: string) => void;
  signerName: string;
  todayISO: string;
  variant?: WfhFieldsVariant;
  /** Details that fill the Staff Declaration (falls back to the signer's name only) */
  declarant?: Declarant;
}

export const WfhRequestFields: React.FC<WfhRequestFieldsProps> = ({
  value: f,
  onChange,
  errors,
  clearError,
  signerName,
  todayISO,
  variant = 'full',
  declarant,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeclarationOpen, setIsDeclarationOpen] = useState(false);
  const declarationAddress =
    [f.address.address || SAVED_ADDRESSES.Current.address, f.address.city || SAVED_ADDRESSES.Current.city].filter(Boolean).join(', ');
  const set = (patch: Partial<WfhFormState>) => onChange({ ...f, ...patch });
  const setAddress = (patch: Partial<DeliveryAddress>, errorKey: string) => {
    onChange({ ...f, address: { ...f.address, ...patch } });
    clearError(errorKey);
  };
  const totalAssets = assetTotal(f.assets);

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((file) => /image\/(jpeg|png)/.test(file.type));
    e.target.value = '';
    if (!files.length) return;
    set({
      attachments: [
        ...f.attachments,
        ...files
          .filter((file) => !f.attachments.some((a) => a.name === file.name))
          .map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
      ],
    });
  };

  const changeQty = (asset: string, delta: number) => {
    const qty = Math.min(MAX_ASSET_QTY, Math.max(0, (f.assets[asset] ?? 0) + delta));
    const assets = { ...f.assets };
    if (qty === 0) delete assets[asset];
    else assets[asset] = qty;
    set({ assets });
  };

  const chooseAddress = (type: AddressType) => onChange({ ...f, address: { ...SAVED_ADDRESSES[type] } });

  return (
    <>
      {/* Request details */}
      <FormSection icon={<FileText className="w-4 h-4" />} title="Request Details">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-600">
            Reason <span className="text-rose-500">*</span>
          </label>
          <Dropdown
            ariaLabel="Reason"
            value={f.reason}
            placeholder="Select Reason"
            options={WFH_REASONS}
            onChange={(r) => {
              set({ reason: r });
              clearError('wfhReason');
            }}
          />
          <FieldError message={errors.wfhReason} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-600">
            Upload Files <span className="font-medium text-slate-400">(jpg, jpeg, png only)</span>
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 text-left active:bg-indigo-50 cursor-pointer"
          >
            <span className="w-9 h-9 rounded-lg bg-white text-[#2F68FE] flex items-center justify-center shadow-2xs shrink-0">
              <Upload className="w-4 h-4" />
            </span>
            <span>
              <span className="block text-xs font-bold text-[#2F68FE]">Tap to upload</span>
              <span className="block text-[11px] text-slate-400">Supporting documents, e.g. a medical note</span>
            </span>
          </button>
          <input ref={fileInputRef} type="file" multiple accept={WFH_ATTACHMENT_TYPES} className="hidden" onChange={addFiles} />
          {f.attachments.length > 0 && (
            <div className="grid grid-cols-4 gap-2 pt-1">
              {f.attachments.map((a) => (
                <div key={a.name} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  {a.url ? (
                    <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                  ) : (
                    // Previously uploaded file (editing a request): show its name
                    <span className="w-full h-full flex flex-col items-center justify-center gap-1 p-1.5 text-center">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-[8.5px] font-medium text-slate-500 leading-tight line-clamp-2 break-all">{a.name}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => set({ attachments: f.attachments.filter((x) => x.name !== a.name) })}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/60 text-white flex items-center justify-center cursor-pointer"
                    aria-label={`Remove ${a.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormSection>

      {variant === 'full' && (
      <>
      {/* Assets */}
      <FormSection
        icon={<Package className="w-4 h-4" />}
        title="Assets Required"
        right={
          totalAssets > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2F68FE] text-[10px] font-bold">{totalAssets} selected</span>
          ) : (
            <span className="text-[10px] text-slate-400">Optional</span>
          )
        }
      >
        {/* Single-column list so every asset name shows in full */}
        <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {WFH_ASSETS.map((asset) => {
            const qty = f.assets[asset] ?? 0;
            const Icon = ASSET_ICONS[asset] ?? Package;
            return (
              <div
                key={asset}
                className={`flex items-center gap-3 py-2 pl-3.5 pr-2.5 transition-colors ${qty ? 'bg-blue-50/50' : 'bg-white'}`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${qty ? 'text-[#2F68FE]' : 'text-slate-400'}`}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <span className={`flex-1 text-xs ${qty ? 'font-bold text-[#1E293B]' : 'font-semibold text-slate-700'}`}>{asset}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => changeQty(asset, -1)}
                    disabled={qty === 0}
                    aria-label={`Fewer ${asset}`}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={() => changeQty(asset, 1)}
                    disabled={qty === MAX_ASSET_QTY}
                    aria-label={`More ${asset}`}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-[#2F68FE] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </FormSection>

      {/* Delivery address (only when assets are requested) */}
      {totalAssets > 0 && (
        <FormSection icon={<MapPin className="w-4 h-4" />} title="Delivery Address">
          <p className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800">
            <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>
              <strong className="font-bold">Note:</strong> The selected assets will be delivered to this address.
            </span>
          </p>

          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Address type">
            {(['Current', 'Permanent'] as AddressType[]).map((t) => {
              const on = f.address.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => chooseAddress(t)}
                  className={`h-10 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                    on ? 'border-[#2F68FE] bg-blue-50 text-[#1E293B] font-bold' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 ${on ? 'border-[#2F68FE] bg-[#2F68FE] ring-2 ring-white ring-inset' : 'border-slate-300'}`}
                  />
                  {t} Address
                </button>
              );
            })}
          </div>

          <TextField label="Address" value={f.address.address} error={errors.address} onChange={(v) => setAddress({ address: v }, 'address')} />
          <TextField label="Land Mark" value={f.address.landmark} error={errors.landmark} onChange={(v) => setAddress({ landmark: v }, 'landmark')} />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Country <span className="text-rose-500">*</span>
              </label>
              <Dropdown size="md" ariaLabel="Country" value={f.address.country} options={COUNTRIES} onChange={(v) => setAddress({ country: v }, 'country')} />
              <FieldError message={errors.country} />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                State <span className="text-rose-500">*</span>
              </label>
              <Dropdown
                size="md"
                ariaLabel="State"
                value={f.address.state}
                placeholder="Select"
                options={INDIAN_STATES}
                menuMinWidth={180}
                onChange={(v) => setAddress({ state: v }, 'state')}
              />
              <FieldError message={errors.state} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextField label="City" value={f.address.city} error={errors.city} onChange={(v) => setAddress({ city: v }, 'city')} />
            <TextField
              label="Zip"
              value={f.address.zip}
              inputMode="numeric"
              maxLength={6}
              error={errors.zip}
              onChange={(v) => setAddress({ zip: v.replace(/\D/g, '') }, 'zip')}
            />
          </div>
        </FormSection>
      )}

      {/* Acknowledgement */}
      <FormSection icon={<ShieldCheck className="w-4 h-4" />} title="Acknowledgement">
        <div className="flex items-end justify-between px-1 pb-2 border-b border-dashed border-slate-200">
          <span className="text-2xl text-[#1E1B4B] leading-none" style={{ fontFamily: "'Caveat', cursive" }}>
            {signerName}
          </span>
          <span className="text-[11px] text-slate-400">{formatFlexDate(todayISO)}</span>
        </div>
        <button
          type="button"
          role="checkbox"
          aria-checked={f.accepted}
          onClick={() => {
            // Ticking opens the declaration (agreeing there ticks it); an accepted box can be unticked directly
            if (f.accepted) set({ accepted: false });
            else setIsDeclarationOpen(true);
          }}
          className="flex items-center gap-2.5 text-left cursor-pointer"
        >
          <span
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
              f.accepted ? 'bg-[#2F68FE] border-[#2F68FE] text-white' : errors.accepted ? 'border-rose-300' : 'border-slate-300'
            }`}
          >
            {f.accepted && <Check className="w-3 h-3 stroke-[3]" />}
          </span>
          <span className="text-xs text-slate-600">
            I accept the <span className="font-semibold text-[#2F68FE]">Terms and Conditions</span>.
          </span>
        </button>
        <FieldError message={errors.accepted} />
      </FormSection>

      <StaffDeclarationSheet
        isOpen={isDeclarationOpen}
        declarant={
          declarant ?? { name: signerName, staffCode: '', designation: '', department: '', personalEmail: '', officialEmail: '' }
        }
        address={declarationAddress}
        onClose={() => setIsDeclarationOpen(false)}
        onAgree={() => {
          set({ accepted: true });
          clearError('accepted');
          setIsDeclarationOpen(false);
        }}
      />
      </>
      )}
    </>
  );
};
