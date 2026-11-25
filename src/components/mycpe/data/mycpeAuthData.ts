// MyCPE: text and lists exactly as in the mobile designs

export const MYCPE_VERSION = '0.2.2';

/* -------------------------------- Onboarding -------------------------------- */

/** The design has four slides; slide 2 is the one provided so far */
export const ONBOARDING_TOTAL = 4;
export const ONBOARDING_ACTIVE = 1;
export const ONBOARDING_SLIDE = {
  eyebrow: 'Unlimited Learning',
  highlight: '15,000+',
  title: ' hours of content library at your fingertips',
};

export interface OnboardingCourse {
  image: string;
  title: string;
}
export const ONBOARDING_COURSES: OnboardingCourse[] = [
  { image: '/mycpe/onboarding/course-1.png', title: 'Forensic Accounting: Court Approved Methods' },
  { image: '/mycpe/onboarding/course-2.png', title: 'HR Next: Balancing Skill Disruption & Well-Being' },
  { image: '/mycpe/onboarding/course-3.png', title: 'Automating Financial Reporting in EXCEL' },
  { image: '/mycpe/onboarding/course-4.png', title: 'Best Tax Return Workshop - Partnerships' },
];
/** Third row of the phone: already faded in the artwork */
export const ONBOARDING_FADED_COURSES = ['/mycpe/onboarding/course-5.png', '/mycpe/onboarding/course-6.png'];

/* ------------------------------- Qualification ------------------------------- */

export const MYCPE_QUALIFICATIONS = [
  'Chartered Public Accountants (CPA-US)',
  'Chartered Accountant - ICAEW',
  'Certified Public Accountant / Certified in Financial Forensics',
  'Certified Public Accountant in Canada',
  'Certified Public Accountant (CRTP)',
  'Certified Private Wealth Advisor',
  'Association of Chartered Certified Accountants',
  'Accredited in Public Trust Doctrine',
  'Financial Risk Manager',
  'Fellow of the Society of Certified Public',
];

/* ----------------------------------- Terms ----------------------------------- */

export const TERMS_TITLE = 'Terms, Policies & Legal Information';
export const TERMS_HEADING = 'Terms of Use';
/** Opening paragraphs; the rest of the text is still to be provided */
export const TERMS_PARAGRAPHS = [
  'Welcome to www.my-cpe.com (the “Website”), a proprietary online platform owned and operated by ANM Media LLP (“Company,” “we,” “us,” or “our”). These Terms of Use (“Terms”) constitute a legally binding agreement between the Company and User, whether as an individual or a legal entity (“you,” “your,” or “the user”), governing your access to and use of the Website, our mobile application (the “App”), and all related features, technologies, content, and services provided through them (collectively, the “Platform” or the “Online Services”).',
  'By accessing, browsing, registering for, or otherwise using any part of the Platform, you acknowledge that you have read, understood, and agreed to be bound by these Terms, together with the Privacy policy, Cookie Policy, Refund Policy and guidelines, or notices that are incorporated by reference, including any amendments or modifications that we may make at our sole discretion from time to time.',
];
/** Line widths (%) of the grey bars standing in for the Terms text not provided yet */
export const TERMS_PENDING_BLOCKS = [
  [96, 100, 88, 94, 60],
  [100, 92, 97, 45],
  [94, 100, 90, 96, 98, 52],
  [100, 95, 91, 70],
  [97, 93, 100, 88, 96, 40],
];

/* ----------------------------------- Plans ----------------------------------- */

export type MyCpePlanId = 'Silver' | 'Gold';

export interface MyCpePlan {
  id: MyCpePlanId;
  price: string;
  features: string[];
}

/** Features visible in the designs (both lists continue below the fold there) */
export const MYCPE_PLANS: MyCpePlan[] = [
  {
    id: 'Silver',
    price: '$199',
    features: [
      '15,000+ Hours of CPE Content',
      '500+ Subject Areas',
      'Mandatory Ethics Courses',
      '250+ Compliance Packages',
      '50+ Conferences and Events Access',
      'Formats: Live, Audio, Video, E-Books',
      'Audio Based Courses & Podcasts',
      'Latest News and Articles (CPE Approved)',
      'Monthly and Quarterly Updates',
      'Add External Certificates with AI',
    ],
  },
  {
    id: 'Gold',
    price: '$299',
    features: [
      '15,000+ Hours of CPE Content',
      '700+ Industry Leaders & Experts',
      'All Delivery Formats',
      'Compliance & Tracking for 100+ Qualifications',
      '250+ Compliance Packages',
      'Nano Credits',
      'News & Insights',
      "Compliance for CPA's of All 50 States",
      'Digital Magazine',
      '100+ Practical Training Programs',
    ],
  },
];
