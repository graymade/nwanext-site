import Link from 'next/link';
import Icon from '@/components/Icon';
import Shell from '@/components/Shell';

export const metadata = { title: 'That page is not here.', robots: { index: false, follow: true } };

const WAYS = [
  { href: '/', name: 'Home', note: 'The latest stories for your city' },
  { href: '/events/', name: 'Things to do', note: 'Events, day by day' },
  { href: '/openings/', name: 'New spots', note: 'What just opened' },
  { href: '/cities/', name: 'Cities and towns', note: 'Every town we cover' },
];

export default function NotFound() {
  return (
    <Shell>
      <div className="page lost">
        <header className="page-head lost__head">
          <h1 className="page-title">That page is not here.</h1>
          <p className="lede">It may have moved, or the link has a typo. Search, or start from one of these.</p>
          <p className="actions"><a className="button" href="/search/" data-open-search=""><Icon name="search" />Search NWA Next</a></p>
        </header>
        <ul className="lost__ways">
          {WAYS.map((w) => (
            <li key={w.href} className="way way--link">
              <h2 className="way__title"><Link className="way__link" href={w.href}>{w.name}</Link></h2>
              <p className="way__line">{w.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}
