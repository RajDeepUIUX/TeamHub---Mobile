/** Staff Declaration for a Work-from-Home (WFH) or Hybrid arrangement — accepted from the Request Flexibility form */

/** Signed-in staff member whose details fill the declaration */
export interface Declarant {
  name: string;
  staffCode: string;
  designation: string;
  department: string;
  personalEmail: string;
  officialEmail: string;
}

export const DECLARATION_COMPANY = {
  name: 'MYCPE ONE SOLUTIONS PRIVATE LIMITED',
  address: 'EIGHTH FLOOR, OFFICE-801 TO 804, SAKAR -1, NR. GANDHIGRAM RAILWAY STATION, ASHRAM ROAD, Ahmedabad, Gujarat',
};

/** A bullet; `label` renders bold before the text, `items` render as a nested list */
export interface DeclarationPoint {
  text: string;
  label?: string;
  items?: string[];
}

export interface DeclarationClause {
  title: string;
  points: DeclarationPoint[];
}

export const declarationIntro = (name: string) =>
  `I, ${name}, employed at My-CPE ONE, hereby declare and confirm my full understanding and acceptance of the following terms and conditions related to the Work-from-Home (WFH) or Hybrid work arrangement, applicable at any time during my employment tenure. I acknowledge that these terms are binding and supplement my existing Employment Agreement with the Company.`;

export const DECLARATION_CLAUSES: DeclarationClause[] = [
  {
    title: 'Exclusivity of Employment',
    points: [
      { text: 'I affirm that my employment with My-CPE ONE is full-time and exclusive, requiring my undivided attention and professional commitment.' },
      { text: 'I shall not engage in freelancing, moonlighting, or secondary employment without explicit prior written approval from the Company.' },
      {
        text: 'If I am found in violation of this clause, I acknowledge that the following actions will apply:',
        items: [
          'Immediate Termination - My employment may be terminated with immediate effect.',
          "Clawback of Salary - I shall reimburse the Company six (6) months' gross salary as compensation for damages.",
          'Non-Negotiable Clause - This penalty provision is non-negotiable and forms an integral part of this Declaration.',
        ],
      },
    ],
  },
  {
    title: 'Commitment to Virtual Work Environment',
    points: [
      {
        text: "I shall perform all my official duties strictly within the Company's prescribed virtual work environment, including the use of:",
        items: ["The Company's Virtual Private Network (VPN)", 'Secured applications and authorized platforms'],
      },
      { text: 'I understand that unauthorized access or usage of personal devices, external storage, or unapproved platforms is strictly prohibited and will be treated as a serious violation of Company policy.' },
    ],
  },
  {
    title: 'Dedicated Workspace & Internet Connectivity',
    points: [
      { text: 'I commit to maintaining a dedicated, professional workspace at my residence that ensures productivity and confidentiality.' },
      { text: 'I confirm that I will ensure a stable high-speed internet connection at my own expense, sourced from a Company-approved service provider.' },
      { text: 'I acknowledge that repeated disruptions affecting my work performance may lead to a review or termination of my WFH/Hybrid privilege.' },
    ],
  },
  {
    title: 'Data Security & Confidentiality',
    points: [
      {
        text: 'I strictly agree to:',
        items: [
          'Refrain from using personal devices for any work-related activities.',
          'Not copy, transfer, or share Company data to personal storage or unapproved platforms.',
          'Comply with all Company policies regarding data confidentiality and security.',
        ],
      },
      { text: 'I acknowledge that any breach of data security policies may result in disciplinary action, termination, or legal consequences.' },
    ],
  },
  {
    title: 'Performance Expectations & Monitoring',
    points: [
      { text: 'I understand that my performance, attendance, and responsiveness will be actively monitored while working remotely.' },
      {
        text: 'I agree to:',
        items: [
          'Log in and remain available during official working hours.',
          'Attend all scheduled meetings, calls, or check-ins as required.',
          'Maintain expected levels of productivity and meet assigned deliverables.',
        ],
      },
      { text: 'Failure to meet these expectations may result in revocation of WFH/Hybrid privileges or further disciplinary action.' },
    ],
  },
  {
    title: 'Working Hours & Availability',
    points: [
      { text: 'I confirm that I will be fully available during designated working hours and will not engage in any personal or non-work-related activities that could impact my productivity.' },
      { text: 'Unauthorized absences, excessive unavailability, or lack of responsiveness may lead to disciplinary action or revocation of my WFH/Hybrid privileges.' },
    ],
  },
  {
    title: 'Compliance with Company Policies & Code of Conduct',
    points: [
      { text: 'I agree to adhere to all existing Company policies, guidelines, and the Staff Code of Conduct, even while working remotely.' },
      { text: 'I understand that any violation of Company policies (including but not limited to data security, confidentiality, and workplace ethics) will be treated as a serious breach and may lead to disciplinary action or termination.' },
    ],
  },
  {
    title: 'Emergency Recall Clause (for Business-Critical Needs)',
    points: [
      { text: 'I acknowledge that in case of urgent business requirements, security concerns, or critical projects, the Company reserves the right to temporarily or permanently revoke my WFH/Hybrid status.' },
      { text: 'I agree to return to the office within a reasonable timeframe as instructed by my reporting manager or HR.' },
    ],
  },
  {
    title: 'Notice Period & Immediate Office Reporting Upon Resignation',
    points: [
      { text: 'I understand that my notice period will only be counted if served in Work-from-Office mode.' },
      {
        text: 'In the event of my resignation, I agree to:',
        items: [
          'Report to the office immediately for knowledge transfer and handover of ongoing tasks.',
          'Return all Company-issued devices, documents, and intellectual property in good condition before my final clearance.',
          'Cooperate fully in the handover process as per Company policy.',
        ],
      },
      { text: 'I acknowledge that failure to return Company property or complete the handover process may result in financial deductions or legal action.' },
    ],
  },
  {
    title: 'Accuracy of Information Provided',
    points: [
      { text: 'I confirm that all details submitted in support of my WFH/Hybrid request are true and accurate.' },
      { text: 'I acknowledge that any false or misleading information may result in immediate revocation of WFH/Hybrid privileges, disciplinary action, or legal consequences.' },
    ],
  },
  {
    title: 'Equipment & IT Support Responsibilities',
    points: [
      {
        label: 'Asset Responsibility:',
        text: 'I accept full responsibility for the safekeeping, proper usage, and timely return of the IT assets allocated to me by MYCPE ONE for WFH, including but not limited to laptops, monitors, keyboards, headphones, webcams, or any other peripheral devices.',
      },
      {
        label: 'Usage Restriction:',
        text: 'The allocated assets shall be used strictly for official work purposes only and shall not be misused, shared, or lent to unauthorized individuals.',
      },
      {
        label: 'Security Compliance:',
        text: 'I will adhere to all company IT security policies and ensure that the device(s) are protected against loss, theft, or damage. I will immediately report any such incident to the IT/HR/Admin team.',
      },
      {
        label: 'Return Obligation:',
        text: 'I understand that I am required to return all IT assets in good working condition upon request, end of WFH arrangement, or upon cessation of employment with MYCPE ONE.',
      },
      {
        label: 'Recovery in Case of Loss/Damage:',
        text: "In case of loss, damage, or misuse, I agree to bear the cost of repair or depreciation-based recovery as per the company's asset management policy.",
      },
      {
        label: 'Asset Acknowledgement:',
        text: 'I confirm that I have reviewed and acknowledged the list of assets issued to me, as reflected in the User Panel.',
      },
    ],
  },
];

export const DECLARATION_FINAL =
  'I declare that I have read, understood, and voluntarily accepted all the above terms and conditions. I acknowledge that these terms are non-negotiable and form an integral part of my Employment Agreement with the Company. I agree to comply fully and understand the consequences of any violations.';

/** "2026-10-06 14:32:08" — the format shown on the signed declaration */
export const formatDeclarationDate = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
