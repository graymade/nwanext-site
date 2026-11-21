'use client';
// One filter system for every list of stories. Wide screens: a sticky bar with Show, then City,
// Topic and When as buttons that open popover panels, then Free; under it the live count and the
// active filters, each removable. Phones: Show plus a "Filters" button that opens a bottom sheet.
// Every option shows how many stories it would give with the other filters applied.
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import { useCities } from './AppData';
import { SHOWS, WHENS, type Counts, type Facet, type FilterState, type Show, type When } from '@/lib/filter';

export type TopicOpt = { slug: string; name: string };
export type Fixed = { facet: Facet; label: string };
type Props = {
  state: FilterState;
  cities: string[]; // the cities in effect (picked, or the saved city)
  saved: string;
  set: (p: Partial<FilterState>) => void;
  clear: () => void;
  counts: Counts;
  total: number;
  noun: [string, string]; // ["story", "stories"]
  facets: Facet[];
  fixed?: Fixed[];
  topics: TopicOpt[];
  label?: string;
  aside?: React.ReactNode; // e.g. the Grid / List switch, at the end of the status line
};

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const plural = (n: number, [one, many]: [string, string]) => `${n} ${n === 1 ? one : many}`;

function CityOptions({ p, idp }: { p: Props; idp: string }) {
  const all = useCities();
  const [q, setQ] = useState('');
  const toggle = (slug: string) => p.set({ cities: p.cities.includes(slug) ? p.cities.filter((c) => c !== slug) : [...p.cities, slug] });
  const keep = (slug: string) => p.cities.includes(slug) || slug === p.saved;
  const n = (slug: string) => p.counts.city[slug] || 0;
  // Options with nothing to show go last and are disabled; the saved and picked cities always stay usable.
  const order = (list: typeof all) => [...list].sort((a, b) => Number(!n(a.slug) && !keep(a.slug)) - Number(!n(b.slug) && !keep(b.slug)));
  const f = fold(q.trim());
  const hit = (c: (typeof all)[number]) => !f || fold(`${c.name} ${c.county}`).includes(f);
  const featured = order(all.filter((c) => c.featured && hit(c)));
  const others = all.filter((c) => !c.featured && hit(c));
  const counties = [...new Set(others.map((c) => c.county))];
  const row = (c: (typeof all)[number]) => (
    <label key={c.slug} className="fopt" data-off={!n(c.slug) && !keep(c.slug) ? '' : undefined}>
      <input type="checkbox" checked={p.cities.includes(c.slug)} disabled={!n(c.slug) && !keep(c.slug)} onChange={() => toggle(c.slug)} />
      <span className="fopt__name">{c.name}{c.slug === p.saved && <span className="fopt__note"> your city</span>}</span>
      <span className="fopt__n num">{n(c.slug)}</span>
    </label>
  );
  return (
    <div className="fgroup">
      <label className="ffind">
        <Icon name="search" className="icon icon--sm" />
        <span className="sr-only">Find a town</span>
        <input id={`${idp}-find`} type="search" placeholder="Find a town or county" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </label>
      {!f && (
        <label className="fopt">
          <input type="checkbox" checked={!p.cities.length} onChange={() => p.set({ cities: [] })} />
          <span className="fopt__name">All NWA</span>
          <span className="fopt__n num">{Object.values(p.counts.city).reduce((a, b) => a + b, 0)}</span>
        </label>
      )}
      {featured.map(row)}
      {counties.length > 0 && <p className="fgroup__sub">More towns</p>}
      {counties.map((county) => (
        <div key={county} className="fgroup__county" role="group" aria-label={county}>
          <p className="fgroup__label">{county}</p>
          {order(others.filter((c) => c.county === county)).map(row)}
        </div>
      ))}
      {!featured.length && !others.length && <p className="fgroup__none">No town called ‘{q.trim()}’ yet.</p>}
    </div>
  );
}

function TopicOptions({ p }: { p: Props }) {
  const n = (slug: string) => p.counts.topic[slug] || 0;
  const list = [...p.topics].sort((a, b) => Number(!n(a.slug) && !p.state.topics.includes(a.slug)) - Number(!n(b.slug) && !p.state.topics.includes(b.slug)));
  const toggle = (slug: string) => p.set({ topics: p.state.topics.includes(slug) ? p.state.topics.filter((t) => t !== slug) : [...p.state.topics, slug] });
  return (
    <div className="fgroup">
      <label className="fopt">
        <input type="checkbox" checked={!p.state.topics.length} onChange={() => p.set({ topics: [] })} />
        <span className="fopt__name">Every topic</span>
      </label>
      {list.map((t) => {
        const off = !n(t.slug) && !p.state.topics.includes(t.slug);
        return (
          <label key={t.slug} className="fopt" data-off={off ? '' : undefined}>
            <input type="checkbox" checked={p.state.topics.includes(t.slug)} disabled={off} onChange={() => toggle(t.slug)} />
            <span className="fopt__name">{t.name}</span>
            <span className="fopt__n num">{n(t.slug)}</span>
          </label>
        );
      })}
    </div>
  );
}

function WhenOptions({ p, idp }: { p: Props; idp: string }) {
  return (
    <div className="fgroup" role="radiogroup" aria-label="When">
      {WHENS.map((w) => {
        const n = p.counts.when[w.value] || 0;
        const off = !n && p.state.when !== w.value && w.value !== 'any';
        return (
          <label key={w.value} className="fopt" data-off={off ? '' : undefined}>
            <input type="radio" name={`${idp}-when`} checked={p.state.when === w.value} disabled={off} onChange={() => p.set({ when: w.value as When })} />
            <span className="fopt__name">{w.label}</span>
            <span className="fopt__n num">{n}</span>
          </label>
        );
      })}
    </div>
  );
}

function ShowControl({ p }: { p: Props }) {
  return (
    <div className="seg" role="radiogroup" aria-label="Show">
      {SHOWS.map((o) => {
        const n = p.counts.show[o.value] || 0;
        return (
          <button key={o.value} type="button" role="radio" className="seg__btn" aria-checked={p.state.show === o.value} disabled={!n && p.state.show !== o.value} onClick={() => p.set({ show: o.value as Show, ...(o.value === 'spots' || o.value === 'news' ? { when: 'any' as When } : {}) })}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Filters(p: Props) {
  const all = useCities();
  const sheet = useRef<HTMLDialogElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  // Sticky things below the bar (day headings, the selected-day panel, anchors) read its height.
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty('--fbar-h', `${Math.round(el.getBoundingClientRect().height)}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => { ro.disconnect(); document.documentElement.style.removeProperty('--fbar-h'); };
  }, []);
  const has = (f: Facet) => p.facets.includes(f);
  const showWhen = has('when') && (p.state.show === 'all' || p.state.show === 'events');
  const name = (slug: string) => all.find((c) => c.slug === slug)?.name || slug;
  const topicName = (slug: string) => p.topics.find((t) => t.slug === slug)?.name || slug;
  const cityLabel = p.cities.length === 0 ? 'City' : p.cities.length === 1 ? `City: ${name(p.cities[0])}` : `City: ${p.cities.length} towns`;
  const topicLabel = p.state.topics.length === 0 ? 'Topic' : p.state.topics.length === 1 ? `Topic: ${topicName(p.state.topics[0])}` : `Topic: ${p.state.topics.length} topics`;
  const whenLabel = p.state.when === 'any' ? 'When' : WHENS.find((w) => w.value === p.state.when)!.label;

  // The active filters as plain text items, each with a remove button.
  const active = useMemo(() => {
    const out: { key: string; label: string; remove: () => void }[] = [];
    if (has('show') && p.state.show !== 'all') out.push({ key: 'show', label: SHOWS.find((s) => s.value === p.state.show)!.label, remove: () => p.set({ show: 'all' }) });
    if (has('city')) for (const c of p.cities) out.push({ key: `c-${c}`, label: `${name(c)}${c === p.saved && p.state.cities === null ? ' (your city)' : ''}`, remove: () => p.set({ cities: p.cities.filter((x) => x !== c) }) });
    if (has('topic')) for (const t of p.state.topics) out.push({ key: `t-${t}`, label: topicName(t), remove: () => p.set({ topics: p.state.topics.filter((x) => x !== t) }) });
    if (showWhen && p.state.when !== 'any') out.push({ key: 'when', label: whenLabel, remove: () => p.set({ when: 'any' }) });
    if (has('free') && p.state.free) out.push({ key: 'free', label: 'Free', remove: () => p.set({ free: false }) });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.state, p.cities, p.saved, showWhen]);
  const nActive = active.length - (has('show') && p.state.show !== 'all' ? 1 : 0);

  const panel = (id: string, title: string, body: React.ReactNode) => (
    <div className="fpanel" id={id} popover="auto" role="dialog" aria-label={title}>
      <div className="fpanel__head">
        <p className="fpanel__title">{title}</p>
        <button type="button" className="iconbtn" popoverTarget={id} popoverTargetAction="hide"><Icon name="close" /><span className="sr-only">Close</span></button>
      </div>
      <div className="fpanel__body">{body}</div>
    </div>
  );

  return (
    <div className="fbar" ref={bar} role="region" aria-label={p.label || 'Filter stories'}>
      <div className="fbar__row">
        {has('show') && <ShowControl p={p} />}
        <div className="fbar__wide">
          {has('city') && <button type="button" className="fbtn" popoverTarget="f-city" aria-haspopup="dialog" data-on={p.cities.length ? '' : undefined}>{cityLabel}<Icon name="down" className="icon icon--sm" /></button>}
          {has('topic') && <button type="button" className="fbtn" popoverTarget="f-topic" aria-haspopup="dialog" data-on={p.state.topics.length ? '' : undefined}>{topicLabel}<Icon name="down" className="icon icon--sm" /></button>}
          {showWhen && <button type="button" className="fbtn" popoverTarget="f-when" aria-haspopup="dialog" data-on={p.state.when !== 'any' ? '' : undefined}>{whenLabel}<Icon name="down" className="icon icon--sm" /></button>}
          {has('free') && (
            <button type="button" className="ftoggle" aria-pressed={p.state.free} disabled={!p.counts.free && !p.state.free} onClick={() => p.set({ free: !p.state.free })}>
              Free <span className="fopt__n num">{p.counts.free}</span>
            </button>
          )}
        </div>
        {!has('show') && active.length > 0 && <p className="fbar__count fbar__count--row num" aria-hidden="true">{plural(p.total, p.noun)}</p>}
        {p.aside && <div className="fbar__aside">{p.aside}</div>}
        {(has('city') || has('topic') || has('when') || has('free')) && (
          <button type="button" className="fbtn fbar__sheetbtn" aria-haspopup="dialog" onClick={() => sheet.current?.showModal()}>
            Filters{nActive > 0 && <span className="fbar__n num"> {nActive}</span>}
          </button>
        )}
      </div>

      {/* The count and the active filters only show while something is filtered. Unfiltered, the count
          stays for screen readers (it is the live status line) but says nothing a visitor needs to see. */}
      <div className="fbar__status" data-quiet={active.length ? undefined : ''}>
        <p className={`fbar__count num${!has('show') ? ' fbar__count--status' : ''}`} role="status" aria-live="polite">{plural(p.total, p.noun)}</p>
        {active.length > 0 && (
          <ul className="fbar__active" aria-label="Active filters">
            {p.fixed?.map((f) => <li key={f.facet} className="fchip fchip--fixed">{f.label}</li>)}
            {active.map((a) => (
              <li key={a.key} className="fchip">
                <span>{a.label}</span>
                <button type="button" className="fchip__x" onClick={a.remove}><Icon name="close" className="icon icon--xs" /><span className="sr-only">Remove {a.label}</span></button>
              </li>
            ))}
          </ul>
        )}
        {active.length > 0 && <button type="button" className="link-btn fbar__clear" onClick={p.clear}>Clear all</button>}
      </div>

      {has('city') && panel('f-city', 'City', <CityOptions p={p} idp="pc" />)}
      {has('topic') && panel('f-topic', 'Topic', <TopicOptions p={p} />)}
      {showWhen && panel('f-when', 'When', <WhenOptions p={p} idp="pw" />)}

      <dialog ref={sheet} className="fsheet" aria-labelledby="fsheet-title" onClick={(e) => { if (e.target === sheet.current) sheet.current?.close(); }}>
        <div className="fsheet__inner">
          <div className="fsheet__bar">
            <h2 id="fsheet-title" className="fsheet__title">Filters</h2>
            {active.length > 0 && <button type="button" className="link-btn" onClick={p.clear}>Clear all</button>}
            <button type="button" className="iconbtn" onClick={() => sheet.current?.close()}><Icon name="close" /><span className="sr-only">Close</span></button>
          </div>
          <div className="fsheet__body">
            {has('city') && <section aria-labelledby="fs-city"><h3 id="fs-city" className="fsheet__h">City</h3><CityOptions p={p} idp="sc" /></section>}
            {has('topic') && <section aria-labelledby="fs-topic"><h3 id="fs-topic" className="fsheet__h">Topic</h3><TopicOptions p={p} /></section>}
            {showWhen && <section aria-labelledby="fs-when"><h3 id="fs-when" className="fsheet__h">When</h3><WhenOptions p={p} idp="sw" /></section>}
            {has('free') && (
              <section aria-labelledby="fs-free">
                <h3 id="fs-free" className="fsheet__h">Price</h3>
                <label className="fopt">
                  <input type="checkbox" checked={p.state.free} disabled={!p.counts.free && !p.state.free} onChange={() => p.set({ free: !p.state.free })} />
                  <span className="fopt__name">Free only</span>
                  <span className="fopt__n num">{p.counts.free}</span>
                </label>
              </section>
            )}
          </div>
          <div className="fsheet__foot">
            <button type="button" className="button fsheet__go" onClick={() => sheet.current?.close()}>Show {plural(p.total, p.noun)}</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
