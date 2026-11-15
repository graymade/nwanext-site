'use client';
// The city the reader picked, shared by every list on the site. Saved in localStorage as "nwa-city".
// The server always renders All NWA (""), the client switches after hydration.
import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

const KEY = 'nwa-city';
const listeners = new Set<() => void>();
let current: string | null = null;

function read() {
  if (current !== null) return current;
  try { current = localStorage.getItem(KEY) || ''; } catch { current = ''; }
  return current;
}

export function getScope() {
  return typeof window === 'undefined' ? '' : read();
}

export const savedCity = () => {
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
};

// Changes the scope everywhere. Crossfades the change with a view transition when the browser has them.
export function setScope(slug: string, { animate = true } = {}) {
  if (slug === read()) return;
  const apply = () => {
    current = slug;
    try { if (slug) localStorage.setItem(KEY, slug); else localStorage.removeItem(KEY); } catch {}
    document.documentElement.dataset.scope = slug;
    flushSync(() => listeners.forEach((l) => l()));
  };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (animate && doc.startViewTransition) {
    const t = doc.startViewTransition(apply) as { ready?: Promise<void>; finished?: Promise<void> };
    t.ready?.catch(() => {});
    t.finished?.catch(() => {});
  } else apply();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { current = null; l(); } };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(l); window.removeEventListener('storage', onStorage); };
};

export function useScope() {
  return useSyncExternalStore(subscribe, getScope, () => '');
}

// Hub pages keep the scope in the address too (?city=rogers), so a filtered view can be shared.
export function writeParam(name: string, value: string) {
  const url = new URL(location.href);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '') + url.hash;
  if (next !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', next);
}
