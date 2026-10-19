import { CLIENT_ACCOUNT_MANAGER } from './clientDashboardData';

/** Desktop Directory tabs (`templates/directories/index.tpl`) */
export type DirectoryTab = 'primary' | 'poc';

export const DIRECTORY_TABS: { id: DirectoryTab; label: string }[] = [
  { id: 'primary', label: 'Primary Contacts' },
  { id: 'poc', label: 'Product Specific POCs' },
];

/** One Entigrity / MyCPE ONE person (desktop row: name, designation, mail, VOIP / phone, chat channel, meeting link) */
export interface DirectoryContact {
  id: string;
  name: string;
  designation: string;
  email?: string;
  /** Primary Contacts show the VOIP line, Product POCs the phone number */
  phone?: string;
  phoneLabel: 'VOIP' | 'Phone';
  /** `tblstaff_meta.ms_teams` */
  teamsUrl?: string;
  /** `tblstaff_additional_details.ms_meeting_link` (Outlook Bookings) */
  meetingUrl?: string;
  /** Client's General Manager (= sidebar Account Manager card) */
  isAccountManager?: boolean;
}

export interface DirectoryProduct {
  id: 'offshoring' | 'cpe_b2b' | 'cpe_individual' | 'digital_marketing_and_website';
  product: string;
  /** Added by designer: what to reach this POC for */
  hint: string;
  /** Desktop allows a product row with no staff mapped */
  poc: DirectoryContact | null;
}

const teamsChat = (email: string) => `https://teams.microsoft.com/l/chat/0/0?users=${email}`;

/** Fixed VP contact — shown on every client (desktop `get_fixed_staff_contact`) */
const VP_CLIENT_RELATIONSHIPS: DirectoryContact = {
  id: 'vp-client-relationships',
  name: 'Vikram Anand',
  designation: 'Vice President of Client Relationships',
  email: 'vikram.anand@example.com',
  phone: '+1 (555) 010-0102',
  phoneLabel: 'VOIP',
  teamsUrl: teamsChat('vikram.anand@example.com'),
  meetingUrl: 'https://outlook.office.com/bookwithme/',
};

/** Primary Contacts: client's General Manager (labelled "Client Success Advisor") + fixed VP contact */
export const DIRECTORY_PRIMARY_SEED: DirectoryContact[] = [
  {
    id: 'general-manager',
    name: CLIENT_ACCOUNT_MANAGER.name,
    designation: 'Client Success Advisor',
    email: CLIENT_ACCOUNT_MANAGER.email,
    phone: CLIENT_ACCOUNT_MANAGER.phone,
    phoneLabel: 'VOIP',
    teamsUrl: teamsChat(CLIENT_ACCOUNT_MANAGER.email),
    meetingUrl: 'https://outlook.office.com/bookwithme/',
    isAccountManager: true,
  },
  VP_CLIENT_RELATIONSHIPS,
];

/** Product Specific POCs: desktop `poc_list()` order and labels */
export const DIRECTORY_POC_SEED: DirectoryProduct[] = [
  {
    id: 'offshoring',
    product: 'Offshoring',
    hint: 'Offshore staff, hiring & engagement',
    poc: { ...VP_CLIENT_RELATIONSHIPS, id: 'poc-offshoring', designation: 'Point of Contact', phoneLabel: 'Phone' },
  },
  {
    id: 'cpe_b2b',
    product: 'CPE Teams',
    hint: 'CPE subscriptions for your firm',
    poc: {
      id: 'poc-cpe-teams',
      name: 'Ethan Parker',
      designation: 'Point of Contact',
      email: 'ethan.parker@example.com',
      phone: '+1 (555) 010-0136',
      phoneLabel: 'Phone',
      teamsUrl: teamsChat('ethan.parker@example.com'),
      meetingUrl: 'https://outlook.office.com/bookwithme/',
    },
  },
  {
    id: 'cpe_individual',
    product: 'CPE Individual',
    hint: 'Personal CPE courses & certificates',
    poc: {
      id: 'poc-cpe-individual',
      name: 'Lucas Grant',
      designation: 'Point of Contact',
      email: 'lucas.grant@example.com',
      phone: '+1 (555) 010-0184',
      phoneLabel: 'Phone',
      teamsUrl: teamsChat('lucas.grant@example.com'),
      meetingUrl: 'https://outlook.office.com/bookwithme/',
    },
  },
  {
    id: 'digital_marketing_and_website',
    product: 'Digital Marketing and Website',
    hint: 'Marketing, SEO & website services',
    poc: {
      id: 'poc-digital-marketing',
      name: 'Meera Kapoor',
      designation: 'Point of Contact',
      email: 'meera.kapoor@example.com',
      phoneLabel: 'Phone',
      teamsUrl: teamsChat('meera.kapoor@example.com'),
      meetingUrl: 'https://outlook.office.com/bookwithme/',
    },
  },
];

/** Avatar tint from the name, so a person looks the same on both tabs */
export const directoryTint = (name: string) => [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

/** "+1 (555) 010-0148" → "+15550100148" for tel: links */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
