// Studio Quick Fill for the review form: fills what's blank with valid demo values, following the same rules as the form
import { Allocation, Certificate, DELIVERY_METHODS, FIELDS_OF_STUDY, fieldsTaken, isSessionMode, learningMethodsFor, PROVIDERS, QUALIFICATIONS, setDelivery, setLearning, withQualifications } from './certModel';

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const TITLES = ['Financial Reporting Update', 'Auditing Essentials', 'Tax Planning Workshop', 'Technology for Accountants'];
const recentDay = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1 - Math.floor(Math.random() * 60));
  return d.toLocaleDateString('en-CA');
};

const fillAllocation = (a: Allocation): Allocation =>
  a.rows.reduce<Allocation>((acc, r) => {
    const field = r.field ?? pick(FIELDS_OF_STUDY.filter((f) => !fieldsTaken(acc, r.id).includes(f)));
    return { ...acc, rows: acc.rows.map((x) => (x.id === r.id ? { ...x, field, credits: Number(x.credits) > 0 ? x.credits : pick(['1.0', '1.5', '2.0']) } : x)) };
  }, a);

export const fillBlanks = (from: Certificate): Certificate => {
  let c: Certificate = { ...from, title: from.title.trim() || pick(TITLES), provider: from.provider ?? pick(PROVIDERS) };
  if (!c.delivery) c = setDelivery(c, pick(DELIVERY_METHODS));
  const methods = learningMethodsFor(c.delivery);
  if (methods.length && !c.learning) c = setLearning(c, pick(methods));
  const atLeastOne = (list: Allocation[]) => (list.length ? list : withQualifications([], [pick(QUALIFICATIONS)])).map(fillAllocation);
  return isSessionMode(c)
    ? { ...c, sessions: c.sessions.map((s, i) => ({ ...s, name: s.name.trim() || `${pick(TITLES)} ${i + 1}`, date: s.date || recentDay(), allocations: atLeastOne(s.allocations) })) }
    : { ...c, date: c.date || recentDay(), allocations: atLeastOne(c.allocations) };
};
