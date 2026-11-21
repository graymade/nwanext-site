// The towns page map, drawn like a print map of the two counties we cover.
// World coordinates: x = lon scaled for latitude, y = lat, 1000 units a degree.
// County outlines: us-atlas counties-10m (U.S. Census, public domain), extracted to lib/brand/nwa-counties.json; corners are
// rounded so the counties read as shapes, not survey lines. State lines: us-atlas states-10m. I-49 is drawn through the towns it
// links and Beaver Lake is hand-placed: both stylized, not survey accurate. site.js sizes labels and markers in screen pixels,
// places labels so none collide, and drives the town card.
import TOPO_RAW from '../brand/us-states-10m.json';
import COUNTY_RAW from '../brand/nwa-counties.json';
import { getPhotos } from '../content';
import { CITIES, F0, blob, cityUrl, esc, smooth, type V } from './kit';

type Topo = { arcs: number[][][]; transform: { scale: number[]; translate: number[] }; objects: { states: { geometries: { type: string; arcs: number[][] | number[][][]; properties: { name: string } }[] } } };
const TOPO = TOPO_RAW as unknown as Topo;
const COUNTY = COUNTY_RAW as unknown as Record<string, { name: string; rings: number[][][] }>;
const KX = Math.cos((36 * Math.PI) / 180);
const wp = ([lon, lat]: number[]) => [+((lon + 95) * KX * 1000).toFixed(1), +((37 - lat) * 1000).toFixed(1)] as [number, number];
const ARCS = TOPO.arcs.map((a) => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * TOPO.transform.scale[0] + TOPO.transform.translate[0], y * TOPO.transform.scale[1] + TOPO.transform.translate[1]]; }); });
const ringPts = (r: number[]) => r.flatMap((i, k) => { const a = i < 0 ? ARCS[~i].slice().reverse() : ARCS[i]; return k ? a.slice(1) : a; });
const stateD = (name: string) => {
  const g = TOPO.objects.states.geometries.find((x) => x.properties.name === name)!;
  const polys = (g.type === 'Polygon' ? [g.arcs] : g.arcs) as number[][][];
  return polys.map((poly) => poly.map((r) => 'M' + ringPts(r).map(wp).map((p) => p.join(' ')).join('L') + 'Z').join('')).join('');
};
// A closed outline with its corners rounded (radius r in map units): straight edges stay straight.
const rounded = (pts: [number, number][], r: number) => {
  const P = pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.5);
  if (Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) < 0.5) P.pop();
  const n = P.length, f = (v: number) => v.toFixed(1);
  const cut = (a: [number, number], b: [number, number], d: number) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = Math.min(d, L / 2) / L; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
  let d = '';
  for (let i = 0; i < n; i++) { const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], a = cut(p1, p0, r), b = cut(p1, p2, r);
    d += `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}Q${f(p1[0])} ${f(p1[1])} ${f(b[0])} ${f(b[1])}`; }
  return d + 'Z';
};
const countyD = (id: string, r = 14) => COUNTY[id].rings.map((ring) => rounded(ring.map(wp), r)).join('');
const rectOf = (a: number[], b: number[]) => { const [x0, y0] = wp(a), [x1, y1] = wp(b); return [x0, y0, +(x1 - x0).toFixed(1), +(y1 - y0).toFixed(1)]; };
const VIEWS = { nwa: rectOf([-94.68, 36.545], [-93.79, 35.725]), core: rectOf([-94.63, 36.53], [-93.83, 35.735]) };
const TIER: Record<string, number> = { Bentonville: 1, Rogers: 1, Springdale: 1, Fayetteville: 1, Farmington: 1, 'Bella Vista': 2, 'Siloam Springs': 2, Centerton: 2, Lowell: 2, 'Pea Ridge': 2, 'Prairie Grove': 2 };
// Beaver Lake: the main channel from the dam near Eureka Springs down past Rogers and Lowell to the War Eagle and White River arms.
const LAKE = [[-93.85, 36.425], [-93.9, 36.405], [-93.95, 36.375], [-94.0, 36.362], [-94.055, 36.345], [-94.02, 36.325], [-93.975, 36.3], [-93.995, 36.262], [-94.02, 36.236], [-93.98, 36.214], [-93.955, 36.172], [-93.935, 36.125]];
const ARM = [[-94.0, 36.27], [-93.96, 36.25], [-93.92, 36.215], [-93.9, 36.18]];
// I-49 from the Missouri line past Bella Vista, through Bentonville, Rogers, Lowell, Springdale and Fayetteville, then south.
const I49 = [[-94.36, 36.545], [-94.3, 36.47], [-94.24, 36.42], [-94.205, 36.37], [-94.175, 36.33], [-94.155, 36.28], [-94.15, 36.23], [-94.16, 36.17], [-94.175, 36.115], [-94.2, 36.06], [-94.205, 36.0], [-94.17, 35.93], [-94.13, 35.84], [-94.1, 35.72]];

export type Counts = { ev: number; sp: number; nw: number };
export const townData = (counts: (name: string) => Counts) => CITIES().map((c) => {
  const ph = getPhotos().find((p) => p.city === c.name);
  return { n: c.name, s: c.slug, u: cityUrl(c.name), co: c.county, i: c.intro, ...counts(c.name), ph: ph ? { src: ph.src.replace(/\.[^.]+$/, '-800.webp'), alt: ph.caption } : null };
});

const band = (pts: number[][], w0: number, w1: number) => {
  const cl = pts.map(wp);
  const side = (sgn: number) => cl.map(([x, y], i) => { const [a, b] = [cl[Math.max(0, i - 1)], cl[Math.min(cl.length - 1, i + 1)]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, w = w0 + w1 * Math.sin((Math.PI * (i + 0.5)) / cl.length); return [x - (sgn * dy * w) / L, y + (sgn * dx * w) / L] as [number, number]; });
  return smooth([...side(1), ...side(-1).reverse()]);
};

export function townMap(counts: (name: string) => Counts) {
  const road = (() => { const p = I49.map(wp); let d = `M${p[0].join(' ')}`; for (let i = 0; i < p.length - 1; i++) { const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], e = p[Math.min(p.length - 1, i + 2)];
    d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0]} ${c[1]}`; } return d; })();
  const towns = CITIES().map((c) => ({ c, t: TIER[c.name] || 3, n: counts(c.name) })).sort((a, b) => b.t - a.t); // small ones first, so big ones draw on top
  const NEAR = ['05015', '05087', '05033', '05047', '40041', '40001', '40135', '29119', '29009'];
  return `<svg class="tsvg" viewBox="${VIEWS.nwa.join(' ')}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Map of the towns in Benton and Washington counties" data-views='${JSON.stringify(VIEWS)}'>
<defs><radialGradient id="nfade" gradientUnits="userSpaceOnUse" cx="${wp([-94.2, 36.13])[0]}" cy="${wp([-94.2, 36.13])[1]}" r="540"><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="nmask" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><rect x="-2000" y="-2000" width="6000" height="6000" fill="url(#nfade)"/></mask></defs>
<g class="near" mask="url(#nmask)">${NEAR.map((id) => `<path d="${countyD(id, 10)}"/>`).join('')}</g>
<path class="cty be" d="${countyD('05007')}"/><path class="cty wa" d="${countyD('05143')}"/>
<path class="lake" d="${band(LAKE, 3.5, 7)}"/><path class="lake" d="${band(ARM, 2, 3.5)}"/>
<path class="stl" mask="url(#nmask)" d="${stateD('Arkansas')}"/>
<path class="i49 cas" d="${road}"/><path class="i49" d="${road}"/>
<text class="st nm" data-at="-94.75,36.06" data-rot="-90">Oklahoma</text><text class="st nm" data-at="-94.08,36.528">Missouri</text>
<text class="st cl be" data-at="-94.59,36.47" data-anchor="start">Benton County</text><text class="st cl wa" data-at="-94.5,35.775" data-anchor="start">Washington County</text>
<text class="st lk" data-at="-93.985,36.395">Beaver Lake</text><text class="st rd" data-at="-94.215,35.965" data-anchor="end">I-49</text>
<path class="mfollow" d=""/>
${towns.map(({ c, t, n }) => { const [x, y] = wp([c.lon, c.lat]), all = n.ev + n.sp + n.nw;
  return `<a href="${cityUrl(c.name)}" class="mc t${t} ${all ? 'has' : ''}" data-town="${esc(c.name)}" data-x="${x}" data-y="${y}" aria-label="${esc(c.name)}${all ? `, ${all} ${all === 1 ? 'story' : 'stories'}` : ''}"><g class="mk" transform="translate(${x} ${y})"><path d="${smooth(blob(0, 0, 115, 85, 2.4, F0, (x % 7) * 0.4))}"/></g><text x="${x + 14}" y="${y + 8}">${esc(c.name)}</text></a>`; }).join('')}
</svg>`;
}
export const countsOf = (up: V[], openings: V[], news: V[]) => (name: string): Counts => ({ ev: up.filter((v) => v.city === name).length, sp: openings.filter((v) => v.city === name).length, nw: news.filter((v) => v.city === name).length });
