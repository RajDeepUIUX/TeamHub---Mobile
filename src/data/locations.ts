// Country › State › City data shared by every address / location form (State depends on Country, City on State).
// Backed by the open `country-state-city` dataset, so every country has its states and every state its cities.
import { City, Country, State } from 'country-state-city';

const COUNTRIES = Country.getAllCountries();
const isoOfCountry = new Map(COUNTRIES.map((c) => [c.name, c.isoCode]));

/** Web order: a few common ones first, then A–Z */
const PINNED = ['Canada', 'United States', 'United Kingdom', 'Israel'];
export const COUNTRY_OPTIONS = [
  ...PINNED,
  ...COUNTRIES.map((c) => c.name)
    .filter((n) => !PINNED.includes(n))
    .sort((a, b) => a.localeCompare(b)),
];

const statesCache = new Map<string, { name: string; isoCode: string }[]>();
const statesData = (country: string) => {
  const iso = isoOfCountry.get(country);
  if (!iso) return [];
  if (!statesCache.has(iso)) statesCache.set(iso, State.getStatesOfCountry(iso).map(({ name, isoCode }) => ({ name, isoCode })));
  return statesCache.get(iso)!;
};

/** States of a country, or null when the country has none listed (the field then takes free text) */
export const statesOf = (country: string | null) => {
  if (!country) return null;
  const list = statesData(country).map((s) => s.name);
  return list.length ? list : null;
};

/** Cities of a state, or null when none are listed (the field then takes free text) */
export const citiesOf = (country: string | null, state: string) => {
  if (!country || !state) return null;
  const countryIso = isoOfCountry.get(country);
  const stateIso = statesData(country).find((s) => s.name === state)?.isoCode;
  if (!countryIso || !stateIso) return null;
  const list = City.getCitiesOfState(countryIso, stateIso).map((c) => c.name);
  return list.length ? list : null;
};

/** All US states (+ DC), e.g. the state a CPA candidate sits the exam in */
export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida',
  'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
  'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];
