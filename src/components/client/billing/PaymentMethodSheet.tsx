import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { BottomSheet } from '../../common/BottomSheet';
import { ChoiceTiles } from '../../common/ChoiceTiles';
import { Dropdown } from '../../../design-system/components/Dropdown';
import { SheetHeader, fieldInputClass } from '../staff/tabs/StaffTabParts';
import { ErrorText, Label } from '../profile/ProfileParts';
import {
  BANK_MASTERS,
  BILLING_RULES,
  BankAccountType,
  BillingBankAccount,
  BillingCountry,
  BillingCreditCard,
  BillingDetails,
  CARD_TYPES,
  CardType,
  detectCardType,
  expiryError,
  maskCardNumber,
  maskExpiry,
  newBillingId,
} from '../data/clientBillingData';

export type PaymentMethodTarget = { kind: 'bank'; edit?: BillingBankAccount } | { kind: 'card' };

interface Props {
  isOpen: boolean;
  target: PaymentMethodTarget | null;
  billing: BillingDetails;
  country: BillingCountry;
  onClose: () => void;
  /** Duplicate check passed; returns the saved method */
  onSave: (method: { kind: 'bank'; bank: BillingBankAccount; isEdit: boolean } | { kind: 'card'; card: BillingCreditCard }) => void;
}

type BankDraft = {
  accountName: string;
  accountNumber: string;
  bankId: string;
  accountType: BankAccountType;
  institutionNumber: string;
  transitNumber: string;
  bankRouting: string;
  sortCode: string;
};
type CardDraft = { cardName: string; cardNumber: string; cardType: CardType | ''; expiry: string; cvv: string };

const EMPTY_BANK: BankDraft = {
  accountName: '',
  accountNumber: '',
  bankId: '',
  accountType: 'checking',
  institutionNumber: '',
  transitNumber: '',
  bankRouting: '',
  sortCode: '',
};
const EMPTY_CARD: CardDraft = { cardName: '', cardNumber: '', cardType: '', expiry: '', cvv: '' };

const SAVE_MS = 800;
const digits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

/** B "Add Payment Information" modal (Bank / Card fields), also "Edit Bank Account" */
export const PaymentMethodSheet: React.FC<Props> = ({ isOpen, target, billing, country, onClose, onSave }) => {
  const [bank, setBank] = useState<BankDraft>(EMPTY_BANK);
  const [card, setCard] = useState<CardDraft>(EMPTY_CARD);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [cvvVisible, setCvvVisible] = useState(false);
  const [busy, setBusy] = useState<'checking' | 'saving' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || !target) return;
    setErrors({});
    setFormError(null);
    setCvvVisible(false);
    setBusy(null);
    setCard(EMPTY_CARD);
    const e = target.kind === 'bank' ? target.edit : undefined;
    setBank(
      e
        ? {
            accountName: e.accountName,
            accountNumber: e.accountNumber,
            bankId: e.bankId,
            accountType: e.accountType,
            institutionNumber: e.institutionNumber ?? '',
            transitNumber: e.transitNumber ?? '',
            bankRouting: e.bankRouting ?? '',
            sortCode: e.sortCode ?? '',
          }
        : EMPTY_BANK,
    );
  }, [isOpen, target]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!target) return null;
  const isCard = target.kind === 'card';
  const editing = target.kind === 'bank' ? target.edit : undefined;
  const title = isCard ? 'Add Credit Card' : editing ? 'Edit Bank Account' : 'Add Bank Account';

  const showCa = country === 'CA' || country === null;
  const showUs = country === 'US' || country === null;
  const showUk = country === 'UK' || country === null;

  const setB = <K extends keyof BankDraft>(key: K, value: BankDraft[K]) => {
    setBank((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
    setFormError(null);
  };
  const setC = <K extends keyof CardDraft>(key: K, value: CardDraft[K]) => {
    setCard((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
    setFormError(null);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (isCard) {
      const num = card.cardNumber.replace(/\D/g, '');
      if (!card.cardName.trim()) e.cardName = 'This field is required.';
      if (!num) e.cardNumber = 'This field is required.';
      else if (num.length < 13) e.cardNumber = 'Enter a valid card number (13–19 digits).';
      if (!card.cardType) e.cardType = 'This field is required.';
      const exp = expiryError(card.expiry);
      if (exp) e.expiry = exp;
      if (!card.cvv) e.cvv = 'This field is required.';
      else if (card.cvv.length < 3) e.cvv = 'CVV must be 3 or 4 digits.';
    } else {
      const name = bank.accountName.trim();
      if (!name) e.accountName = 'This field is required.';
      else if (!BILLING_RULES.accountName.test(name)) e.accountName = 'Only letters, spaces, hyphens and apostrophes are allowed.';
      if (!bank.accountNumber) e.accountNumber = 'This field is required.';
      else if (!BILLING_RULES.accountNumber.test(bank.accountNumber)) e.accountNumber = 'Must be 4–20 digits.';
      if (!bank.bankId) e.bankId = 'This field is required.';
      // Optional; exact length only when entered (desktop `apDigits`)
      const len = (key: keyof BankDraft, n: number, show: boolean) => {
        const v = bank[key] as string;
        if (show && v && v.length !== n) e[key] = `Must be ${n} digits.`;
      };
      len('institutionNumber', BILLING_RULES.institutionLen, showCa);
      len('transitNumber', BILLING_RULES.transitLen, showCa);
      len('bankRouting', BILLING_RULES.routingLen, showUs);
      len('sortCode', BILLING_RULES.sortCodeLen, showUk);
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    // Add: duplicate check first (B `hrms-check-payment-existence`); edit skips it
    setBusy(editing ? 'saving' : 'checking');
    timer.current = setTimeout(() => {
      if (isCard) {
        const num = card.cardNumber.replace(/\D/g, '');
        const lastFour = num.slice(-4);
        if (billing.cards.some((c) => c.lastFour === lastFour && c.expiry === card.expiry)) {
          setBusy(null);
          setFormError('This payment method already exists.');
          return;
        }
        setBusy('saving');
        timer.current = setTimeout(
          () =>
            onSave({
              kind: 'card',
              card: { id: newBillingId('card'), cardName: card.cardName.trim(), cardType: card.cardType as CardType, lastFour, expiry: card.expiry },
            }),
          SAVE_MS,
        );
        return;
      }
      if (!editing && billing.banks.some((b) => b.accountNumber === bank.accountNumber)) {
        setBusy(null);
        setFormError('This payment method already exists.');
        return;
      }
      setBusy('saving');
      timer.current = setTimeout(
        () =>
          onSave({
            kind: 'bank',
            isEdit: Boolean(editing),
            bank: {
              id: editing?.id ?? newBillingId('bank'),
              bankId: bank.bankId,
              accountName: bank.accountName.trim(),
              accountNumber: bank.accountNumber,
              accountType: bank.accountType,
              institutionNumber: showCa ? bank.institutionNumber || undefined : undefined,
              transitNumber: showCa ? bank.transitNumber || undefined : undefined,
              bankRouting: showUs ? bank.bankRouting || undefined : undefined,
              sortCode: showUk ? bank.sortCode || undefined : undefined,
            },
          }),
        SAVE_MS,
      );
    }, editing ? 0 : 500);
  };

  const close = busy ? () => undefined : onClose;
  const busyLabel = busy === 'checking' ? 'Checking…' : editing ? 'Updating…' : 'Adding…';

  const numberField = (key: keyof BankDraft, label: string, hint: string, max: number, placeholder: string, required = false) => (
    <label className="block space-y-1.5">
      <Label text={label} hint={hint} required={required} />
      <input
        inputMode="numeric"
        autoComplete="off"
        value={bank[key] as string}
        onChange={(e) => setB(key, digits(e.target.value, max) as BankDraft[typeof key])}
        placeholder={placeholder}
        aria-invalid={Boolean(errors[key])}
        className={`${fieldInputClass(errors[key])} tabular-nums`}
      />
      <ErrorText error={errors[key]} />
    </label>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={close} maxHeight="max-h-[92%]">
      <SheetHeader
        title={title}
        subtitle={isCard ? 'Used for staff invoices you map to it' : editing ? 'Re-enter any number you want to change' : 'Used for staff invoices you map to it'}
        onClose={close}
      />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        {formError && (
          <p role="alert" className="px-3 py-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[12px] font-semibold text-rose-600">
            {formError}
          </p>
        )}

        {isCard ? (
          <>
            <label className="block space-y-1.5">
              <Label text="Card Name" required hint={`${card.cardName.length}/${BILLING_RULES.cardNameMax}`} />
              <input
                autoComplete="cc-name"
                value={card.cardName}
                onChange={(e) => setC('cardName', e.target.value.slice(0, BILLING_RULES.cardNameMax))}
                placeholder="Cardholder Name"
                aria-invalid={Boolean(errors.cardName)}
                className={fieldInputClass(errors.cardName)}
              />
              <ErrorText error={errors.cardName} />
            </label>
            <label className="block space-y-1.5">
              <Label text="Card Number" required />
              <input
                inputMode="numeric"
                autoComplete="cc-number"
                value={card.cardNumber}
                onChange={(e) => {
                  const masked = maskCardNumber(e.target.value);
                  setC('cardNumber', masked);
                  const detected = detectCardType(masked.replace(/\D/g, ''));
                  if (detected) {
                    setCard((d) => ({ ...d, cardNumber: masked, cardType: detected }));
                    setErrors((x) => ({ ...x, cardType: '' }));
                  }
                }}
                placeholder="Enter Card Number"
                aria-invalid={Boolean(errors.cardNumber)}
                className={`${fieldInputClass(errors.cardNumber)} tabular-nums tracking-wide`}
              />
              <ErrorText error={errors.cardNumber} />
            </label>
            <div className="space-y-1.5">
              <Label text="Card Type" required />
              <Dropdown
                ariaLabel="Card Type"
                sheetTitle="Card Type"
                value={card.cardType || null}
                placeholder="Select Card Type"
                options={CARD_TYPES}
                onChange={(v) => setC('cardType', v)}
              />
              <ErrorText error={errors.cardType} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 min-w-0">
                <Label text="Expiry" required />
                <input
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={card.expiry}
                  onChange={(e) => setC('expiry', maskExpiry(e.target.value))}
                  placeholder="MM-YYYY"
                  aria-invalid={Boolean(errors.expiry)}
                  className={`${fieldInputClass(errors.expiry)} tabular-nums`}
                />
                <ErrorText error={errors.expiry} />
              </label>
              <label className="block space-y-1.5 min-w-0">
                <Label text="Card CVV" required />
                <span className="relative block">
                  <input
                    type={cvvVisible ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={card.cvv}
                    onChange={(e) => setC('cvv', digits(e.target.value, 4))}
                    placeholder="CVV"
                    aria-invalid={Boolean(errors.cvv)}
                    className={`${fieldInputClass(errors.cvv)} pr-10 tabular-nums`}
                  />
                  <button
                    type="button"
                    onClick={() => setCvvVisible((v) => !v)}
                    aria-label={cvvVisible ? 'Hide CVV' : 'Show CVV'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 active:bg-slate-100 cursor-pointer"
                  >
                    {cvvVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </span>
                <ErrorText error={errors.cvv} />
              </label>
            </div>
            <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-px text-slate-400" />
              After saving, only the card type, name, last 4 digits and expiry are shown. The full number and CVV are never displayed.
            </p>
          </>
        ) : (
          <>
            <label className="block space-y-1.5">
              <Label text="Account Name" required />
              <input
                autoComplete="off"
                value={bank.accountName}
                onChange={(e) => setB('accountName', e.target.value.slice(0, BILLING_RULES.accountNameMax))}
                placeholder="Enter Account Name"
                aria-invalid={Boolean(errors.accountName)}
                className={fieldInputClass(errors.accountName)}
              />
              <ErrorText error={errors.accountName} />
            </label>
            {numberField('accountNumber', 'Account Number', '4–20 digits', 20, 'Enter Account Number', true)}
            <div className="space-y-1.5">
              <Label text="Bank Name" required />
              <Dropdown
                ariaLabel="Bank Name"
                sheetTitle="Select Bank"
                value={bank.bankId || null}
                placeholder="Select Bank"
                options={BANK_MASTERS.map((m) => ({ value: m.id, label: m.name }))}
                onChange={(v) => setB('bankId', v)}
              />
              <ErrorText error={errors.bankId} />
            </div>
            <div className="space-y-1.5">
              <Label text="Bank Account Type" />
              <ChoiceTiles
                multiple={false}
                options={['Checking', 'Saving']}
                selected={[bank.accountType === 'checking' ? 'Checking' : 'Saving']}
                onChange={([v]) => setB('accountType', v === 'Saving' ? 'saving' : 'checking')}
              />
            </div>
            {showCa && (
              <div className="grid grid-cols-2 gap-3">
                {numberField('institutionNumber', 'Institution No.', 'Canada · 3', 3, '000')}
                {numberField('transitNumber', 'Transit No.', '5 digits', 5, '00000')}
              </div>
            )}
            {showUs && numberField('bankRouting', 'Bank Routing', 'US · 9 digits', 9, '000000000')}
            {showUk && numberField('sortCode', 'Sort Code', 'UK · 6 digits', 6, '000000')}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={Boolean(busy)}
          className="h-12 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold bg-white active:bg-slate-50 cursor-pointer disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={Boolean(busy)}
          className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer disabled:opacity-80 disabled:cursor-wait"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? busyLabel : editing ? 'Update Payment' : 'Add Payment'}
        </button>
      </div>
    </BottomSheet>
  );
};
