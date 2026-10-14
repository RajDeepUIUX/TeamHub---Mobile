export type TicketPriority = 'High' | 'Medium' | 'Low';

export type TicketStatus =
  | 'Open'
  | 'In Progress'
  | 'Answered'
  | 'On Hold'
  | 'Review by HR'
  | 'Review by Admin'
  | 'Review by Finance'
  | 'Payment Initiated'
  | 'Paid'
  | 'Closed'
  | 'Acknowledged';

export type CommentAuthorRole = 'Staff' | 'Manager' | 'Support' | 'System';

export interface TicketComment {
  id: string;
  author: string;
  role: CommentAuthorRole;
  text: string;
  createdAt: string; // ISO timestamp
}

export interface Ticket {
  id: string; // ticket number, e.g. "93349"
  staffName: string;
  staffCode: string;
  subject: string;
  department: string;
  priority: TicketPriority;
  /** Sanitised HTML from the rich text editor */
  descriptionHtml: string;
  status: TicketStatus;
  createdAt: string; // ISO timestamp
  comments: TicketComment[];
}
