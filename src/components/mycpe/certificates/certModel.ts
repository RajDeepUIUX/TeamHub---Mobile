// Upload & Autofill with AI: option lists, conditional rules, validation and totals (no UI here)

/* ------------------------------------ Options ------------------------------------ */

export const DELIVERY_METHODS = [
  'Group Program',
  'Self Study Program',
  'Blended Learning Programs',
  'Committee / Firm Meeting',
  'Publication',
  'Instruction',
  'University',
  'Technical Reviewer',
  'Informal Learning',
  'Certification Programs',
  'Editorial Advisory Credit',
  'Fraud Magazine',
  'ACFE Working Group',
  'CFE Exam Development',
  'ACFE-Approved Certification Programs',
  'Chapter Programming',
  'Project Work',
  'Mentoring',
];

const LEARNING_METHODS: Record<string, string[]> = {
  'Group Program': ['Live Webinars', 'In-Person Events', 'Virtual Conference'],
  'Self Study Program': ['On Demand', 'E-Books', 'Podcasts', 'Nano Courses'],
};

export const PROVIDERS = ['AICPA', 'ACFE', 'Becker Professional Education', 'Checkpoint Learning (Thomson Reuters)', 'CPA Academy', 'Kaplan'];

export const QUALIFICATIONS = [
  'AFSP',
  'Alabama - CPA (US)',
  'Alaska - CPA (US)',
  'CA - Ireland',
  'CFE',
  'CMA',
  'CPE',
  'CPP',
  'California - IAR',
  'Idaho - CPA (US)',
  'Iowa - CPA (US)',
];

/** No qualification-specific mapping exists in the app, so every qualification offers the full list */
export const FIELDS_OF_STUDY = [
  'Accounting',
  'Accounting & Auditing',
  'Auditing',
  'Behavioral Ethics',
  'Business Law',
  'Communications and Marketing',
  'Ethics',
  'Federal Ethics',
  'Federal Tax Law',
  'Federal Tax Update',
  'Finance',
  'Information Technology',
];

/* ------------------------------------- Model ------------------------------------- */

export const MAX_FILES = 5;
export const MAX_BYTES = 20 * 1024 * 1024;
export const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

export interface CertFile {
  id: string;
  name: string;
  size: number;
  kind: 'PDF' | 'JPG' | 'PNG' | 'FILE';
  /** Preview of the real file; none for a demo sample */
  url?: string;
  /** Demo sample (Quick Fill): which sample result it stands for */
  sample?: number;
  status: 'uploading' | 'uploaded' | 'error';
  error?: UploadError;
}

export type UploadError = 'format' | 'size' | 'content' | 'upload';
export const UPLOAD_ERROR_TEXT: Record<UploadError, string> = {
  format: 'Unsupported file format. Please upload a PDF, JPG, or PNG file.',
  size: 'This file exceeds the 20 MB limit.',
  content: 'Uploaded file does not contain certificate details.',
  upload: 'This file could not be uploaded. Please try again.',
};

export interface FieldRow {
  id: string;
  field: string | null;
  credits: string;
}
export interface Allocation {
  id: string;
  qualification: string;
  rows: FieldRow[];
}
export interface Session {
  id: string;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  allocations: Allocation[];
}

export type FailReason = 'failed' | 'not_certificate';
export type AiField = 'title' | 'date' | 'delivery' | 'learning' | 'multiple' | 'provider' | 'quals';

export interface Certificate {
  /** Same as its file's id */
  id: string;
  title: string;
  date: string;
  delivery: string | null;
  learning: string | null;
  multiple: boolean | null;
  provider: string | null;
  allocations: Allocation[];
  sessions: Session[];

  source: 'ai' | 'manual' | 'failed';
  failReason?: FailReason;
  /** Filled by AI and not edited since */
  aiFilled: AiField[];
  /** Labels of the fields AI couldn't identify */
  unidentified: string[];
  nameMismatch?: boolean;

  reviewed: boolean;
  /** Confirm & Continue was tapped with something missing */
  attempted: boolean;
  /** Error keys found by that tap and not fixed since: the only ones shown, so a field just added or being edited is never red */
  flagged: string[];
  /** Opened at least once */
  visited: boolean;
}

let seq = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const newRow = (field: string | null = null, credits = ''): FieldRow => ({ id: uid('row'), field, credits });
export const newAllocation = (qualification: string, rows: FieldRow[] = [newRow()]): Allocation => ({ id: uid('alloc'), qualification, rows });
export const newSession = (date = '', name = '', allocations: Allocation[] = []): Session => ({ id: uid('session'), name, date, allocations });
export const blankCertificate = (id: string, patch: Partial<Certificate> = {}): Certificate => settle({
  id,
  title: '',
  date: '',
  delivery: null,
  learning: null,
  multiple: null,
  provider: null,
  allocations: [],
  sessions: [],
  source: 'ai',
  aiFilled: [],
  unidentified: [],
  reviewed: false,
  attempted: false,
  flagged: [],
  visited: false,
  ...patch,
});

/* ------------------------------- Conditional rules ------------------------------- */

export const learningMethodsFor = (delivery: string | null) => (delivery ? LEARNING_METHODS[delivery] ?? [] : []);

/** "Does this certificate include multiple sessions?" */
export const asksSessions = (c: Pick<Certificate, 'delivery' | 'learning'>) =>
  c.delivery === 'Group Program' && (c.learning === 'In-Person Events' || c.learning === 'Virtual Conference');

/** Date, qualifications and credits live in course sessions instead of on the certificate */
export const isSessionMode = (c: Certificate) => asksSessions(c) && c.multiple === true;

/** Drops whatever the current selections no longer allow */
const settle = (c: Certificate): Certificate => {
  const learning = c.learning && learningMethodsFor(c.delivery).includes(c.learning) ? c.learning : null;
  const next = { ...c, learning };
  // A hidden answer is dropped, and what AI said about it
  if (!asksSessions(next)) return { ...next, multiple: null, sessions: [], aiFilled: next.aiFilled.filter((f) => f !== 'multiple') };
  // No unless AI or the learner says otherwise
  if (next.multiple !== true) return { ...next, multiple: false, sessions: [] };
  // Session mode always has at least one session; the certificate's own date and qualifications are kept, unused, in case it's switched back
  return next.sessions.length ? next : { ...next, sessions: [newSession(next.date)] };
};

export const setDelivery = (c: Certificate, delivery: string) => settle({ ...c, delivery });
export const setLearning = (c: Certificate, learning: string) => settle({ ...c, learning });
export const setMultiple = (c: Certificate, multiple: boolean) => settle({ ...c, multiple });

const rowHasData = (r: FieldRow) => Boolean(r.field || r.credits);
export const allocationHasData = (a: Allocation) => a.rows.some(rowHasData);
export const sessionHasData = (s: Session) => Boolean(s.name.trim() || s.allocations.length);
export const certificateHasData = (c: Certificate) =>
  Boolean(c.title || c.date || c.delivery || c.provider || c.allocations.length || c.sessions.some(sessionHasData));

/** A change that would remove entered session details */
export const losesSessions = (from: Certificate, to: Certificate) => isSessionMode(from) && !isSessionMode(to) && from.sessions.some(sessionHasData);

/* --------------------------------- Allocations ---------------------------------- */

/** Keeps the allocations already made and adds blank ones for new qualifications, in list order */
export const withQualifications = (allocations: Allocation[], selected: string[]) =>
  selected.map((q) => allocations.find((a) => a.qualification === q) ?? newAllocation(q));

/** A field of study can be used once per qualification */
export const fieldsTaken = (a: Allocation, exceptRow: string) => a.rows.filter((r) => r.id !== exceptRow && r.field).map((r) => r.field as string);

export const updateRow = (a: Allocation, rowId: string, patch: Partial<FieldRow>): Allocation => {
  if (patch.field && fieldsTaken(a, rowId).includes(patch.field)) return a;
  return { ...a, rows: a.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)) };
};
/** Course sessions only; a certificate without sessions allows one field of study per qualification */
export const addRow = (a: Allocation): Allocation => ({ ...a, rows: [...a.rows, newRow()] });
export const removeRow = (a: Allocation, rowId: string): Allocation => (a.rows.length > 1 ? { ...a, rows: a.rows.filter((r) => r.id !== rowId) } : a);

/** Digits and one decimal point */
export const cleanCredits = (v: string) => {
  const [whole, ...rest] = v.replace(/,/g, '.').replace(/[^\d.]/g, '').split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
};
const creditValue = (v: string) => (/^(\d+\.?\d*|\.\d+)$/.test(v) ? Number(v) : NaN);
export const totalCredits = (a: Allocation) => a.rows.reduce((sum, r) => sum + (creditValue(r.credits) || 0), 0);
export const formatCredits = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return `${Number.isInteger(r * 10) ? r.toFixed(1) : r.toFixed(2)} ${r === 1 ? 'Credit' : 'Credits'}`;
};

/** Credits per qualification, across sessions. Not summed together: the same course counts separately towards each licence. */
export const creditSummary = (c: Certificate) => {
  const totals = new Map<string, number>();
  const allocations = isSessionMode(c) ? c.sessions.flatMap((s) => s.allocations) : c.allocations.map((a) => ({ ...a, rows: a.rows.slice(0, 1) }));
  allocations.forEach((a) => totals.set(a.qualification, (totals.get(a.qualification) ?? 0) + totalCredits(a)));
  return [...totals].map(([qualification, credits]) => ({ qualification, credits }));
};

/** Fields AI couldn't identify that the learner hasn't filled in yet */
export const stillUnidentified = (c: Certificate) => {
  const sessions = isSessionMode(c);
  const allocations = sessions ? c.sessions.flatMap((s) => s.allocations) : c.allocations;
  const filled: Record<string, boolean> = {
    'Course Title': Boolean(c.title.trim()),
    'Date of Completion': sessions ? c.sessions.every((s) => s.date) : Boolean(c.date),
    'Method of Delivery': Boolean(c.delivery),
    'Continuing Education Provider': Boolean(c.provider),
    Credits: allocations.length > 0 && allocations.every((a) => totalCredits(a) > 0),
  };
  return c.unidentified.filter((label) => !filled[label]);
};

/* ---------------------------------- Validation ---------------------------------- */

export interface CertError {
  key: string;
  message: string;
  sessionId?: string;
}
export const rowKey = (allocId: string, rowId: string, part: 'field' | 'credits') => `${allocId}/${rowId}/${part}`;
export const sessionKey = (sessionId: string, part: 'name' | 'date' | 'quals') => `${sessionId}/${part}`;

const allocationErrors = (allocations: Allocation[], oneField: boolean, sessionId?: string): CertError[] =>
  allocations.flatMap((a) =>
    (oneField ? a.rows.slice(0, 1) : a.rows).flatMap((r) => {
      const out: CertError[] = [];
      if (!r.field) out.push({ key: rowKey(a.id, r.id, 'field'), message: 'Select a field of study.', sessionId });
      else if (fieldsTaken(a, r.id).includes(r.field) && !oneField) out.push({ key: rowKey(a.id, r.id, 'field'), message: 'Already added.', sessionId });
      if (!r.credits) out.push({ key: rowKey(a.id, r.id, 'credits'), message: 'Enter credits.', sessionId });
      else if (!(creditValue(r.credits) > 0)) out.push({ key: rowKey(a.id, r.id, 'credits'), message: 'Enter valid credits.', sessionId });
      return out;
    })
  );

export const sessionErrors = (s: Session): CertError[] => [
  ...(s.name.trim() ? [] : [{ key: sessionKey(s.id, 'name'), message: 'Enter the session name.', sessionId: s.id }]),
  ...(s.date ? [] : [{ key: sessionKey(s.id, 'date'), message: 'Select the date of completion.', sessionId: s.id }]),
  ...(s.allocations.length ? [] : [{ key: sessionKey(s.id, 'quals'), message: 'Select at least one qualification.', sessionId: s.id }]),
  ...allocationErrors(s.allocations, false, s.id),
];

/** Errors in the order the fields appear; fields that aren't showing are never checked */
export const validateCertificate = (c: Certificate, file: CertFile | undefined): CertError[] => {
  const sessions = isSessionMode(c);
  const out: CertError[] = [];
  if (!c.title.trim()) out.push({ key: 'title', message: 'Enter the course title.' });
  if (!sessions && !c.date) out.push({ key: 'date', message: 'Select the date of completion.' });
  if (!c.delivery) out.push({ key: 'delivery', message: 'Select the method of delivery.' });
  if (learningMethodsFor(c.delivery).length && !c.learning) out.push({ key: 'learning', message: 'Select the learning method.' });
  if (asksSessions(c) && c.multiple === null) out.push({ key: 'multiple', message: 'Select Yes or No.' });
  if (!c.provider) out.push({ key: 'provider', message: 'Select the provider.' });
  if (sessions) {
    if (!c.sessions.length) out.push({ key: 'sessions', message: 'Add at least one session.' });
    c.sessions.forEach((s) => out.push(...sessionErrors(s)));
  } else {
    if (!c.allocations.length) out.push({ key: 'quals', message: 'Select at least one qualification.' });
    out.push(...allocationErrors(c.allocations, true));
  }
  if (!file || file.status !== 'uploaded') out.push({ key: 'file', message: 'Upload the certificate.' });
  return out;
};

export type ReviewStatus = 'Needs Review' | 'Incomplete' | 'Reviewed' | 'Analysis Failed';
export const reviewStatus = (c: Certificate, file: CertFile | undefined, isOpen: boolean): ReviewStatus => {
  if (c.source === 'failed') return 'Analysis Failed';
  if (c.reviewed) return 'Reviewed';
  if ((c.attempted || (c.visited && !isOpen)) && validateCertificate(c, file).length) return 'Incomplete';
  return 'Needs Review';
};

/* ------------------------------------ Display ------------------------------------ */

export const formatDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
export const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/* ----------------------------------- Submission ---------------------------------- */

/** Only what applies to the certificate's structure is sent */
export const toPayload = (c: Certificate, file: CertFile) => {
  const rows = (a: Allocation, oneField: boolean) => ({
    qualification: a.qualification,
    fieldsOfStudy: (oneField ? a.rows.slice(0, 1) : a.rows).map((r) => ({ fieldOfStudy: r.field, credits: Number(r.credits) })),
  });
  const base = { fileId: file.id, fileName: file.name, courseTitle: c.title.trim(), methodOfDelivery: c.delivery, provider: c.provider };
  const learning = learningMethodsFor(c.delivery).length ? { learningMethod: c.learning } : {};
  return isSessionMode(c)
    ? {
        ...base,
        ...learning,
        multipleSessions: true as const,
        sessions: c.sessions.map((s) => ({ name: s.name.trim(), dateOfCompletion: s.date, qualifications: s.allocations.map((a) => rows(a, false)) })),
      }
    : {
        ...base,
        ...learning,
        ...(asksSessions(c) ? { multipleSessions: false as const } : {}),
        dateOfCompletion: c.date,
        qualifications: c.allocations.map((a) => rows(a, true)),
      };
};
export type CertificatePayload = ReturnType<typeof toPayload>;
