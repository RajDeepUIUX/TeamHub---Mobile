import React, { useState } from 'react';
import { McAuthPage, McButton, McCheckBox, McField, McSelectField } from '../common/McUi';
import { McQualificationSheet } from './McQualificationSheet';
import { McTermsSheet } from './McTermsSheet';
import { EMAIL_RE } from './McSignIn';
import { McAccount } from '../data/mycpeHomeData';
import { useQuickFill } from '../../../hooks/useQuickFill';
import { demoEmail, demoFirstName, demoLastName, demoPassword, demoQualifications } from '../data/mycpeDemo';

type Key = 'firstName' | 'lastName' | 'email' | 'password' | 'qualification';

export const McSignUp: React.FC<{ onCreated: (account: McAccount) => void; onSignIn: () => void }> = ({ onCreated, onSignIn }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [sheet, setSheet] = useState<'qualification' | 'terms' | null>(null);

  const clear = (k: Key) => setErrors((p) => ({ ...p, [k]: undefined }));
  const set = (k: keyof typeof form) => (v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    clear(k);
  };

  // Only blank fields are filled; the email matches the name
  useQuickFill(() => {
    const firstName = form.firstName.trim() || demoFirstName();
    const lastName = form.lastName.trim() || demoLastName();
    setForm({ firstName, lastName, email: form.email.trim() || demoEmail(firstName, lastName), password: form.password || demoPassword() });
    if (!qualifications.length) setQualifications(demoQualifications());
    setAccepted(true);
    setErrors({});
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) return;
    const found: typeof errors = {};
    if (!form.firstName.trim()) found.firstName = 'Enter your first name.';
    if (!form.lastName.trim()) found.lastName = 'Enter your last name.';
    if (!EMAIL_RE.test(form.email.trim())) found.email = 'Enter a valid email.';
    if (!form.password) found.password = 'Enter a password.';
    if (!qualifications.length) found.qualification = 'Select your qualification.';
    setErrors(found);
    if (!Object.keys(found).length) onCreated({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() });
  };

  const link = (text: string) => (
    <button type="button" onClick={() => setSheet('terms')} className="text-mc-link cursor-pointer">
      {text}
    </button>
  );

  return (
    <>
      <McAuthPage title="Create your free account" subtitle="Add basic Details">
        <form onSubmit={submit} noValidate>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <McField label="First Name*" autoComplete="given-name" value={form.firstName} error={errors.firstName} onChange={set('firstName')} />
              <McField label="Last Name*" autoComplete="family-name" value={form.lastName} error={errors.lastName} onChange={set('lastName')} />
            </div>
            <McField label="Email*" type="email" autoComplete="email" value={form.email} error={errors.email} onChange={set('email')} />
            <McField label="Password*" type="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={set('password')} />
            <McSelectField label="Qualification*" value={qualifications.join(', ')} error={errors.qualification} onOpen={() => setSheet('qualification')} />
          </div>

          <div className="mt-8 flex items-start gap-2 text-sm leading-5 text-mc-text">
            <button
              type="button"
              role="checkbox"
              aria-checked={accepted}
              aria-label="I accept the MYCPE ONE Terms of Services and Privacy Policy"
              onClick={() => setAccepted((a) => !a)}
              className="-m-2 p-2 pt-2.5 cursor-pointer"
            >
              <McCheckBox checked={accepted} tone="link" />
            </button>
            <p>
              <span onClick={() => setAccepted((a) => !a)} className="cursor-pointer">
                I accept the MYCPE ONE
              </span>{' '}
              {link('Terms of Services')} and {link('Privacy Policy.')}
            </p>
          </div>

          <McButton type="submit" disabled={!accepted} className="mt-4">
            Get Started
          </McButton>
        </form>
        <p className="mt-6 text-center text-base font-medium text-mc-text">
          Already have an account?{' '}
          <button type="button" onClick={onSignIn} className="font-semibold text-mc-primary cursor-pointer">
            Sign In
          </button>
        </p>
        <p className="mt-10 text-center text-xs leading-[18px] text-mc-text">
          Get your free CPE Wallet to save certificates, track credits, and manage your learning.
        </p>
      </McAuthPage>

      <McQualificationSheet
        isOpen={sheet === 'qualification'}
        selected={qualifications}
        onClose={() => setSheet(null)}
        onSelect={(next) => {
          setQualifications(next);
          clear('qualification');
          setSheet(null);
        }}
      />
      <McTermsSheet
        isOpen={sheet === 'terms'}
        onClose={() => setSheet(null)}
        onAccept={() => {
          setAccepted(true);
          setSheet(null);
        }}
      />
    </>
  );
};
