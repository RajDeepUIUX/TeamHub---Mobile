/**
 * Mock data for Invoices › Billing Details.
 * Desktop has no page of its own: MyCPE ONE "Billing → HRMS (Offshoring)" (`teamprofile-new.blade.php` `hrms-payment-section`)
 * reads / writes system C (`hr.my-cpe.com/api`) through `HrmsPaymentService` (Part F5 "Payments"):
 * 1 Payment Information (Bank Details / Credit Card / Direct Pay) and 2 Payment Mapping (staff → payment method).
 * Every bank, card, account number and name below is dummy data.
 */
import { CURRENT_STAFF_STATUSES, ClientStaffMember } from './clientStaffData';

export type BankAccountType = 'checking' | 'saving';
export type PaymentType = 'bank' | 'card' | 'direct';

export interface BillingBankAccount {
  id: string;
  /** Bank master id (`bank_masters`) */
  bankId: string;
  accountName: string;
  accountNumber: string;
  accountType: BankAccountType;
  /** Canada — 3 digits */
  institutionNumber?: string;
  /** Canada — 5 digits */
  transitNumber?: string;
  /** US — 9 digits */
  bankRouting?: string;
  /** UK — 6 digits */
  sortCode?: string;
}

export interface BillingCreditCard {
  id: string;
  cardName: string;
  cardType: CardType;
  /** HRMS only returns the last 4 digits (PCI change) */
  lastFour: string;
  /** MM-YYYY */
  expiry: string;
}

/** One desktop mapping row: Select Staff(s) · Payment Type · Payment Method */
export interface PaymentMappingRow {
  id: string;
  staffIds: string[];
  type: PaymentType;
  /** Bank / card id; null for Direct Pay (or when its method was deleted) */
  methodId: string | null;
}

export interface BillingDetails {
  banks: BillingBankAccount[];
  cards: BillingCreditCard[];
  /** HRMS `direct_pay_enabled`: the account may use Direct Pay */
  directPayEligible: boolean;
  directPayEnabled: boolean;
  /** Working copy of the mapping table (what the screen shows) */
  mappings: PaymentMappingRow[];
  /** Last submitted mapping (desktop re-reads it from `hrms-timesheet-mappings`) */
  submittedMappings: PaymentMappingRow[];
  submittedAt: string | null;
  submittedBy: string | null;
  draftSavedAt: string | null;
}

/** Desktop `country`: 1 Canada, 2 US, 3 UK, null = show every bank field */
export type BillingCountry = 'CA' | 'US' | 'UK' | null;

export const billingCountryOf = (country: string): BillingCountry =>
  country === 'Canada' ? 'CA' : country === 'United States' ? 'US' : country === 'United Kingdom' ? 'UK' : null;

/** Dummy bank masters (HRMS `bank_masters`) */
export const BANK_MASTERS: { id: string; name: string }[] = [
  { id: 'bm-1', name: 'Harborview National Bank' },
  { id: 'bm-2', name: 'Summit Federal Bank' },
  { id: 'bm-3', name: 'Lakeshore Credit Union' },
  { id: 'bm-4', name: 'First Meridian Bank' },
  { id: 'bm-5', name: 'Pioneer Trust Bank' },
  { id: 'bm-6', name: 'Cedar Valley Bank' },
  { id: 'bm-7', name: 'Granite State Savings' },
  { id: 'bm-8', name: 'Bluewater Community Bank' },
];

export const bankNameOf = (bank: BillingBankAccount) => BANK_MASTERS.find((m) => m.id === bank.bankId)?.name ?? bank.accountName;

/** Desktop Card Type select */
export const CARD_TYPES = ['Visa', 'Mastercard', 'American Express', 'Discover', 'JCB', 'UnionPay', 'Diners Club'] as const;
export type CardType = (typeof CARD_TYPES)[number];

/** Short brand mark shown on card tiles (desktop uses brand SVGs) */
export const CARD_BRAND: Record<CardType, { mark: string; className: string }> = {
  Visa: { mark: 'VISA', className: 'bg-[#EFF6FF] text-[#1D4ED8]' },
  Mastercard: { mark: 'MC', className: 'bg-[#FFF7ED] text-[#EA580C]' },
  'American Express': { mark: 'AMEX', className: 'bg-[#ECFEFF] text-[#0E7490]' },
  Discover: { mark: 'DISC', className: 'bg-[#FEF8E7] text-[#D97706]' },
  JCB: { mark: 'JCB', className: 'bg-[#E8F8F0] text-[#059669]' },
  UnionPay: { mark: 'UP', className: 'bg-[#FEF2F2] text-rose-600' },
  'Diners Club': { mark: 'DC', className: 'bg-[#EEF2FF] text-[#4F46E5]' },
};

/** Card type from the number's first digits, so the select fills itself (Added by designer) */
export const detectCardType = (digits: string): CardType | null => {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^3(0[0-5]|[68])/.test(digits)) return 'Diners Club';
  if (/^35/.test(digits)) return 'JCB';
  if (/^(6011|65|64[4-9])/.test(digits)) return 'Discover';
  if (/^62/.test(digits)) return 'UnionPay';
  return null;
};

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = { bank: 'Bank', card: 'Credit Card', direct: 'Direct Pay' };

/** "•••• 4821" */
export const maskedLast4 = (value: string) => `•••• ${value.replace(/\D/g, '').slice(-4)}`;

/** "08-2028" → "08/28" (desktop `hrmsFormatExpiry`) */
export const formatExpiry = (value: string) => {
  const [m, y] = value.split(/[-/]/);
  return y ? `${m.padStart(2, '0')}/${y.slice(-2)}` : value;
};

/** A card works until the end of its expiry month: "11-2026" → Nov 30, 2026 23:59:59 */
const cardLastDayOf = (expiry: string) => {
  const [m, y] = expiry.split('-').map(Number);
  return m && y ? new Date(y, m, 0, 23, 59, 59) : null;
};

/** Card expired before this month / expires within 60 days (Added by designer) */
export const cardExpiryState = (expiry: string, today = new Date()): 'expired' | 'soon' | 'ok' => {
  const lastDay = cardLastDayOf(expiry);
  if (!lastDay) return 'ok';
  if (lastDay < new Date(today.getFullYear(), today.getMonth(), 1)) return 'expired';
  return lastDay.getTime() - today.getTime() < 60 * 86_400_000 ? 'soon' : 'ok';
};

/** One Dashboard "Action Required" row */
export interface BillingActionItem {
  id: string;
  state: 'soon' | 'expired';
  title: string;
  description: string;
  /** Pill text: "Expires in 36 days" / "Expired" */
  status: string;
}

/** "Visa card" · "Mastercard" (the brand already says card) */
const cardPhraseOf = (type: CardType) => (/card$/i.test(type) ? type : `${type} card`);

/** Dashboard "Action Required": every card that is expired or expires within 60 days, in card order (Added by designer — no desktop equivalent) */
export const billingActionItemsOf = (b: BillingDetails, today = new Date()): BillingActionItem[] =>
  b.cards.flatMap((card): BillingActionItem[] => {
    const state = cardExpiryState(card.expiry, today);
    const lastDay = cardLastDayOf(card.expiry);
    if (state === 'ok' || !lastDay) return [];
    const date = lastDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const phrase = `Your ${cardPhraseOf(card.cardType)} ending in ${card.lastFour}`;
    if (state === 'expired') {
      return [
        {
          id: `card-expired-${card.id}`,
          state,
          title: 'Billing Card Expired',
          description: `${phrase} expired on ${date}. Please update your payment method.`,
          status: 'Expired',
        },
      ];
    }
    const days = Math.max(1, Math.ceil((lastDay.getTime() - today.getTime()) / 86_400_000));
    return [
      {
        id: `card-soon-${card.id}`,
        state,
        title: 'Billing Card Expiring Soon',
        description: `${phrase} expires on ${date}. Update your billing information to avoid payment interruptions.`,
        status: `Expires in ${days} ${days === 1 ? 'day' : 'days'}`,
      },
    ];
  });

export const methodLabel = (b: BillingDetails, type: PaymentType, methodId: string | null) => {
  if (type === 'direct') return 'Direct Pay';
  if (type === 'bank') {
    const bank = b.banks.find((x) => x.id === methodId);
    return bank ? `${bankNameOf(bank)} ${maskedLast4(bank.accountNumber)}` : 'Bank account removed';
  }
  const card = b.cards.find((x) => x.id === methodId);
  return card ? `${card.cardType} ${maskedLast4(card.lastFour)}` : 'Card removed';
};

/** Row has a type and (except Direct Pay) a method that still exists */
export const isMappingComplete = (b: BillingDetails, r: PaymentMappingRow) =>
  r.type === 'direct'
    ? b.directPayEnabled
    : r.type === 'bank'
      ? b.banks.some((x) => x.id === r.methodId)
      : b.cards.some((x) => x.id === r.methodId);

/** Staff billed on the account (HRMS `staffs`): everyone not Inactive */
export const billableStaffOf = (staff: ClientStaffMember[]) =>
  [...staff].filter((s) => CURRENT_STAFF_STATUSES.includes(s.status)).sort((a, b) => a.name.localeCompare(b.name));

export const unmappedStaffIds = (b: BillingDetails, staffIds: string[]) => {
  const mapped = new Set(b.mappings.flatMap((r) => r.staffIds));
  return staffIds.filter((id) => !mapped.has(id));
};

/** Staff on a row whose payment method was deleted / disabled: in the table, but not payable yet */
export const needsMethodStaffIds = (b: BillingDetails) => b.mappings.filter((r) => !isMappingComplete(b, r)).flatMap((r) => r.staffIds);

export const mappingsEqual = (a: PaymentMappingRow[], b: PaymentMappingRow[]) => {
  const key = (rows: PaymentMappingRow[]) =>
    JSON.stringify(rows.filter((r) => r.staffIds.length).map((r) => [r.id, r.type, r.methodId, [...r.staffIds].sort()]));
  return key(a) === key(b);
};

/** Desktop Add Payment Information validation (B `hrmsAddPaymentForm`) */
export const BILLING_RULES = {
  accountName: /^[a-zA-Z\s'\-.]+$/,
  accountNumber: /^\d{4,20}$/,
  accountNameMax: 60,
  cardNameMax: 30,
  institutionLen: 3,
  transitLen: 5,
  routingLen: 9,
  sortCodeLen: 6,
};

/** Desktop `validateHrmsExpiry` messages */
export const expiryError = (value: string, today = new Date()): string | null => {
  if (!value) return 'Please enter the card expiry date.';
  if (!/^\d{2}-\d{4}$/.test(value)) return 'Enter expiry in MM-YYYY format - e.g., 06-2027.';
  const [mm, yyyy] = value.split('-');
  const month = Number(mm);
  if (month < 1 || month > 12) return `Month ${mm} is not valid. Please enter a month between 01 and 12.`;
  if (new Date(Number(yyyy), month - 1, 1) < new Date(today.getFullYear(), today.getMonth(), 1))
    return `This card expired in ${mm}-${yyyy}. Please use a card that hasn't expired yet.`;
  return null;
};

/** Desktop mask: digits only, dash after the month → MM-YYYY */
export const maskExpiry = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 6);
  return d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
};

/** "4242 4242 4242 4242" (max 19 digits) */
export const maskCardNumber = (raw: string) =>
  raw
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

/** Mock portal password check (B `verifyHrmsPaymentPassword`): any password of 6+ characters passes */
export const VERIFY_MIN_LENGTH = 6;
/** How long verified bank numbers stay visible (Added by designer) */
export const REVEAL_MS = 2 * 60_000;

export const newBillingId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Northwind CPA: two bank accounts, two cards (Visa expiring soon, unmapped Mastercard expired), Direct Pay available; the three newest joiners are not mapped yet */
export const billingSeedFor = (staff: ClientStaffMember[]): BillingDetails => {
  const ids = billableStaffOf(staff).map((s) => s.id);
  const byName = (names: string[]) =>
    names.map((n) => staff.find((s) => s.name === n)?.id).filter((id): id is string => Boolean(id) && ids.includes(id as string));

  const mappings: PaymentMappingRow[] = [
    {
      id: 'map-1',
      type: 'bank',
      methodId: 'bank-1',
      staffIds: byName([
        'Aarav Mehta',
        'Aditya Rao',
        'Ananya Iyer',
        'Arnav Joshi',
        'Charvi Nair',
        'Dev Malhotra',
        'Farhan Qureshi',
        'Gaurav Bansal',
        'Heena Kulkarni',
        'Isha Menon',
      ]),
    },
    { id: 'map-2', type: 'card', methodId: 'card-1', staffIds: byName(['Kavya Reddy', 'Manav Saxena', 'Priti Bhatt', 'Rohan Verma', 'Uday Sethi']) },
  ];

  return {
    banks: [
      {
        id: 'bank-1',
        bankId: 'bm-1',
        accountName: 'Northwind CPA Operating',
        accountNumber: '000123454821',
        accountType: 'checking',
        bankRouting: '011234567',
      },
      {
        id: 'bank-2',
        bankId: 'bm-2',
        accountName: 'Northwind CPA Reserve',
        accountNumber: '000987657730',
        accountType: 'saving',
        bankRouting: '021345678',
      },
    ],
    cards: [
      { id: 'card-1', cardName: 'Taylor Morgan', cardType: 'Visa', lastFour: '4242', expiry: '11-2026' },
      { id: 'card-2', cardName: 'Jordan Ellis', cardType: 'Mastercard', lastFour: '5678', expiry: '09-2026' },
    ],
    directPayEligible: true,
    directPayEnabled: true,
    mappings,
    submittedMappings: mappings,
    submittedAt: '2026-10-05T15:20:00',
    submittedBy: 'Taylor Morgan',
    draftSavedAt: null,
  };
};

/** "2 banks · 1 card · 15 / 18 staff mapped" (Invoices link, Added by designer) */
export const billingSummaryOf = (b: BillingDetails, staff: ClientStaffMember[]) => {
  const ids = billableStaffOf(staff).map((s) => s.id);
  const mapped = ids.length - unmappedStaffIds(b, ids).length - needsMethodStaffIds(b).length;
  const parts = [
    b.banks.length ? `${b.banks.length} ${b.banks.length === 1 ? 'bank' : 'banks'}` : null,
    b.cards.length ? `${b.cards.length} ${b.cards.length === 1 ? 'card' : 'cards'}` : null,
  ].filter(Boolean);
  return `${parts.length ? parts.join(' · ') : 'No payment method'} · ${mapped} / ${ids.length} staff mapped`;
};
