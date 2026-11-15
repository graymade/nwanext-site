'use client';
import { useId, useState } from 'react';

// Posts straight to the newsletter provider once site.newsletter.action is set in the CMS.
// Until then it says so instead of pretending to subscribe.
// `stacked` puts the field over a full-width button, for narrow columns like the sidebar.
export default function NewsletterForm({ action, emailField, handle, label = 'Get the Friday email', stacked = false }: { action: string; emailField: string; handle: string; label?: string; stacked?: boolean }) {
  const id = useId();
  const [note, setNote] = useState('');
  return (
    <form
      className={`signup-form${stacked ? ' signup-form--stacked' : ''}`}
      action={action || undefined}
      method="post"
      target={action ? '_blank' : undefined}
      onSubmit={(e) => {
        if (!action) {
          e.preventDefault();
          setNote(`Signups open soon. Until then, follow @${handle} on Instagram.`);
        }
      }}
    >
      <label className="sr-only" htmlFor={id}>Email address</label>
      <input id={id} className="input" type="email" name={emailField || 'email'} required placeholder="you@email.com" autoComplete="email" />
      <button type="submit" className="button">{label}</button>
      <p className="signup-form__small">Free. Unsubscribe any time.</p>
      <p className="signup-form__note" role="status">{note}</p>
    </form>
  );
}
