// Compact story rows: a square thumb, the headline, a meta line. The headline link covers the row and
// opens the story page. Client-safe, so scoped client lists and server pages share them.
import Link from 'next/link';
import Img from './Img';
import Icon from './Icon';
import { CalendarMenu, DirectionsLink, MetaLine } from './Bits';
import type { Card } from '@/lib/view';

type H = 'h2' | 'h3' | 'h4';

function Thumb({ c, size }: { c: Card; size: string }) {
  return c.image ? (
    <span className="thumb"><Img src={c.image} alt="" sizes={size} /></span>
  ) : (
    <span className="thumb thumb--empty" aria-hidden="true" />
  );
}

export function Row({ c, h = 'h3', showCity = true }: { c: Card; h?: H; showCity?: boolean }) {
  const Tag = h;
  return (
    <li className="row" data-city={c.citySlug}>
      <Thumb c={c} size="5rem" />
      <div className="row__text">
        <Tag className="row__title"><Link className="row__link" href={c.href}>{c.title}</Link></Tag>
        <MetaLine c={c} showCity={showCity} />
      </div>
    </li>
  );
}

// One line of the schedule (Relume event 31): time, headline and where, price, thumb.
export function AgendaRow({ c, h = 'h3', past = false }: { c: Card; h?: H; past?: boolean }) {
  const Tag = h;
  return (
    <li className="arow" data-city={c.citySlug}>
      <p className="arow__time num">{past ? c.dayShort : c.startLabel || 'All day'}</p>
      <div className="arow__text">
        <Tag className="arow__title"><Link className="row__link" href={c.href}>{c.title}</Link></Tag>
        <p className="arow__where">
          <span>{c.where}</span>
          {c.free ? <span className="free">Free</span> : c.price ? <span className="num">{c.price}</span> : null}
        </p>
      </div>
      <Thumb c={c} size="4rem" />
    </li>
  );
}

// New spots: thumb, status, headline, address and two plain actions.
export function SpotRow({ c, h = 'h3' }: { c: Card; h?: H }) {
  const Tag = h;
  return (
    <li className="srow" data-city={c.citySlug}>
      <Thumb c={c} size="5rem" />
      <div className="srow__text">
        <MetaLine c={c} />
        <Tag className="row__title"><Link className="row__link" href={c.href}>{c.title}</Link></Tag>
        {c.address && <p className="srow__addr">{c.address}, {c.city}</p>}
        <div className="srow__actions">
          <Link className="tbtn" href={c.href} aria-label={`Read: ${c.title}`}><Icon name="read" /><span>Read</span></Link>
          <DirectionsLink url={c.directions} />
        </div>
      </div>
    </li>
  );
}

export { CalendarMenu };
