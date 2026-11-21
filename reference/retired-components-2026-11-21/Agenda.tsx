'use client';
// Things to do: a day scroller (Relume event 33) over a schedule grouped by day (Relume event 31),
// then "Earlier" by month. It shows the events it is given; the filter bar above does the narrowing.
// Pressing a day scrolls to it; scrolling the schedule moves the selected day.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AgendaRow } from './Rows';
import type { Card } from '@/lib/view';

type Day = { key: string; weekday: string; day: string; long: string };
type Props = { list: Card[]; days: Day[]; today: string; dayNames: Record<string, string>; nothingAtAll: boolean; empty: React.ReactNode };

const monthOf = (c: Card) => new Date(`${c.start}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });

export default function Agenda({ list, days, today, dayNames, nothingAtAll, empty }: Props) {
  const [selected, setSelected] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const jumping = useRef(0);

  const upcoming = useMemo(() => list.filter((c) => c.upcoming), [list]);
  const past = useMemo(() => list.filter((c) => !c.upcoming).sort((a, b) => (a.start! < b.start! ? 1 : -1)), [list]);
  const groups = useMemo(() => {
    const m = new Map<string, Card[]>();
    for (const c of upcoming) m.set(c.day!, [...(m.get(c.day!) || []), c]);
    return [...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  }, [upcoming]);
  const counts = useMemo(() => Object.fromEntries(groups.map(([d, l]) => [d, l.length])), [groups]);

  // The day whose heading is nearest the top of the screen is the selected one.
  useEffect(() => {
    const heads = [...document.querySelectorAll<HTMLElement>('.agenda__day')];
    if (!heads.length) { setSelected(''); return; }
    const onScroll = () => {
      if (Date.now() < jumping.current) return;
      const line = window.innerWidth <= 1024 ? 200 : 140;
      let cur = heads[0].dataset.day!;
      for (const h of heads) if (h.getBoundingClientRect().top - line <= 0) cur = h.dataset.day!;
      setSelected(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [groups]);

  useEffect(() => {
    const row = scroller.current;
    const b = row?.querySelector<HTMLElement>(`[data-key="${selected}"]`);
    if (!b || !row) return;
    const r = b.getBoundingClientRect(), rr = row.getBoundingClientRect();
    if (r.left < rr.left || r.right > rr.right) row.scrollTo({ left: b.offsetLeft - row.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' });
  }, [selected]);

  const jump = (key: string) => {
    setSelected(key);
    jumping.current = Date.now() + 900;
    const el = document.getElementById(`day-${key}`);
    el?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    el?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  };

  return (
    <div className="agenda-wrap">
      {groups.length > 0 && (
        <section className="section_event33 days" aria-label="Jump to a day">
          <div className="days__row" ref={scroller}>
            {days.map((d) => {
              const n = counts[d.key] || 0;
              return (
                <button key={d.key} type="button" className="day" data-key={d.key} disabled={!n} aria-pressed={selected === d.key} aria-current={d.key === today ? 'date' : undefined} onClick={() => jump(d.key)}>
                  <span className="day__wd">{d.key === today ? 'Today' : d.weekday}</span>
                  <span className="day__num num">{d.day}</span>
                  <span className="day__dots" aria-hidden="true">{Array.from({ length: Math.min(3, n) }, (_, i) => <i key={i} />)}</span>
                  <span className="sr-only">{d.long}, {n ? `${n} ${n === 1 ? 'event' : 'events'}` : 'nothing yet'}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="section_event31 agenda" aria-labelledby="agenda-title" data-scoped>
        <h2 id="agenda-title" className="sr-only">Schedule</h2>
        {nothingAtAll && (
          <div className="agenda-empty">
            <p className="agenda-empty__line">Nothing on the calendar yet. We post events as soon as we confirm them.</p>
          </div>
        )}
        {!nothingAtAll && !list.length && empty}
        {groups.map(([day, rows]) => (
          <section key={day} className="agenda__day" id={`day-${day}`} data-day={day} aria-labelledby={`h-${day}`}>
            <h2 className="agenda__head" id={`h-${day}`} tabIndex={-1}>
              <span>{dayNames[day]}</span>
            </h2>
            <ol className="agenda__rows">{rows.map((c) => <AgendaRow key={c.slug} c={c} />)}</ol>
          </section>
        ))}
      </section>

      {past.length > 0 && (
        <section className="earlier" id="earlier" aria-labelledby="earlier-title">
          <h2 id="earlier-title" className="section-title">{nothingAtAll ? 'The latest ones we covered' : groups.length ? 'Earlier' : 'Past events'}</h2>
          {[...new Set(past.map(monthOf))].map((m) => (
            <div key={m}>
              <h3 className="earlier__month">{m}</h3>
              <ol className="rows agenda__rows">{past.filter((c) => monthOf(c) === m).map((c) => <AgendaRow key={c.slug} c={c} h="h4" past />)}</ol>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
