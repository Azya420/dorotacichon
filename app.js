const PDF_URL = 'portfolio.pdf';
const FALLBACK_TOTAL_PAGES = 58;

const projects = [
  {
    number: '01',
    title: 'Sea Echo',
    type: 'Bachelor’s Thesis & Competition',
    pages: '4-13',
    startPage: 4,
    thumb: 5,
    description: 'A year-round seaside resort inspired by the rhythm and sound of sea waves, organic architectural form, CLT timber panels, and green roof topography.'
  },
  {
    number: '02',
    title: 'Neighborhood Fabric',
    type: 'Competition',
    pages: '14-21',
    startPage: 14,
    thumb: 15,
    description: 'A mixed-use urban proposal for a former university campus in Philadelphia, organized around Live, Play, Work, and Connect.'
  },
  {
    number: '03',
    title: 'Gardens Next Door',
    type: 'Student Project',
    pages: '22-29',
    startPage: 22,
    thumb: 22,
    description: 'A student project exploring residential, communal, and landscape relationships through a garden-based spatial concept.'
  },
  {
    number: '04',
    title: 'Beco das Artes',
    type: 'Student Project & Competition',
    pages: '30-35',
    startPage: 30,
    thumb: 30,
    description: 'A competition and student project focused on architecture, culture, and the transformation of an artistic urban environment.'
  },
  {
    number: '05',
    title: 'NSU BRA Canopy',
    type: 'Competition',
    pages: '36-41',
    startPage: 36,
    thumb: 36,
    description: 'A canopy proposal developed for a competition, emphasizing structure, shade, and a clear architectural gesture.'
  },
  {
    number: '06',
    title: 'Windberg',
    type: 'Competition',
    pages: '42-47',
    startPage: 42,
    thumb: 42,
    description: 'A competition project with a compact architectural idea shaped by environmental forces and expressive form.'
  },
  {
    number: '07',
    title: 'Where Boundaries Fade',
    type: 'Master’s Thesis',
    pages: '48-57',
    startPage: 48,
    thumb: 48,
    description: 'An architecture of coexistence based on mycelium and bioactive air filtration, connecting spatial design with environmental systems.'
  }
];

const leftPage = document.getElementById('leftPage');
const rightPage = document.getElementById('rightPage');
const pageStatus = document.getElementById('pageStatus');
const pdfNote = document.getElementById('pdfNote');
const flipLayer = document.getElementById('flipLayer');
const flipImage = document.getElementById('flipImage');
const pageInput = document.getElementById('pageInput');
const projectGrid = document.getElementById('projectGrid');
const firstBtn = document.getElementById('firstBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const jumpBtn = document.getElementById('jumpBtn');

let pdfDoc = null;
let totalPages = FALLBACK_TOTAL_PAGES;
let currentStart = 1;
let isAnimating = false;
const pageCache = new Map();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setControls(enabled) {
  [firstBtn, prevBtn, nextBtn, pageInput, jumpBtn].forEach((element) => {
    element.disabled = !enabled;
  });
}

function spreadStartFor(page) {
  const safePage = clamp(Number(page) || 1, 1, totalPages);
  const start = safePage % 2 === 0 ? safePage - 1 : safePage;
  return clamp(start, 1, Math.max(1, totalPages - 1));
}

function renderPageImage(pageNumber, targetWidth = 1600) {
  if (pageCache.has(pageNumber)) return pageCache.get(pageNumber);

  const promise = pdfDoc.getPage(pageNumber).then((page) => {
    const viewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });

    canvas.width = Math.floor(scaledViewport.width);
    canvas.height = Math.floor(scaledViewport.height);

    return page.render({ canvasContext: context, viewport: scaledViewport }).promise.then(() => {
      return canvas.toDataURL('image/webp', 0.88);
    });
  });

  pageCache.set(pageNumber, promise);
  return promise;
}

async function setImage(img, pageNumber, pageSide) {
  if (pageNumber > totalPages) {
    img.removeAttribute('src');
    img.alt = `${pageSide} blank page`;
    return;
  }

  img.alt = `Portfolio page ${pageNumber}`;
  img.src = await renderPageImage(pageNumber);
}

function preloadAround(start) {
  [start - 2, start - 1, start + 2, start + 3, start + 4].forEach((page) => {
    if (page >= 1 && page <= totalPages) renderPageImage(page, 1200);
  });
}

async function renderSpread() {
  const right = Math.min(currentStart + 1, totalPages);
  pageStatus.textContent = `Loading pages ${currentStart}-${right}…`;
  await Promise.all([
    setImage(leftPage, currentStart, 'Left'),
    setImage(rightPage, right, 'Right')
  ]);
  pageStatus.textContent = `Pages ${currentStart}-${right} of ${totalPages}`;
  pageInput.value = currentStart;
  preloadAround(currentStart);
}

async function turnTo(targetStart, direction = 'next') {
  targetStart = spreadStartFor(targetStart);
  if (isAnimating || targetStart === currentStart) return;

  isAnimating = true;
  setControls(false);
  const sourceImage = direction === 'next' ? rightPage : leftPage;
  if (sourceImage.src) flipImage.src = sourceImage.src;
  flipLayer.className = `flip-layer ${direction}`;

  currentStart = targetStart;
  await renderSpread();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => flipLayer.classList.add('active'));
  });

  window.setTimeout(() => {
    flipLayer.className = 'flip-layer';
    flipImage.removeAttribute('src');
    isAnimating = false;
    setControls(true);
  }, 820);
}

function nextSpread() {
  if (currentStart + 2 <= totalPages) turnTo(currentStart + 2, 'next');
}

function prevSpread() {
  if (currentStart - 2 >= 1) turnTo(currentStart - 2, 'prev');
}

function openPage(page) {
  const target = spreadStartFor(page);
  const direction = target > currentStart ? 'next' : 'prev';
  turnTo(target, direction);
  document.getElementById('book').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildProjectCards() {
  projectGrid.innerHTML = projects.map((project) => `
    <article class="project-card">
      <div class="project-thumb">
        <img data-pdf-thumb="${project.thumb}" alt="Preview of ${project.title}" />
      </div>
      <div class="project-body">
        <div class="project-meta">
          <span class="project-number">${project.number}</span>
          <span>Pages ${project.pages}</span>
        </div>
        <h3>${project.title}</h3>
        <p>${project.type}</p>
        <p>${project.description}</p>
        <button type="button" data-page="${project.startPage}" disabled>Open in book</button>
      </div>
    </article>
  `).join('');

  projectGrid.querySelectorAll('button[data-page]').forEach((button) => {
    button.addEventListener('click', () => openPage(Number(button.dataset.page)));
  });
}

async function loadThumbnails() {
  const thumbs = [...projectGrid.querySelectorAll('img[data-pdf-thumb]')];
  await Promise.all(thumbs.map(async (img) => {
    const page = Number(img.dataset.pdfThumb);
    img.src = await renderPageImage(page, 800);
  }));
  projectGrid.querySelectorAll('button[data-page]').forEach((button) => {
    button.disabled = false;
  });
}

async function init() {
  buildProjectCards();
  setControls(false);

  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    pdfDoc = await pdfjsLib.getDocument(PDF_URL).promise;
    totalPages = pdfDoc.numPages;
    pageInput.max = totalPages;
    pdfNote.innerHTML = `Loaded <strong>${totalPages}</strong> pages from <strong>${PDF_URL}</strong>.`;
    await renderSpread();
    setControls(true);
    loadThumbnails();
  } catch (error) {
    console.error(error);
    pageStatus.textContent = 'Portfolio PDF could not be loaded.';
    pdfNote.classList.add('error');
    pdfNote.innerHTML = 'Upload the optimized file as <strong>portfolio.pdf</strong> to the repository root, then refresh this page.';
  }
}

nextBtn.addEventListener('click', nextSpread);
prevBtn.addEventListener('click', prevSpread);
firstBtn.addEventListener('click', () => turnTo(1, 'prev'));
jumpBtn.addEventListener('click', () => openPage(Number(pageInput.value)));

pageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') openPage(Number(pageInput.value));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') nextSpread();
  if (event.key === 'ArrowLeft') prevSpread();
});

window.addEventListener('load', init);
