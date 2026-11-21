// Small pieces shared by server and client lists. Client-safe (no fs).
import Link from 'next/link';
import Icon from './Icon';
import type { Card } from '@/lib/view';

// Add to calendar: a native popover, no script needed.
export function CalendarMenu({ c, id, primary = false }: { c: Pick<Card, 'gcal' | 'ics' | 'title'>; id: string; primary?: boolean }) {
  if (!c.gcal || !c.ics) return null;
  return (
    <>
      <button type="button" className={primary ? 'button button--primary' : 'tbtn'} popoverTarget={id} aria-haspopup="menu" data-tip="Add to calendar">
        <Icon name="calendar" />
        <span className="tbtn__label">Add to calendar</span>
      </button>
      <div className="menu-pop" id={id} popover="auto">
        <a className="menu-pop__item" href={c.gcal} target="_blank" rel="noopener">Google Calendar</a>
        <a className="menu-pop__item" href={c.ics} download>Apple or Outlook</a>
        <a className="menu-pop__item menu-pop__item--sub" href="/calendar/#subscribe">Subscribe to all events</a>
      </div>
    </>
  );
}

// Share: one delegated handler (components/ShareButtons) uses the share sheet or copies the link.
export function ShareButton({ href, title, primary = false }: { href: string; title: string; primary?: boolean }) {
  return (
    <button type="button" className={primary ? 'button button--quiet' : 'tbtn'} data-share={href} data-share-title={title} data-tip="Share">
      <Icon name="share" />
      <span className="tbtn__label">Share</span>
    </button>
  );
}

export function DirectionsLink({ url, primary = false }: { url?: string; primary?: boolean | 'main' }) {
  if (!url) return null;
  return (
    <a className={primary === 'main' ? 'button' : primary ? 'button button--quiet' : 'tbtn'} href={url} target="_blank" rel="noopener" data-tip="Directions">
      <Icon name="directions" />
      <span className="tbtn__label">Directions</span>
    </a>
  );
}

// "Wed, Sep 23, 6 PM  Fayetteville  Free": the date first, side by side with a gap, never joined by dots.
// With `place`, events name the venue too ("Ozark Music Hall, Fayetteville").
export function MetaLine({ c, showCity = true, place = false, className = 'meta' }: { c: Card; showCity?: boolean; place?: boolean; className?: string }) {
  const when = c.kind === 'event' ? [c.upcoming ? c.dateLabel : `Was on ${c.dateLabel}`, c.time].filter(Boolean).join(', ') : c.ago;
  const where = place && c.kind === 'event' ? (showCity ? c.where : c.placeName) : showCity ? c.city : '';
  return (
    <p className={className}>
      {c.status === 'Now open' && <span className="status"><i className="dot" aria-hidden="true" />Now open</span>}
      {c.status && c.status !== 'Now open' && <span className="status status--soon">{c.status}</span>}
      <span className="num">{when}</span>
      {where && <span>{where}</span>}
      {c.free && c.kind === 'event' && <span className="free">Free</span>}
    </p>
  );
}

// Breadcrumb trail, visible on every page but home. The same trail goes out as BreadcrumbList JSON-LD.
export function Crumbs({ trail }: { trail: { name: string; href: string }[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {trail.map((c, i) => (
          <li key={c.href}>
            {i === trail.length - 1 ? <span aria-current="page">{c.name}</span> : <Link href={c.href}>{c.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
