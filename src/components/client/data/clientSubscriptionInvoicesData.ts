/**
 * Mock data for Invoices › Continuing Education.
 * MyCPE ONE `my-team-profile-new?tab=invoice` first tab (`data-service-table="continuing-education"`): billing history of the
 * firm's MyCPE ONE subscriptions — Subscription, License (seats), Purchase Date, Next renewal, Total Paid, Payment Method
 * ("ACH" / "CC - 4242" / "-") and Download (Invoice | Receipt links). Plans, seats, prices and card digits are dummy data.
 */
import { addDays, formatTimesheetDate, isoOf } from './clientTimesheetsData';

export interface SubscriptionInvoice {
  id: string;
  /** Desktop "Subscription" */
  title: string;
  /** Desktop "License" (seats); null = "-" */
  licenses: number | null;
  /** Purchase Date (ISO) */
  purchasedOn: string;
  /** Next renewal (ISO) = package expiry + 1 day; null = "-" */
  renewsOn: string | null;
  /** Total Paid (USD) */
  amount: number;
  /** "ACH", "CC - 4242" or null */
  method: string | null;
  /** Desktop shows an Invoice link only when the S3 file exists; Receipt is always available (regenerated on demand) */
  hasInvoice: boolean;
}

const SEED: { monthsAgo: number; title: string; licenses: number | null; amount: number; method: string | null; hasInvoice: boolean }[] = [
  { monthsAgo: 2, title: 'Unlimited CPE – Firm Subscription (Annual)', licenses: 25, amount: 4975, method: 'CC - 4242', hasInvoice: true },
  { monthsAgo: 8, title: 'Additional Licenses (Add-on)', licenses: 5, amount: 995, method: 'ACH', hasInvoice: true },
  { monthsAgo: 14, title: 'Unlimited CPE – Firm Subscription (Annual)', licenses: 20, amount: 3980, method: 'CC - 4242', hasInvoice: true },
  { monthsAgo: 26, title: 'Unlimited CPE – Firm Subscription (Annual)', licenses: 15, amount: 2985, method: 'ACH', hasInvoice: true },
  { monthsAgo: 38, title: 'Individual Subscription', licenses: null, amount: 199, method: null, hasInvoice: false },
];

/** Newest first, like the desktop table */
export const subscriptionInvoices = (today = new Date()): SubscriptionInvoice[] =>
  SEED.map((s, i) => {
    const purchasedOn = isoOf(new Date(today.getFullYear(), today.getMonth() - s.monthsAgo, 9));
    const expiry = isoOf(new Date(today.getFullYear(), today.getMonth() - s.monthsAgo + 12, 8));
    return {
      id: `sub-${i}`,
      title: s.title,
      licenses: s.licenses,
      purchasedOn,
      renewsOn: addDays(expiry, 1),
      amount: s.amount,
      method: s.method,
      hasInvoice: s.hasInvoice,
    };
  }).sort((a, b) => b.purchasedOn.localeCompare(a.purchasedOn));

export const formatSubscriptionDate = formatTimesheetDate;

export const subscriptionFileNames = {
  invoice: (s: SubscriptionInvoice) => `Invoice_${s.purchasedOn}_${s.id}.pdf`,
  receipt: (s: SubscriptionInvoice) => `Receipt_${s.purchasedOn}_${s.id}.pdf`,
};
