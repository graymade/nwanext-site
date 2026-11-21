'use client';
// "Subscribe to the NWA Next calendar": one feed every calendar app can follow, so new events
// arrive on their own. Apple and Google use webcal, Outlook adds from the web, or copy the link.
import { useState } from 'react';
import Icon from './Icon';
import type { SubLinks } from '@/lib/ics';

type Props = { links: SubLinks; city?: { name: string; links?: SubLinks }; compact?: boolean };

function Options({ links, label }: { links: SubLinks; label: string }) {
  const [copied, setCopied] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(links.https); setCopied('Copied. Paste it into your calendar app.'); } catch { setCopied(links.https); }
    window.setTimeout(() => setCopied(''), 4000);
  };
  return (
    <>
      <ul className="subscribe__list" aria-label={label}>
        <li><a className="subscribe__opt" href={links.apple}><span>Apple Calendar</span><Icon name="right" className="icon icon--sm" /></a></li>
        <li><a className="subscribe__opt" href={links.google} target="_blank" rel="noopener"><span>Google Calendar</span><Icon name="right" className="icon icon--sm" /></a></li>
        <li><a className="subscribe__opt" href={links.outlook} target="_blank" rel="noopener"><span>Outlook</span><Icon name="right" className="icon icon--sm" /></a></li>
        <li><button type="button" className="subscribe__opt" onClick={copy}><span>Copy link</span><Icon name="share" className="icon icon--sm" /></button></li>
      </ul>
      <p className="subscribe__status" role="status">{copied}</p>
    </>
  );
}

export default function Subscribe({ links, city, compact = false }: Props) {
  return (
    <section className={`subscribe${compact ? ' subscribe--compact' : ''}`} id="subscribe" aria-labelledby="subscribe-title">
      <h2 id="subscribe-title" className="subscribe__title"><Icon name="calendar" /><span>Subscribe to the NWA Next calendar</span></h2>
      <Options links={links} label="Subscribe to every event" />
      <p className="subscribe__note">New events show up on their own once you subscribe.</p>
      {city?.links && (
        <details className="subscribe__city">
          <summary>Only {city.name} events</summary>
          <Options links={city.links} label={`Subscribe to ${city.name} events`} />
        </details>
      )}
    </section>
  );
}
