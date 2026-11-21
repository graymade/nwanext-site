'use client';
// A list of stories with the filter bar on top. Holds the filter state, keeps it in the URL,
// and renders the results as the page needs them: the home feed, a story grid, new spots,
// the things-to-do schedule or the month calendar. The server renders everything unfiltered.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import Filters, { type Fixed, type TopicOpt } from './Filters';
import Feed, { EmailBand } from './Feed';
import Carousel from './Carousel';
import Agenda from './Agenda';
import MonthCalendar from './MonthCalendar';
import Subscribe from './Subscribe';
import Icon from './Icon';
import { useScope } from '@/lib/scope';
import { useCities } from './AppData';
import { counts as countAll, effectiveCities, EMPTY, fromParams, matches, toParams, type Ctx, type Facet, type FilterState, type Show } from '@/lib/filter';
import type { Card } from '@/lib/view';
import type { SubLinks } from '@/lib/ics';

type Day = { key: string; weekday: string; day: string; long: string };
type Props = {
  variant: 'home' | 'feed' | 'spots' | 'agenda' | 'calendar';
  list: Card[];
  facets: Facet[];
  noun?: [string, string];
  topics: TopicOpt[];
  ctx: Ctx;
  lock?: { show?: Show; city?: string; topic?: string };
  fixed?: Fixed[];
  spots?: Card[];
  days?: Day[];
  dayNames?: Record<string, string>;
  nothingAtAll?: boolean;
  label?: string;
  showCity?: boolean;
  month?: string;
  bounds?: { min: string; max: string };
  subscribe?: SubLinks;
  citySubs?: Record<string, SubLinks>;
  head?: React.ReactNode;
  viewSwitch?: boolean;
  modules?: boolean;
  carouselTitle?: string;
};

const FILTER_KEYS = ['show', 'city', 'topic', 'category', 'when', 'free'];

export default function Browse(p: Props) {
  const saved = useScope();
  const cities = useCities();
  const locked: Facet[] = [...(p.lock?.show ? ['show' as const] : []), ...(p.lock?.city ? ['city' as const] : []), ...(p.lock?.topic ? ['topic' as const] : [])];
  const base: FilterState = { ...EMPTY, show: p.lock?.show || 'all' };
  const [state, setState] = useState<FilterState>(base);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Read the URL once on load (shared links), and the saved Grid or List choice.
  useEffect(() => {
    // Old ?category=Food%20%26%20Drink links name the CMS category; its slug is the topic.
    const slug = (n: string) => n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const from = fromParams(new URLSearchParams(location.search), (n) => p.topics.find((t) => t.slug === slug(n) || t.name.toLowerCase() === n.toLowerCase())?.slug);
    for (const f of locked) delete (from as Record<string, unknown>)[f === 'city' ? 'cities' : f === 'topic' ? 'topics' : f];
    setState((s) => ({ ...s, ...from }));
    try { const v = localStorage.getItem('nwa-view'); if (v === 'list' || v === 'grid') setView(v); } catch {}
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write the filters back into the address (other params, like ?month=, are kept).
  useEffect(() => {
    if (!ready) return;
    const url = new URL(location.href);
    for (const k of FILTER_KEYS) url.searchParams.delete(k);
    for (const [k, v] of toParams(state, locked)) url.searchParams.set(k, v);
    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString().replace(/%2C/g, ',')}` : '') + url.hash;
    if (next !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready]);

  const set = useCallback((patch: Partial<FilterState>) => {
    const apply = () => setState((s) => ({ ...s, ...patch }));
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition) {
      const t = doc.startViewTransition(() => flushSync(apply)) as { ready?: Promise<void>; finished?: Promise<void> };
      t.ready?.catch(() => {});
      t.finished?.catch(() => {});
    } else apply();
  }, []);
  // Clear all also clears the saved-city default for this view (an explicit All NWA), but only when there is one.
  const clear = useCallback(() => set({ ...EMPTY, show: p.lock?.show || 'all', cities: saved ? [] : null }), [set, p.lock?.show, saved]);

  const eff = p.lock?.city ? [p.lock.city] : effectiveCities(state, saved);
  const st: FilterState = p.lock?.topic ? { ...state, topics: [p.lock.topic] } : state;
  const filtered = useMemo(() => p.list.filter((c) => matches(c, st, eff, p.ctx)), [p.list, st, eff, p.ctx]);
  const counts = useMemo(() => countAll(p.list, st, eff, p.ctx), [p.list, st, eff, p.ctx]);
  const pristine = !p.lock?.city && eff.length === 0 && !st.topics.length && st.when === 'any' && !st.free && st.show === (p.lock?.show || 'all');
  const noun = p.noun || ['story', 'stories'];
  const resetKey = JSON.stringify([st, eff]);

  const empty = (
    <div className="quiet">
      <p className="quiet__line">{eff.length === 1 && !(cities.find((c) => c.slug === eff[0])?.count) ? `No stories from ${cities.find((c) => c.slug === eff[0])?.name} yet.` : 'No stories match.'}</p>
      <p className="muted">Try fewer filters, or tell us what we are missing.</p>
      <p className="quiet__actions">
        <button type="button" className="button button--quiet" onClick={clear}>Clear all</button>
        <a className="button" href="/submit/">Send a tip</a>
      </p>
    </div>
  );

  const switcher = p.viewSwitch && (
    <div className="viewswitch viewswitch--icons" role="radiogroup" aria-label="Layout">
      {(['grid', 'list'] as const).map((v) => (
        <button key={v} type="button" role="radio" className="viewswitch__btn" aria-checked={view === v} title={v === 'grid' ? 'Grid' : 'List'} onClick={() => { setView(v); try { localStorage.setItem('nwa-view', v); } catch {} }}>
          <Icon name={v} />
          <span className="sr-only">{v === 'grid' ? 'Grid' : 'List'}</span>
        </button>
      ))}
    </div>
  );
  const filters = (
    <Filters
      state={state}
      cities={eff}
      saved={saved}
      set={set}
      clear={clear}
      counts={counts}
      total={filtered.length}
      noun={noun}
      facets={p.facets.filter((f) => !locked.includes(f))}
      fixed={p.fixed}
      topics={p.topics}
      label={p.label}
      aside={switcher}
    />
  );



  // Calendar and things to do: the subscribe block sits beside the title on wide screens, after the list on phones.
  if (p.variant === 'calendar' || p.variant === 'agenda') {
    const one = eff.length === 1 ? eff[0] : '';
    return (
      <div className="cal-layout">
        <div className="browse-head">{p.head}</div>
        {p.subscribe && <Subscribe links={p.subscribe} compact={p.variant === 'agenda'} city={one ? { name: cities.find((c) => c.slug === one)?.name || '', links: p.citySubs?.[one] } : undefined} />}
        {filters}
        {p.variant === 'calendar' ? (
          <MonthCalendar events={filtered} all={p.list} today={p.ctx.today} initial={p.month!} bounds={p.bounds!} />
        ) : (
          <Agenda list={filtered} days={p.days!} today={p.ctx.today} dayNames={p.dayNames!} nothingAtAll={!!p.nothingAtAll && pristine} empty={empty} />
        )}
      </div>
    );
  }

  return (
    <>
      {/* The page's own head comes from the server; a wrapper keeps React from treating it as a list item. */}
      <div className="browse-head">{p.head}</div>
      {filters}
      {p.variant === 'home' && (
        <>
          {st.show !== 'spots' && st.show !== 'news' && st.when !== 'past' && (
            <Carousel list={filtered.filter((c) => c.kind === 'event' && c.upcoming).sort((a, b) => (a.day! < b.day! ? -1 : a.day! > b.day! ? 1 : (a.startLabel || '') < (b.startLabel || '') ? -1 : 1))} nothingAtAll={p.nothingAtAll && pristine} priority scoped title={p.carouselTitle} />
          )}
          <Feed
            list={filtered}
            view={view}
            resetKey={resetKey}
            empty={empty}
            showCity={p.showCity !== false}
            label={p.label || 'Latest stories'}
            modules={p.modules !== false && (pristine || (eff.length > 0 && !st.topics.length && st.when === 'any' && !st.free && st.show === 'all')) ? { spots: (p.spots || []).filter((c) => !eff.length || eff.includes(c.citySlug || '')) } : undefined}
          />
          {p.modules !== false && <EmailBand />}
        </>
      )}
      {p.variant === 'feed' && (
        <>
          <Feed list={filtered} view={view} resetKey={resetKey} empty={empty} showCity={p.showCity !== false} label={p.label || 'Stories'} />
        </>
      )}
      {p.variant === 'spots' && (
        <>
          <div className="feed-head"><h2 className="section-title">Now open</h2></div>
          <Feed list={filtered.filter((c) => c.kind === 'opening')} view={view} resetKey={resetKey} empty={empty} label="Now open" />
          {filtered.some((c) => c.kind === 'coming') && (
            <section className="hub-section" id="coming" aria-labelledby="coming-title">
              <h2 id="coming-title" className="section-title">Coming soon</h2>
              <Feed list={filtered.filter((c) => c.kind === 'coming')} view={view} resetKey={resetKey} label="Coming soon stories" />
            </section>
          )}
        </>
      )}
    </>
  );
}
