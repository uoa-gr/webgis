/* =================================================================
   WebGIS — An Index
   - Renders 6 entries from a data array into an <template>
   - Generates a QR code per entry into a <canvas>
   - Wires up copy/download for link / quickview PNG / QR PNG
   ================================================================= */

const ENTRIES = [
  {
    id: 'tombolos',
    no: 'N° 01',
    title: 'Tombolos',
    titleItalic: 'of Greece',
    deck: 'Interactive WebGIS for exploring tombolos in Greece and their vulnerability to sea-level rise under RCP climate scenarios.',
    url: 'https://uoa-gr.github.io/Tombolos/',
    quickview: 'quickviews/Tombolos.png',
  },
  {
    id: 'historic-floods',
    no: 'N° 02',
    title: 'Historic Floods',
    titleItalic: 'an open record',
    deck: 'A WebGIS of recorded historic flood events — dates, locations, and sources.',
    url: 'https://historicfloods.org/',
    quickview: 'quickviews/HistoricFloods.png',
  },
  {
    id: 'beach-rocks',
    no: 'N° 03',
    title: 'Beach Rocks',
    titleItalic: 'of the world',
    deck: 'Interactive WebGIS for exploring the global distribution of beachrocks — coastal sedimentary formations.',
    url: 'https://uoa-gr.github.io/BeachRocks/',
    quickview: 'quickviews/BeachRocks.png',
  },
  {
    id: 'coastal-storm-surge',
    no: 'N° 04',
    title: 'Πληγείσες Παράκτιες Περιοχές',
    titleItalic: 'κακοκαιρία Φεβρουαρίου 2026',
    deck: 'WebGIS των πληγεισών παράκτιων περιοχών της κακοκαιρίας Φεβρουαρίου 2026.',
    url: 'https://uoa-gr.github.io/coastal-storm-surge-GR-2026/',
    quickview: 'quickviews/coastal-storm-surge-GR-2026.png',
  },
  {
    id: 'lagoons',
    no: 'N° 05',
    title: 'Lagoons',
    titleItalic: 'of Earth',
    deck: 'A WebGIS of the world’s coastal lagoons — their geomorphology, location, and projected vulnerability to sea-level rise under IPCC scenarios.',
    url: 'https://uoa-gr.github.io/Lagoons/',
    quickview: 'quickviews/Lagoons.png',
  },
  {
    id: 'naxos',
    no: 'N° 06',
    title: 'Naxos',
    titleItalic: 'a geomorphological map',
    deck: 'A geomorphological WebGIS of the island of Naxos.',
    url: 'https://uoa-gr.github.io/naxos/',
    quickview: 'quickviews/naxos.png',
  },
];

/* ----------------------------- DOM helpers ----------------------------- */

const $   = (sel, root = document) => root.querySelector(sel);
const $$  = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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

  node.querySelector('[data-field="no"]').textContent = entry.no;
  node.querySelector('[data-field="title"]').textContent = entry.title;
  node.querySelector('[data-field="titleItalic"]').textContent = entry.titleItalic;
  node.querySelector('[data-field="deck"]').textContent = entry.deck;

  const url = entry.url;

  const link = node.querySelector('[data-field="quickviewLink"]');
  link.href = url;

  const img = node.querySelector('[data-field="quickviewImg"]');
  img.src = entry.quickview;
  img.alt = `Quickview — ${entry.title}`;

  const urlAnchor = node.querySelector('[data-field="url"]');
  urlAnchor.href = url;
  urlAnchor.textContent = displayUrl(url);

  node.querySelectorAll('[data-act]').forEach((btn) => {
    btn.dataset.entryId = entry.id;
  });

  const dlQv = node.querySelector('[data-act="download-quickview"]');
  dlQv.href = entry.quickview;
  dlQv.download = `${entry.id}-quickview.png`;

  entriesRoot.appendChild(node);
  cardEls.set(entry.id, { node, entry, qrCanvas: null });
});

/* ----------------------------- QR generation ----------------------------- */

/* High-res canvas (good for printing). Frame sets the display size; the
   intrinsic resolution stays sharp on Retina and produces a crisp PNG. */
const QR_PIXELS = 720;

function generateQR(entry, holder) {
  if (typeof QRious === 'undefined') {
    console.error('QRious lib not loaded — QR for', entry.id, 'unavailable');
    holder.textContent = 'QR unavailable';
    return;
  }
  try {
    const canvas = document.createElement('canvas');
    new QRious({
      element: canvas,
      value: entry.url,
      size: QR_PIXELS,
      level: 'M',
      background: '#ffffff',
      foreground: '#000000',
      padding: 16,
    });
    holder.appendChild(canvas);
    const rec = cardEls.get(entry.id);
    if (rec) rec.qrCanvas = canvas;
  } catch (err) {
    console.error('QR generation failed for', entry.id, err);
    holder.textContent = 'QR unavailable';
  }
}

ENTRIES.forEach((entry) => {
  const rec = cardEls.get(entry.id);
  const holder = rec.node.querySelector('[data-field="qrFrame"]');
  generateQR(entry, holder);
});

/* ----------------------------- Clipboard / download ----------------------------- */

async function copyText(text) {
  if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
  await navigator.clipboard.writeText(text);
}

async function copyBlobAsPng(blob) {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Image clipboard unavailable');
  }
  const png = blob.type === 'image/png'
    ? blob
    : new Blob([await blob.arrayBuffer()], { type: 'image/png' });
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas conversion failed'));
    }, 'image/png');
  });
}

async function fetchAsBlob(src) {
  const res = await fetch(src, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Fetch ${src} failed (${res.status})`);
  return res.blob();
}

/* ----------------------------- Button delegation ----------------------------- */

entriesRoot.addEventListener('click', async (event) => {
  const btn = event.target.closest('[data-act]');
  if (!btn) return;

  const act = btn.dataset.act;
  const id = btn.dataset.entryId;
  const rec = cardEls.get(id);
  if (!rec) return;
  const { entry } = rec;

  try {
    switch (act) {
      case 'copy-link':
        event.preventDefault();
        await copyText(entry.url);
        flashAction(btn, 'success', 'Copied');
        showToast('Link copied to clipboard');
        break;

      case 'copy-quickview': {
        event.preventDefault();
        const blob = await fetchAsBlob(entry.quickview);
        await copyBlobAsPng(blob);
        flashAction(btn, 'success', 'Copied');
        showToast('Quickview PNG copied');
        break;
      }

      case 'download-quickview':
        /* Anchor handles the download natively; just flash for UX. */
        flashAction(btn, 'success', 'Saved');
        showToast('Quickview PNG saved');
        break;

      case 'copy-qr': {
        event.preventDefault();
        if (!rec.qrCanvas) throw new Error('QR not ready');
        const blob = await canvasToBlob(rec.qrCanvas);
        await copyBlobAsPng(blob);
        flashAction(btn, 'success', 'Copied');
        showToast('QR PNG copied');
        break;
      }

      case 'download-qr': {
        event.preventDefault();
        if (!rec.qrCanvas) throw new Error('QR not ready');
        const blob = await canvasToBlob(rec.qrCanvas);
        downloadBlob(blob, `${entry.id}-qr.png`);
        flashAction(btn, 'success', 'Saved');
        showToast('QR PNG saved');
        break;
      }
    }
  } catch (err) {
    console.error(err);
    flashAction(btn, 'error', 'Failed');
    showToast(err.message || 'Action failed');
  }
});
