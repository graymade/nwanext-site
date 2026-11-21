'use client';
// Site-wide data the client pieces share: every city and town with counts, and the newsletter settings.
// Passed once from the server layout so no client component imports content files.
import { createContext, useContext, useEffect } from 'react';
import type { CityLite } from '@/lib/view';

export type SiteLite = { handle: string; instagram: string; action: string; emailField: string };
type Data = { cities: CityLite[]; site: SiteLite };
const Ctx = createContext<Data>({ cities: [], site: { handle: 'nwa_next', instagram: '', action: '', emailField: 'email' } });

export default function AppData({ cities, site, children }: Data & { children: React.ReactNode }) {
  // Lists that depend on the saved city stay faded until they have switched, so nobody sees All NWA flash first.
  useEffect(() => {
    const id = requestAnimationFrame(() => document.documentElement.classList.add('scope-ready'));
    return () => cancelAnimationFrame(id);
  }, []);
  return <Ctx.Provider value={{ cities, site }}>{children}</Ctx.Provider>;
}

export const useAppData = () => useContext(Ctx);
export const useCities = () => useContext(Ctx).cities;
export const cityName = (cities: CityLite[], slug: string) => cities.find((c) => c.slug === slug)?.name || '';
