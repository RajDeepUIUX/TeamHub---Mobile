import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { McAuthPage, McButton, McField, useFieldSpacing } from '../common/McUi';
import { useQuickFill } from '../../../hooks/useQuickFill';
import { demoEmail, demoPassword } from '../data/mycpeDemo';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const McSignIn: React.FC<{ onSignIn: () => void; onForgot: () => void; onSignUp: () => void }> = ({ onSignIn, onForgot, onSignUp }) => {
  // Filled as in the design
  const [email, setEmail] = useState('Johndoe@my-cpe.com');
  const [password, setPassword] = useState('');
  const spacing = useFieldSpacing();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Only blank fields are filled
  useQuickFill(() => {
    if (!email.trim()) setEmail(demoEmail());
    if (!password) setPassword(demoPassword());
    setErrors({});
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) found.email = 'Enter a valid email.';
    if (!password) found.password = 'Enter your password.';
    setErrors(found);
    if (!Object.keys(found).length) onSignIn();
  };

  return (
    <McAuthPage title="Welcome back!" subtitle="Continuing Education at Your Fingertips!">
      <form onSubmit={submit} noValidate>
        <div className={spacing.stack}>
          <McField
            icon={<Mail className="w-5 h-5" />}
            label="Email*"
            type="email"
            autoComplete="email"
            value={email}
            error={errors.email}
            onChange={(v) => {
              setEmail(v);
              setErrors((p) => ({ ...p, email: undefined }));
            }}
          />
          <McField
            icon={<Lock className="w-5 h-5" />}
            label="Password*"
            type="password"
            autoComplete="current-password"
            value={password}
            error={errors.password}
            onChange={(v) => {
              setPassword(v);
              setErrors((p) => ({ ...p, password: undefined }));
            }}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={onForgot} className="text-sm leading-5 text-mc-primary underline underline-offset-[3px] cursor-pointer">
            Forgot Password?
          </button>
        </div>
        <McButton type="submit" className="mt-8">
          Sign In
        </McButton>
      </form>
      <p className="mt-6 text-center text-base font-medium text-mc-text">
        New to MYCPE ONE?{' '}
        <button type="button" onClick={onSignUp} className="font-semibold text-mc-primary cursor-pointer">
          Sign up
        </button>
      </p>
    </McAuthPage>
  );
};
