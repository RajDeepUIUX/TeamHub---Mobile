import React, { useEffect, useMemo, useState } from 'react';
import { Award, Check, CirclePlus, Info, Mic, Pencil } from 'lucide-react';
import { SegmentedTabs } from '../../../design-system/components/SegmentedTabs';
import { avatarTint, initialsOf } from '../../home/celebrationUtils';
import { Card, EmptyCard, SearchField } from '../staff/tabs/StaffTabParts';
import { ErrorText } from './ProfileParts';
import {
  ClientQualification,
  FollowedSpeaker,
  TOPIC_OPTIONS,
  isQualificationActive,
  qualificationMeta,
  qualificationTitle,
} from '../data/clientUserProfileData';

/** B shows dates as mm/dd/yyyy on the qualification cards */
const usDate = (iso: string) => (iso ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}` : '-');

const AddButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="h-10 px-3.5 rounded-xl bg-[#4F46E5] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:bg-[#4338CA] transition-colors cursor-pointer shrink-0"
  >
    <CirclePlus className="w-4 h-4" />
    Add Qualification
  </button>
);

/* --------------------------- Qualification Details --------------------------- */

export const QualificationsPanel: React.FC<{
  qualifications: ClientQualification[];
  onAdd: () => void;
  onEdit: (q: ClientQualification) => void;
}> = ({ qualifications, onAdd, onEdit }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between gap-3 min-h-10">
      <h2 className="text-base font-extrabold text-[#1E293B]">Qualification Details</h2>
      {qualifications.length > 0 && <AddButton onClick={onAdd} />}
    </div>

    {qualifications.length === 0 ? (
      <EmptyCard
        icon={Award}
        title="No qualifications added"
        text="Add your licenses and certifications so your CPE compliance can be tracked."
        action={
          <div className="mt-4">
            <AddButton onClick={onAdd} />
          </div>
        }
      />
    ) : (
      qualifications.map((q) => {
        const meta = qualificationMeta(q.type);
        const active = isQualificationActive(q);
        const rows = [
          { label: 'Expiration Date', value: meta.noExpiry ? '-' : usDate(q.expiryDate) },
          { label: 'Cycle End Date', value: usDate(q.cycleEndDate) },
          { label: 'License Number', value: q.licenseNumber || '-' },
          { label: 'Issue Date', value: meta.noExpiry ? '-' : usDate(q.issueDate) },
          { label: 'Reciprocal Exemption', value: q.reciprocalExemption === null ? 'Not available' : q.reciprocalExemption ? 'Yes' : 'No' },
        ];
        return (
          <article key={q.id} className="bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs overflow-hidden">
            <h3 className="px-4 py-5 bg-[#EEF2FF] text-center text-[15px] font-semibold text-[#1E293B] leading-snug">{qualificationTitle(q)}</h3>
            <dl className="divide-y divide-slate-100">
              {rows.map((r) => (
                <div key={r.label} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-[12.5px] font-semibold text-[#1E293B]">{r.label}</dt>
                  <dd className="text-[12.5px] font-medium text-[#1E293B] tabular-nums text-right break-all">{r.value}</dd>
                </div>
              ))}
            </dl>
            <div className="px-4 py-3 bg-slate-50 border-t-4 border-slate-100 flex items-center justify-between gap-3">
              <span
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                  active ? 'bg-[#E8F8F0] border-[#A7F3D0] text-[#059669]' : 'bg-[#FEF2F2] border-rose-200 text-rose-600'
                }`}
              >
                {active ? 'Active' : 'Inactive'}
              </span>
              <button
                type="button"
                onClick={() => onEdit(q)}
                aria-label={`Edit ${qualificationTitle(q)}`}
                className="h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#1E293B] flex items-center gap-1.5 active:bg-slate-100 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
            {!active && (
              <p className="px-4 py-2.5 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100">
                <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                Shows Active while your CPE cycle is in the current period. Update the cycle dates once your new cycle starts.
              </p>
            )}
          </article>
        );
      })
    )}
  </div>
);

/* ---------------------------- Learning Preference ---------------------------- */

type LearningTab = 'topics' | 'speakers';

export const LearningPreferencePanel: React.FC<{
  topics: string[];
  speakers: FollowedSpeaker[];
  onSaveTopics: (topics: string[]) => void;
  onUnfollow: (speaker: FollowedSpeaker) => void;
}> = ({ topics, speakers, onSaveTopics, onUnfollow }) => {
  const [tab, setTab] = useState<LearningTab>('topics');
  const [draft, setDraft] = useState<string[]>(topics);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(topics), [topics]);

  const dirty = [...draft].sort().join('|') !== [...topics].sort().join('|');
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? TOPIC_OPTIONS.filter((t) => t.toLowerCase().includes(q)) : TOPIC_OPTIONS;
  }, [query]);

  const toggle = (t: string) => {
    setDraft((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]));
    setError('');
  };

  const submit = () => {
    if (!draft.length) return setError('Select at least one topic.');
    setSaving(true);
    setTimeout(() => {
      onSaveTopics(draft);
      setSaving(false);
    }, 600);
  };

  return (
    <div className="space-y-3">
      <SegmentedTabs
        ariaLabel="Learning preference"
        value={tab}
        onChange={setTab}
        options={[
          { id: 'topics', label: 'Topics' },
          { id: 'speakers', label: 'Following Speakers', badge: speakers.length || undefined },
        ]}
      />

      {tab === 'topics' ? (
        <Card className="p-4">
          <h2 className="text-sm font-bold text-[#1E293B]">Choose Topics That Match Your Interests</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-500">Select the subject areas to get personalized course recommendations.</p>

          <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-[#1E293B]">
                Selected Topics <span className="text-slate-400 font-semibold tabular-nums">({draft.length})</span>
              </p>
              {draft.length > 0 && (
                <button type="button" onClick={() => setDraft([])} className="h-8 -mr-1.5 px-2 rounded-lg text-[11px] font-bold text-rose-500 active:bg-rose-50 cursor-pointer">
                  All Clear
                </button>
              )}
            </div>
            <p className={`mt-1 text-[11.5px] leading-relaxed ${draft.length ? 'text-[#1E293B]' : 'italic text-slate-400'}`}>
              {draft.length ? draft.join(', ') : 'No topics selected yet'}
            </p>
          </div>

          <div className="mt-3.5">
            <SearchField value={query} onChange={setQuery} placeholder="Search topics" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Topics">
            {shown.map((t) => {
              const on = draft.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(t)}
                  className={`h-9 px-3 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    on ? 'bg-[#EFF6FF] border-[#2F68FE] text-[#1D4ED8]' : 'bg-white border-slate-200 text-slate-600 active:bg-slate-50'
                  }`}
                >
                  {on && <Check className="w-3.5 h-3.5" />}
                  {t}
                </button>
              );
            })}
            {shown.length === 0 && <p className="text-[12px] text-slate-400">No topics match "{query.trim()}".</p>}
          </div>
          <div className="mt-2">
            <ErrorText error={error} />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={saving || !dirty}
            className="mt-3 w-full h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Saving…' : 'Submit'}
          </button>
        </Card>
      ) : speakers.length === 0 ? (
        <EmptyCard
          icon={Mic}
          title="No Speakers Found"
          text="Follow speakers from their profile pages to see them listed here and receive regular updates."
        />
      ) : (
        <Card className="p-4">
          <h2 className="text-sm font-bold text-[#1E293B]">Learn from Industry Experts</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-500">Follow your preferred speakers to stay updated on their latest courses.</p>
          <ul className="mt-2 -mx-1 divide-y divide-slate-100">
            {speakers.map((s, i) => (
              <li key={s.id} className="min-h-16 px-1 py-2.5 flex items-center gap-3">
                <span className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTint(i)}`} aria-hidden>
                  {initialsOf(s.name)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-[#1E293B] truncate">
                    {s.name}
                    {s.qualification && `, ${s.qualification}`}
                  </span>
                  <span className="block text-[11px] text-slate-400 truncate">{s.company}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onUnfollow(s)}
                  aria-label={`Unfollow ${s.name}`}
                  className="h-9 px-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[11px] font-bold text-[#1D4ED8] flex items-center gap-1 active:bg-blue-100 cursor-pointer shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  Following
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
