'use client';
// The sidebar nav on wide screens and the bottom tab bar on phones. Active state follows the page.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from './Icon';
import NewsletterForm from './NewsletterForm';
import { useAppData } from './AppData';

export type NavTopic = { name: string; href: string; count: number };
type Props = { topics: NavTopic[]; places: NavTopic[] };

const isActive = (path: string, href: string) => (href === '/' ? path === '/' : href === '/calendar/' ? path.startsWith('/calendar/') || path.startsWith('/events/') : path.startsWith(href));
const cur = (on: boolean) => (on ? { 'aria-current': 'page' as const } : {});

function Group({ label, open, items, all }: { label: string; open: boolean; items: { href: string; name: string; count?: number }[]; all: { href: string; name: string } }) {
  const path = (usePathname() || '/');
  return (
    <li>
      <details className="sidenav__group" open={open}>
        <summary className="sidenav__link sidenav__summary" data-active={open || undefined}>
          <span>{label}</span><Icon name="down" className="icon icon--sm sidenav__chev" />
        </summary>
        <ul className="sidenav__sub">
          {items.map((i) => (
            <li key={i.href}>
              <Link className="sidenav__sublink" href={i.href} {...cur(path === i.href)}>
                <span>{i.name}</span>{i.count !== undefined && <span className="num">{i.count}</span>}
              </Link>
            </li>
          ))}
          <li><Link className="sidenav__sublink" href={all.href} {...cur(path === all.href)}><span>{all.name}</span></Link></li>
        </ul>
      </details>
    </li>
  );
}

export function SideNav({ topics, places }: Props) {
  const path = (usePathname() || '/');
  const { cities } = useAppData();
  const top = [
    { href: '/', label: 'Home' },
    { href: '/calendar/', label: 'Calendar' },
    { href: '/openings/', label: 'New spots' },
  ];
  return (
    <nav className="sidenav" aria-label="Main">
      <ul className="sidenav__list">
        {top.map((l) => (
          <li key={l.href}><Link className="sidenav__link" href={l.href} {...cur(isActive(path, l.href))}>{l.label}</Link></li>
        ))}
        <Group label="Cities" open={path.startsWith('/cities/')} items={cities.filter((c) => c.featured).map((c) => ({ href: `/cities/${c.slug}/`, name: c.name, count: c.count }))} all={{ href: '/cities/', name: 'All cities and towns' }} />
        <Group label="Topics" open={path.startsWith('/topics/') || path === '/news/'} items={topics.map((t) => ({ href: t.href, name: t.name, count: t.count }))} all={{ href: '/news/', name: 'All stories' }} />
        <Group label="Places" open={path.startsWith('/places/')} items={places.map((p) => ({ href: p.href, name: p.name, count: p.count }))} all={{ href: '/places/', name: 'All places' }} />
        <li><Link className="sidenav__link" href="/guides/" {...cur(path.startsWith('/guides/'))}>Guides</Link></li>
      </ul>
    </nav>
  );
}

export function SideSignup() {
  const path = (usePathname() || '/');
  const { site } = useAppData();
  if (path.startsWith('/newsletter/')) return null;
  return (
    <div className="side-signup">
      <NewsletterForm action={site.action} emailField={site.emailField} handle={site.handle} stacked />
    </div>
  );
}

const TABS: { href: string; label: string; icon: IconName; search?: boolean; more?: boolean }[] = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/calendar/', label: 'Calendar', icon: 'calendar' },
  { href: '/search/', label: 'Search', icon: 'search', search: true },
  { href: '/openings/', label: 'New spots', icon: 'spot' },
  { href: '#sitemap', label: 'More', icon: 'more', more: true },
];

export function TabBar() {
  const path = (usePathname() || '/');
  return (
    <nav className="tabbar" aria-label="Sections">
      <ul className="tabbar__list">
        {TABS.map((t) => {
          const inner = <><Icon name={t.icon} /><span className="tab__label">{t.label}</span></>;
          if (t.search) return <li key={t.label}><a className="tab" href={t.href} data-open-search="" {...cur(path.startsWith('/search/'))}>{inner}</a></li>;
          if (t.more) return <li key={t.label}><a className="tab" href={t.href} data-open-more="" aria-haspopup="dialog">{inner}</a></li>;
          return <li key={t.label}><Link className="tab" href={t.href} {...cur(isActive(path, t.href))}>{inner}</Link></li>;
        })}
      </ul>
    </nav>
  );
}
