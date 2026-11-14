const byId = id => document.getElementById(id);
const start = byId('startDate');
const end = byId('endDate');
const gallery = byId('gallery');
const dialog = byId('detail');
const statusLine = byId('status');
const day = 86400000;
const iso = value => new Date(value).toISOString().slice(0, 10);
const code = date => date.slice(2).replaceAll('-', '');
const archivePage = date => 'https://apod.nasa.gov/apod/ap' + code(date) + '.html';
const formatDate = date => new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
}).format(new Date(date + 'T00:00:00Z'));

const facts = [
  'Sunlight takes about eight minutes to reach Earth.',
  'A light-year measures distance: how far light travels in one year.',
  'On Venus, one rotation takes longer than one orbit around the Sun.',
  'The Moon keeps nearly the same face pointed toward Earth throughout its orbit.'
];
byId('fact').textContent = facts[Math.floor(Math.random() * facts.length)];

// An archive selection stays browsable while the live API is loading.
const featured = [
 ['Virgo Cluster Galaxies','Daniel Adibi','LRGB_final_corrected2048.jpg','Many of these faint smudges are separate galaxies in the Virgo Cluster. Their differing shapes stand out against a foreground of stars in our own galaxy.'],
 ['Comet C/2025 F2 SWAN','Dan Bartlett','C2025_F2SWAN_20250414_DEBartlett.jpg','A long, slender tail stretches away from this comet. Sunlight and the solar wind act on material released as the comet warms.'],
 ['Painting with Jupiter','NASA / JPL-Caltech / SwRI / MSSS · Processing by Rick Lundh','PIA21983JupiterLundh.jpg','JunoCam recorded these swirling clouds in Jupiter’s atmosphere. Color processing reveals fine structure along the edges of the storms.'],
 ['The Orion Nebula in Visible and Infrared','NASA / Spitzer Space Telescope and Oliver Czernetz / Siding Spring Observatory','M42_SpitzerCzernetz_2000.jpg','Two views of Orion reveal different parts of this stellar nursery. Visible light shows glowing gas, while infrared observations trace dust in the clouds where stars form.'],
 ['Galaxy Lenses Galaxy from Webb','ESA/Webb, NASA, CSA and G. Mahler','GalaxiesLens_Webb_1146.jpg','The gravity of a foreground galaxy bends light coming from a more distant galaxy. Their alignment stretches the background galaxy into a bright ring.'],
 ['Terminator Moon: A Moonscape of Shadows','Rich Addis','TerminatorMoon_Addis_3558.jpg','Along the boundary between lunar day and night, sunlight strikes the surface at a low angle. Long shadows make crater rims and mountains easier to see.'],
 ['An Almost Everything Sky','Koen van Barneveld','EverythingSky_Koen_960.jpg','Ten exposures taken from a single spot at Castle Hill, New Zealand, bring together the Milky Way, a meteor, zodiacal light and an auroral glow.'],
 ["NGC 6164: A Dragon’s Egg",'Daniel Stern','NGC_6164_r4_1024.jpg','Lobes of glowing gas extend on opposite sides of the central star system. Fainter material around the bright nebula records an earlier stage in its history.'],
 ['Asteroid Donaldjohanson','Lucy / NASA / Goddard / SwRI / Johns Hopkins APL / NOIRLab','final_0798443319_dec.png','NASA’s Lucy spacecraft photographed this elongated asteroid during its April 2025 flyby. Its two lobes suggest that smaller bodies once joined together.']
].map(([title, credit, file, explanation], i) => {
  const date = '2025-04-' + (17 + i);
  const hd = 'https://www.oa.uj.edu.pl/apod/apod/image/2504/' + file;
  return { date, title, credit, explanation, hd, image: i < 6 ? 'img/apod-' + (17 + i) + '.webp' : hd, page: archivePage(date) };
});

function safeURL(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href.replace(/^http:/, 'https:') : '';
  } catch { return ''; }
}
function plain(value) {
  const template = document.createElement('template');
  template.innerHTML = String(value || '').replace(/<\/p>/gi, ' </p>');
  return template.content.textContent.trim();
}
function normalize(entry) {
  const item = {...entry, ...entry.meta};
  const date = String(item.date || '').slice(0, 10);
  const video = /video|iframe/i.test(item.media_type);
  const url = safeURL(item.url);
  const hd = safeURL(item.hdurl);
  const permalink = safeURL(item.permalink);
  const legacyImage = !video && !permalink && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
  return {date, title:plain(item.title?.rendered || item.title).replace(/^APOD:\s*\d{4}.*?\s[–-]\s/, ''),
    explanation:plain(item.explanation), credit:plain(item.copyright || item.credit),
    video, hd:hd || (legacyImage ? url : ''), image:video ? safeURL(item.thumbnail_url) || hd : (legacyImage ? url : hd),
    page:permalink || archivePage(date), play:permalink || url || archivePage(date)};
}
function imageFor(parent, source, alt, fallback, message) {
  if (!source) { parent.textContent = message; return; }
  const img = new Image();
  img.alt = alt;
  img.onerror = () => {
    if (fallback && img.getAttribute('src') !== fallback) { img.src = fallback; return; }
    parent.textContent = message;
  };
  img.src = source;
  parent.append(img);
}
function showDetail(item) {
  const media = byId('media');
  media.replaceChildren();
  if (item.video) {
    const link = document.createElement('a');
    link.href = item.play; link.target = '_blank'; link.rel = 'noopener';
    link.textContent = '▶ Watch the featured video ↗'; media.append(link);
  } else imageFor(media, item.hd || item.image, item.title, item.image, 'Original image available through the archive link below.');
  byId('detail-title').textContent = item.title;
  byId('detail-date').textContent = formatDate(item.date);
  byId('explanation').textContent = item.explanation;
  byId('credit').textContent = item.credit;
  byId('original').href = item.page;
  dialog.showModal();
}
function render(items) {
  const cards = items.map(item => {
    const button = document.createElement('button');
    button.className = 'card';
    const visual = document.createElement('span'); visual.className = 'visual';
    const preview = featured.find(photo => photo.date === item.date)?.image;
    imageFor(visual, item.image, '', preview, item.video ? '▶  Video entry' : 'Open archive entry ↗');
    const caption = document.createElement('span'); caption.className = 'caption';
    const title = document.createElement('b'); title.textContent = item.title;
    const date = document.createElement('time'); date.dateTime = item.date;
    date.textContent = formatDate(item.date) + (item.video ? ' · VIDEO' : '');
    caption.append(date, title); button.append(visual, caption);
    button.onclick = () => showDetail(item);
    return button;
  });
  gallery.replaceChildren(...cards);
  byId('count').textContent = items.length ? String(items.length).padStart(2,'0') + ' ENTRIES' : '';
}
let requestNumber = 0;
let controller;
async function load() {
  const request = ++requestNumber;
  controller?.abort(); controller = new AbortController();
  const signal = controller.signal;
  const first = start.value, last = end.value;
  const saved = featured.filter(item => item.date >= first && item.date <= last);
  render(saved);
  statusLine.textContent = 'Loading space images…';
  const queries = [
    'https://science.nasa.gov/wp-json/wp/v2/apod-basic?' + new URLSearchParams({date_from:code(first),date_to:code(last),per_page:'9'}),
    'https://api.nasa.gov/planetary/apod?' + new URLSearchParams({start_date:first,end_date:last,api_key:'DEMO_KEY',thumbs:'true'})
  ];
  for (const url of queries) {
    try {
      const response = await fetch(url, {signal:AbortSignal.any([signal, AbortSignal.timeout(8500)])});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const payload = await response.json();
      const records = Array.isArray(payload) ? payload : payload.items || payload.posts || payload.data || [payload];
      const dates = new Map();
      for (const entry of records.map(normalize)) {
        if (entry.date >= first && entry.date <= last && entry.title) dates.set(entry.date, entry);
      }
      if (!dates.size) throw new Error('No entries in range');
      if (request !== requestNumber) return;
      const items = [...dates.values()].sort((a,b) => a.date.localeCompare(b.date));
      render(items);
      statusLine.textContent = items.length === 9 ? '' : 'NASA returned ' + items.length + ' of the nine requested dates.';
      return;
    } catch { if (signal.aborted || request !== requestNumber) return; }
  }
  statusLine.textContent = saved.length ? 'NASA’s live feed is unavailable. Showing saved archive entries for these dates.' : 'NASA’s feed could not be reached. Try Get Space Images again, or explore April 17–25, 2025.';
}
byId('close').onclick = () => dialog.close();
dialog.addEventListener('click', event => { if (event.target === dialog) {
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
}});
setupDateInputs(start,end);
start.value = featured[0].date; end.value = featured[8].date;
// Capture empty changes before the unmodified starter date helper.
start.addEventListener('change', event => { if (!start.value) event.stopImmediatePropagation(); }, true);
function syncRange(anchor) {
  if (!anchor.value || !anchor.validity.valid) return;
  const first = anchor === start ? anchor.valueAsNumber : anchor.valueAsNumber - 8 * day;
  start.value = iso(Math.max(Date.parse(earliestDate), Math.min(Date.parse(today) - 8 * day, first)));
  end.value = iso(start.valueAsNumber + 8 * day);
}
for (const input of [start,end]) input.addEventListener('change', () => syncRange(input));
byId('filters').onsubmit = event => { event.preventDefault(); syncRange(start); load(); };
load();
