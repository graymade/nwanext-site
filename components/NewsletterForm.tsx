'use client';
import { useId, useState } from 'react';
import { sendForm } from '@/lib/sendForm';

// Email signup. Saves to the signup sheet once site.newsletter.action is set in the CMS;
// until then it says so instead of pretending to subscribe.
// `stacked` puts the field over a full-width button, for narrow columns like the sidebar.
export default function NewsletterForm({ action, emailField, handle, label = 'Subscribe', stacked = false }: { action: string; emailField: string; handle: string; label?: string; stacked?: boolean }) {
  const id = useId();
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  if (state === 'done') {
    return <p className={`signup-form signup-form--done${stacked ? ' signup-form--stacked' : ''}`} role="status">You’re on the list. Thanks for subscribing.</p>;
  }
  return (
    <form
      className={`signup-form${stacked ? ' signup-form--stacked' : ''}`}
      method="post"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!action) {
          setNote(`Signups open soon. Until then, follow @${handle} on Instagram.`);
          return;
        }
        const f = new FormData(e.currentTarget);
        setState('sending');
        setNote('');
        const ok = await sendForm(action, { type: 'newsletter', email: String(f.get(emailField || 'email') || ''), website: String(f.get('website') || '') });
        if (ok) setState('done');
        else {
          setState('idle');
          setNote('That didn’t go through. Check your connection and try again.');
        }
      }}
    >
      <label className="sr-only" htmlFor={id}>Email address</label>
      <input id={id} className="input" type="email" name={emailField || 'email'} required placeholder="you@email.com" autoComplete="email" />
      <input type="text" name="website" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button type="submit" className="button" disabled={state === 'sending'}>{state === 'sending' ? 'Subscribing…' : label}</button>
      <p className="signup-form__small">Free. Unsubscribe any time.</p>
      <p className="signup-form__note" role="status">{note}</p>
    </form>
  );
}
