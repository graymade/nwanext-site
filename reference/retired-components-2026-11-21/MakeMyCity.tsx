'use client';
// On a city page: make this the city the whole site shows first.
import { setScope, useScope } from '@/lib/scope';

export default function MakeMyCity({ slug, name }: { slug: string; name: string }) {
  const scope = useScope();
  const mine = scope === slug;
  return (
    <button type="button" className="button button--quiet make-city" aria-pressed={mine} onClick={() => setScope(mine ? '' : slug)}>
      {mine ? <><i className="dot" aria-hidden="true" />{name} is your city</> : `Make ${name} my city`}
    </button>
  );
}
