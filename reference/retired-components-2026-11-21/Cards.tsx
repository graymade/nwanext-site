// Content cards for the hub and inner pages: cities, places, guides, photo credits and story tiles.
// Photo (or a type panel when there is none), then the headline, then one meta line, then an optional line
// of text. The headline's link covers the card. Client-safe (no fs), so any page can use it.
import Link from 'next/link';
import Img from './Img';
import { MetaLine } from './Bits';
import type { Card } from '@/lib/view';

type H = 'h2' | 'h3';

export function ContentCard({ href, title, h = 'h2', image, alt = '', panel, meta, text, sizes = '(max-width: 768px) 100vw, 30rem', className = '' }: {
  href: string;
  title: string;
  h?: H;
  image?: string;
  alt?: string;
  panel?: string; // shown in big type when there is no photo
  meta?: React.ReactNode;
  text?: React.ReactNode;
  sizes?: string;
  className?: string;
}) {
  const Tag = h;
  const link = <Link className="ccard__link" href={href}>{title}</Link>;
  return (
    <li className={`ccard ${className}`}>
      {image ? (
        <span className="ccard__media"><Img src={image} alt={alt} sizes={sizes} /></span>
      ) : panel !== undefined ? (
        <span className="ccard__media ccard__media--type" aria-hidden="true"><strong>{panel}</strong></span>
      ) : null}
      <div className="ccard__body">
        <Tag className="ccard__title">{link}</Tag>
        {meta}
        {text && <p className="ccard__text">{text}</p>}
      </div>
    </li>
  );
}

// A story as a tile (photo 4:3, headline, the date and place). Opens the story page.
export function StoryTile({ c, h = 'h3' }: { c: Card; h?: H }) {
  return (
    <ContentCard
      href={c.href}
      title={c.title}
      h={h}
      image={c.image}
      panel={c.image ? undefined : c.city}
      meta={<MetaLine c={c} place />}
      sizes="(max-width: 768px) 100vw, 22rem"
      className="ccard--story"
    />
  );
}
