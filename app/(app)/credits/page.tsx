import Link from 'next/link';
import Img from '@/components/Img';
import PageHead, { HOME } from '@/components/PageHead';
import { getPhotos } from '@/lib/content';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Photo credits',
  description: 'Credits and licenses for the photos of Northwest Arkansas used on NWA Next.',
  path: '/credits/',
});

export default function CreditsPage() {
  return (
    <div className="page page--credits">
      <PageHead
        trail={[HOME, { name: 'Photo credits', href: '/credits/' }]}
        title="Photo credits"
        lede={<>Place photos come from Wikimedia Commons under the licenses below. Story photos are credited on each story, and the businesses and organizations we cover own their images. <Link className="link" href="/submit/">Tell us</Link> if you’d like an image credited differently or removed.</>}
      />
      <ul className="credits">
        {getPhotos().map((p) => (
          <li key={p.slug} className="credit">
            <span className="credit__media"><Img src={p.src} alt={p.caption} sizes="(max-width: 768px) 100vw, 20rem" /></span>
            <div className="credit__text">
              <strong>{p.caption}</strong>
              <p>{p.author}, <a href={p.license_url || p.source} rel="license nofollow noopener">{p.license}</a>, resized.</p>
              <p><a href={p.source} rel="nofollow noopener">Source on Wikimedia Commons</a></p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
