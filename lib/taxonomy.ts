// Topics and places: the hub pages that make the site easy to browse and to find in search.
// Client-safe (no fs). Add a place here when it shows up in two or more stories.

export type Topic = { name: string; slug: string; href: string; title: string; h1: string; blurb: string };

// One topic per CMS category. Events has its own page, so its topic link goes there.
export const TOPICS: Topic[] = [
  { name: 'Events', slug: 'events', href: '/events/', title: 'Things to do in Northwest Arkansas', h1: 'Things to do', blurb: 'Festivals, shows, markets and free outings, with the date and place for each.' },
  { name: 'Food & Drink', slug: 'food-and-drink', href: '/topics/food-and-drink/', title: 'Food and drink news in Northwest Arkansas', h1: 'Food and drink', blurb: 'New restaurants, coffee shops, breweries and food events.' },
  { name: 'Arts & Music', slug: 'arts-and-music', href: '/topics/arts-and-music/', title: 'Arts and music in Northwest Arkansas', h1: 'Arts and music', blurb: 'Concerts, shows, screenings and art days around the region.' },
  { name: 'Business', slug: 'business', href: '/topics/business/', title: 'Business news in Northwest Arkansas', h1: 'Business', blurb: 'Shops opening, moving and growing around the region.' },
  { name: 'Development', slug: 'development', href: '/topics/development/', title: 'Development and roadwork in Northwest Arkansas', h1: 'Development and roadwork', blurb: 'What is being built, proposed or repaved, and how it affects your drive.' },
  { name: 'Outdoors', slug: 'outdoors', href: '/topics/outdoors/', title: 'Outdoors in Northwest Arkansas', h1: 'Outdoors', blurb: 'Gardens, trails, parks and outdoor events.' },
  { name: 'News', slug: 'news', href: '/topics/news/', title: 'Local news in Northwest Arkansas', h1: 'Local news', blurb: 'Everything else worth knowing around town.' },
];
export const topicByName = (name: string) => TOPICS.find((t) => t.name === name);
export const topicBySlug = (slug: string) => TOPICS.find((t) => t.slug === slug);

export type Place = { slug: string; name: string; city: string; blurb: string; match: RegExp[] };

// Venues that come up again and again. A story belongs to the first place whose pattern it matches.
export const PLACES: Place[] = [
  { slug: 'the-momentary', name: 'The Momentary', city: 'Bentonville', blurb: 'Contemporary art, music and food in a former cheese plant, including RØDE House and Fermentation Hall.', match: [/momentary/i, /r[øo]de house/i, /fermentation hall/i] },
  { slug: 'walton-arts-center', name: 'Walton Arts Center', city: 'Fayetteville', blurb: 'The performing arts center on Dickson Street, plus its Nadine Baum Studios.', match: [/walton ?arts ?center/i, /nadine baum/i] },
  { slug: 'bentonville-square', name: 'Bentonville Square', city: 'Bentonville', blurb: 'The downtown square, home to First Friday and Movie Nights.', match: [/bentonville square/i, /downtownbentonville/i] },
  { slug: 'fayetteville-square', name: 'Fayetteville Square', city: 'Fayetteville', blurb: 'The downtown square and its farmers market, crawls and festivals.', match: [/fayetteville square/i] },
  { slug: 'ozark-music-hall', name: 'Ozark Music Hall', city: 'Fayetteville', blurb: 'Concert hall on North Steele Boulevard.', match: [/ozark ?music ?hall/i] },
  { slug: 'botanical-garden-of-the-ozarks', name: 'Botanical Garden of the Ozarks', city: 'Fayetteville', blurb: 'Gardens and events on Crossover Road.', match: [/botanical garden of the ozarks/i] },
  { slug: 'the-jones-center', name: 'The Jones Center', city: 'Springdale', blurb: 'Pool, ice rink and community space on Emma Avenue.', match: [/jones ?center/i] },
];
export const placeBySlug = (slug: string) => PLACES.find((p) => p.slug === slug);
