import type { Metadata, Viewport } from 'next';
import { Instrument_Sans } from 'next/font/google';
import './globals.css';
import JsonLd from '@/components/JsonLd';
import ShareButtons from '@/components/ShareButtons';
import { getSite } from '@/lib/content';
import { orgLd } from '@/lib/seo';

const sans = Instrument_Sans({ subsets: ['latin'], axes: ['wdth'], display: 'swap', variable: '--font-sans' });
const site = getSite();
// Google Analytics (GA4) loads only when a measurement ID (G-...) is set in the CMS (Site settings, Analytics).
const GA = /^G-[A-Z0-9]+$/.test(site.analytics?.googleId?.trim() || '') ? site.analytics!.googleId!.trim() : '';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | What's happening in Northwest Arkansas`, template: `%s | ${site.name}` },
  description: site.description,
  alternates: { types: { 'application/rss+xml': '/feed.xml' } },
  openGraph: { type: 'website', siteName: site.name, images: ['/open-graph-share.png'] },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.png', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#19323A', viewportFit: 'cover', width: 'device-width', initialScale: 1 };

// Before first paint: mark JavaScript as on and apply the saved city, so scoped lists can hold
// their fade until they have switched (also when the address carries filters). A watchdog reveals them whatever happens.
// Images fade in once loaded: a capturing load listener on document (load never reaches window) marks
// each one (data-in); errors and anything
// already complete get marked too, so no image stays hidden.
const BOOT = `(function(){var d=document.documentElement;d.classList.add('js');try{d.dataset.scope=localStorage.getItem('nwa-city')||''}catch(e){}if(/[?&](show|city|topic|category|when|free)=/.test(location.search))d.dataset.filtered='1';setTimeout(function(){d.classList.add('scope-ready')},1500);function m(e){var t=e.target;if(t&&t.tagName==='IMG')t.setAttribute('data-in','')}document.addEventListener('load',m,true);document.addEventListener('error',m,true);addEventListener('load',function(){setTimeout(function(){document.querySelectorAll('img:not([data-in])').forEach(function(i){if(i.complete)i.setAttribute('data-in','')})},300)})})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        {GA && <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} />}
        {GA && <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA}');` }} />}
      </head>
      <body>
        {children}
        <ShareButtons />
        <JsonLd data={orgLd()} />
      </body>
    </html>
  );
}
