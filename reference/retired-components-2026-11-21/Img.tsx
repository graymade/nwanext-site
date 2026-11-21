import media from '@/lib/media.json';

type Info = { w: number; h: number; widths: number[] };
const MEDIA = media as Record<string, Info>;

// Every image on the site goes through here: WebP srcset at real sizes, so nothing shifts on load.
// Images fade in once loaded (see the boot script in app/layout.tsx and the data-in rule in globals.css).
export default function Img({ src, alt, sizes, priority = false, className }: { src: string; alt: string; sizes: string; priority?: boolean; className?: string }) {
  const info = MEDIA[src];
  if (!info) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} loading={priority ? 'eager' : 'lazy'} decoding="async" suppressHydrationWarning />;
  }
  const base = src.replace(/\.[^.]+$/, '');
  const srcSet = info.widths.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
  const fallback = `${base}-${info.widths.find((w) => w >= 800) ?? info.widths[info.widths.length - 1]}.webp`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fallback}
      srcSet={srcSet}
      sizes={sizes}
      width={info.w}
      height={info.h}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      // The boot script marks loaded images (data-in) before React hydrates; that attribute is expected.
      suppressHydrationWarning
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  );
}
