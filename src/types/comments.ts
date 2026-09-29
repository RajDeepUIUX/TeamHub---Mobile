export type ThreadAuthorRole = 'Staff' | 'Manager' | 'Support' | 'System';

/** A message in a request's comment thread */
export interface ThreadComment {
  id: string;
  author: string;
  role: ThreadAuthorRole;
  text: string;
  createdAt: string; // ISO timestamp
}
