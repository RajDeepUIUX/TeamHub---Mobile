/** MyCPE users: a Subscriber has bought a plan, a Non Subscriber hasn't. MyCPE only (HRMS has UserRole). */
export type MyCpeUserType = 'Subscriber' | 'Non Subscriber';

export const MYCPE_USER_TYPES: MyCpeUserType[] = ['Subscriber', 'Non Subscriber'];
