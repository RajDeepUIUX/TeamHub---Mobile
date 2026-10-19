/**
 * Client User Profile (desktop "Update Profile" modal, `bottom.tpl` + `user_profile&task=updateProfileContact`;
 * desktop now opens MyCPE ONE `dashboard/common-profile`, so B's rules apply on top: name change by request,
 * email locked for ERP clients, time zone, photo crop). Field names follow A `tblcontacts`.
 */

export type NameChangeStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ClientNameChangeRequest {
  firstName: string;
  lastName: string;
  reason: string;
  files: string[];
  submittedAt: string;
  status: NameChangeStatus;
}

export interface ClientUserProfile {
  firstName: string;
  lastName: string;
  email: string;
  /** US format 999-999-9999 (desktop input mask) */
  phone: string;
  /** ISO yyyy-mm-dd, empty when not set */
  birthDate: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  timeZone: string;
  designation: string;
  memberSince: string;
  lastSyncedAt: string;
  nameChange: ClientNameChangeRequest | null;
}

export const CLIENT_USER_PROFILE_SEED: ClientUserProfile = {
  firstName: 'Taylor',
  lastName: 'Morgan',
  email: 'taylor.morgan@northwindcpa.example',
  phone: '617-555-0148',
  birthDate: '1985-06-12',
  address: '100 Example Avenue, Suite 400',
  country: 'United States',
  state: 'Massachusetts',
  city: 'Boston',
  zipCode: '02110',
  timeZone: 'America/New_York',
  designation: 'Managing Partner',
  memberSince: '2021-03-08',
  lastSyncedAt: '2026-10-15T09:42:00',
  nameChange: null,
};

/** Country → State → City (desktop cascades `getStatesByCountryAjax` → `getCitiesByStateAjax`) */
export const CLIENT_LOCATIONS: Record<string, Record<string, string[]>> = {
  'United States': {
    California: ['Irvine', 'Los Angeles', 'Sacramento', 'San Diego', 'San Francisco', 'San Jose'],
    Florida: ['Jacksonville', 'Miami', 'Orlando', 'Tampa'],
    Georgia: ['Atlanta', 'Augusta', 'Savannah'],
    Illinois: ['Chicago', 'Naperville', 'Springfield'],
    Massachusetts: ['Boston', 'Cambridge', 'Springfield', 'Worcester'],
    'New Jersey': ['Edison', 'Jersey City', 'Newark', 'Princeton'],
    'New York': ['Albany', 'Buffalo', 'New York City', 'Rochester'],
    Texas: ['Austin', 'Dallas', 'Houston', 'San Antonio'],
    Washington: ['Bellevue', 'Seattle', 'Spokane', 'Tacoma'],
  },
  Canada: {
    'British Columbia': ['Vancouver', 'Victoria'],
    Ontario: ['Mississauga', 'Ottawa', 'Toronto'],
    Quebec: ['Montreal', 'Quebec City'],
  },
  India: {
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara'],
    Maharashtra: ['Mumbai', 'Pune'],
  },
  'United Kingdom': {
    England: ['London', 'Manchester'],
    Scotland: ['Edinburgh', 'Glasgow'],
  },
};

export const CLIENT_COUNTRIES = Object.keys(CLIENT_LOCATIONS);
export const statesOf = (country: string) => Object.keys(CLIENT_LOCATIONS[country] ?? {});
export const citiesOf = (country: string, state: string) => CLIENT_LOCATIONS[country]?.[state] ?? [];

/** MyCPE ONE timezone list (B `timezones`, PHP identifiers) — common client zones */
export const CLIENT_TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'America/Toronto', label: 'Toronto (ET)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
] as const;

export const timeZoneLabel = (value: string) => CLIENT_TIME_ZONES.find((t) => t.value === value)?.label ?? value;

/** Desktop rules: JPG / PNG only, cropped to a 400 × 400 square */
export const PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png'];
export const PROFILE_PHOTO_MAX_MB = 5;
export const PROFILE_PHOTO_SIZE = 400;

/** B `submitNameChangeRequest`: letters + spaces, ≤50 chars, reason ≤512, ID proof required */
export const NAME_MAX = 50;
export const NAME_REASON_MAX = 512;
export const ID_PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const ID_PROOF_MAX_FILES = 3;
export const ID_PROOF_MAX_MB = 5;

/** Field limits from B (`limitChar`) */
export const ADDRESS_MAX = 300;
export const ZIP_MAX = 10;

/** 6175550148 → 617-555-0148 while typing (desktop `inputmask 999-999-9999`) */
export const formatUsPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
};
