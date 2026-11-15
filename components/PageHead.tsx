// Breadcrumbs (visible, plus BreadcrumbList JSON-LD), the page's one h1 and a short lede.
import JsonLd from './JsonLd';
import { Crumbs } from './Bits';
import { breadcrumbLd, type Crumb } from '@/lib/seo';

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <>
      <Crumbs trail={trail} />
      <JsonLd data={breadcrumbLd(trail)} />
    </>
  );
}

export default function PageHead({ trail, title, lede, children, className = '' }: { trail: Crumb[]; title: string; lede?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <header className={`page-head ${className}`}>
      <Breadcrumbs trail={trail} />
      <h1 className="page-title">{title}</h1>
      {lede && <p className="lede">{lede}</p>}
      {children}
    </header>
  );
}

export const HOME: Crumb = { name: 'Home', href: '/' };
