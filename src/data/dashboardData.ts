export interface TeamCelebration {
  id: string;
  name: string;
  department: string;
  /** Days from today (0 = today, 1 = tomorrow, ...) */
  inDays: number;
  /** Work anniversaries only: completed years */
  years?: number;
}

// Totals across the whole year (shown on the tab badges and dashboard tiles)
export const CELEBRATION_TOTALS = {
  birthdays: 87,
  anniversaries: 59,
};

export const BIRTHDAYS: TeamCelebration[] = [
  { id: 'b-1', name: 'Raj Kamal', department: 'Engineering', inDays: 0 },
  { id: 'b-2', name: 'Arpan Shah', department: 'Product Design', inDays: 0 },
  { id: 'b-3', name: 'Jhanvi Motwani', department: 'Human Resources', inDays: 0 },
  { id: 'b-4', name: 'Husain Rasiwala', department: 'Finance', inDays: 1 },
  { id: 'b-5', name: 'Ayushi Vashita', department: 'Marketing', inDays: 1 },
  { id: 'b-6', name: 'Nidhi Purohit', department: 'Engineering', inDays: 1 },
  { id: 'b-7', name: 'Krupali Shah', department: 'Audit', inDays: 1 },
  { id: 'b-8', name: 'Anil Kukraniya', department: 'Tax', inDays: 1 },
  { id: 'b-9', name: 'Ritik Chelani', department: 'Engineering', inDays: 1 },
  { id: 'b-10', name: 'Meera Joshi', department: 'Operations', inDays: 12 },
  { id: 'b-11', name: 'Kunal Desai', department: 'Audit', inDays: 18 },
  { id: 'b-12', name: 'Sneha Patel', department: 'Learning & Development', inDays: 25 },
];

export const ANNIVERSARIES: TeamCelebration[] = [
  { id: 'a-1', name: 'Priya Nair', department: 'Tax', inDays: 0, years: 5 },
  { id: 'a-2', name: 'Vikram Rao', department: 'Engineering', inDays: 0, years: 2 },
  { id: 'a-3', name: 'Dhruv Mehta', department: 'Finance', inDays: 1, years: 3 },
  { id: 'a-4', name: 'Pooja Trivedi', department: 'Audit', inDays: 1, years: 1 },
  { id: 'a-5', name: 'Harsh Vora', department: 'Product Design', inDays: 4, years: 7 },
  { id: 'a-6', name: 'Tanvi Bhatt', department: 'Human Resources', inDays: 9, years: 4 },
  { id: 'a-7', name: 'Rohan Kapoor', department: 'Operations', inDays: 21, years: 10 },
];

export const RECENT_ATTENDANCE = [
  { day: '25', month: 'Sep', start: '12:14', end: '21:15', hours: '09:01 Hours', status: 'Full day' },
  { day: '24', month: 'Sep', start: '12:24', end: '21:52', hours: '09:28 Hours', status: 'Full day' },
  { day: '23', month: 'Sep', start: '12:20', end: '21:40', hours: '09:20 Hours', status: 'Full day' },
];
