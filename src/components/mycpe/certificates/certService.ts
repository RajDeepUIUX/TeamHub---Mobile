/**
 * MOCK SERVICE. No AI extraction or submission API exists in this app yet, so nothing here reads a file or sends anything.
 * The screens only use `analyzeCertificate` and `submitCertificates`; replace those two with real calls.
 *
 * Demo results: the 1st, 2nd and 3rd certificates get the three sample certificates from the specification; a 4th and 5th come
 * back with nothing identified. To see other outcomes, put one of these words in a file's name, or add &demo=word to the URL
 * (it then applies to the 2nd file):
 *   fail             analysis fails the first time, works on Retry
 *   not-certificate  the document isn't a certificate
 *   mismatch         the holder's name doesn't match the learner
 *   submit-fail      the first submission fails
 */
import { Allocation, blankCertificate, Certificate, CertFile, CertificatePayload, FailReason, newAllocation, newRow, newSession } from './certModel';

export const ANALYSIS_STAGES = [
  'Reading certificates',
  'Extracting course information',
  'Identifying learning methods',
  'Mapping qualifications and credits',
  'Preparing certificates for review',
];

export type AnalysisResult = { ok: true; certificate: Certificate } | { ok: false; reason: FailReason };

interface AnalyzeOptions {
  /** Position in the upload list */
  index: number;
  onStage: (stage: number) => void;
  signal: AbortSignal;
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Cancelled', 'AbortError'));
    });
  });

const alloc = (qualification: string, ...fields: [string, string][]): Allocation => newAllocation(qualification, fields.map(([f, c]) => newRow(f, c)));

/** The three certificates of the specification's demonstration */
const SAMPLES: ((id: string) => Certificate)[] = [
  (id) =>
    blankCertificate(id, {
      title: 'Annual Accounting and Finance Conference',
      delivery: 'Group Program',
      learning: 'Virtual Conference',
      multiple: true,
      provider: 'AICPA',
      sessions: [
        newSession('2026-11-18', 'Advanced Financial Reporting', [
          alloc('CA - Ireland', ['Accounting', '2.0'], ['Auditing', '1.0']),
          alloc('CMA', ['Accounting', '3.0']),
          alloc('Alaska - CPA (US)', ['Accounting', '2.0'], ['Finance', '1.0']),
        ]),
        newSession('2026-11-18', 'Professional Ethics', [alloc('California - IAR', ['Ethics', '2.0']), alloc('CFE', ['Behavioral Ethics', '2.0'])]),
        newSession('2026-11-19', 'Business and Technology', [
          alloc('CA - Ireland', ['Business Law', '1.0'], ['Information Technology', '2.0']),
          alloc('CMA', ['Information Technology', '3.0']),
        ]),
      ],
      aiFilled: ['title', 'delivery', 'learning', 'multiple', 'provider'],
    }),
  (id) =>
    blankCertificate(id, {
      title: 'Advanced Financial Management',
      date: '2026-11-20',
      delivery: 'Self Study Program',
      learning: 'On Demand',
      provider: 'Becker Professional Education',
      allocations: [alloc('CMA', ['Finance', '2.0']), alloc('CFE', ['Finance', '2.0']), alloc('Alaska - CPA (US)', ['Finance', '2.0'])],
      aiFilled: ['title', 'date', 'delivery', 'learning', 'provider', 'quals'],
    }),
  (id) =>
    blankCertificate(id, {
      title: 'Emerging Trends in Professional Ethics',
      date: '2026-11-21',
      delivery: 'Publication',
      provider: 'ACFE',
      allocations: [alloc('CFE', ['Ethics', '1.0']), alloc('CMA', ['Behavioral Ethics', '1.0'])],
      aiFilled: ['title', 'date', 'delivery', 'provider', 'quals'],
    }),
];

/** Nothing identified: the fields stay empty */
const unidentified = (id: string) =>
  blankCertificate(id, {
    unidentified: ['Course Title', 'Date of Completion', 'Method of Delivery', 'Continuing Education Provider', 'Credits'],
  });

const urlDemo = () => (typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('demo') ?? '');
const asksFor = (word: string, file: CertFile, index: number) => file.name.toLowerCase().includes(word) || (urlDemo() === word && index === 1);

const tried = new Set<string>();

export const analyzeCertificate = async (file: CertFile, { index, onStage, signal }: AnalyzeOptions): Promise<AnalysisResult> => {
  const retry = tried.has(file.id);
  tried.add(file.id);
  for (let stage = 0; stage < ANALYSIS_STAGES.length; stage++) {
    onStage(stage);
    await wait(800, signal);
    if (stage === 0 && asksFor('not-certificate', file, index)) return { ok: false, reason: 'not_certificate' };
    if (stage === 1 && !retry && file.name.toLowerCase().includes('submit-fail') === false && asksFor('fail', file, index)) return { ok: false, reason: 'failed' };
  }
  const sample = SAMPLES[file.sample ?? index];
  const certificate = sample ? sample(file.id) : unidentified(file.id);
  return { ok: true, certificate: asksFor('mismatch', file, index) ? { ...certificate, nameMismatch: true } : certificate };
};

let submissions = 0;

export const submitCertificates = async (payloads: CertificatePayload[]): Promise<{ submitted: number }> => {
  await wait(1500);
  const failOnce = urlDemo() === 'submit-fail' || payloads.some((p) => p.fileName.toLowerCase().includes('submit-fail'));
  if (failOnce && submissions++ === 0) throw new Error('Submission failed');
  return { submitted: payloads.length };
};

/** Quick Fill on the upload screen: three sample certificates (no real documents) */
export const SAMPLE_FILES: Omit<CertFile, 'id' | 'status'>[] = [
  { name: 'Annual-Accounting-and-Finance-Conference.pdf', size: 2_516_582, kind: 'PDF', sample: 0 },
  { name: 'Advanced-Financial-Management.pdf', size: 1_153_434, kind: 'PDF', sample: 1 },
  { name: 'Emerging-Trends-in-Professional-Ethics.jpg', size: 3_355_443, kind: 'JPG', sample: 2 },
];
/** What the sample viewer prints, so a sample never looks like a real document */
export const sampleSummary = (sample: number) => {
  const c = SAMPLES[sample]?.('preview');
  return c && { title: c.title, provider: c.provider ?? '', date: c.date || c.sessions[0]?.date || '' };
};
