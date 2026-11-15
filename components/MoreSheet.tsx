'use client';
// "More" on the phone tab bar: a bottom sheet with every hub, the cities with counts and the Friday email.
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import NewsletterForm from './NewsletterForm';
import { useAppData } from './AppData';
import type { NavTopic } from './Nav';

type Props = { topics: NavTopic[]; places: { name: string; href: string; count: number }[] };

export default function MoreSheet({ topics, places }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const { cities, site } = useAppData();
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-open-more]');
      if (!t || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      opener.current = t;
      ref.current?.showModal();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Any navigation closes it.
  useEffect(() => { if (ref.current?.open) ref.current.close(); }, [pathname]);

  const close = () => ref.current?.close();
  const onLink = (e: React.MouseEvent) => { if ((e.target as HTMLElement).closest('a')) close(); };

  return (
    <dialog
      ref={ref}
      className="more"
      aria-labelledby="more-title"
      onClose={() => opener.current?.focus()}
      onClick={(e) => { if (e.target === ref.current) close(); }}
    >
      <div className="more__inner" onClick={onLink}>
        <div className="more__bar">
          <h2 id="more-title" className="more__title">More</h2>
          <button type="button" className="iconbtn" onClick={close}><Icon name="close" /><span className="sr-only">Close</span></button>
        </div>
        <div className="more__body">
          <section aria-labelledby="more-cities">
            <h3 id="more-cities" className="more__h">Cities</h3>
            <ul className="more__list">
              {cities.filter((c) => c.featured).map((c) => (
                <li key={c.slug}><Link className="more__link" href={`/cities/${c.slug}/`}><span>{c.name}</span><span className="num muted">{c.count}</span></Link></li>
              ))}
              <li><Link className="more__link" href="/cities/"><span>All cities and towns</span><span className="num muted">{cities.length}</span></Link></li>
            </ul>
          </section>
          <section aria-labelledby="more-topics">
            <h3 id="more-topics" className="more__h">Topics</h3>
            <ul className="more__list">
              {topics.map((t) => (
                <li key={t.href}><Link className="more__link" href={t.href}><span>{t.name}</span><span className="num muted">{t.count}</span></Link></li>
              ))}
              <li><Link className="more__link" href="/news/"><span>All stories</span></Link></li>
            </ul>
          </section>
          <section aria-labelledby="more-places">
            <h3 id="more-places" className="more__h">Places</h3>
            <ul className="more__list">
              {places.map((p) => (
                <li key={p.href}><Link className="more__link" href={p.href}><span>{p.name}</span><span className="num muted">{p.count}</span></Link></li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="more-site">
            <h3 id="more-site" className="more__h">NWA Next</h3>
            <ul className="more__list">
              <li><Link className="more__link" href="/events/">Things to do</Link></li>
              <li><Link className="more__link" href="/guides/">Guides</Link></li>
              <li><Link className="more__link" href="/connect/">Get connected</Link></li>
              <li><Link className="more__link" href="/submit/">Send a tip</Link></li>
              <li><Link className="more__link" href="/about/">About</Link></li>
              <li><Link className="more__link" href="/credits/">Photo credits</Link></li>
            </ul>
          </section>
          {!pathname?.startsWith('/newsletter/') && (
            <section className="more__signup" aria-labelledby="more-email">
              <h3 id="more-email" className="more__h">One email on Friday morning.</h3>
              <NewsletterForm action={site.action} emailField={site.emailField} handle={site.handle} stacked />
            </section>
          )}
        </div>
      </div>
    </dialog>
  );
}
