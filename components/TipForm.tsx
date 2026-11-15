'use client';
import { useState } from 'react';
import { sendForm } from '@/lib/sendForm';

// Saves tips to the same sheet as signups once tips.action is set in the CMS.
// Until then it sends readers to Instagram messages, which already work.
export default function TipForm({ action, handle }: { action: string; handle: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  if (!action) {
    return (
      <div className="tip-fallback">
        <p>The fastest way to reach us is a message on Instagram.</p>
        <a className="button" href={`https://ig.me/m/${handle}`}>Message @{handle}</a>
      </div>
    );
  }
  if (state === 'done') {
    return (
      <div className="tip-fallback" role="status">
        <p>Thanks, we got it. We check every tip with a first-hand source before it runs.</p>
        <button className="button" type="button" onClick={() => setState('idle')}>Send another tip</button>
      </div>
    );
  }
  return (
    <form
      className="tip-form"
      method="post"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const get = (k: string) => String(f.get(k) || '');
        setState('sending');
        const ok = await sendForm(action, { type: 'tip', tip: get('tip'), source: get('source'), email: get('email'), website: get('website') });
        setState(ok ? 'done' : 'error');
      }}
    >
      <label>
        <span>What’s happening?</span>
        <textarea className="input" name="tip" required rows={5} placeholder="A new restaurant opening on Dickson Street, a festival date, a closing" />
      </label>
      <label>
        <span>Where did you hear about it? <span className="hint">A link or source helps a lot.</span></span>
        <input className="input" name="source" type="text" placeholder="Website, post, sign in the window" />
      </label>
      <label>
        <span>Your email <span className="hint">Optional, only if we have a question.</span></span>
        <input className="input" name="email" type="email" autoComplete="email" />
      </label>
      <input type="text" name="website" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className="button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send tip'}</button>
      {state === 'error' && <p className="signup-form__note" role="status">That didn’t go through. Check your connection and try again.</p>}
    </form>
  );
}
