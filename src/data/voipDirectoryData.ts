export type VoipLineKind = 'Branch office' | 'Meeting room' | 'Team line' | 'Facility';

export interface VoipEntry {
  id: string;
  name: string;
  /** Desk extension, dialled from any office VOIP phone */
  ext: string;
  /** Present for people; shared office lines have none */
  empCode?: string;
  designation?: string;
  email?: string;
  /** Present for shared office lines (rooms, branches, team desks) */
  lineKind?: VoipLineKind;
}

const line = (id: string, name: string, ext: string, lineKind: VoipLineKind): VoipEntry => ({ id, name, ext, lineKind });

const person = (empCode: string, name: string, designation: string, ext: string, email: string): VoipEntry => ({
  id: empCode,
  name,
  ext,
  empCode,
  designation,
  email,
});

export const VOIP_OFFICE_LINES: VoipEntry[] = [
  line('ol-1', 'Jaipur Manager', '1462', 'Branch office'),
  line('ol-2', 'Jaipur Office', '1461', 'Branch office'),
  line('ol-3', 'Nagpur Branch', '1361', 'Branch office'),
  line('ol-4', 'Indore Office', '1444', 'Branch office'),
  line('ol-5', 'Rajkot 1', '1450', 'Branch office'),
  line('ol-6', 'Manager Cabin Rajkot', '1441', 'Branch office'),
  line('ol-7', 'Conference Room', '2004', 'Meeting room'),
  line('ol-8', 'Interview Room Baroda', '1423', 'Meeting room'),
  line('ol-9', '2nd Floor', '1392', 'Facility'),
  line('ol-10', '8th Floor Sakar-1', '1405', 'Facility'),
  line('ol-11', 'Canteen', '1407', 'Facility'),
  line('ol-12', 'Sales Team', '1285', 'Team line'),
  line('ol-13', 'Sourcing Team', '1460', 'Team line'),
  line('ol-14', 'Auditor', '1191', 'Team line'),
];

export const VOIP_PEOPLE: VoipEntry[] = [
  person('A02071', 'Matthew Uranus', 'Sr. Manager', '1428', 'matthew@my-cpe.com'),
  person('A04115', 'Aalay Shah', 'Manager', '1064', 'aalay.shah@my-cpe.com'),
  person('A00020', 'Abhi Parikh', 'Sr. Manager', '1010', 'abhi@my-cpe.com'),
  person('A04065', 'Abhi Garg', 'Assistant Manager', '1503', 'abhi.garg@my-cpe.com'),
  person('ANM0080', 'Abhishek Sanwal', 'Sr. Associate', '1481', 'abhishek@my-cpe.com'),
  person('A00164', 'Abhishek Sundas', 'Manager', '1029', 'abhishek.sundas1@my-cpe.com'),
  person('A03843', 'Abrarahmed Badarpura', 'Sr. Associate', '2000', 'abrar.badarpura@my-cpe.com'),
  person('A03341', 'Aditya Shukla', 'Corporate Counsel', '1396', 'aditya.shukla@my-cpe.com'),
  person('A01744', 'Afzal Ujjainwala', 'Team Lead', '1147', 'afzal.ujjainwala@my-cpe.com'),
  person('A00055', 'Akash Patel', 'Sr. Manager', '1023', 'akash@my-cpe.com'),
  person('A02103', 'Akil Shah', 'Manager', '1442', 'akil.shah@my-cpe.com'),
  person('A04321', 'Akshansh Negi', 'Associate', '1182', 'akshansh.negi@my-cpe.com'),
  person('A00111', 'Akshay Nayak', 'Manager', '1037', 'akshay@my-cpe.com'),
  person('A02413', 'Akshay Sharma', 'Team Lead', '1048', 'akshay.sharma@my-cpe.com'),
  person('ANM0022', 'Akshaysinh Varma', 'Associate', '1301', 'akshaysinh.varma@my-cpe.com'),
  person('A00762', 'Alok Mishra', 'Manager', '1150', 'alok.mishra@my-cpe.com'),
  person('ANM0023', 'Ankit Parikh', 'Sr. Manager', '1319', 'ankit@my-cpe.com'),
  person('A01984', 'Ankit Garg', 'Manager', '1433', 'ankit.garg@my-cpe.com'),
  person('A02577', 'Ankita Vairagi', 'Specialist', '1178', 'ankita.vairagi@my-cpe.com'),
  person('A00732', 'Arfat Mansuri', 'Associate', '1174', 'arfat.mansuri@my-cpe.com'),
  person('A03046', 'Arnel Hisoler', 'Associate', '1179', 'arnel.hisoler@my-cpe.com'),
  person('A00270', 'Arpita Darji', 'Consultant', '1268', 'arpita.darji@my-cpe.com'),
  person('A00730', 'Ashish Raval', 'Specialist', '1348', 'ashish.raval@my-cpe.com'),
  person('A00752', 'Ashwin Kanjariya', 'Consultant', '1210', 'ashwin.kanjariya@my-cpe.com'),
  person('A02957', 'Ashwin Rohit', 'Associate', '1530', 'ashwin.rohit@my-cpe.com'),
  person('A00190', 'Ayush Joshi', 'Assistant Manager', '1155', 'joshi.ayush@my-cpe.com'),
  person('A02428', 'Ayush Raj Kumawat', 'Sr. Specialist', '1107', 'ayush.kumawat@my-cpe.com'),
  person('A00580', 'Azazhusen Kureshi', 'Team Lead', '3108', 'azaz.kureshi@my-cpe.com'),
  person('A03722', 'Ben Kumar', 'Director', '1123', 'benkumar@my-cpe.com'),
  person('A00995', 'Bharat Maisal', 'Team Lead', '1252', 'bharat.maisal@my-cpe.com'),
  person('ANM0002', 'Bhargav Prajapati', 'Sr. Associate', '1302', 'bhargav@my-cpe.com'),
  person('A01269', 'Bhargavi Mathur', 'Sr. Consultant', '1401', 'bhargavi.mathur@my-cpe.com'),
  person('A00116', 'Bhavik Bhatti', 'Manager', '1043', 'bhavik.bhatti@my-cpe.com'),
  person('ANM0032', 'Chandan Narayan', 'Assistant Manager', '1507', 'chandan@my-cpe.com'),
  person('A02878', 'Chandramouli Rameswarapu', 'Consultant', '1039', 'chandramouli.rameswarapu@my-cpe.com'),
  person('A01705', 'Chandresh Nayak', 'Sr. Associate', '1421', 'chandresh.nayak@my-cpe.com'),
  person('ANM0161', 'Charan Nadella', 'Associate', '1343', 'charan.nadella@my-cpe.com'),
  person('A00888', 'Chintan Joshi', 'Team Lead', '1390', 'chintan.joshi@my-cpe.com'),
  person('A00566', 'Chintan Pandya', 'Team Lead', '1026', 'chintan.pandya@my-cpe.com'),
  person('A00914', 'Chirag Jani', 'Sr. Associate', '1413', 'chirag.jani@my-cpe.com'),
  person('A00624', 'Chirag Purohit', 'Team Lead', '1154', 'chirag.purohit@my-cpe.com'),
  person('A00303', 'Darshan Vora', 'Manager', '1034', 'darshan.vora1@my-cpe.com'),
  person('A00393', 'Darshan Dabhi', 'Independent Team Lead', '1156', 'darshan.dabhi@my-cpe.com'),
  person('A00181', 'Darshan Garvad', 'Assistant Manager', '1209', 'darshan.garvad1@my-cpe.com'),
  person('A01596', 'Darshit Vachhani', 'Specialist', '1018', 'darshit.vachhani@my-cpe.com'),
  person('A01112', 'Hiren Dattani', 'HR & Admin', '1116', 'hiren.dattani@my-cpe.com'),
  person('A00907', 'Loveisha Bhambhani', 'HR & Admin', '1108', 'loveisha.bhambhani@my-cpe.com'),
  person('A00641', 'Naveen Das', 'Sr. Manager', '1236', 'naveen.das@my-cpe.com'),
  person('A01033', 'Nehal Patel', 'Recruitment Lead', '1227', 'nehal.patel@my-cpe.com'),
  person('A01458', 'Nitisha Jain', 'Sr. Consultant', '1264', 'nitisha.jain@my-cpe.com'),
  person('A00502', 'Parvan Vora', 'Manager', '1119', 'parvan.vora@my-cpe.com'),
  person('A00048', 'Puran Bhavsar', 'Sr. Manager', '1102', 'puran.bhavsar@my-cpe.com'),
  person('A01376', 'Shashank Mishra', 'Manager', '1189', 'shashank.mishra@my-cpe.com'),
  person('A00879', 'Shubham Agarwal', 'Sr. Manager', '1245', 'shubham.agarwal@my-cpe.com'),
  person('A01920', 'Taufiq Shaikh', 'Recruiter', '1142', 'taufiq.shaikh@my-cpe.com'),
].sort((a, b) => a.name.localeCompare(b.name));

export const VOIP_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'people', label: 'People' },
  { id: 'lines', label: 'Office lines' },
] as const;

export type VoipFilter = (typeof VOIP_FILTERS)[number]['id'];
