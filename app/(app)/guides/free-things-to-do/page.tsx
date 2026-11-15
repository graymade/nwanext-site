import PageHead, { HOME } from '@/components/PageHead';
import { AgendaRow, Row } from '@/components/Rows';
import { items, upcoming } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import { cards } from '@/lib/view';

export const metadata = pageMeta({
  title: 'Free things to do in Northwest Arkansas',
  description: 'Free events, outings and openings across Northwest Arkansas. Updated as we post.',
  path: '/guides/free-things-to-do/',
});

// Builds itself: any story that mentions "free" (or is marked Free in the CMS) lands here.
export default function FreeThings() {
  const free = items().filter((i) => i.free);
  const up = upcoming(free);
  const rest = free.filter((i) => !up.includes(i));
  return (
    <div className="page page--free">
      <PageHead
        trail={[HOME, { name: 'Guides', href: '/guides/' }, { name: 'Free things to do', href: '/guides/free-things-to-do/' }]}
        title="Free things to do"
        lede="Every free event, outing and open house we have covered."
      />
      {up.length > 0 && (
        <section className="hub-section" aria-labelledby="free-up">
          <h2 id="free-up" className="section-title">Coming up</h2>
          <ol className="rows agenda__rows">{cards(up).map((c) => <AgendaRow key={c.slug} c={{ ...c, startLabel: c.dayShort }} />)}</ol>
        </section>
      )}
      <section className="hub-section" aria-labelledby="free-rest">
        <h2 id="free-rest" className="section-title">{up.length ? 'Earlier' : 'What we covered'}</h2>
        <ul className="rows rows--cols">{cards(rest).map((c) => <Row key={c.slug} c={c} />)}</ul>
      </section>
    </div>
  );
}
