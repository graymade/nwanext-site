'use client';
// "Coming up" (Relume event 15): the next events as a snapping row on native scroll.
// Follows the chosen city unless a page fixes it to one city.
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Img from './Img';
import Icon from './Icon';
import type { Card } from '@/lib/view';

type Props = { list: Card[]; title?: string; id?: string; priority?: boolean; nothingAtAll?: boolean; scoped?: boolean };

// Shows the events it is given (already filtered). Empty: one line when nothing is on the calendar
// anywhere, otherwise nothing, so the feed below carries the empty state.
export default function Carousel({ list, title = 'Coming up', id = 'coming-up', priority = false, nothingAtAll = false, scoped = false }: Props) {
  const mine = list;
  const row = useRef<HTMLOListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const sync = () => setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft >= el.scrollWidth - el.clientWidth - 2 });
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => { el.removeEventListener('scroll', sync); window.removeEventListener('resize', sync); };
  }, [mine.length]);

  const step = (dir: number) => {
    const el = row.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (first.offsetWidth + gap) * 2 });
  };

  if (!mine.length && !nothingAtAll) return null;
  return (
    <section className="section_event15 coming" aria-labelledby={`${id}-title`} {...(scoped ? { 'data-scoped': '' } : {})} {...(edge.start && edge.end ? { 'data-fits': '' } : {})}>
      <div className="coming__head">
        <h2 id={`${id}-title`} className="section-title">{title}</h2>
        <div className="coming__tools">
          {mine.length > 2 && (
            <span className="coming__arrows">
              <button type="button" className="iconbtn iconbtn--line" onClick={() => step(-1)} disabled={edge.start}><Icon name="left" /><span className="sr-only">Earlier events</span></button>
              <button type="button" className="iconbtn iconbtn--line" onClick={() => step(1)} disabled={edge.end}><Icon name="right" /><span className="sr-only">Later events</span></button>
            </span>
          )}
          <Link className="see-all" href="/events/">See all<span className="sr-only"> events</span></Link>
        </div>
      </div>
      {mine.length ? (
        <ol className="coming__row" ref={row}>
          {mine.map((c, i) => (
            <li key={c.slug} className="ecard">
              <Link className="ecard__link" href={c.href}>
                <span className="ecard__media">
                  {c.image ? <Img src={c.image} alt="" sizes="(max-width: 768px) 13rem, 17rem" priority={priority && i < 2} /> : <span className="ecard__blank" />}
                  <span className="datebox datebox--on" aria-hidden="true">
                    <span>{c.weekday}</span>
                    <strong className="num">{c.dayNum}</strong>
                  </span>
                </span>
                <span className="sr-only">{c.dateLabel}{c.time ? `, ${c.time}` : ''}: </span>
                <span className="ecard__title">{c.title}</span>
                <span className="ecard__where">{c.where}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-line">Nothing on the calendar yet. We post events as soon as we confirm them. <Link className="link" href="/events/#earlier">See recent events.</Link></p>
      )}
    </section>
  );
}
