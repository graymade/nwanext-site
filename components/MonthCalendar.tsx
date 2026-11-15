'use client';
// The month view. Wide: a seven-column grid starting Sunday, up to three events a day, "+2 more",
// and the selected day's full list beside or under the grid. Phone: a compact grid with dots,
// the selected day listed underneath, and a sideways swipe to change month.
// Multi-day events show on every day they run. Events open their story page.
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import { AgendaRow } from './Rows';
import type { Card } from '@/lib/view';

type Props = { events: Card[]; all: Card[]; today: string; initial: string; bounds: { min: string; max: string } };

const pad = (n: number) => String(n).padStart(2, '0');
const at = (key: string) => new Date(`${key}T12:00:00Z`);
const keyOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const shiftMonth = (m: string, n: number) => {
  const d = at(`${m}-01`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return keyOf(d).slice(0, 7);
};
const monthTitle = (m: string) => at(`${m}-01`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });
const longDay = (k: string) => at(k).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const runsOn = (c: Card, k: string) => c.start! <= k && (c.end || c.start!) >= k;
const byTime = (a: Card, b: Card) => Number(!!a.end) - Number(!!b.end) || (a.startLabel ? 0 : 1) - (b.startLabel ? 0 : 1) || (a.start! < b.start! ? -1 : 1);

export default function MonthCalendar({ events, all, today, initial, bounds }: Props) {
  const [month, setMonth] = useState(initial);
  const [selected, setSelected] = useState('');
  const grid = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  // ?month=2026-10 on load; written back on change.
  useEffect(() => {
    const m = new URLSearchParams(location.search).get('month');
    if (m && /^\d{4}-\d{2}$/.test(m)) setMonth(m);
  }, []);
  useEffect(() => {
    const url = new URL(location.href);
    if (month === initial) url.searchParams.delete('month');
    else url.searchParams.set('month', month);
    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString().replace(/%2C/g, ',')}` : '') + url.hash;
    if (next !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', next);
  }, [month, initial]);

  const cells = useMemo(() => {
    const first = at(`${month}-01`);
    const start = new Date(first);
    start.setUTCDate(1 - first.getUTCDay());
    const out: string[] = [];
    const d = new Date(start);
    do {
      for (let i = 0; i < 7; i++) { out.push(keyOf(d)); d.setUTCDate(d.getUTCDate() + 1); }
    } while (keyOf(d).slice(0, 7) === month);
    return out;
  }, [month]);

  const on = useMemo(() => {
    const m: Record<string, Card[]> = {};
    for (const k of cells) m[k] = events.filter((c) => c.start && runsOn(c, k)).sort(byTime);
    return m;
  }, [cells, events]);

  // Pick a sensible day when the month changes: today, else the first day with something on.
  useEffect(() => {
    if (selected.startsWith(month)) return;
    const inMonth = cells.filter((k) => k.startsWith(month));
    setSelected(today.startsWith(month) ? today : inMonth.find((k) => on[k]?.length) || inMonth[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, on]);

  const canPrev = month > bounds.min;
  const canNext = month < bounds.max;
  const go = (n: number) => {
    if ((n < 0 && !canPrev) || (n > 0 && !canNext)) return;
    setMonth((m) => shiftMonth(m, n));
  };
  const pick = (k: string) => {
    if (!k.startsWith(month)) setMonth(k.slice(0, 7));
    setSelected(k);
  };
  const dayList = on[selected] || [];
  const monthCount = new Set(cells.filter((k) => k.startsWith(month)).flatMap((k) => on[k].map((c) => c.slug))).size;

  return (
    <section className="month-view" aria-labelledby="month-title">
      <div className="month-view__head">
        <h2 id="month-title" className="month-view__title" aria-live="polite">{monthTitle(month)}</h2>
        <p className="month-view__count muted num">{monthCount} {monthCount === 1 ? 'event' : 'events'}</p>
        <div className="month-view__nav">
          <button type="button" className="button button--quiet month-view__today" onClick={() => { setMonth(today.slice(0, 7)); setSelected(today); }}>Today</button>
          <button type="button" className="iconbtn iconbtn--line" onClick={() => go(-1)} disabled={!canPrev}><Icon name="left" /><span className="sr-only">Previous month</span></button>
          <button type="button" className="iconbtn iconbtn--line" onClick={() => go(1)} disabled={!canNext}><Icon name="right" /><span className="sr-only">Next month</span></button>
        </div>
      </div>

      <div className="month-view__body">
        <div
          className="mgrid"
          ref={grid}
          onPointerDown={(e) => { if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY }; }}
          onPointerUp={(e) => {
            const s = swipe.current;
            swipe.current = null;
            if (!s) return;
            const dx = e.clientX - s.x, dy = e.clientY - s.y;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => { swipe.current = null; }}
        >
          <div className="mgrid__week" aria-hidden="true">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
          <div className="mgrid__days">
            {cells.map((k) => {
              const list = on[k] || [];
              const out = !k.startsWith(month);
              const shown = list.slice(0, 3);
              return (
                <div key={k} className="mcell" data-out={out ? '' : undefined} data-past={k < today ? '' : undefined} data-today={k === today ? '' : undefined} data-sel={k === selected ? '' : undefined} data-day={k}>
                  <button type="button" className="mcell__num num" aria-pressed={k === selected} aria-current={k === today ? 'date' : undefined} onClick={() => pick(k)}>
                    <span aria-hidden="true">{at(k).getUTCDate()}</span>
                    <span className="sr-only">{longDay(k)}, {list.length ? `${list.length} ${list.length === 1 ? 'event' : 'events'}` : 'nothing on'}</span>
                  </button>
                  {list.length > 0 && (
                    <>
                      <ul className="mcell__events">
                        {shown.map((c) => (
                          <li key={c.slug}>
                            <Link className="mev" href={c.href} title={c.title}>
                              {c.startLabel && !c.end && <span className="mev__time num">{c.startLabel.replace(':00', '').replace(' ', '')}</span>}
                              <span className="mev__title">{c.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {list.length > 3 && <button type="button" className="mcell__more" onClick={() => pick(k)}>+{list.length - 3} more</button>}
                      <span className="mcell__dots" aria-hidden="true">{list.slice(0, 3).map((c) => <i key={c.slug} />)}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <section className="dayview" aria-labelledby="day-title">
          <h3 id="day-title" className="dayview__title">{selected ? longDay(selected) : ''}{selected === today ? <span className="dayview__today"> Today</span> : null}</h3>
          {dayList.length ? (
            <ol className="rows agenda__rows">{dayList.map((c) => <AgendaRow key={c.slug} c={c} h="h4" />)}</ol>
          ) : (
            <p className="muted">{all.some((c) => c.start && runsOn(c, selected)) ? 'Nothing that matches your filters on this day.' : 'Nothing on this day yet.'}</p>
          )}
        </section>
      </div>
    </section>
  );
}
