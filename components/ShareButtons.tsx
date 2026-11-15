'use client';
// Share buttons anywhere (feed, story page): one delegated handler. Phones get the share sheet,
// everything else copies the link and says so in a small toast.
import { useEffect, useRef } from 'react';

export default function ShareButtons() {
  const toast = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let timer: number | undefined;
    const say = (msg: string) => {
      const t = toast.current;
      if (!t) return;
      t.textContent = msg;
      try { t.showPopover(); } catch {}
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { try { t.hidePopover(); } catch {} }, 2200);
    };
    const onShare = async (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-share]');
      if (!b) return;
      e.preventDefault();
      const url = new URL(b.dataset.share || location.pathname, location.origin).toString();
      const title = b.dataset.shareTitle || document.title;
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        try { await navigator.share({ title, url }); } catch {}
        return;
      }
      try { await navigator.clipboard.writeText(url); say('Link copied'); } catch { say(url); }
    };
    document.addEventListener('click', onShare);
    return () => { document.removeEventListener('click', onShare); window.clearTimeout(timer); };
  }, []);
  return <div ref={toast} className="toast" popover="manual" role="status" aria-live="polite" />;
}
