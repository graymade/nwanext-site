# Round 3 build rules (shared by J Almanac and K Pocket)

Sam, 2026-11-10: "I feel like these designs could be better. Which two best designs could we have that are better than these current options? I care more about user experience and UI/UX design, and for good SEO setup for it to be easily navigable for visitors. You can use the Relume MCP to help get components to help with having some more interesting designed sections."

Two separate Next.js apps, one per design, beside the older prototypes so Sam can compare:

- `Website/_Almanac/` design J, port **3034**
- `Website/_Pocket/` design K, port **3035**
- Older: `_Working/` (A to H, port 3030), `_River/` (I, port 3032). Read-only for this build.

Your design spec is `DESIGN.md` in your app folder. This file holds the rules both builds share.

## 1. Hard limits

- Work only inside your own app folder. Everything else is read-only, including `../_Working` (read its content, never write, build or sync there), `../_River` and the other Round 3 app. Do not stop or restart servers on 3030 or 3032, or the other Round 3 port.
- Do not run anything in the NWA Next repo root (`make verify`, `make clean-derived`, newsroom or runtime scripts). The social operation is paused. This build does not resume it.
- No deploy, no push, no git commits, no domain, newsletter provider or form service connections.
- No deletes outside your folder. Inside it, delete only files this build generated.
- Headless only. Never open a visible browser window (no `open`, no headed Playwright). Stop servers only by their own port PID: `lsof -ti tcp:<port> -sTCP:LISTEN`. Never `pkill`.
- No em dashes (U+2014) anywhere, in copy or in code comments. Use commas or periods.

## 2. What is already built (the foundation, do not rewrite it)

The app is scaffolded from the River build: Next.js 15 static export, React 19, TypeScript, `next/font/google`, one `app/globals.css`. `npm install` is done (node_modules present).

- `scripts/images.mjs` runs before dev and build. It makes WebP sizes and a 1200px JPEG of every story and place photo under `public/media`, and writes `lib/media.json`. Never edit those outputs. Every image goes through `components/Img.tsx` (real width and height, srcset, lazy by default, `priority` for the first visible images).
- `lib/content.ts`: `getArticles()`, `getArticle(slug)`, `getSite()`, `getCities()` (north to south), `getResources()`, `getGuides()`, `getPhotos()`, `photo(slug)`, `photoCredit(p)`, `shortCredit()`, `absoluteUrl()`, `mediaInfo()`. Content is read from `../_Working/content` (one copy of every story).
- `lib/now.ts`: `NOW`, `TODAY` (YYYY-MM-DD in Central time), `addDays()`. **`NWA_NOW`** (an ISO date) previews the site as it was on that day: later stories are hidden and "upcoming" is worked out from it. The real date today has no upcoming events (posting is paused), so design and QA with `NWA_NOW=2026-09-21T23:00:00-05:00` (ten upcoming events), then check the empty states with the real date.
- `lib/facts.ts`: `factsFor(article)` returns `{ kind: 'event' | 'opening' | 'coming' | 'news', start, end, time, startTime, endTime, place, address, price, upcoming }`, read from each caption. 19 events, 8 openings, 2 coming soon on the current content.
- `lib/taxonomy.ts`: `TOPICS` (each with `slug`, `href`, `title`, `h1`, `blurb`; Events links to `/events/`), `PLACES` (venues that recur).
- `lib/data.ts`: `items()` (every story as an `Item`: lite story fields, photo `w`/`h`, `href`, `facts`), `upcoming()`, `pastEvents()`, `openings()`, `comingSoon()`, `byDay(list)`, `showDay(item)`, `weekend()`, `inRange()`, `cityStats()`, `topicStats()`, `placeStats()` (places with 2+ stories), `itemsForPlace()`, `related(item)`, `nextStory(slug)`, `cityHref()`, `topicHref()`, `searchEntries()`.
- `lib/when.ts` (client-safe): `dateParts(key)`, `dayHeading(key)`, `eventDateLabel(facts)`, `whenLong(facts)`, `googleCalendarUrl(...)`, `directionsUrl(facts, city)`, `whereLine(facts, city)`.
- `lib/format.ts` (client-safe): `shortDate`, `longDate`, `monthLabel`, `statusWord`. `lib/site.ts`: `firstSentence`, `guidePairs()`. `lib/cityPhotos.ts`: `CITY_PHOTO` (Farmington has none).
- `lib/seo.ts`: `pageMeta({ title, description, path, image?, noindex?, type? })`, `breadcrumbLd(crumbs)`, `orgLd()` (with the sitelinks search box), `articleLd(article, facts)`, `eventLd(article, facts)`, `itemListLd(name, items)`.
- Routes done: `app/sitemap.ts` (every hub and story), `app/robots.ts`, `app/feed.xml/route.ts`, `app/search-index.json/route.ts` (the whole search index, fetched on first search), `app/news/[slug]/event.ics/route.ts` (Add to calendar for Apple and Outlook).
- Components: `Img`, `Wordmark` (outlined logo paths, ink is `currentColor`; give the dot `fill: #C58A58`), `JsonLd`, `NewsletterForm` and `TipForm` (port their logic: no provider is connected yet, so they show the "Signups open soon" fallback). `app/layout.tsx`, `app/page.tsx` and `app/news/[slug]/page.tsx` are placeholders. Replace them.
- `scripts/qa.mjs` is River's QA script. Adapt it (port, page list, checks).

If you find a real bug in the foundation, fix it in your folder and say so in your report.

## 3. Site map and SEO (both designs build every page)

| URL | What | Title tag |
|---|---|---|
| `/` | Home | `NWA Next | What's happening in Northwest Arkansas` |
| `/events/` | Upcoming events by day, then past events | `Things to do in Northwest Arkansas` |
| `/openings/` | Now open, and coming soon | `New restaurants and shops in Northwest Arkansas` |
| `/news/` | Every story, newest first, grouped by month | `All stories` |
| `/news/[slug]/` | Story | its headline |
| `/cities/` and `/cities/[city]/` | The five cities | `Things to do and what's new in {City}, AR` |
| `/topics/[topic]/` | One page per topic except Events | the topic's `title` |
| `/places/` and `/places/[place]/` | Venues with 2+ stories | `{Place} in {City}: events and news` |
| `/guides/`, `/guides/[slug]/`, `/guides/free-things-to-do/` | Port from River | |
| `/connect/`, `/newsletter/`, `/submit/`, `/about/`, `/credits/` | Port from River | |
| `/search/` | Search page (`?q=`), noindex | |
| `/links/` | The Instagram bio link page, noindex | |
| 404 | `That page is not here.` | |

Rules for every page:

- `export const metadata` or `generateMetadata` through `pageMeta()`: a unique title and a description written for that page (not the site description), canonical path with trailing slash.
- One `h1`. Headings in order. Landmarks: header, nav (with `aria-label`), main, footer.
- Every page except home shows **visible breadcrumbs** (`nav aria-label="Breadcrumb"`, an ordered list, current page as `aria-current="page"` text) and outputs the same trail as `breadcrumbLd`. Story trail: Home, then Things to do (events) or the topic, then the city.
- Stories output `articleLd`, plus `eventLd` when `facts.kind === 'event'`. `/events/`, city, topic and place pages output `itemListLd`. The layout outputs `orgLd()`.
- Topic pages with fewer than 3 stories, `/search/` and `/links/` are `noindex`.
- Internal links do the navigation work: every story links to its city page, its topic page and its place page (when it has one), and ends with related stories and the next story. Every hub links to its stories and to its sibling hubs. The footer is an HTML sitemap of the hubs.
- Real links (`next/link` or `<a href>`) for anything that navigates. Client filters update the URL with `history.replaceState` (`?city=rogers&free=1&when=weekend`) and read it on load, so a filtered view can be shared.
- Lists the server can render are rendered on the server (crawlable without JavaScript). Client components enhance them.
- Past events say so: on a story whose event is over, a plain line near the top ("This was on Tue, Sep 29.") with a link to `/events/`. Lists never call a past event "upcoming".
- Images: `alt` from `imageAlt` when present, else a short description built from the headline. Credits shown under photos (`shortCredit`), small.
- Copy: plain, short, sentence case, words a neighbour would say. No "discover", "explore", "curated", "vibrant", "hidden gems". No em dashes.

## 4. House CSS rules (Sam's, these win over anything else)

Load the `good-css` skill before writing CSS and read the reference files that match what you are writing. Then read `/Users/samgray/Documents/_Sam Working/Web Home/recipes/good-css.md`. The ones that bite:

- One stylesheet, `app/globals.css`. No Tailwind, no CSS modules, no CSS-in-JS.
- All media queries at the bottom, one block each, in this order: `(hover: hover) and (pointer: fine)`, `(prefers-reduced-motion: reduce)`, `(max-width: 1024px)`, `(max-width: 768px)`. No rule after a media block. Prefer `clamp()`, auto-fit grids and container queries so those blocks stay small.
- Every `:hover` inside the hover query. `:focus-visible` with an outline, never `outline: none`. An `:active` state on everything pressable.
- Reduced motion reduces, never removes: the reduce block changes only movement (transform, translate, or swaps an animation for a fade-only keyframe). Never `animation: none`, `transition: none`, opacity, visibility or display in it. Never gate motion behind `no-preference`.
- Brand colours stay hex tokens: ink `#19323A`, limestone `#EFE7D8`, sandstone `#C58A58`, river `#4E8996`. Derive tints with `color-mix()`. Mix warm neutrals `in srgb` (oklch mixes of limestone drift pink).
- Logical properties throughout. Name transitioned properties, never `all`, never `ease-in`. `overflow: clip` instead of `hidden` unless a script scrolls it.
- Text at least 15px (inputs `max(16px, 1rem)`), contrast at least 4.5:1 (3:1 at 24px and up). Sandstone is never text on a light ground. Tap targets at least 44px.

## 5. Relume

Sam wants Relume sections behind the more interesting parts. Your `DESIGN.md` names them. Fetch each with the Relume MCP (`mcp__relume-library__get_components`, `primitives: "names-only"`) to read the structure and proportions, then port it to plain CSS in our tokens. Keep the Relume section name as the section's class (for example `section_event31`) so it can be rebuilt in Webflow later. Previews are wireframes: real photos and real copy decide whether a layout lands, so adjust. No Relume packages, no Tailwind.

## 6. Sam's taste (from his own feedback)

Restraint over decoration: one idea per screen, say each thing once. No cards with borders and shadows stacked everywhere, no pill chips, no uppercase labels, no eyebrow labels above headings, no gradients, no decorative icons, no arrows appended to link text. Plain circles and full-width hairlines carry structure. Photos at their true shape with plain captions, never a headline over a photo. Motion subtle and answering the reader, nothing flashy. Balanced compositions with no empty corners. He judges the real thing at 1440 and on a phone.

## 7. Checks before you report

- `npm run typecheck` clean. `npm run build` passes and writes `out/`.
- `scripts/qa.mjs` (playwright-core, `channel: 'chrome'`, headless) visits every page type at 1440, 1024, 768 and 390 wide, with `NWA_NOW=2026-09-21T23:00:00-05:00` on the server: no sideways page scroll, no console errors, no text under 15px, a full-page screenshot in `qa/`. Also screenshot the home and `/events/` at the real date (empty states).
- Test every interactive piece with Playwright and screenshot each state (your `DESIGN.md` lists them). Keyboard: tab through home and a story; every focus ring visible, order sensible. Phone menu or sheets close with Esc and their close button.
- With `reducedMotion: 'reduce'` everything still shows and nothing slides.
- Home at 390 wide transfers under 1 MB of images.
- Validate the JSON-LD on one event story, one opening story and `/events/` (parse it, check required Event fields: name, startDate, location).
- Search the source for U+2014, `text-transform`, `outline: none`, `transition: all` and `:hover` outside the hover query. None should be found.
- Look at every screenshot yourself, then do a self-critique round: fix anything templated, cramped, misaligned or unbalanced, any empty corner, any orphaned word in a big headline. Then do it once more.
- Leave the dev server running on your port with `NWA_NOW=2026-09-21T23:00:00-05:00` (`npm run dev:preview`).

## 8. Report back

Plainly: what is built, what differs from `DESIGN.md` and why, the output of each check, anything left undone or doubtful. Do not claim a check you did not run.
