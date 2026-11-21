> **Superseded 2026-11-21.** The live site now uses the Field Guide design (Round 4 comp in `../_Round4/`, render templates in `lib/render/`). This file describes the older K Pocket design and is kept as history.

# K. Pocket: design spec

Read `BUILD_RULES.md` first (limits, foundation, site map, SEO, CSS rules, checks). This file is the design and the single source of truth for it.

Version 2 (2026-11-10): Sam picked Pocket and asked for a desktop layout that fills the space, a stacked email form in narrow columns, one intuitive way to filter by city, topic and more, and a real calendar with easy ways to add it to your own. Sections 3, 4, 6, 7, 8, 9, 10, 11, 13 and 14 changed.

Version 3 (2026-11-10): Sam asked for no useless eyebrow taglines, clearer formatting and hierarchy, better hover states, interactions and transitions, and a fix for the "Coming up" row that scrolled up and down inside itself. Sections 2, 3, 4, 5, 6, 7, 10 and 13 changed; section 2a (hierarchy and labels) and section 13 (interaction rules) are new rules for every page.

Version 4 (2026-11-10): Sam found the hovers jittery, the thumbnails badly designed, the stacked logo weak (he wants "NWA Next" horizontally in two weights) and the inner pages narrow columns that waste the space. Sections 2, 2b (new, cards), 3, 9 (now the inner page layouts) and 13 changed.

Version 5 (2026-11-11): Sam asked for the Instagram bio line on the site, a filter bar where it is clearer what's what, and no story sheet (a story opens its full page). Sections 1, 4, 5, 10 and 13 changed. The old sheet code is kept in `reference/retired-2026-11-11/`.

## 1. The idea

NWA Next lives on Instagram, and most visitors arrive from the bio link on a phone. Pocket feels like the app they just left, only searchable and sorted by place and date: a feed of stories with big true-shape photos, a tab bar under the thumb, a city you pick once and the site remembers, and stories that open as full pages with their own URL (Back returns to the list). On a laptop the same app spreads out: a sidebar and a fluid main area with a story grid, one filter bar for every list, and a month calendar.

Under the app feel, every page is a real server-rendered page with its own URL, so search engines see a normal, well-linked site.

## 2. Look

- **Dark app**: ground is ink `#19323A`. Raised surfaces (sheet, menus, sidebar) `color-mix(in srgb, #19323A 88%, #EFE7D8)`. Text limestone `#EFE7D8`; muted `color-mix(in srgb, #EFE7D8 68%, #19323A)`. Hairlines `color-mix(in srgb, #EFE7D8 14%, transparent)`.
- **Accent**: sandstone `#C58A58` for the active tab, the selected city, today's marker, the "now open" dot and the primary button (ink text on sandstone). River `#4E8996` only for focus rings' inner tone if useful, otherwise unused.
- **Type**: `Instrument_Sans` only (with the `wdth` axis). Body 1.0625rem weight 500, line height 1.5. Headlines weight 650, `font-stretch` about 92%, tight leading. Numbers tabular. One scale, four steps (tokens in `globals.css`):
  - **Page title** `--text-title` (2rem to 2.875rem): every page's `h1`, home and story included.
  - **Section title** `--text-section` (1.375rem to 1.625rem): every section `h2` ("Coming up", "New spots", "More at The Momentary", "Next story", county names on `/cities/`, "Fayetteville links").
  - **Card title** `--text-card` 1.1875rem in the grid (the list view and the lead are larger, `--text-feed` and up to 2.625rem).
  - **Meta** `--text-meta` 0.9375rem weight 500 muted. Nothing smaller.
- **Spacing**: one `--section-gap` (2.75rem to 4.25rem) between every section of every page. The page head sits `--head-gap` (1.5rem) above its filter bar, and the first list sits `--after-bar` (2rem) below it. Sections are separated by space, not by rules. Hairlines stay only inside lists of rows (agenda, related, cities) and under the sticky filter bar.
- **Shape**: photos 10px radius (app feel), bottom sheets 18px top corners on phones, buttons 999px for round icon buttons and the filter bar's tracks and menus (v5), 8px for other text buttons, height 2.75rem to 3rem. Raised panels (facts panel, subscribe block, email band, site map, form cards, guide cards, the ways on connect and the 404, about's corrections and tips) 14px (`--radius-panel`). No shadows except one soft shadow under bottom sheets and menus. No bordered cards: feed items are separated by space.
- **Logo**: the horizontal wordmark "NWA Next", NWA in Avenir Next Regular and Next in Avenir Next Demi Bold, title case, kerned by the font and outlined to SVG paths (`components/Wordmark.tsx`, built by `scripts/build-logo.py` with fontTools and HarfBuzz; option 2 of six in `qa/logo-options-v4.png`). It replaces the stacked Buffalo River lockup everywhere in the site: sidebar (8.75rem wide), phone top bar (7.5rem), footer (10rem), links page h1 (9.5rem). `currentColor` ink, no sandstone in the mark (sandstone stays for active states). Accessible name "NWA Next". The favicon and Instagram avatar are unchanged.

## 2a. Hierarchy and labels (the eyebrow rule)

- **No eyebrows.** No small label sits above a heading or a block. A label stays only if it adds information the heading, breadcrumb or context does not already give, and it helps a visitor decide something. Otherwise delete it, or turn it into metadata **below** the heading.
- **Title first, then one meta line.** Cards, rows and the story head put the headline first and the facts after it: date and time, then the place (or city), then Free. Never the meta above the headline.
- **Counts only when they answer something.** The "30 stories" line shows only while a filter is on ("12 stories" then tells you what the filter did). Unfiltered it stays in the page for screen readers (it is the live status line) but is visually hidden. Agenda day headings carry no event count.
- **Ledes inform, never instruct.** A page lede says what is on the page in a few words or is left out. No "tap a day to…", no "narrow it down by…".
- Removed in v3: home "Monday, Sep 21"; the "30 stories" / "19 events" / "13 stories Fayetteville" status line when unfiltered; the story page's "Things to do  Bentonville  Posted Sep 21" over the headline (now the byline under it); "Next story" inside the next-story card (now a section heading); "Next in this list" over the sheet's next title (now under it); sidebar "Your city" (now a pin icon beside the city) and "The Friday email" (the button already says it); the "See your city first" chips; the agenda's "1 event" per day; the help-text ledes on things to do, calendar and all stories, and the second sentences of the new spots, places, cities and free-things ledes.
- **Icons**: functional only (tab bar, search, close, calendar, map pin, share). One set, inline SVG, 1.75px stroke, 22px, `currentColor`. Never decorative.

## 2b. Cards (one rhythm for every card type)

Every card is image plus text, the card's own type carrying the date, place and price: photo (10px radius), then `--card-gap` (0.875rem), the headline, `--card-text-gap` (0.375rem), one meta line, then at most one muted line of text. Feed grid cards, the carousel, New spots, the next-story card, content cards (cities, places, guides) and story tiles all use these two gaps. Headlines in grid-like cards are `--text-card` (1.1875rem); content cards (city, place, guide) are `--text-card-lg` (1.25rem to 1.4375rem). Rows (thumb beside the text) keep 1rem padding and a 1rem gap.

- **Content card** (`components/Cards.tsx`, `.ccard`): photo 3:2, or a raised type panel with the name when there is no photo (cities fall back to their newest story photo first). The headline's link covers the card.
- **Panel card** (`.ccard--panel`): text only on a raised 14px panel with 1.25rem to 1.75rem padding (guides).
- **Story tile** (`.ccard--story`): photo 4:3, headline (3 lines max), meta; opens the story page. On phones it becomes a compact row (square photo beside the text).
- **Balanced grid** (`.bgrid`): 1, 2 or 3 across by main's width (container queries). A short last row never leaves an empty corner: with one card over, the first card takes the whole row laid out sideways; with two over, the first two share the top row at half width each.
- **Feeds with one or two cards** (Coming soon on New spots) lay each card sideways across half the row.

## 3. Shell (Relume `application-shell16`: sidebar and a fluid main area)

### Wide screens (1025px and up)

```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│ NWA NEXT     │  What's happening in Northwest Arkansas                      │
│ [⌕ Search  /]│  All Events New spots News  City▾ Topic▾ When▾ ☐Free  Grid List│ ← sticky filter bar
│              │  (only when filtered) 12 stories  Rogers ×  Clear all        │
│ Home         │  Coming up ─ carousel (fills the row) ──────────────  ‹ › See all
│ Calendar     │  ┌──────── lead: the whole first row ──────────────────────┐ │
│ New spots    │  │ photo (own shape) │ big headline, meta, summary, actions│ │
│ Cities    ▸  │  └───────────────────┴──────────────────────────────────────┘ │
│ Topics    ▸  │  ┌─────┐ ┌─────┐ ┌─────┐   2 to 4 columns by main width,      │
│ Places    ▸  │  │ 4:5 │ │ 4:5 │ │ 4:5 │   title then one meta line           │
│ Guides       │  └─────┘ └─────┘ └─────┘   (two full rows)                    │
│              │  New spots (full-width row, fills the width)                 │
│ ⌖ Rogers Change  more cards, Show more, Friday email band                     │
│ [email     ] │  site map footer                                             │
│ [Get the Friday email]                                                      │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

- **Sidebar** (16rem, sticky full height, raised surface): the horizontal wordmark, a Search field-looking button with the `/` hint, then nav: Home `/`, Calendar `/calendar/` (also active on `/events/`), New spots `/openings/`, then three sections that open in place: **Cities** (featured cities with counts, then "All cities and towns"), **Topics** (with counts, then "All stories"), **Places** (places with pages, with counts, then "All places"), then Guides. These stay plain links to the hub pages (good for SEO and for people who browse). At the bottom: the saved city as one row, a map pin, the city name ("All of NWA" or "Rogers") and Change (opens the town picker); then the Friday email form **stacked** with no label above it: the field full width, the button "Get the Friday email" full width under it, and "Free. Unsubscribe any time." muted. Every form in a narrow column is stacked the same way. Current page: a light tint behind the item plus the sandstone bar on the left edge, which scales in.
- **No side panel.** It repeated "Coming up", which the carousel already shows. Its Places list moved into the sidebar and its small links into the site-map footer.
- **Main** is fluid between the sidebar and the window edge: padding `clamp(1.5rem, 3vw, 3.5rem)`, content up to 88rem, centred in what is left. Main is a size container (`container: main / inline-size`); layouts inside respond to main's width with container queries, not viewport breakpoints. Every page uses the full main width with a real layout (section 9); reading text keeps its own measure (`--measure`, 65ch; guide prose 40rem). Only search stays a centred 52rem column, like the palette it mirrors.

### Phones and tablets (1024px and under)

- **Top bar** (sticky, ink, a hairline once scrolled): wordmark left, the "my city" button ("All NWA" or "Rogers", opens the town picker), Search icon right.
- **Bottom tab bar** (fixed, raised, safe-area padding): **Home, Calendar, Search, New spots, More**. Icon above a 0.9375rem label. Active: sandstone icon, limestone label. More opens a bottom sheet with Cities (featured, then all), Topics, Places, Things to do, Guides, Get connected, Send a tip, About, Photo credits and the stacked Friday email form.

### Footer

The HTML site map sits at the bottom of main on every page as a raised 14px block (Relume footer structure, its own size container): the brand column (wordmark, then "Every story links to its sources. See something wrong? Tell us.") beside five link columns once the footer is 56rem wide: Cities (featured, then all), Topics, Things to do (Things to do, Calendar, Free things to do, places), New spots, NWA Next (About, Get connected, Friday email, Send a tip, Photo credits, RSS feed, Instagram). Narrower, the brand sits above the columns (two columns on phones). A hairline, then "© 2026 NWA Next".

### My city

The town picker (top bar city button, "Change" in the sidebar) is one searchable list of every city and town, grouped by county, with counts: a popover on wide screens, a bottom sheet on phones. Picking a town saves it (`localStorage` `nwa-city`). The saved city is the default City filter everywhere until the visitor changes the filter on a page.

## 4. Home (`/`)

1. The h1 is the Instagram bio line from `site.json` `tagline` ("What’s opening, closing, building, and changing across Northwest Arkansas."), medium weight with "Northwest Arkansas" in bold (the wordmark's two weights), up to 22ch wide, 1.875rem to 3.5rem. Under it one muted line: "Things to do, new spots and local news, town by town. Every story links to its sources." Nothing above it. The `<title>` stays "NWA Next | What's happening in Northwest Arkansas" for search. The tagline also sits in the footer brand column, on `/links/` and on the default share image (`scripts/build-og.mjs`).
2. The **filter bar** (section 10) with Show, City, Topic, When and Free, and the **Grid / List** icon switch at its right end (wide screens only, remembered in `localStorage` `nwa-view`). The carousel and the feed both follow it.
3. **Coming up** carousel (Relume `section_event15`): the next upcoming events in the filtered set. 4:5 photo, date block on its corner, headline (two lines), where. A grid on native scroll: cards are 13rem to 17rem (a peek of the next one shows) and stretch to fill the row when only a few events are on, so the row never ends in empty space. Arrow buttons on fine pointers, only when the row has more to scroll to. Hidden when Show is New spots or News, when When is Past, or when nothing matches; when nothing is on the calendar anywhere it says so in one line. The row scrolls sideways only, never up and down (see the rule in section 13).
4. **Feed** (`components/Feed.tsx`). Every card is one link: the headline's link stretches over the whole card (photo included), no separate action row.
   - **Grid** (main 40rem and wider): 2 columns from 40rem of main, 3 from 62rem, 4 from 84rem, gaps 2.25rem by 1.5rem. Every photo is cropped to 4:5 so rows line up. Under it: headline (3 lines max), then one meta line (date and time, the place, Free; status and city for new spots). The first story is the **lead**, the whole first row: the photo at its own shape (4:5 to 3:2, up to 34rem tall) and beside it the larger headline, the meta line, a three-line summary and the labelled actions (Add to calendar, Directions, Share). Only the lead and the story page carry actions.
   - **List** (phones always; wide screens when chosen): one column of true-shape photos clamped between 4:5 and 1.91:1, centred at 44rem on wide screens, with headline, meta line and two-line summary, 2.5rem apart, no rules between. Tall photos narrow instead of cropping (never taller than about 78% of the screen). The first story keeps its actions.
   - 13 show (the lead plus twelve cards, which fills whole rows at 2, 3 and 4 columns), then "Show more"; without JavaScript all show.
   - **New spots** row (up to 4 openings, once): a full-width row pinned to the fourth grid row, after the lead and two rows of cards, so every row above it is full at any column count. Its cards fill the width (4:3 photos) and scroll sideways on phones. It shows when the list is unfiltered or filtered only by city.
5. **Friday email band** after the feed (home and city pages): a raised 14px band, the section title "One email on Friday morning" and one line on the left, the same stacked form as the sidebar on the right (stacked under the text on phones).

## 5. Opening a story (no sheet, v5)

Every story link (feed, carousel, rows, tiles, calendar, search) is a plain Next `<Link>` to `/news/[slug]/`: a client-side page change with prefetch, so the full page opens quickly, has its own URL and title, and Back returns to the list where it was. Modified and middle clicks open a new tab as usual. The story sheet (v1 to v4) was removed at Sam's request on 2026-11-11; its code and CSS are in `reference/retired-2026-11-11/`. Share buttons work through one delegated handler, `components/ShareButtons.tsx`, mounted in the root layout with its "Link copied" toast.

## 6. Story page (`/news/[slug]/`)

A normal page in the shell, wrapped in `<article class="story">`. Relume `section_blog-post-header4` for the top, `section_event-item-header11` for the facts row.

Reading order: headline, byline, photo, facts panel, body, sources, each 2rem apart.

- Breadcrumbs. `h1`. Dek when it does not repeat the body (River's rule). Then the **byline** under the headline: the city and the topic as links (Things to do for events), then "Posted Sep 21". Nothing above the headline but the breadcrumbs.
- Photo at true shape (max 75vh), credit under it. Past event line when it is over.
- **Facts panel** for events and openings: one raised 14px panel with Date, Time, Where (the place linked, the address under it), Price, or Status for new spots, sized to their content and wrapping, then the buttons: **Add to calendar** (primary; menu with Google Calendar, Apple or Outlook for this event, and "Subscribe to all events"), **Directions**, **Share** (icon only on phones).
- Body in `.prose` (36rem). **Sources**: a hairline above, a small "Sources" heading, each source on its own line, then the Instagram links with their icon.
- **Right column** (`.story__rail`, beside the article on wide main 62rem and up, after it below that): "More at {place}" or "More in {city}" as a section title over hairline rows, then "Next story" as a section title over a card (3:2 photo, title, date and city; the whole card is the link). No label inside the card.
- JSON-LD: `articleLd`, `eventLd` when an event, `breadcrumbLd`.

## 7. Things to do (`/events/`)

The list view of the calendar and the SEO hub for events. Relume `section_event33` (date tabs) and `section_event31` (schedule by day).

- Breadcrumbs, `h1` "Things to do in Northwest Arkansas" (no lede), and the **List / Month** switch (links to `/calendar/`, carrying the filters).
- The **subscribe block** (section 11) beside the title on wide screens, after the list on phones.
- The filter bar with City, Topic, When and Free (Show fixed to events).
- **Day scroller**: the next 14 days, a dot per event up to three. Pressing a day scrolls to it; scrolling updates the selected day.
- **Agenda**: day groups. On wide main (62rem and up) the day name sits in its own column beside the rows; under that, sticky day headings (below the filter bar). The heading is the day only, no count. Rows: start time ("6 PM", "All day"), headline and where, price or Free, a square thumb. Rows open the story page.
- **Earlier** below by month ("Past events" when When is Past). Empty at the real date: "Nothing on the calendar yet. We post events as soon as we confirm them." then the latest ones covered.

## 8. New spots (`/openings/`)

Breadcrumbs, `h1` "New in Northwest Arkansas", lede, the filter bar with City and Topic (Show fixed to new spots), then "Now open" and "Coming soon" as feeds (grid or list), each card with Directions.

## 9. Other pages (all in the shell)

- **City** (`/cities/[city]/`): breadcrumbs; a split header (name, county, intro, stats, "Make Rogers my city", a link to the city's links; the city photo at 16:9 beside it on wide main, above it on phones; Farmington-style type panel when there is no photo). Then the filter bar with City fixed (the city shows as a plain item in the filter line only while another filter is on), the city's Coming up carousel and its feed with the New spots module, then "{City} links" and nearby towns. A town with no stories: noindex, out of the sitemap, a friendly empty state with a tip button.
- **Cities** (`/cities/`): "Cities and towns, north to south" and one lede line, then the towns with stories as content cards in the balanced grid, north to south (photo, name, then county, stories, coming up and new counts, then "Latest: ..."), then "More towns we cover" as a raised block grouped by county.
- **Topic** (`/topics/[topic]/`) and **Place** (`/places/[place]/`): breadcrumbs, `h1`, blurb, the filter bar with the page's own facet fixed, then the feed (places also get their Coming up carousel). "Other places" and "{City} links" are hairline link rows flowing into columns.
- **Places** (`/places/`): content cards in the balanced grid (the newest story photo at that place, name, city and counts, the blurb).
- **All stories** (`/news/`): the filter bar with every facet and the feed. Old `?category=` links still work.
- **Calendar** (`/calendar/`): section 11.

### Inner page layouts (v4)

Every inner page fills the main area at 1024 to 1920 and stacks cleanly at 390: a page header (breadcrumbs, `h1`, at most one lede line, 42rem), then real sections at `--section-gap`. Shared pieces in `globals.css`: `.split` (a side-headed section: heading and one line in a left column, content in the right two thirds from 52rem of main; beside a link grid the heading starts on the same hairline as the first row of links), `.pairs--grid` (hairline link rows flowing into columns), `.bgrid`, `.panels` and `.panel`, `.ways` and `.way`, `.form-head` and `.form-card`, `.reading`, `.tiles`.

- **About** (`/about/`, Relume `section_stats14`): header; "What we cover" text (65ch) with a link to every city and town, beside four figures with a left rule (stories, events covered, new spots tracked, cities and towns), all counted from the content so they stay true; "How we check stories" as four standards in a row (plain numbered circle, a short name, the sentence); then Corrections (`#corrections`, "Tell us" and the Instagram message) and Tips as two raised panels.
- **Get connected** (`/connect/`, Relume `section_contact23`): header; four ways as raised panels in a row (Friday email with the primary button, Instagram, free things to do, send a tip), each a title, one line and one full-width button pinned to the bottom; then Volunteer and Find local calendars as side-headed link grids; the directory note line.
- **Friday email** (`/newsletter/`, Relume `section_cta14`): breadcrumbs, then the title and pitch on the left and the stacked form in a raised card on the right; then "Recent stories" (with "All stories") as four story tiles. The old "What was in the last one" heading went (no email has gone out yet) and so did the second "Free. Unsubscribe any time." line.
- **Send a tip** (`/submit/`, Relume `section_contact5`): breadcrumbs, then the title, pitch and a link to how corrections work on the left, the tip form (or the Instagram fallback while no form service is set) in a raised card on the right.
- **Guides** (`/guides/`): header; the guides as panel cards in the balanced grid; "Local directory" with a jump list of its groups, then one side-headed section per group (title and blurb left, links in columns right); the suggest-a-link line.
- **A guide** (`/guides/[slug]/`): header; the prose (40rem) beside a rail with "More guides" and the directory groups (after the prose below 62rem of main).
- **Free things to do**: "Coming up" as agenda rows, "Earlier" as rows in two columns.
- **Photo credits** (`/credits/`): a gallery: each photo at 3:2, the caption, then the author and license, then the source link.
- **404**: the title, one line and a primary "Search NWA Next" button on the left, four ways back (Home, Things to do, New spots, Cities and towns) as raised link panels in a 2 by 2 grid on the right.
- **Search** (`/search/?q=`) stays a centred 52rem column. **Links** (`/links/`, Relume `section_links1`, no app chrome, noindex) carries the wordmark as its `h1` under the Instagram avatar.

## 10. Filters (`components/Filters.tsx`, `components/Browse.tsx`, `lib/filter.ts`)

One filter system for every list of stories: home, all stories, things to do, new spots, the calendar, and city, topic and place pages.

- **Three groups, three looks (v5)**, so it is clear what each control does: **Show** is a raised pill track with the chosen option filled limestone (what you are looking at); **City, Topic, When and Free** are outlined pill buttons after a hairline divider, turning sandstone-tinted with a sandstone outline when on (how you narrow it); the **layout switch** is a small icon-only track (grid, list) at the far end (a setting). The calendar's List / Month links use the small track with words.
- **Facets**: **Show** (All, Events, New spots, News; one choice), **City** (multi-select: All NWA, featured cities, then "More towns" grouped by county, with a search field), **Topic** (multi-select), **When** (Any time, Upcoming, This weekend, Next 7 days, Past; only shown when Show is All or Events; any choice but Any time narrows to events), **Free** (a toggle).
- **Wide screens**: one sticky bar at the top of main under the page title: Show, then City, Topic and When as text buttons that open popover panels with checkboxes, then Free, then the Grid / List icon switch at the far end where a page has one. Each button names its state ("City: Rogers", "City: 3 towns", "Topic: Food and drink"). Only while a filter is on, a second line shows the live count ("12 stories"), the page's own fixed facet, the active filters as plain text with an × to remove each, and "Clear all". Unfiltered there is no second line (the count stays visually hidden as the live status).
- **Phones** (main under 40rem): a sticky row with Show (scrolls sideways if needed) and a "Filters" button with the active count. It opens a bottom sheet with every facet as a section and a primary "Show 12 stories" button.
- **Counts** next to every option reflect the other active filters (faceted counts). Options with 0 matches are disabled and sorted last; the saved city stays usable.
- **State** lives in the URL: `?show=events&city=rogers,bentonville&topic=food-and-drink&when=weekend&free=1`, read on load and written with `replaceState`. Old `?category=` links map to the topic. The saved "my city" is the default City until the visitor changes it (`?city=` with no value means All NWA on purpose).
- **Locked facets**: a page's own facet (the city on a city page, the topic on a topic page, the place on a place page, events on things to do and the calendar, new spots on New spots) is fixed and shown as a plain item without × in the filter line while another filter is on (the page title already says it otherwise).
- The server renders the unfiltered list, so everything stays crawlable. Filtering is instant on the client with a view-transition crossfade. Nothing left: "No stories match." with "Clear all" and "Send a tip".

## 11. Calendar (`/calendar/`) and subscribing

- A top-level destination: the tab bar's second tab and the sidebar's Calendar. `/calendar/` and `/events/` share the **List / Month** switch.
- **Header**: breadcrumbs, `h1` "Events calendar", lede, the switch; the **subscribe block** beside it on wide screens (after the calendar on phones).
- The filter bar with City, Topic and Free (Show fixed to events).
- **Month view** (main 40rem and up): the month title with its event count, Today, Previous and Next month buttons (disabled where no events exist before or after). A 7-column grid starting Sunday. Each day: the number (a button that selects the day), up to 3 events (start time and title, two lines at most, each opening its story page), then "+2 more". Today is a sandstone circle, the selected day is outlined, past days are muted and days outside the month are faint. Multi-day events show on every day they run. The selected day's full list sits beside the grid when main is 72rem or wider (sticky), under it otherwise.
- **Phones** (main under 40rem): a compact grid with up to 3 dots per day; tapping a day lists its events under the grid. Swiping sideways on the grid changes the month.
- Default month is the one containing "now" (respects `NWA_NOW`). URL `?month=2026-10` plus the filter params.
- **Subscribe block** ("Subscribe to the NWA Next calendar"): Apple Calendar (`webcal://…/calendar.ics`), Google Calendar (`https://calendar.google.com/calendar/r?cid=` + the URL-encoded webcal URL), Outlook (`https://outlook.live.com/calendar/0/addfromweb?url=` + the https feed + `&name=NWA%20Next`), Copy link (with a "Copied" status line) and the muted line "New events show up on their own once you subscribe." With exactly one city filtered and that city has events, "Only Rogers events" opens the same four options for its feed. A compact copy sits on `/events/`, and every event's Add to calendar menu links to it ("Subscribe to all events").
- **Feeds** (`lib/ics.ts`): `/calendar.ics` (every upcoming event plus the last 60 days) and `/calendar/{city}/calendar.ics` for each city with an event in that window. `X-WR-CALNAME`, `X-WR-TIMEZONE:America/Chicago`, `REFRESH-INTERVAL;VALUE=DURATION:PT6H`, `X-PUBLISHED-TTL:PT6H`, a VTIMEZONE block for America/Chicago, CRLF line endings and lines folded at 75 octets. Timed single-day events use local Chicago times; untimed and multi-day events are all-day (the daily time goes in the description). The single-event `event.ics` uses the same code. Absolute URLs use `site.url`, so subscribing only works once the site is live.
- SEO: title "Northwest Arkansas events calendar", its own description, breadcrumbs, an ItemList of the default month's events.

## 12. Search (`components/Search.tsx`, client)

A full-screen dialog on phones (opened by the Search tab), a centred command palette (about 40rem wide, raised surface) on wide screens (opened by the sidebar button and the `/` key). Same component on `/search/`.

- Input with a search icon and a Close or Cancel button. Before typing: "Recent" (from `localStorage` `nwa-recent`, max 5, with Clear) and "Try" (text buttons that run a search: "This weekend", "Free", "New restaurants", "The Momentary", your saved city).
- Fetches `/search-index.json` the first time it opens. Matching: case and accent insensitive, every word must appear in title, summary or meta; title-prefix matches first; upcoming events above past. "this weekend" and "free" act as filters.
- Results grouped: Stories (thumb, headline, date and city; open the story page), Places, Cities, Topics and guides. Arrow keys and Enter (`role="listbox"`), Esc closes. Live count line.
- No results: "Nothing for 'xyz'. Try a city or a place." plus the Try buttons.

## 13. Interaction and motion rules

Refined and quick, never flashy. Every pressable thing answers the pointer, the keyboard and a tap.

- **Every** link, card, button, nav item, chip, filter control, tab and footer link has: a hover state (inside `@media (hover: hover) and (pointer: fine)` only), a visible `:focus-visible` outline (2px limestone, sandstone on filled buttons; cards ring the whole card with `:has(link:focus-visible)`), and an `:active` press (scale 0.94 to 0.99, or a dim for text links).
- **Cards** (feed, carousel, new spots, next story, content cards, story tiles, rows with thumbs): the photo zooms gently (`--zoom` 1.03, `--zoom-thumb` 1.045 on small thumbs, 560ms on `--ease-hover`, a soft ease-out) and the headline warms toward sandstone (`--hover-title`, 200ms). Exit runs the same curve back. Rows take a soft tint (`--hover-tint`) on a layer under the row that runs 0.75rem past the text on both sides, so the row itself never changes. Panel cards and the 404's ways lighten their background.
- **Why v3 felt jittery** (fixed in v4): the image fade rule `html.js img { transition: opacity }` outranked the card rules that added the scale transition, so every photo jumped to its zoom on the frame the pointer arrived (and jumped back on leave) while the headline eased, and the old zoom curve was very sharp. Now the one `img` rule carries both transitions, photo frames are their own stacking context (`isolation: isolate`), and on pointer devices card images keep their compositing layer (`will-change: scale`), so the zoom never re-rasters at its start or end. Hovers change only colour, background colour, opacity, box-shadow and scale; nothing changes size, weight, border or layout, and `npm run qa` (mode `hover`) checks that every card's boxes stay put.
- **Text links**: quiet links (breadcrumbs, meta, byline, footer, See all, sources) have the underline fade in and brighten to limestone; body links (`.link`, prose, facts) carry a faint underline that goes full strength.
- **Sidebar nav**: hover tint; the current page has a tint and the sandstone bar on the left edge, which scales in. Sections open with a height transition, the chevron turns.
- **Segmented controls** (Show, Grid / List, List / Month): one sandstone underline slides to the chosen word (CSS anchor positioning, `anchor-scope` per control); browsers without it draw the underline under each chosen word.
- **Carousel arrows**: round outline buttons with a hover fill and a stronger ring, a dimmed disabled state at each end, hidden when the row fits. "See all" is a quiet text link.
- **Popovers, filter panels, the town picker, the search palette, the More and filter sheets, menus and the toast** enter and exit with `@starting-style` and `transition-behavior: allow-discrete` (opacity plus a short rise, scale or slide; backdrops fade). Nothing jumps.
- **Images fade in** when loaded (320ms) instead of popping: the boot script marks each loaded image (`data-in`, a capturing load listener on `document`), errors and complete images too, so none stays hidden.
- Filter changes and the saved city: view-transition crossfade. Carousel: smooth scroll on arrow buttons, scroll snap.
- Timings: UI 180ms, hover colour and tint 200ms (`--hover-dur`), presses 120ms, image zoom 560ms (`--zoom-dur`), bottom sheets 320ms. Easing: `--ease` for UI and presses, `--ease-hover` (`cubic-bezier(0.33, 1, 0.68, 1)`) for hovers and the zoom. Transitions name their properties; never `all`, never `ease-in`.
- **Reduced motion reduces, never removes**: one reduce block takes out movement only (slides become fades, presses and zooms stay still, the underline jumps instead of sliding, the sidebar bar fades). Fades and colour changes stay.
- No scroll reveals, no parallax. (A scroll-driven section reveal was considered and left out: full-page screenshots and below-the-fold content would start hidden, and the feed already moves enough.)
- **No nested vertical scroll.** Nothing but an intended panel (dialogs, sheets, the search body, filter and town popover bodies, the sticky sidebar) may scroll up and down inside the page. Horizontal rows scroll sideways only. Any aspect-ratio frame that clips a photo sets `min-block-size: 0`: an aspect-ratio box keeps an automatic minimum height, and `overflow: clip` (unlike `hidden`) does not switch it off, so a tall photo stretched its card and the "Coming up" row scrolled up and down inside itself. `npm run qa` checks every page at every width for this.

## 14. Interactions to test and screenshot

Opening a story (a click opens the full page, Back returns, modifier click opens a new tab). The town picker (save a featured and a non-featured town; the filter bar follows). Filters on home, `/news/` and a city page at 1440 and 390: multi-select cities, topic, when, free, remove one, clear all, reload keeps state, shared URL, old `?category=` link, no matches. Things to do: day scroller, filters. Month view: next, previous, Today, select a day, open an event's page, a multi-day event across days, a city filter and its own feed. Phone calendar: tap a day, swipe months. Subscribe links (exact URLs, copy) and the `.ics` feeds (parse, count VEVENTs, one timed and one all-day). Layouts at 1025, 1280, 1440, 1680 and 1920 (no big empty bands, balanced edges). Bottom tab bar and More sheet. Search. Add to calendar menu. Links page at 390. Home and `/events/` at the real date.
