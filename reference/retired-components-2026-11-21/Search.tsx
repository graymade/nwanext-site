'use client';
// Search: a full-screen dialog on phones, a command palette on wide screens (opened by the Search
// buttons and the "/" key), and the same thing inline on /search/. Loads the whole index once.
import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Img from './Img';
import Icon from './Icon';
import { cityName, useCities } from './AppData';
import { savedCity } from '@/lib/scope';

type Entry = { t: string; u: string; k: 'story' | 'place' | 'city' | 'topic' | 'guide'; s?: string; m?: string; d?: string; img?: string };
type Props = { today: string; weekend: { from: string; to: string }; mode?: 'dialog' | 'page' };

let indexPromise: Promise<Entry[]> | null = null;
const loadIndex = () => (indexPromise ??= fetch('/search-index.json').then((r) => r.json() as Promise<Entry[]>).catch(() => { indexPromise = null; return []; }));

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/gi, 'o').toLowerCase();
const stem = (w: string) => (w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
const isEvent = (e: Entry) => e.k === 'story' && !!e.m?.includes('Event');
const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });

function run(index: Entry[], raw: string, today: string, weekend: Props['weekend']) {
  let q = norm(raw).trim();
  const wantWeekend = /\b(this )?weekend\b/.test(q);
  q = q.replace(/\b(this )?weekend\b/g, ' ');
  const wantFree = /\bfree\b/.test(q);
  q = q.replace(/\bfree\b/g, ' ');
  const words = q.split(/\s+/).filter(Boolean).map(stem);
  if (!words.length && !wantWeekend && !wantFree) return null;
  const phrase = words.join(' ');
  const hits = index.filter((e) => {
    if (wantWeekend && !(isEvent(e) && e.d! >= weekend.from && e.d! <= weekend.to)) return false;
    if (wantFree && !(e.k === 'story' && e.m?.includes('Free'))) return false;
    if (!words.length) return true;
    const hay = norm(`${e.t} ${e.s || ''} ${e.m || ''}`);
    return words.every((w) => hay.includes(w));
  });
  const up = (e: Entry) => isEvent(e) && e.d! >= today;
  const prefix = (e: Entry) => !!phrase && (norm(e.t).startsWith(phrase) || norm(e.t).includes(` ${phrase}`));
  const stories = hits.filter((e) => e.k === 'story').sort((a, b) => {
    const p = Number(prefix(b)) - Number(prefix(a));
    if (p) return p;
    const u = Number(up(b)) - Number(up(a));
    if (u) return u;
    if (up(a) && up(b)) return a.d! < b.d! ? -1 : 1;
    return a.d! < b.d! ? 1 : -1;
  });
  return {
    stories,
    places: hits.filter((e) => e.k === 'place'),
    cities: hits.filter((e) => e.k === 'city'),
    more: hits.filter((e) => e.k === 'topic' || e.k === 'guide'),
    up,
  };
}

const RECENT = 'nwa-recent';
const readRecent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT) || '[]'); } catch { return []; } };

export default function Search({ today, weekend, mode = 'dialog' }: Props) {
  const page = mode === 'page';
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<Entry[] | null>(null);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const cities = useCities();
  const pathname = usePathname();
  const uid = useId().replace(/:/g, '');
  const listId = `sr-${uid}`;

  const prepare = useCallback(() => {
    loadIndex().then(setIndex);
    setRecent(readRecent());
    setCity(savedCity());
  }, []);

  const open = useCallback((from?: HTMLElement | null) => {
    // On /search/ the page's own field takes the job.
    const inline = document.querySelector<HTMLInputElement>('[data-search-page] input');
    if (inline) { inline.focus(); return; }
    opener.current = from || (document.activeElement as HTMLElement);
    prepare();
    setActive(-1);
    dialog.current?.showModal();
    requestAnimationFrame(() => input.current?.select());
  }, [prepare]);

  const close = useCallback(() => { dialog.current?.close(); }, []);

  // Openers: any [data-open-search] link and the "/" key.
  useEffect(() => {
    if (page) {
      prepare();
      const initial = new URLSearchParams(location.search).get('q') || '';
      setQ(initial);
      return;
    }
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-open-search]');
      if (!t || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      open(t);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('dialog[open]')) return;
      e.preventDefault();
      open(null);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, [page, open, prepare]);

  useEffect(() => { if (!page && dialog.current?.open) close(); }, [pathname, page, close]);

  // The page version keeps the query in the address, so a search can be shared.
  useEffect(() => {
    if (!page) return;
    const url = q ? `/search/?q=${encodeURIComponent(q)}` : '/search/';
    if (location.pathname.startsWith('/search')) history.replaceState(history.state, '', url);
  }, [q, page]);

  const res = useMemo(() => (index ? run(index, q, today, weekend) : null), [index, q, today, weekend]);
  const flat = useMemo(() => (res ? [...res.stories.slice(0, 12), ...res.places, ...res.cities, ...res.more] : []), [res]);
  const total = res ? res.stories.length + res.places.length + res.cities.length + res.more.length : 0;

  const remember = (text: string) => {
    const v = text.trim();
    if (v.length < 2) return;
    const next = [v, ...readRecent().filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, 5);
    try { localStorage.setItem(RECENT, JSON.stringify(next)); } catch {}
    setRecent(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!flat.length) return;
      e.preventDefault();
      const n = e.key === 'ArrowDown' ? (active + 1) % flat.length : (active <= 0 ? flat.length - 1 : active - 1);
      setActive(n);
      document.getElementById(`${listId}-${n}`)?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Escape' && !page) {
      // A search field would clear itself first; in the palette, Esc always closes.
      e.preventDefault();
      close();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      remember(q);
      if (active >= 0) document.querySelector<HTMLAnchorElement>(`#${listId}-${active} a`)?.click();
    }
  };

  // A result opens its page; close the palette first.
  const onResultClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a) return;
    remember(q);
    if (!page) close();
  };

  const tryList = ['This weekend', 'Free', 'New restaurants', 'The Momentary', ...(city ? [cityName(cities, city)] : [])].filter(Boolean);
  const runTry = (t: string) => { setQ(t); setActive(-1); remember(t); input.current?.focus(); };

  let n = -1;
  const option = (e: Entry, body: React.ReactNode, cls = '') => {
    n += 1;
    const i = n;
    return (
      <li key={e.u} id={`${listId}-${i}`} role="option" aria-selected={active === i} className={`sresult ${cls}`} onMouseMove={() => setActive(i)}>
        <Link className="sresult__link" href={e.u} tabIndex={-1}>{body}</Link>
      </li>
    );
  };
  const group = (title: string, list: Entry[], render: (e: Entry) => React.ReactNode) =>
    list.length ? (
      <li role="presentation" className="sgroup">
        <h3 className="sgroup__title" id={`${listId}-${title}`}>{title}</h3>
        <ul role="group" aria-labelledby={`${listId}-${title}`}>{list.map(render)}</ul>
      </li>
    ) : null;

  const body = (
    <div className={`search__panel ${page ? 'search__panel--page' : ''}`} {...(page ? { 'data-search-page': '' } : {})}>
      <div className="search__bar">
        <label className="search__field">
          <Icon name="search" />
          <span className="sr-only">Search NWA Next</span>
          <input
            ref={input}
            type="search"
            className="search__input"
            placeholder="Search stories, places, cities"
            value={q}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            role="combobox"
            aria-expanded={!!res && total > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            onChange={(e) => { setQ(e.target.value); setActive(-1); }}
            onKeyDown={onKeyDown}
            autoFocus={page}
          />
        </label>
        {!page && <button type="button" className="search__cancel" onClick={close}>Cancel</button>}
      </div>

      <div className="search__body">
        <p className="search__count" role="status" aria-live="polite">
          {res ? (total ? `${total} ${total === 1 ? 'result' : 'results'}` : '') : ''}
        </p>

        {!res && (
          <div className="search__start">
            {recent.length > 0 && (
              <section className="search__sect" aria-labelledby={`${listId}-recent`}>
                <div className="search__sect-head">
                  <h3 id={`${listId}-recent`} className="sgroup__title">Recent</h3>
                  <button type="button" className="link-btn" onClick={() => { try { localStorage.removeItem(RECENT); } catch {} setRecent([]); }}>Clear<span className="sr-only"> recent searches</span></button>
                </div>
                <ul className="search__recent">
                  {recent.map((r) => <li key={r}><button type="button" className="search__recent-btn" onClick={() => runTry(r)}>{r}</button></li>)}
                </ul>
              </section>
            )}
            <section className="search__sect" aria-labelledby={`${listId}-try`}>
              <h3 id={`${listId}-try`} className="sgroup__title">Try</h3>
              <div className="search__try">
                {tryList.map((t) => <button key={t} type="button" className="search__try-btn" onClick={() => runTry(t)}>{t}</button>)}
              </div>
            </section>
          </div>
        )}

        {res && total === 0 && (
          <div className="search__none">
            <p>Nothing for ‘{q.trim()}’. Try a city or a place.</p>
            <div className="search__try">
              {tryList.map((t) => <button key={t} type="button" className="search__try-btn" onClick={() => runTry(t)}>{t}</button>)}
            </div>
          </div>
        )}

        {res && total > 0 && (
          <ul className="sresults" id={listId} role="listbox" aria-label="Search results" onClick={onResultClick}>
            {group('Stories', res.stories.slice(0, 12), (e) =>
              option(
                e,
                <>
                  <span className="sresult__thumb">{e.img ? <Img src={e.img} alt="" sizes="3.5rem" /> : null}</span>
                  <span className="sresult__text">
                    <span className="sresult__title">{e.t}</span>
                    <span className="sresult__meta">
                      <span className="num">{res.up(e) ? `Coming ${shortDay(e.d!)}` : isEvent(e) ? `Was on ${shortDay(e.d!)}` : shortDay(e.d!)}</span>
                      <span>{e.m?.split(' · ')[0]}</span>
                    </span>
                  </span>
                </>,
                'sresult--story',
              ),
            )}
            {group('Places', res.places, (e) => option(e, <span className="sresult__text"><span className="sresult__title">{e.t}</span><span className="sresult__meta">{e.m}</span></span>))}
            {group('Cities', res.cities, (e) => option(e, <span className="sresult__text"><span className="sresult__title">{e.t}</span><span className="sresult__meta">{e.m}</span></span>))}
            {group('Topics and guides', res.more, (e) => option(e, <span className="sresult__text"><span className="sresult__title">{e.t}</span><span className="sresult__meta">{e.s}</span></span>))}
          </ul>
        )}
        {res && res.stories.length > 12 && <p className="search__more">Showing 12 of {res.stories.length} stories. Add a word to narrow it down.</p>}
      </div>
    </div>
  );

  if (page) return body;
  return (
    <dialog
      ref={dialog}
      className="search"
      aria-label="Search"
      onClose={() => { setQ(''); setActive(-1); const o = opener.current; if (o && o.isConnected) o.focus(); }}
      onClick={(e) => { if (e.target === dialog.current) close(); }}
    >
      {body}
    </dialog>
  );
}

