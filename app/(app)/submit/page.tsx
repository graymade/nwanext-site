import Link from 'next/link';
import { Breadcrumbs, HOME } from '@/components/PageHead';
import TipForm from '@/components/TipForm';
import { getSite } from '@/lib/content';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Send a tip',
  description: 'Know about a new restaurant, an opening, a closing or a local event in Northwest Arkansas? Tell NWA Next.',
  path: '/submit/',
});

export default function SubmitPage() {
  const site = getSite();
  return (
    <div className="page page--submit">
      <header className="page-head form-head section_contact5">
        <Breadcrumbs trail={[HOME, { name: 'Send a tip', href: '/submit/' }]} />
        <div className="form-head__grid">
          <div className="form-head__text">
            <h1 className="page-title">Send a tip</h1>
            <p className="lede">{site.tips.pitch}</p>
            <p className="note-line">Found a mistake in a story? <Link className="link" href="/about/#corrections">How we handle corrections</Link>.</p>
          </div>
          <div className="form-card">
            <TipForm action={site.tips.action} handle={site.instagramHandle} />
          </div>
        </div>
      </header>
    </div>
  );
}
