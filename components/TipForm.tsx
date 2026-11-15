// Posts to a form service once tips.action is set in the CMS.
// Until then it sends readers to Instagram messages, which already work.
export default function TipForm({ action, handle }: { action: string; handle: string }) {
  if (!action) {
    return (
      <div className="tip-fallback">
        <p>The tip form goes live with the site. For now, the fastest way to reach us is a message on Instagram.</p>
        <a className="button" href={`https://ig.me/m/${handle}`}>Message @{handle}</a>
      </div>
    );
  }
  return (
    <form className="tip-form" action={action} method="post">
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
      <input type="text" name="_gotcha" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className="button" type="submit">Send tip</button>
    </form>
  );
}
