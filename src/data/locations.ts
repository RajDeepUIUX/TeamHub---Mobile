// Country › State › City data shared by every address / location form (State depends on Country, City on State)


/** States (and their main cities) for the countries we have data for; other countries take free text */
export const LOCATIONS: Record<string, Record<string, string[]>> = {
  India: {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
    Assam: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'],
    Bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
    Chhattisgarh: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba'],
    Delhi: ['New Delhi', 'Dwarka', 'Rohini', 'Saket'],
    Goa: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar'],
    Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi', 'Solan'],
    Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
    Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'],
    Kerala: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain'],
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad'],
    Manipur: ['Imphal', 'Thoubal'],
    Meghalaya: ['Shillong', 'Tura'],
    Mizoram: ['Aizawl', 'Lunglei'],
    Nagaland: ['Kohima', 'Dimapur'],
    Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri'],
    Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Mohali', 'Patiala'],
    Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
    Sikkim: ['Gangtok', 'Namchi'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
    Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
    Tripura: ['Agartala', 'Udaipur'],
    'Uttar Pradesh': ['Lucknow', 'Noida', 'Kanpur', 'Varanasi', 'Agra', 'Ghaziabad'],
    Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Rishikesh'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'],
    Chandigarh: ['Chandigarh'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag'],
    Ladakh: ['Leh', 'Kargil'],
    Puducherry: ['Puducherry', 'Karaikal'],
  },
  'United States': {
    California: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
    Florida: ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
    Georgia: ['Atlanta', 'Savannah', 'Augusta'],
    Illinois: ['Chicago', 'Naperville', 'Springfield'],
    Massachusetts: ['Boston', 'Cambridge', 'Worcester'],
    'New Jersey': ['Newark', 'Jersey City', 'Edison', 'Princeton'],
    'New York': ['New York City', 'Buffalo', 'Albany', 'Rochester'],
    'North Carolina': ['Charlotte', 'Raleigh', 'Durham'],
    Pennsylvania: ['Philadelphia', 'Pittsburgh', 'Harrisburg'],
    Texas: ['Houston', 'Dallas', 'Austin', 'San Antonio'],
    Virginia: ['Richmond', 'Arlington', 'Virginia Beach'],
    Washington: ['Seattle', 'Spokane', 'Tacoma'],
  },
  Canada: {
    Alberta: ['Calgary', 'Edmonton', 'Red Deer'],
    'British Columbia': ['Vancouver', 'Victoria', 'Surrey', 'Burnaby'],
    Manitoba: ['Winnipeg', 'Brandon'],
    'Nova Scotia': ['Halifax', 'Sydney'],
    Ontario: ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton'],
    Quebec: ['Montreal', 'Quebec City', 'Laval', 'Gatineau'],
    Saskatchewan: ['Saskatoon', 'Regina'],
  },
  'United Kingdom': {
    England: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool'],
    Scotland: ['Edinburgh', 'Glasgow', 'Aberdeen'],
    Wales: ['Cardiff', 'Swansea', 'Newport'],
    'Northern Ireland': ['Belfast', 'Derry'],
  },
  Australia: {
    'New South Wales': ['Sydney', 'Newcastle', 'Wollongong'],
    Victoria: ['Melbourne', 'Geelong', 'Ballarat'],
    Queensland: ['Brisbane', 'Gold Coast', 'Cairns'],
    'Western Australia': ['Perth', 'Fremantle'],
    'South Australia': ['Adelaide'],
  },
  'United Arab Emirates': {
    'Abu Dhabi': ['Abu Dhabi', 'Al Ain'],
    Dubai: ['Dubai'],
    Sharjah: ['Sharjah'],
    Ajman: ['Ajman'],
  },
  Israel: {
    'Tel Aviv District': ['Tel Aviv', 'Ramat Gan', 'Holon'],
    'Jerusalem District': ['Jerusalem', 'Beit Shemesh'],
    'Haifa District': ['Haifa', 'Hadera'],
    'Central District': ['Petah Tikva', 'Rishon LeZion', 'Netanya'],
  },
};

/** Web order: a few common ones first, then A–Z */
const PINNED = ['Canada', 'United States', 'United Kingdom', 'Israel'];
const ALL_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'American Samoa', 'Andorra', 'Angola', 'Anguilla', 'Antarctica', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus',
  'Belgium', 'Belize', 'Benin', 'Bermuda', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'British Indian Ocean Territory', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Cape Verde',
  'Cayman Islands', 'Central African Republic', 'Chad', 'Chile', 'China', 'Christmas Island', 'Cocos (Keeling) Islands', 'Colombia',
  'Comoros', 'Congo', 'Cook Islands', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica',
  'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland',
  'France', 'French Guiana', 'French Polynesia', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Gibraltar', 'Greece', 'Greenland',
  'Grenada', 'Guam', 'Guatemala', 'Guinea', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia',
  'Iran', 'Iraq', 'Ireland', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia',
  'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macau', 'Madagascar', 'Malawi', 'Malaysia',
  'Maldives', 'Mali', 'Malta', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique',
  'Myanmar', 'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Puerto Rico', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Somalia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];
export const COUNTRY_OPTIONS = [...PINNED, ...ALL_COUNTRIES.filter((c) => !PINNED.includes(c))];

export const statesOf = (country: string | null) => (country && LOCATIONS[country] ? Object.keys(LOCATIONS[country]) : null);
export const citiesOf = (country: string | null, state: string) =>
  country && state && LOCATIONS[country]?.[state] ? LOCATIONS[country][state] : null;
