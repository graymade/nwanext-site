import { absoluteUrl, getGuides, getSite } from '@/lib/content';
import { cityStats, items, topicStats, upcoming } from '@/lib/data';

export const dynamic = 'force-static';

// llms.txt: a plain map of the site for AI answer engines (llmstxt.org). Rebuilt with every deploy.
export function GET() {
  const site = getSite();
  const all = items();
  const n = (k: number) => `${k} ${k === 1 ? 'story' : 'stories'}`;
  const line = (title: string, href: string, note?: string) => `- [${title}](${absoluteUrl(href)})${note ? `: ${note}` : ''}`;
  const events = upcoming(all).slice(0, 30);
  const latest = all.slice(0, 40);
  const body = `# ${site.name}

> ${site.description}

${site.name} covers new restaurants, openings, closings, events and local changes in Benton and Washington counties, Arkansas. Every story names its sources and credits its photos. Information comes from published sources and the businesses and organizations covered. Stories are short, dated and updated when facts change.

## Main sections

${line('Events', '/events/', 'upcoming things to do across Northwest Arkansas')}
${line('Calendar', '/calendar/', 'events by month; subscribe at ' + absoluteUrl('/calendar.ics'))}
${line('New spots', '/openings/', 'restaurant, shop and business openings')}
${line('News', '/news/', 'every story, newest first')}
${line('Towns', '/cities/', 'Bentonville, Rogers, Springdale, Fayetteville and the towns around them')}
${line('Guides', '/guides/', 'evergreen local guides')}
${line('About', '/about/', 'who runs NWA Next and how stories are sourced')}
${line('Send a tip', '/submit/')}

## Towns

${cityStats().filter((c) => c.count > 0).map((c) => line(c.name, c.href, n(c.count))).join('\n')}

## Topics

${topicStats().filter((t) => t.count > 0).map((t) => line(t.name, t.href, n(t.count))).join('\n')}

## Guides

${getGuides().map((g) => line(g.title, `/guides/${g.slug}/`, g.summary)).join('\n')}
${events.length ? `\n## Upcoming events\n\n${events.map((i) => line(i.title, i.href, i.summary)).join('\n')}\n` : ''}
## Latest stories

${latest.map((i) => line(i.title, i.href, i.summary)).join('\n')}

## Feeds

- [RSS feed](${absoluteUrl('/feed.xml')})
- [Event calendar (iCal)](${absoluteUrl('/calendar.ics')})
- [Sitemap](${absoluteUrl('/sitemap.xml')})
`;
  return new Response(body.replace(/\n{3,}/g, '\n\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
