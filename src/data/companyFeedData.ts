/** Company Feed ("What's Happening Around!") — announcements shared with every user, whatever their role */

export const FEED_CATEGORIES = [
  'General',
  'HR & Admin',
  'Learning & Growth',
  'Best Practices',
  'Employee Hub',
  'Internal Jobs & Opportunities',
] as const;

export type FeedCategory = (typeof FEED_CATEGORIES)[number];

/**
 * Content blocks. Inline text supports **bold** and [label](href);
 * `app:profile` links open the user's own profile.
 */
export type FeedBlock =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string; emoji?: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: { text: string; sub?: string[] }[] }
  | { t: 'kv'; rows: [string, string][] }
  | { t: 'callout'; tone: 'info' | 'warn' | 'danger'; title?: string; text: string }
  | { t: 'banner'; eyebrow: string; title: string; subtitle: string; meta: [string, string][]; speaker?: string }
  | { t: 'attachment'; name: string; kind: 'video' | 'pdf' }
  | { t: 'sign'; lines: string[] };

export interface FeedPost {
  id: string;
  category: FeedCategory;
  title: string;
  /** ISO date */
  date: string;
  /** Team that published it */
  from: string;
  /** Short preview shown on the list card */
  summary: string;
  blocks: FeedBlock[];
  unread: boolean;
  likes: number;
  dislikes: number;
}

export type FeedReaction = 'like' | 'dislike' | null;

export const FEED_POSTS_SEED: FeedPost[] = [
  /* ------------------------------- General ------------------------------- */
  {
    id: 'feed-ptin',
    category: 'General',
    title: 'PTIN Information Update in Team Hub',
    date: '2026-09-09',
    from: 'Team Client & Team Success Management (CTM)',
    summary:
      'Team members who hold a valid PTIN are requested to update their PTIN details in their Team Hub Profile under Professional Details.',
    unread: true,
    likes: 42,
    dislikes: 1,
    blocks: [
      {
        t: 'p',
        text: 'Team members who hold a valid PTIN (Preparer Tax Identification Number) are requested to update their PTIN details in their Team Hub Profile under Professional Details. Maintaining accurate PTIN information will help ensure readiness for Tax opportunities, support client requirements, and keep professional records up to date.',
      },
      {
        t: 'callout',
        tone: 'info',
        title: 'Action Required',
        text: 'Update your PTIN number in **Team Hub → Staff Profile → Professional Details**, or [open your profile](app:profile) now.',
      },
      { t: 'h', text: 'Important Notes' },
      {
        t: 'ul',
        items: [
          'Effective **1 January 2027**, a valid PTIN will be mandatory for all team members currently working in the Tax domain, as well as for those who wish to pursue Tax opportunities in the future.',
          'Team members who already have a valid PTIN should update their PTIN details in Team Hub at the earliest.',
          'Team members who do not currently hold a PTIN are encouraged to plan and complete the application process during the upcoming PTIN application cycle to ensure they meet the January 2027 requirement.',
          'Starting 1 Jan 2027, only profiles with a valid PTIN updated in Team Hub will be made live in the staff available hub.',
        ],
      },
      {
        t: 'p',
        text: 'As PTIN will become a mandatory requirement for Tax opportunities effective January 2027, we encourage all current and aspiring Tax professionals to take the necessary steps and ensure their Staff Profile remains up to date.',
      },
      { t: 'p', text: 'Thank you for your cooperation and support.' },
      { t: 'sign', lines: ['Regards,', 'Team Client & Team Success Management (CTM)'] },
    ],
  },
  {
    id: 'feed-ai-assistant',
    category: 'General',
    title: 'AI Chat Assistant — What It Can Do for You',
    date: '2026-08-20',
    from: 'Learning & Development Team',
    summary:
      'Ask about your own learning progress or CPE in plain language and get an answer pulled live from your actual record and compliance ledger.',
    unread: false,
    likes: 87,
    dislikes: 3,
    blocks: [
      {
        t: 'p',
        text: '**How to use it** — Please log in to your myCPE account and open [my-cpe.com/chat-assistant](https://my-cpe.com/chat-assistant).',
      },
      {
        t: 'p',
        text: 'Ask about your own Learning Progress / CPE in plain language and get an answer pulled live from your actual record & your compliance ledger, what your L&D Department has assigned you, and the course catalogue at the moment you ask. It answers about **you**.',
      },
      { t: 'h', text: 'What your firm has assigned you' },
      {
        t: 'ul',
        items: [
          '**Your learning plan** — the plans your firm has assigned to you, with plan name, current status, due date, and the courses and credits included.',
          "**Your progress against it** — how far through you are and what's still outstanding.",
        ],
      },
      { t: 'h', text: 'Finding courses' },
      {
        t: 'ul',
        items: [
          '**Recommendations built around your gap** — content scored against your actual qualification shortfall and deadline pressure, not a generic popular list.',
          '**Search the full catalogue** — by keyword, topic, qualification, state, or speaker, filterable by rating, credit range and publish date.',
          '**Live webinars and virtual conferences** — your registered sessions plus everything upcoming, with calendar-aware filters ("this weekend", "next week") and speaker search.',
          '**Speakers you follow** — who you\'re following and what they have coming up.',
        ],
      },
      { t: 'h', text: 'Your learning record' },
      {
        t: 'ul',
        items: [
          "**Courses and progress** — what you've completed and what's in progress, sorted by recency or credit value.",
          '**Your statistics** — total hours, courses completed, courses in progress, certificates earned, and a month-by-month activity breakdown.',
        ],
      },
    ],
  },

  /* ------------------------------ HR & Admin ------------------------------ */
  {
    id: 'feed-ev-loan-feature',
    category: 'HR & Admin',
    title: 'EV Loan Application Feature Now Available in User Panel',
    date: '2026-07-22',
    from: 'HR Team',
    summary: 'In continuation of our recently updated EV Policy, the EV Loan application feature is now live in the User Panel.',
    unread: true,
    likes: 64,
    dislikes: 0,
    blocks: [
      { t: 'p', text: 'Dear Team,' },
      {
        t: 'p',
        text: 'In continuation of our recently updated **EV Policy**, we are pleased to announce that the **EV Loan application feature is now live** in the User Panel.',
      },
      {
        t: 'callout',
        tone: 'info',
        title: 'Where to apply',
        text: '**User Panel → Support → Adv. Salary & EV Loan**. While raising the request, select **"EV Loan"** from the **"Request For"** dropdown.',
      },
      {
        t: 'p',
        text: 'This enhancement is aimed at making the application process simpler and more convenient for all employees looking to avail the benefits under the EV Policy.',
      },
      { t: 'p', text: 'For any queries or assistance, please feel free to reach out to the HR team.' },
      { t: 'p', text: "**Let's take a step towards sustainable mobility!** 🚗⚡" },
      { t: 'sign', lines: ['Regards,', 'HR Team'] },
    ],
  },
  {
    id: 'feed-ev-loan-live',
    category: 'HR & Admin',
    title: 'Exciting Update: EV Loan Facility Now Live 🚗⚡',
    date: '2026-07-03',
    from: 'Team HR',
    summary: 'The EV Loan facility is now live, and the detailed guidelines are available in the Team Hub.',
    unread: true,
    likes: 51,
    dislikes: 0,
    blocks: [
      { t: 'p', text: 'Hello Team,' },
      {
        t: 'p',
        text: "We're excited to announce that the **EV Loan facility is now live**, and the detailed guidelines are available in the Team Hub.",
      },
      {
        t: 'p',
        text: 'While the loan application module is currently not available in the system, we are happy to share that **applications are actively being accepted in the meantime**.',
      },
      {
        t: 'p',
        text: "If you're interested in applying, simply drop an email to [hr@my-cpe.com](mailto:hr@my-cpe.com), and our HR team will gladly assist you throughout the process.",
      },
      {
        t: 'p',
        text: 'This initiative is part of our continued effort to **encourage eco-friendly choices** and support our employees in transitioning towards greener alternatives.',
      },
      { t: 'sign', lines: ['Warm regards,', 'Team HR'] },
    ],
  },
  {
    id: 'feed-form16',
    category: 'HR & Admin',
    title: 'Form 16 for FY 2025-26 is Now Available on Spine HR Portal',
    date: '2026-06-25',
    from: 'Team HR',
    summary: 'Your Form 16 is now available for download on the Spine HR Portal. Follow the steps to access it.',
    unread: false,
    likes: 120,
    dislikes: 2,
    blocks: [
      { t: 'p', text: 'Dear Team,' },
      { t: 'p', text: 'We would like to inform you that your **Form 16** is now available for download on the **Spine HR Portal**.' },
      { t: 'h', text: 'How to download your Form 16' },
      {
        t: 'ol',
        items: [
          { text: 'Open Team Hub (User Panel): [user.my-cpe.com](https://user.my-cpe.com)' },
          { text: 'Navigate to **Payroll > Salary Slip** (this will redirect you to Spine HR).' },
          {
            text: 'Log in to Spine HR using the following credentials:',
            sub: [
              '**Company:** ENTIGR',
              '**Login As:** User',
              '**User Name:** Your Employee Code',
              '**Password:** Your PAN Card Number (in CAPITAL LETTERS)',
            ],
          },
          { text: 'After logging in, go to **Self Service > Taxation > Download Form 16**.' },
        ],
      },
      {
        t: 'callout',
        tone: 'warn',
        text: 'For any query regarding your Form 16, please raise a support ticket or email [payroll@my-cpe.com](mailto:payroll@my-cpe.com). Please refrain from sending personal messages for queries.',
      },
      { t: 'sign', lines: ['Thanks & Regards,', 'Team HR'] },
    ],
  },
  {
    id: 'feed-loan-tax',
    category: 'HR & Admin',
    title: 'Tax Implication on Employee Loans & Advances',
    date: '2026-04-10',
    from: 'Payroll Team',
    summary: 'A quick guide to how interest-free or concessional loans and salary advances are treated for tax purposes.',
    unread: false,
    likes: 38,
    dislikes: 1,
    blocks: [
      { t: 'p', text: 'Dear Team Members,' },
      {
        t: 'p',
        text: 'Interest-free or concessional loans provided by the company may be treated as a **perquisite** under the Income Tax rules and can be taxable in your hands.',
      },
      {
        t: 'ul',
        items: [
          'The taxable value is calculated using the prescribed SBI lending rate, less any interest you actually pay.',
          'Loans up to **₹20,000** in aggregate are exempt from this perquisite valuation.',
          'Salary advances recovered within the same financial year are not treated as loans.',
        ],
      },
      {
        t: 'p',
        text: 'The applicable tax, if any, will be reflected in your monthly payroll. For questions, email [payroll@my-cpe.com](mailto:payroll@my-cpe.com).',
      },
      { t: 'sign', lines: ['Regards,', 'Payroll Team'] },
    ],
  },

  /* --------------------------- Learning & Growth --------------------------- */
  {
    id: 'feed-ted-15',
    category: 'Learning & Growth',
    title: 'TED Takeaway #15',
    date: '2026-09-28',
    from: 'Learning & Development Team',
    summary: 'One TED Talk. One key insight. This week: The Art of Stillness by Pico Iyer (9 minutes).',
    unread: true,
    likes: 33,
    dislikes: 0,
    blocks: [
      {
        t: 'p',
        text: "One TED Talk. One key insight. A few minutes of learning every week. Discover fresh ideas from some of the world's most inspiring thinkers.",
      },
      {
        t: 'kv',
        rows: [
          ['🎬 Featured Talk', 'The Art of Stillness – Pico Iyer'],
          ['⏱️ Duration', '9 minutes'],
        ],
      },
      { t: 'h', text: "Why We're Sharing This" },
      {
        t: 'p',
        text: 'In a world filled with constant notifications, deadlines, meetings, and information, staying busy can sometimes feel like the only way to stay productive. In this reflective TED Talk, Pico Iyer explores the value of slowing down and creating moments of stillness to think more clearly, regain focus, and reconnect with what truly matters.',
      },
      { t: 'h', text: 'Key Takeaway' },
      {
        t: 'p',
        text: 'Constant activity does not always lead to better results. Taking intentional moments to pause can improve focus, reduce mental clutter, and help us respond more thoughtfully instead of simply reacting.',
      },
      { t: 'h', text: 'Reflection Question' },
      {
        t: 'callout',
        tone: 'info',
        text: 'When during your workday could you create a few minutes of quiet, distraction-free time to reset your mind and improve your focus?',
      },
      { t: 'attachment', name: 'The Art of Stillness – Pico Iyer.mp4', kind: 'video' },
    ],
  },
  {
    id: 'feed-mastermind',
    category: 'Learning & Growth',
    title: 'US Accounting Mastermind: Beyond Numbers — Decoding Business Value',
    date: '2026-09-25',
    from: 'Learning & Development Team',
    summary: 'Join the US Accounting Mastermind session on Sep 28th, 5:00 PM to 6:00 PM, on understanding business valuation.',
    unread: true,
    likes: 47,
    dislikes: 0,
    blocks: [
      {
        t: 'banner',
        eyebrow: 'Masterminds of MYCPE ONE',
        title: 'US Accounting Mastermind Session',
        subtitle: 'Beyond Numbers: Decoding Business Value',
        meta: [
          ['Date', '28th September, 2026'],
          ['Time', '5:00 PM to 6:00 PM'],
        ],
        speaker: 'Surbhi Parasrampuria',
      },
      { t: 'p', text: 'Hello Everyone, greetings for the day!' },
      {
        t: 'p',
        text: '📢 Get ready for our upcoming **US Accounting Mastermind** session on understanding **Beyond Numbers: Decoding Business Value** and its accounting practices.',
      },
      {
        t: 'kv',
        rows: [
          ['Title', 'Beyond Numbers: Decoding Business Value'],
          ['Date', 'Sep 28th, 2026'],
          ['Time', '5:00 PM to 6:00 PM'],
          ['Duration', '60 Minutes'],
        ],
      },
      { t: 'callout', tone: 'warn', text: '**Please note:** The session will begin promptly at **5:00 PM**.' },
      { t: 'h', text: 'What You Will Learn', emoji: '🔍' },
      {
        t: 'ul',
        items: [
          '**Understand what really drives business value** — cash flows, growth and risk.',
          '**Choose the right valuation approach** — DCF, market multiples or asset-based approaches.',
          '**Understand why Value ≠ Price** — and why the same business can have different prices.',
          '**Understand the key numbers and assumptions** that can change a valuation.',
        ],
      },
      { t: 'p', text: '**Join us at:** [Microsoft Teams meeting link](https://teams.microsoft.com/)' },
      { t: 'h', text: 'Meet Our Expert', emoji: '📌' },
      {
        t: 'p',
        text: 'The session will be led by **Surbhi Parasrampuria**, who has extensive experience in Business Valuation and Financial due diligence. She will share practical insights and best practices throughout the session.',
      },
      {
        t: 'p',
        text: "🗓️ Save the date, mark your calendar, and join us for an informative and engaging learning session. For any queries, please get in touch with the **US Accounting Chief, Karan Kibliwala**.",
      },
      { t: 'sign', lines: ['Best regards,', 'Learning & Development Team'] },
    ],
  },

  /* ----------------------------- Best Practices ----------------------------- */
  {
    id: 'feed-acceptable-use',
    category: 'Best Practices',
    title: 'Cybersecurity & IT Awareness – Acceptable Use of Company Assets',
    date: '2026-07-16',
    from: 'IT Team',
    summary:
      'Company-issued laptops, systems, email and Microsoft 365 accounts are provided strictly for official business purposes. Please follow these guidelines.',
    unread: true,
    likes: 58,
    dislikes: 2,
    blocks: [
      { t: 'p', text: 'Dear Team Members,' },
      {
        t: 'p',
        text: "This is a friendly reminder that all **company-issued laptops, desktops, systems, email accounts, Microsoft 365 accounts, and other IT resources are provided strictly for official business and operational purposes only.** All team members are expected to use these assets responsibly and in accordance with the company's IT and Information Security policies.",
      },
      { t: 'h', text: 'Please Do Not', emoji: '🚫' },
      {
        t: 'ul',
        items: [
          'Download or install any software, applications, browser extensions, plugins, utilities, drivers, or any other tools without prior approval from the **IT Team**.',
          'Access pirated, illegal, or untrusted websites, including movie, music, software, torrent, gaming, crack, keygen, or similar websites.',
          'Download files from unknown or unverified sources.',
          'Disable or modify antivirus, endpoint protection, firewall, or any other security settings.',
          'Connect unauthorized USB devices or external storage media to company systems.',
          'Share your company credentials or provide access to your company-issued system to any unauthorized person.',
        ],
      },
      { t: 'h', text: 'Software Installation & Change Requests', emoji: '💻' },
      {
        t: 'ul',
        items: [
          'Please raise a request with the **IT Team**.',
          'The IT Team will review the request for business, licensing, compatibility, and security requirements.',
          '**Once approved, the IT Team will install and configure the required software on your behalf.**',
          '**Team members must not install software or browser extensions themselves.**',
        ],
      },
      { t: 'h', text: 'Client Software & Remote Access', emoji: '🤝' },
      {
        t: 'p',
        text: 'Even if a **client requests** that you install software, browser extensions, security agents, remote support tools, or any other application, **please do not proceed without prior approval from the MYCPE ONE IT Team.**',
      },
      {
        t: 'p',
        text: 'Similarly, **do not provide remote access to your company-issued system** to client IT teams, vendors, consultants, external support engineers, or any other third party without prior authorization from the **MYCPE ONE IT Team**.',
      },
      { t: 'h', text: 'IT Support Process', emoji: '🛠️' },
      {
        t: 'p',
        text: "If you experience **any IT-related issue**, please **contact the MYCPE ONE IT Team first**. If the issue requires coordination with the client's IT team, **our IT Team will engage with them on your behalf**.",
      },
      { t: 'h', text: 'Why These Guidelines Are Important', emoji: '🔐' },
      {
        t: 'ul',
        items: [
          'Protect company and client information.',
          'Prevent malware, ransomware, phishing, and other cyber threats.',
          'Ensure compliance with security, legal, and regulatory requirements.',
          'Maintain the stability and security of our IT infrastructure.',
          'Reduce operational risks and avoid unauthorized changes to company systems.',
        ],
      },
      { t: 'p', text: 'If you have any questions or require IT assistance, please feel free to contact the **IT Team**.' },
      { t: 'sign', lines: ['Thank you for your cooperation and continued support.', 'IT Team'] },
    ],
  },
  {
    id: 'feed-phishing',
    category: 'Best Practices',
    title: 'Cybersecurity Alert: New Microsoft 365 Phishing Attack Bypasses MFA',
    date: '2026-06-17',
    from: 'IT Team',
    summary:
      'Cybercriminals are using a new phishing technique that targets Microsoft 365 users and can bypass Multi-Factor Authentication.',
    unread: true,
    likes: 72,
    dislikes: 0,
    blocks: [
      { t: 'callout', tone: 'danger', title: 'Cybersecurity Alert', text: 'A new Microsoft 365 phishing attack can bypass MFA. Please read carefully.' },
      { t: 'p', text: 'Dear Team,' },
      {
        t: 'p',
        text: 'Cybercriminals are actively using a new phishing technique that targets Microsoft 365 users and can bypass Multi-Factor Authentication (MFA).',
      },
      { t: 'h', text: 'How the Attack Works' },
      {
        t: 'ol',
        items: [
          { text: 'You receive an email that appears to come from Microsoft, OneDrive, Teams, SharePoint, DocuSign, or another trusted service.' },
          { text: 'The email asks you to visit a Microsoft sign-in page and enter a verification code.' },
          { text: 'The code links your account to the attacker\'s device, giving them access without your password.' },
        ],
      },
      { t: 'h', text: 'What You Should Do' },
      {
        t: 'ul',
        items: [
          '**Never enter a verification code** you did not request yourself.',
          'Check the sender address carefully before clicking any link.',
          'Report suspicious emails to the **IT Team** immediately.',
        ],
      },
      { t: 'sign', lines: ['Stay safe,', 'IT Team'] },
    ],
  },

  /* ------------------------------ Employee Hub ------------------------------ */
  {
    id: 'feed-intro-video',
    category: 'Employee Hub',
    title: 'Update: Profile Introduction Video',
    date: '2026-09-26',
    from: 'Team Client & Team Success Management (CTM)',
    summary: 'Team members can now add a Profile Introduction Video from My Profile. It will automatically be mapped to all created resumes.',
    unread: true,
    likes: 29,
    dislikes: 1,
    blocks: [
      {
        t: 'p',
        text: 'Team members can now add a **Profile Introduction Video** from **My Profile > Profile Introduction Video**. It **will automatically be mapped to all created resumes.**',
      },
      {
        t: 'ul',
        items: [
          'A **guideline** and **sample recording** are available for reference.',
          'Users can replace or remove the video when required.',
          'If the video is currently visible to clients on the **Available Staff Hub**, editing will be disabled.',
          'In such cases, the user must contact their **Reporting Manager or CTM** to remove the approval before making changes.',
        ],
      },
      { t: 'p', text: '**Watch the complete walkthrough:** [loom.com walkthrough](https://www.loom.com/)' },
    ],
  },

  /* ---------------------- Internal Jobs & Opportunities ---------------------- */
  {
    id: 'feed-ijp-udaipur',
    category: 'Internal Jobs & Opportunities',
    title: 'IJP – Team Lead / Senior Executive (Taxation & Accounts), Udaipur',
    date: '2026-01-17',
    from: 'HR Team',
    summary: 'Internal Job Posting for a Team Lead / Senior Executive in Taxation & Accounts at the Udaipur Branch.',
    unread: true,
    likes: 24,
    dislikes: 0,
    blocks: [
      { t: 'kv', rows: [['Role', 'Team Lead / Senior Executive (Taxation & Accounts)'], ['Location', 'Udaipur Branch']] },
      { t: 'h', text: 'Eligibility Criteria & Key Requirements' },
      { t: 'p', text: '**Minimum Tenure with the Company**' },
      { t: 'ul', items: ['Minimum **3+ years** of continuous tenure with the organization.'] },
      { t: 'p', text: '**Domain Experience**' },
      { t: 'ul', items: ['Minimum **3 years of relevant experience**', 'Preferably in **Taxation and/or Accounts domain**'] },
      { t: 'p', text: '**Operational Knowledge**' },
      {
        t: 'ul',
        items: [
          'Strong understanding of **day-to-day operational processes**, workflows, and deliverables',
          'Ability to handle **end-to-end process execution** with minimal supervision',
        ],
      },
      { t: 'p', text: '**People Management & Leadership Skills**' },
      {
        t: 'ul',
        items: [
          'Prior experience in **training and guiding team members**',
          'Demonstrated ability in **people management, mentoring, and team development**',
          'Strong **communication, coordination, and leadership skills**',
          'Capability to act as a **point of contact for team-related queries and escalations**',
        ],
      },
      { t: 'p', text: '**Educational Qualification**' },
      { t: 'ul', items: ['Minimum qualification: **Inter CA**'] },
      { t: 'callout', tone: 'info', text: 'Interested candidates can apply by raising a ticket to the HR team with the subject "IJP – Udaipur".' },
    ],
  },
  {
    id: 'feed-ijp-surat',
    category: 'Internal Jobs & Opportunities',
    title: 'IJP – Audit Associate, Sadra (Surat)',
    date: '2026-01-05',
    from: 'HR Team',
    summary: 'We are looking for an Audit Associate at the Sadra, Surat office. Internal candidates with 2+ years in Audit are encouraged to apply.',
    unread: false,
    likes: 15,
    dislikes: 0,
    blocks: [
      { t: 'kv', rows: [['Role', 'Audit Associate'], ['Location', 'Sadra - Surat']] },
      {
        t: 'ul',
        items: [
          'Minimum **2 years** of experience in Audit.',
          'Minimum **1 year** of continuous tenure with the organization.',
          'Good knowledge of US GAAP is a plus.',
        ],
      },
      { t: 'callout', tone: 'info', text: 'Raise a ticket to the HR team with the subject "IJP – Surat" to apply.' },
    ],
  },
];
