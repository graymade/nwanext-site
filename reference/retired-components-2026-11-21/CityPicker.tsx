'use client';
// Picking a town. The phone top bar's scope button, "Change" under "Your city" and "More towns" in the
// scope row all open one searchable list of every city and town, grouped by county, with counts.
// It is a native popover: anchored to its button on wide screens, a bottom sheet on phones.
import { useMemo, useRef, useState } from 'react';
import { setScope, useScope } from '@/lib/scope';
import { cityName, useCities } from './AppData';
import Icon from './Icon';

export const PICK_ID = 'town-pick';

export function ScopeButton() {
  const cities = useCities();
  const scope = useScope();
  return (
    <button type="button" className="topbar__scope" popoverTarget={PICK_ID} aria-haspopup="dialog">
      <span className="sr-only">Showing </span>
      <span className="topbar__scope-name">{scope ? cityName(cities, scope) : 'All NWA'}</span>
      <Icon name="down" className="icon icon--sm" />
      <span className="sr-only">, change town</span>
    </button>
  );
}

export function YourCity() {
  const cities = useCities();
  const scope = useScope();
  return (
    <p className="yourcity">
      <Icon name="pin" className="icon icon--sm yourcity__pin" />
      <strong className="yourcity__name"><span className="sr-only">Your city: </span>{scope ? cityName(cities, scope) : 'All of NWA'}</strong>
      <button type="button" className="link-btn yourcity__change" popoverTarget={PICK_ID} aria-haspopup="dialog">Change<span className="sr-only"> your city</span></button>
    </p>
  );
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const storyCount = (n: number) => (n ? `${n} ${n === 1 ? 'story' : 'stories'}` : 'No stories yet');

export function TownPicker() {
  const cities = useCities();
  const scope = useScope();
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');

  // Counties in the order of their northernmost town; towns north to south inside each.
  const groups = useMemo(() => {
    const f = fold(q.trim());
    const hits = cities.filter((c) => !f || fold(`${c.name} ${c.county}`).includes(f));
    const map = new Map<string, typeof cities>();
    for (const c of hits) map.set(c.county, [...(map.get(c.county) || []), c]);
    return [...map.entries()];
  }, [cities, q]);

  const choose = (slug: string) => {
    ref.current?.hidePopover?.();
    setScope(slug);
  };

  return (
    <div
      className="towns"
      id={PICK_ID}
      popover="auto"
      ref={ref}
      role="dialog"
      aria-labelledby="towns-title"
      onToggle={(e) => {
        if ((e.nativeEvent as ToggleEvent).newState !== 'open') return;
        setQ('');
        if (window.matchMedia('(pointer: fine)').matches) requestAnimationFrame(() => input.current?.focus());
      }}
    >
      <div className="towns__head">
        <h2 id="towns-title" className="towns__title">Pick your town</h2>
        <button type="button" className="iconbtn" popoverTarget={PICK_ID} popoverTargetAction="hide"><Icon name="close" /><span className="sr-only">Close</span></button>
      </div>
      <label className="towns__field">
        <Icon name="search" className="icon icon--sm" />
        <span className="sr-only">Find a town</span>
        <input ref={input} className="towns__input" type="search" placeholder="Find a town or county" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </label>
      <div className="towns__body">
        {!q && (
          <button type="button" className="towns__item" aria-pressed={!scope} onClick={() => choose('')}>
            <span className="towns__name">All of NWA</span>
            <span className="towns__count">Every story</span>
          </button>
        )}
        {groups.map(([county, list]) => (
          <section key={county} className="towns__group" aria-labelledby={`county-${county.replace(/\W+/g, '-')}`}>
            <h3 className="towns__county" id={`county-${county.replace(/\W+/g, '-')}`}>{county}</h3>
            {list.map((c) => (
              <button key={c.slug} type="button" className="towns__item" aria-pressed={scope === c.slug} onClick={() => choose(c.slug)}>
                <span className="towns__name">{c.name}</span>
                <span className="towns__count num">{storyCount(c.count)}</span>
              </button>
            ))}
          </section>
        ))}
        {groups.length === 0 && <p className="towns__none">No town called ‘{q.trim()}’ yet. <a className="link" href="/submit/">Tell us where you are.</a></p>}
      </div>
    </div>
  );
}
