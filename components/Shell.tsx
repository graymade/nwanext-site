// The app shell (Relume application shell 16): sidebar and a fluid main area on wide screens;
// top bar and bottom tab bar on phones. Every page renders inside it except the Instagram links page.
import Link from 'next/link';
import AppData from './AppData';
import Wordmark from './Wordmark';
import Icon from './Icon';
import MoreSheet from './MoreSheet';
import Search from './Search';
import SiteFooter from './SiteFooter';
import { SideNav, SideSignup, TabBar } from './Nav';
import { ScopeButton, TownPicker, YourCity } from './CityPicker';
import { placeStats, topicStats, weekend } from '@/lib/data';
import { cityList, siteLite } from '@/lib/view';
import { TODAY } from '@/lib/now';

export default function Shell({ children }: { children: React.ReactNode }) {
  const topics = topicStats().filter((t) => t.count > 0).map((t) => ({ name: t.h1, href: t.href, count: t.count }));
  const places = placeStats().map((p) => ({ name: p.name, href: p.href, count: p.count }));
  return (
    <AppData cities={cityList()} site={siteLite()}>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="app">
        <div className="shell application-shell16">
          <header className="side">
            <div className="side__inner">
            <div className="side__bar">
              <Link className="brand" href="/" aria-label="NWA Next, home">
                <Wordmark className="brand__mark" />
              </Link>
              <ScopeButton />
              <a className="side__search" href="/search/" data-open-search="">
                <Icon name="search" />
                <span className="side__search-label">Search</span>
                <kbd className="side__kbd" aria-hidden="true">/</kbd>
              </a>
            </div>
            <SideNav topics={topics} places={places} />
            <div className="side__foot">
              <YourCity />
              <SideSignup />
            </div>
            </div>
            <TownPicker />
          </header>

          <div className="center">
            <main id="main" className="main" tabIndex={-1}>{children}</main>
            <SiteFooter />
          </div>

        </div>
      </div>
      <TabBar />
      <MoreSheet topics={topics} places={places} />
      <Search today={TODAY} weekend={weekend()} />
    </AppData>
  );
}
