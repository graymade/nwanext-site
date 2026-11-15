import Link from 'next/link';

// Hairline rows with a name on the left and a short line on the right. Guides, city links, directory.
export type Pair = { href: string; name: string; note?: string; external?: boolean };

export default function PairRows({ items, className = '' }: { items: Pair[]; className?: string }) {
  return (
    <ul className={`pairs ${className}`}>
      {items.map((p) => (
        <li key={p.href + p.name} className="pair">
          {p.external ? <a className="pair__link" href={p.href}>{p.name}</a> : <Link className="pair__link" href={p.href}>{p.name}</Link>}
          {p.note && <span className="pair__note">{p.note}</span>}
        </li>
      ))}
    </ul>
  );
}
