/* =================================================================
   WebGIS — An Index
   - Renders 6 entries from a data array into a <template>
   - Static PNGs for QR and quickview; copy/download via fetch + <a download>
   ================================================================= */

const ENTRIES = [
  {
    id: 'tombolos',
    no: 'N° 01',
    title: 'Tombolos',
    titleItalic: 'of Greece',
    deck: 'Interactive WebGIS for exploring tombolos in Greece and their vulnerability to sea-level rise under RCP climate scenarios.',
    url: 'https://uoa-gr.github.io/Tombolos/',
  },
  {
    id: 'historic-floods',
    no: 'N° 02',
    title: 'Historic Floods',
    titleItalic: 'an open record',
    deck: 'A WebGIS of recorded historic flood events — dates, locations, and sources.',
    url: 'https://historicfloods.org/',
  },
  {
    id: 'beach-rocks',
    no: 'N° 03',
    title: 'Beach Rocks',
    titleItalic: 'of the world',
    deck: 'Interactive WebGIS for exploring the global distribution of beachrocks — coastal sedimentary formations.',
    url: 'https://uoa-gr.github.io/BeachRocks/',
  },
  {
    id: 'coastal-storm-surge',
    no: 'N° 04',
    title: 'Πληγείσες Παράκτιες Περιοχές',
    titleItalic: 'κακοκαιρία Φεβρουαρίου 2026',
    deck: 'WebGIS των πληγεισών παράκτιων περιοχών της κακοκαιρίας Φεβρουαρίου 2026.',
    url: 'https://uoa-gr.github.io/coastal-storm-surge-GR-2026/',
  },
  {
    id: 'lagoons',
    no: 'N° 05',
    title: 'Lagoons',
    titleItalic: 'of Earth',
    deck: 'A WebGIS of the world’s coastal lagoons — their geomorphology, location, and projected vulnerability to sea-level rise under IPCC scenarios.',
    url: 'https://uoa-gr.github.io/Lagoons/',
  },
  {
    id: 'naxos',
    no: 'N° 06',
    title: 'Naxos',
    titleItalic: 'a geomorphological map',
    deck: 'A geomorphological WebGIS of the island of Naxos.',
    url: 'https://uoa-gr.github.io/naxos/',
  },
];

/* Assets follow a fixed pattern; centralised so a future move only edits here. */
const qrPath        = (id)   => `qr/${id}.png`;
const quickviewPath = (file) => `quickviews/${file}`;

/* The PNG filenames for quickviews were authored by hand; map id → file. */
const QUICKVIEW_FILES = {
  'tombolos':            'Tombolos.png',
  'historic-floods':     'HistoricFloods.png',
  'beach-rocks':         'BeachRocks.png',
  'coastal-storm-surge': 'coastal-storm-surge-GR-2026.png',
  'lagoons':             'Lagoons.png',
  'naxos':               'naxos.png',
};

/* ----------------------------- DOM helpers ----------------------------- */

const $  = (sel, root = document) => root.querySelector(sel);

const toast = $('#toast');
let toastTimer = 0;
function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 1800);
}

function flashAction(btn, kind = 'success', label) {
  const cls = `is-${kind}`;
  const original = btn.textContent;
  btn.classList.add(cls);
  if (label) btn.textContent = label;
  setTimeout(() => {
    btn.classList.remove(cls);
    if (label) btn.textContent = original;
  }, 1500);
}

function displayUrl(url) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/* ----------------------------- Render ----------------------------- */

const entriesRoot = $('#entries');
const template = $('#entry-template');
const cardEls = new Map();

ENTRIES.forEach((entry) => {
  const node = template.content.firstElementChild.cloneNode(true);
  node.dataset.id = entry.id;

  const quickview = quickviewPath(QUICKVIEW_FILES[entry.id]);
  const qr = qrPath(entry.id);

  node.querySelector('[data-field="no"]').textContent = entry.no;
  node.querySelector('[data-field="title"]').textContent = entry.title;
  node.querySelector('[data-field="titleItalic"]').textContent = entry.titleItalic;
  node.querySelector('[data-field="deck"]').textContent = entry.deck;

  const link = node.querySelector('[data-field="quickviewLink"]');
  link.href = entry.url;

  const img = node.querySelector('[data-field="quickviewImg"]');
  img.src = quickview;
  img.alt = `Quickview — ${entry.title}`;

  const qrImg = node.querySelector('[data-field="qrImg"]');
  qrImg.src = qr;
  qrImg.alt = `QR code — ${entry.url}`;

  const urlAnchor = node.querySelector('[data-field="url"]');
  urlAnchor.href = entry.url;
  urlAnchor.textContent = displayUrl(entry.url);

  /* Stamp every action target with its entry id and wire native downloads. */
  node.querySelectorAll('[data-act]').forEach((el) => {
    el.dataset.entryId = entry.id;
  });

  const dlQv = node.querySelector('[data-act="download-quickview"]');
  dlQv.href = quickview;
  dlQv.download = `${entry.id}-quickview.png`;

  const dlQr = node.querySelector('[data-act="download-qr"]');
  dlQr.href = qr;
  dlQr.download = `${entry.id}-qr.png`;

  entriesRoot.appendChild(node);
  cardEls.set(entry.id, { node, entry, quickview, qr });
});

/* ----------------------------- Clipboard ----------------------------- */

async function copyText(text) {
  if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
  await navigator.clipboard.writeText(text);
}

async function copyImageAsPng(src) {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Image clipboard unavailable');
  }
  const res = await fetch(src, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Fetch ${src} failed (${res.status})`);
  const blob = await res.blob();
  const png = blob.type === 'image/png'
    ? blob
    : new Blob([await blob.arrayBuffer()], { type: 'image/png' });
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}

/* ----------------------------- Button delegation ----------------------------- */

entriesRoot.addEventListener('click', async (event) => {
  const el = event.target.closest('[data-act]');
  if (!el) return;

  const act = el.dataset.act;
  const id = el.dataset.entryId;
  const rec = cardEls.get(id);
  if (!rec) return;

  try {
    switch (act) {
      case 'copy-link':
        event.preventDefault();
        await copyText(rec.entry.url);
        flashAction(el, 'success', 'Copied');
        showToast('Link copied to clipboard');
        break;

      case 'copy-quickview':
        event.preventDefault();
        await copyImageAsPng(rec.quickview);
        flashAction(el, 'success', 'Copied');
        showToast('Quickview PNG copied');
        break;

      case 'copy-qr':
        event.preventDefault();
        await copyImageAsPng(rec.qr);
        flashAction(el, 'success', 'Copied');
        showToast('QR PNG copied');
        break;

      case 'download-quickview':
        /* Anchor handles the download natively. */
        flashAction(el, 'success', 'Saved');
        showToast('Quickview PNG saved');
        break;

      case 'download-qr':
        /* Anchor handles the download natively. */
        flashAction(el, 'success', 'Saved');
        showToast('QR PNG saved');
        break;
    }
  } catch (err) {
    console.error(err);
    flashAction(el, 'error', 'Failed');
    showToast(err.message || 'Action failed');
  }
});
