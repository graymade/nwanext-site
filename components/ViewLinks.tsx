'use client';
// "List" and "Month": the things-to-do list and the calendar, carrying the current filters across.
import Link from 'next/link';

export default function ViewLinks({ current }: { current: 'list' | 'month' }) {
  const carry = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const q = new URLSearchParams(location.search);
    q.delete('month');
    q.delete('show');
    const s = q.toString().replace(/%2C/g, ',');
    if (s) e.currentTarget.href = `${e.currentTarget.getAttribute('href')!.split('?')[0]}?${s}`;
  };
  return (
    <nav className="viewswitch viewswitch--links" aria-label="Calendar view">
      <Link className="viewswitch__btn" href="/events/" aria-current={current === 'list' ? 'page' : undefined} onClick={carry}>List</Link>
      <Link className="viewswitch__btn" href="/calendar/" aria-current={current === 'month' ? 'page' : undefined} onClick={carry}>Month</Link>
    </nav>
  );
}
