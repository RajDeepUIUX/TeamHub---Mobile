// Profile › Family member › Qualification & Certificate: dropdown lists (as in the MYCPE ONE web form)

const pursuingDropout = (course: 'CA' | 'CS') =>
  (['Pursuing', 'Dropout'] as const).flatMap((state) => [
    `${course} ${state} - Foundation`,
    `${course} ${state} - Intermediate - Group 1`,
    `${course} ${state} - Intermediate - Group 2`,
    `${course} ${state} - Final - Group 1`,
    `${course} ${state} - Final - Group 2`,
  ]);

const TAIL = [
  'BA',
  'Master of Computer Applications (MCA)',
  'Bachelor of Computer Applications (BCA)',
  'Bachelor of Engineering',
  'Master of Engineering',
  'Bachelor of Laws (LLB)',
  'BSC',
  'Master of Science (MSC)',
  'Chartered Financial Analyst (CFA)',
  'CFA Pursuing',
  'Accredited Financial Examiner (AFE)',
  'Accredited in Business Valuation (ABV)',
  'Accredited Investment Fiduciary (AIF)',
  'Annual Filing Season Program (AFSP)',
  'California Registered Tax Preparers (CRTP)',
  'CPA (Canada)',
  'Certification in Control Self Assessment (CCSA)',
  'Certified Commercial Contracts Manager (CCCM)',
  'Certification in Risk Management Assurance (CRMA)',
];

export const EDUCATION_OPTIONS = [
  'Bachelor of Commerce',
  'Master of Commerce',
  'BBA Finance',
  'MBA Finance',
  'CA-Intermediate',
  'CS - Intermediate',
  'CMA - Intermediate',
  'Chartered Accountant (CA)',
  'CS',
  'Cost and Management Accountant (CMA)',
  'Association of Chartered Certified Accountants (ACCA)',
  'Enrolled Agent (EA)',
  'CMA US',
  'CMA India',
  'Chartered Accountant (CA) Dropout - Articleship Complete',
  'Bachelor of Arts',
  '12th Pass',
  '2 Yrs+ Exp. in CA Firm',
  'CA Dropout - Articleship > 2Yrs',
  ...pursuingDropout('CA'),
  ...pursuingDropout('CS'),
  ...TAIL,
];

/** Same list as Education, with the short names the web uses for this field (CA, ACCA, EA) */
export const SUBJECT_OPTIONS = EDUCATION_OPTIONS.map((o) =>
  o === 'Chartered Accountant (CA)'
    ? 'CA'
    : o === 'Association of Chartered Certified Accountants (ACCA)'
      ? 'ACCA'
      : o === 'Enrolled Agent (EA)'
        ? 'EA'
        : o
);


// Location lists live in ./locations (shared app-wide); re-exported for existing imports
export { COUNTRY_OPTIONS, LOCATIONS, citiesOf, statesOf } from './locations';
