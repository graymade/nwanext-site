'use client';
// The feed. On a phone (or in List view) it is one column of true-shape photos, Instagram style.
// In Grid view on a wide main area it becomes 2 to 4 columns of 4:5 photos, with the first story
// as a lead across the full row. Rendered on the server in full; with JavaScript 13 show, then "Show more".
// Every card is one link (the headline's link covers the card). Only the lead carries actions.
// The New spots row sits across the full width after two rows of cards; the newsletter signup closes the list.
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import Img from './Img';
import NewsletterForm from './NewsletterForm';
import { CalendarMenu, DirectionsLink, MetaLine, ShareButton } from './Bits';
import { useAppData } from './AppData';
import type { Card } from '@/lib/view';

// Grid: one lead row plus twelve cards fills whole rows at 2, 3 and 4 columns.
// List (one column, phones): twelve, which keeps the phone home page inside its image budget.
const FIRST = 13;
const FIRST_LIST = 12;
const GRID_FROM = 640; // the grid starts when main is 40rem wide
// The Instagram range for List view: no taller than 4:5, no wider than 1.91:1. Grid view crops to 4:5.
const ratio = (c: Card) => (c.w && c.h ? Math.min(1.91, Math.max(0.8, c.w / c.h)) : 1.5);

function Post({ c, i, priority, hidden, showCity, lead }: { c: Card; i: number; priority: boolean; hidden: boolean; showCity: boolean; lead: boolean }) {
  return (
    <article className={`post${lead ? ' post--lead' : ''}`} hidden={hidden} data-i={i} style={{ '--r': ratio(c), ...(lead ? { '--rl': Math.min(1.5, ratio(c)) } : {}) } as React.CSSProperties}>
      {c.image && (
        <span className="post__photo">
          <Img src={c.image} alt={c.alt} sizes={lead ? '(max-width: 1024px) 100vw, 34rem' : '(max-width: 640px) calc(100vw - 2.5rem), (max-width: 1280px) 40vw, 24rem'} priority={priority} />
        </span>
      )}
      <div className="post__body">
        <h3 className="post__title"><Link className="post__link" href={c.href}>{c.title}</Link></h3>
        <MetaLine c={c} showCity={showCity} place />
        {c.summary && <p className="post__summary">{c.summary}</p>}
        {lead && (
          <div className="post__actions">
            {c.gcal && <CalendarMenu c={c} id={`cal-feed-${c.slug}`} />}
            {(c.kind === 'opening' || c.kind === 'coming') && <DirectionsLink url={c.directions} />}
            <ShareButton href={c.href} title={c.title} />
          </div>
        )}
      </div>
    </article>
  );
}

function SpotsModule({ list }: { list: Card[] }) {
  return (
    <section className="module spots" aria-labelledby="spots-title">
      <div className="module__head">
        <h3 id="spots-title" className="section-title">New spots</h3>
        <Link className="see-all" href="/openings/">See all<span className="sr-only"> new spots</span></Link>
      </div>
      <ul className="spots__row">
        {list.map((c) => (
          <li key={c.slug} className="spot">
            <span className="spot__media">{c.image && <Img src={c.image} alt="" sizes="(max-width: 768px) 11rem, 18rem" />}</span>
            <Link className="spot__link" href={c.href}>{c.title}</Link>
            <span className="spot__meta"><span className="status"><i className="dot" aria-hidden="true" />Now open</span><span>{c.city}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// The closing band: the same stacked form as the sidebar, with the one line that says what it is.
export function EmailBand({ id = 'email-band' }: { id?: string }) {
  const { site } = useAppData();
  return (
    <section className="email-band" aria-labelledby={`${id}-title`}>
      <div className="email-band__text">
        <h2 id={`${id}-title`} className="section-title">Get the NWA Next newsletter</h2>
        <p>New openings, things to do and what’s changing across Northwest Arkansas, straight to your inbox.</p>
      </div>
      <NewsletterForm action={site.action} emailField={site.emailField} handle={site.handle} stacked />
    </section>
  );
}

export type Modules = { spots?: Card[] };
type Props = { list: Card[]; view?: 'grid' | 'list'; modules?: Modules; first?: number; label?: string; showCity?: boolean; empty?: React.ReactNode; resetKey?: string };

export default function Feed({ list, view = 'grid', modules, first: firstProp, label = 'Latest stories', showCity = true, empty, resetKey = '' }: Props) {
  const titleId = `feed-${useId().replace(/:/g, '')}`;
  const root = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [oneColumn, setOneColumn] = useState(false);
  useEffect(() => {
    setMounted(true);
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setOneColumn(el.clientWidth < GRID_FROM));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const first = firstProp ?? (view === 'list' || oneColumn ? FIRST_LIST : FIRST);
  useEffect(() => setOpen(false), [resetKey]);
  const collapsed = mounted && !open;
  const lead = view === 'grid' && list.length > 3;
  // Skip openings already showing in the first screen of the feed, so no story appears twice.
  const shown = new Set(list.slice(0, first).map((c) => c.slug));
  const spots = (modules?.spots || []).filter((c) => !shown.has(c.slug)).slice(0, 4);

  const out: React.ReactNode[] = [];
  list.forEach((c, i) => {
    out.push(<Post key={c.slug} c={c} i={i} priority={i === 0} hidden={collapsed && i >= first} showCity={showCity} lead={lead && i === 0} />);
    // After the lead and two rows of three cards. In Grid view CSS pins the row to the fourth grid row,
    // so the rows above it are always full, whatever the column count.
    if (i === 6 && spots.length > 1) out.push(<SpotsModule key="m-spots" list={spots} />);
  });

  return (
    <section className="feed" ref={root} data-view={view} aria-labelledby={titleId} data-scoped>
      <h2 id={titleId} className="sr-only">{label}</h2>
      {list.length ? <div className="feed__list">{out}</div> : empty}
      {collapsed && list.length > first && (
        <button type="button" className="button button--quiet feed__more" onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => document.querySelector<HTMLElement>(`[aria-labelledby="${titleId}"] [data-i="${first}"] .post__link`)?.focus());
        }}>
          Show {list.length - first} more {list.length - first === 1 ? 'story' : 'stories'}
        </button>
      )}
    </section>
  );
}
