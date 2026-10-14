export interface RelevantContact {
  id: string;
  name: string;
  department: string;
  roles: string[];
  email: string;
  /** Mobile number, or an office extension such as "Ext. 1174" */
  phone?: string;
}

export const RELEVANT_CONTACTS: RelevantContact[] = [
  {
    id: 'rc-1',
    name: 'Nehal Patel',
    department: 'Recruitment',
    roles: ['Experience hiring management'],
    email: 'nehal.patel@my-cpe.com',
    phone: '+91 63575 82351',
  },
  {
    id: 'rc-2',
    name: 'Puran Bhavsar',
    department: 'Human Resources & Administration',
    roles: ['Head HR-ADMIN', 'Sr. Manager'],
    email: 'puran.bhavsar@my-cpe.com',
    phone: '+91 98250 41762',
  },
  {
    id: 'rc-3',
    name: 'Loveisha Bhambhani',
    department: 'Human Resources & Administration',
    roles: ['HR & Admin'],
    email: 'loveisha.bhambhani@my-cpe.com',
    phone: 'Ext. 1108',
  },
  {
    id: 'rc-4',
    name: 'Hiren Dattani',
    department: 'Human Resources & Administration',
    roles: ['HR & Admin'],
    email: 'hiren.dattani@my-cpe.com',
    phone: '+91 97129 30448',
  },
  {
    id: 'rc-5',
    name: 'Taufiq Shaikh',
    department: 'Recruitment',
    roles: ['Referral payment'],
    email: 'taufiq.shaikh@my-cpe.com',
    phone: 'Ext. 1142',
  },
  {
    id: 'rc-6',
    name: 'Arfat Mansuri',
    department: 'Learning & Development',
    roles: ['Practical Training Courses', 'L&D Felicitation Ceremony', 'Scholarship Support for CPA/EA Exams (old policy)'],
    email: 'arfat.mansuri@my-cpe.com',
    phone: 'Ext. 1174',
  },
  {
    id: 'rc-7',
    name: 'Parvan Vora',
    department: 'Learning & Development',
    roles: ['New Joiners Training/Reporting', 'Digital Signage', 'MyCPE User Concerns'],
    email: 'parvan.vora@my-cpe.com',
    phone: '+91 99099 67215',
  },
  {
    id: 'rc-8',
    name: 'Dr. Bhawna Chhabra',
    department: 'Learning & Development',
    roles: ['Communication Training/Events'],
    email: 'bhawna.chhabra@my-cpe.com',
    phone: '+91 98795 12046',
  },
  {
    id: 'rc-9',
    name: 'Shashank Mishra',
    department: 'Learning & Development',
    roles: [
      'PTC/CPE Teams/Content/Assessments/Evaluations',
      'Technical Training Moderator',
      'Coordinator MYCPE/ERP Product Team',
      'Staff Training Reporting',
    ],
    email: 'shashank.mishra@my-cpe.com',
    phone: 'Ext. 1189',
  },
  {
    id: 'rc-10',
    name: 'Nitisha Jain',
    department: 'Learning & Development',
    roles: [
      'Weekly Exam Prep Induction',
      'MYCPE ONE Academy Podcasts',
      'Query for EA, CMA and CPA',
      'Scholarships for CPA/EA/CMA Exams',
      'Content creation coordination',
    ],
    email: 'nitisha.jain@my-cpe.com',
    phone: '+91 90331 58820',
  },
  {
    id: 'rc-11',
    name: 'Ankit Garg',
    department: 'Recruitment',
    roles: ['Recruitment webinar management'],
    email: 'ankit.garg@my-cpe.com',
  },
  {
    id: 'rc-12',
    name: 'Shubham Agarwal',
    department: 'Learning & Development',
    roles: [
      'Quarterly Meetings with Managers & teams',
      'Weekly L&D Induction',
      'Entigrity Insider/Accountant Talk Show',
      'Practical Training Courses',
      'Industry Update / Client Success Sessions',
      'Collaborative Resource Hub',
      'Client/Internal Training Requests',
      'Mastermind Sessions',
      'Technical Manager Evaluation and Training',
    ],
    email: 'shubham.agarwal@my-cpe.com',
    phone: '+91 98984 70391',
  },
];

/** Short labels for the department filter chips */
export const CONTACT_DEPARTMENTS: { id: string; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'Human Resources & Administration', label: 'HR & Admin' },
  { id: 'Learning & Development', label: 'L&D' },
  { id: 'Recruitment', label: 'Recruitment' },
];
