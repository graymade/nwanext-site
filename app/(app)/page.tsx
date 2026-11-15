import Browse from '@/components/Browse';
import { items, openings, upcoming } from '@/lib/data';
import { getSite } from '@/lib/content';
import { pageMeta } from '@/lib/seo';
import { browseBase, cards } from '@/lib/view';

export const metadata = {
  ...pageMeta({
    title: "NWA Next | What's happening in Northwest Arkansas",
    description: "New restaurants, things to do this week and what's changing across Northwest Arkansas, town by town. Sourced local stories, sorted by city and date.",
    path: '/',
  }),
  title: { absolute: "NWA Next | What's happening in Northwest Arkansas" },
};

// The Instagram bio line is the headline. The region's name carries the weight, like the wordmark.
function Tagline({ text }: { text: string }) {
  const i = text.lastIndexOf('Northwest Arkansas');
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<strong className="home-title__place">Northwest Arkansas</strong>{text.slice(i + 18)}</>;
}

export default function Home() {
  const { ctx, topics } = browseBase();
  const site = getSite();
  return (
    <div className="page page--home">
      <Browse
        variant="home"
        list={cards(items())}
        spots={cards(openings())}
        facets={['show', 'city', 'topic', 'when', 'free']}
        topics={topics}
        ctx={ctx}
        nothingAtAll={upcoming().length === 0}
        viewSwitch
        head={
          <header className="home-head">
            <h1 className="home-title"><Tagline text={site.tagline} /></h1>
            <p className="home-sub">Things to do, new spots and local news, town by town. Every story links to its sources.</p>
          </header>
        }
      />
    </div>
  );
}
