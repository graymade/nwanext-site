import Link from 'next/link';
import PageHead, { HOME } from '@/components/PageHead';
import PairRows from '@/components/PairRows';
import { getResources, getSite, slugify } from '@/lib/content';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Get connected in Northwest Arkansas',
  description: 'Ways to plug in around NWA: free events, volunteering, libraries, city boards and the NWA Next newsletter.',
  path: '/connect/',
});

export default function ConnectPage() {
  const site = getSite();
  const { groups } = getResources();
  const pick = (t: string) => groups.find((g) => g.title === t);
  const give = pick('Give and volunteer');
  const todo = pick('Things to do');
  // Four ways in (Relume contact 23), each a short line and one action.
  const ways = [
    { title: 'Get the newsletter', line: site.newsletter.pitch, action: <Link className="button" href="/newsletter/">Get the newsletter</Link> },
    { title: 'Follow along', line: 'New openings and events land on Instagram first.', action: <a className="button button--quiet" href={site.instagram}>@{site.instagramHandle}</a> },
    { title: 'Go to something free', line: 'Museum nights, outdoor movies, festivals and markets. We keep a running list.', action: <Link className="button button--quiet" href="/guides/free-things-to-do/">Free things to do</Link> },
    { title: 'Tell us what we missed', line: 'Opening, closing or happening and we haven’t covered it? We want to know.', action: <Link className="button button--quiet" href="/submit/">Send a tip</Link> },
  ];
  const linkSection = (id: string, title: string, g: NonNullable<typeof give>) => (
    <section className="split" aria-labelledby={id}>
      <div className="split__text">
        <h2 id={id} className="section-title">{title}</h2>
        <p className="muted">{g.blurb}</p>
      </div>
      <PairRows className="pairs--grid" items={g.links.map((l) => ({ href: l.url, name: l.name, note: l.note || l.city, external: true }))} />
    </section>
  );
  return (
    <div className="page page--connect">
      <PageHead trail={[HOME, { name: 'Get connected', href: '/connect/' }]} title="Get connected" lede="The fastest way to feel at home here is to show up to things. Here’s how to find them, and how to stay in the loop with us." />
      <ul className="ways section_contact23">
        {ways.map((w) => (
          <li key={w.title} className="way">
            <h2 className="way__title">{w.title}</h2>
            <p className="way__line">{w.line}</p>
            <p className="way__action">{w.action}</p>
          </li>
        ))}
      </ul>
      {give && linkSection('give-title', 'Volunteer', give)}
      {todo && linkSection('cal-title', 'Find local calendars', todo)}
      <p className="note-line">More in the <Link className="link" href={`/guides/#${slugify('City halls')}`}>local directory</Link> and our guide to <Link className="link" href="/guides/get-connected/">ways to get connected</Link>.</p>
    </div>
  );
}
