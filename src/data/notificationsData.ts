export type NotificationCategory =
  | 'Work Timing'
  | 'Leaves'
  | 'Attendance'
  | 'Tickets'
  | 'Resignation'
  | 'Assets'
  | 'Cab Request'
  | 'Adv. Salary'
  | 'WFO Days'
  | 'Celebrations'
  | 'Announcements'
  | 'Training';

/** Where tapping the notification takes the user */
export type NotificationLink =
  | 'attendance'
  | 'leaves'
  | 'work-timing'
  | 'ot-request'
  | 'tickets'
  | 'resignation'
  | 'assets'
  | 'cab-request'
  | 'advance-salary'
  | 'wfo'
  | 'celebrations'
  | 'training-request';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string; // ISO timestamp
  read: boolean;
  link?: NotificationLink;
  /** Highlights notifications that need the user to do something */
  actionRequired?: boolean;
}

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  'Work Timing',
  'Leaves',
  'Attendance',
  'Tickets',
  'Resignation',
  'Assets',
  'Cab Request',
  'Adv. Salary',
  'WFO Days',
  'Celebrations',
  'Announcements',
  'Training',
];

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** Notifications for the signed-in staff member (John Smith) */
export const STAFF_NOTIFICATIONS_SEED: AppNotification[] = [
  {
    id: 'sn-1',
    category: 'Celebrations',
    title: "It's Raj Kamal's birthday today 🎂",
    body: 'Send a quick wish to make their day.',
    createdAt: ago(35),
    read: false,
    link: 'celebrations',
  },
  {
    id: 'sn-2',
    category: 'Tickets',
    title: 'Update on ticket #93349',
    body: 'HR Support: "We have forwarded this to the Finance team for review."',
    createdAt: ago(190),
    read: false,
    link: 'tickets',
  },
  {
    id: 'sn-3',
    category: 'Attendance',
    title: 'Half day marked for Sep 22',
    body: 'Your working time was 08h 43m. Request an edit if this looks wrong.',
    createdAt: ago(60 * 20),
    read: false,
    link: 'attendance',
    actionRequired: true,
  },
  {
    id: 'sn-4',
    category: 'Announcements',
    title: 'Diwali celebration at Gota office',
    body: 'Join us on Oct 16 at 4 PM in the cafeteria for sweets, games and rangoli.',
    createdAt: ago(60 * 27),
    read: true,
  },
  {
    id: 'sn-5',
    category: 'Leaves',
    title: 'Leave approved',
    body: 'Your PTO for Dec 29, 2025 was approved by Naveen Das.',
    createdAt: ago(60 * 24 * 3),
    read: true,
    link: 'leaves',
  },
  {
    id: 'sn-6',
    category: 'Announcements',
    title: 'Annual Letter 2025-26 is available',
    body: 'Read the leadership update on our goals and highlights for the year.',
    createdAt: ago(60 * 24 * 6),
    read: true,
  },
];

/** Notifications for the reporting manager (Naveen Das) */
export const MANAGER_NOTIFICATIONS_SEED: AppNotification[] = [
  {
    id: 'mn-1',
    category: 'Work Timing',
    title: 'New flexibility request from Ananya Kulkarni',
    body: 'Work From Home · Temporary · 5 Oct – 16 Oct 2026. Needs your approval.',
    createdAt: ago(25),
    read: false,
    link: 'work-timing',
    actionRequired: true,
  },
  {
    id: 'mn-2',
    category: 'Leaves',
    title: '3 leave requests awaiting approval',
    body: 'Ananya Kulkarni, Nidhi Purohit and Kunal Desai have pending leave requests.',
    createdAt: ago(140),
    read: false,
    link: 'leaves',
    actionRequired: true,
  },
  {
    id: 'mn-3',
    category: 'Attendance',
    title: 'Attendance edit request from Nidhi Purohit',
    body: 'Sep 23 · Hybrid — "Client visit at their Prahlad Nagar office in the second half."',
    createdAt: ago(60 * 19),
    read: false,
    link: 'attendance',
    actionRequired: true,
  },
  {
    id: 'mn-4',
    category: 'Resignation',
    title: 'Resignation submitted by Ananya Kulkarni',
    body: 'Last working day would be Nov 27, 2026. Review it in Team Resignations.',
    createdAt: ago(60 * 22),
    read: true,
    link: 'resignation',
  },
  {
    id: 'mn-5',
    category: 'Tickets',
    title: 'Nidhi Purohit raised a High priority ticket',
    body: '#93358 · VPN keeps disconnecting while working from client site.',
    createdAt: ago(60 * 24 * 2),
    read: true,
    link: 'tickets',
  },
  {
    id: 'mn-6',
    category: 'Celebrations',
    title: '2 work anniversaries in your team today ✨',
    body: 'Priya Nair (5 years) and Vikram Rao (2 years).',
    createdAt: ago(60 * 24 * 2 + 60),
    read: true,
    link: 'celebrations',
  },
];
