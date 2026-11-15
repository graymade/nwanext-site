import { getArticles, getGuides } from './content';

// First sentence only, for one-line descriptions.
export const firstSentence = (s: string) => (s.match(/^.+?[.!?](\s|$)/)?.[0] || s).trim();

// The starter links shown on the home page, the guides page and the menu.
export function guidePairs() {
  const free = getArticles().filter((a) => a.free).length;
  return [
    ...getGuides().map((g) => ({ href: `/guides/${g.slug}/`, name: g.title.replace('Northwest Arkansas', 'NWA'), note: firstSentence(g.summary) })),
    { href: '/guides/free-things-to-do/', name: 'Free things to do', note: `${free} free outings and events we have covered.` },
    { href: '/guides/#directory', name: 'Local directory', note: 'City halls, libraries, transit and visitor guides.' },
  ];
}
