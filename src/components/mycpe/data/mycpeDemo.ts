// MyCPE Quick Fill: random but valid values for the sign-in forms
import { MYCPE_QUALIFICATIONS } from './mycpeAuthData';

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

const FIRST = ['Olivia', 'Anita', 'James', 'Emily', 'Daniel', 'Sophia', 'Michael', 'Grace', 'Ethan', 'Laura'];
const LAST = ['Joe', 'Miller', 'Carter', 'Bennett', 'Hughes', 'Parker', 'Foster', 'Reed', 'Morgan', 'Brooks'];

export const demoFirstName = () => pick(FIRST);
export const demoLastName = () => pick(LAST);
export const demoEmail = (first = demoFirstName(), last = demoLastName()) =>
  `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '') + `${digits(2)}@gmail.com`;
export const demoPassword = () => `${pick(['Learn', 'Credit', 'Ledger', 'Audit'])}@${digits(4)}${pick(['Ax', 'Qz', 'Mr', 'Kp'])}`;

/** One to three different qualifications, in list order */
export const demoQualifications = () => {
  const count = 1 + Math.floor(Math.random() * 3);
  const chosen = new Set<string>();
  while (chosen.size < count) chosen.add(pick(MYCPE_QUALIFICATIONS));
  return MYCPE_QUALIFICATIONS.filter((q) => chosen.has(q));
};
