import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Bricolage_Grotesque } from 'next/font/google';
import './site.css';
import JsonLd from '@/components/JsonLd';
import { getSite } from '@/lib/content';
import { orgLd } from '@/lib/seo';

// Bricolage Grotesque, self-hosted by next/font at build time (no request to Google from the visitor).
const brico = Bricolage_Grotesque({ subsets: ['latin'], axes: ['opsz'], display: 'swap', variable: '--font-b' });
const site = getSite();
// Google Analytics (GA4) loads only when a measurement ID (G-...) is set in the CMS (Site settings, Analytics).
const GA = /^G-[A-Z0-9]+$/.test(site.analytics?.googleId?.trim() || '') ? site.analytics!.googleId!.trim() : '';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | New eats, events and openings in Northwest Arkansas`, template: `%s | ${site.name}` },
  description: site.description,
  alternates: { types: { 'application/rss+xml': '/feed.xml' } },
  openGraph: { type: 'website', siteName: site.name, images: ['/open-graph-share.png'] },
  twitter: { card: 'summary_large_image' },
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.png', sizes: '48x48' }], apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#F2EDE3', viewportFit: 'cover', width: 'device-width', initialScale: 1 };

// Before first paint: JavaScript is on (reveal animations wait for it) and buttons use the creek stone shape.
const BOOT = `document.documentElement.classList.add('js');document.documentElement.dataset.btn='stone';`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={brico.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        {GA && <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} />}
        {GA && <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA}');` }} />}
      </head>
      <body>
        {children}
        <JsonLd data={orgLd()} />
        <Script src="/site.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
