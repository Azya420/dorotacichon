const PDF_URL = 'portfolio.pdf';
const INSERTED_BLANK_AFTER_COVER = 2;
const FALLBACK_PDF_PAGES = 58;

const projects = [
  {
    number: '01',
    title: 'Sea Echo',
    type: 'Bachelor’s Thesis & Competition',
    pages: '4–13',
    startPdfPage: 4,
    thumbPdfPage: 5,
    description: 'A seaside resort for the Silesian University of Technology inspired by sea waves, sound recordings, organic form, CLT timber panels, and a green roof landscape.'
  },
  {
    number: '02',
    title: 'Neighborhood Fabric',
    type: 'Competition',
    pages: '14–21',
    startPdfPage: 14,
    thumbPdfPage: 15,
    description: 'A Grand Prix urban design proposal transforming a former university campus in Philadelphia into a mixed-use district organized around Live, Play, Work, and Connect.'
  },
  {
    number: '03',
    title: 'Gardens Next Door',
    type: 'Student Project',
    pages: '22–29',
    startPdfPage: 22,
    thumbPdfPage: 23,
    description: 'A student project exploring residential life, shared greenery, and the relationship between everyday domestic spaces and garden-based urban structure.'
  },
  {
    number: '04',
    title: 'Beco das Artes',
    type: 'Student Project & Competition',
    pages: '30–35',
    startPdfPage: 30,
    thumbPdfPage: 31,
    description: 'A competition project for Covilhã, Portugal, focused on cultural renewal, artistic public space, and adaptive transformation of a historic urban fabric.'
  },
  {
    number: '05',
    title: 'NSU BRA Canopy',
    type: 'Competition',
    pages: '36–41',
    startPdfPage: 36,
    thumbPdfPage: 37,
    description: 'A competition canopy proposal using a clear structural gesture to define shade, gathering, and a recognizable architectural identity.'
  },
  {
    number: '06',
    title: 'Windberg',
    type: 'Competition',
    pages: '42–47',
    startPdfPage: 42,
    thumbPdfPage: 43,
    description: 'A compact architectural competition concept shaped by environmental forces, landscape conditions, and expressive spatial form.'
  },
  {
    number: '07',
    title: 'Where Boundaries Fade',
    type: 'Master’s Thesis',
    pages: '48–57',
    startPdfPage: 48,
    thumbPdfPage: 49,
    description: 'A master’s thesis on an architecture of coexistence, using mycelium-based bioactive air filtration and spatial systems that blur boundaries between building and environment.'
  }
];

const leftPage = document.getElementById('leftPage');
const rightPage = document.getElementById('rightPage');
const leftPageShell = leftPage.closest('.page');
const rightPageShell = rightPage.closest('.page');
const pageStatus = document.getElementById('pageStatus');
const pdfNote = document.getElementById('pdfNote');
const flipPage = document.getElementById('flipPage');
const flipFront = document.getElementById('flipFront');
const flipBack = document.getElementById('flipBack');
const flipFrontFace = flipFront.closest('.flip-face');
const flipBackFace = flipBack.closest('.flip-face');
const pageInput = document.getElementById('pageInput');
const projectGrid = document.getElementById('projectGrid');
const firstBtn = document.getElementById('firstBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const jumpBtn = document.getElementById('jumpBtn');
const navLinks = [...document.querySelectorAll('[data-view]')];
const viewPanels = [...document.querySelectorAll('[data-view-panel]')];

let pdfDoc = null;
let pdfPageCount = FALLBACK_PDF_PAGES;
let totalBookPages = FALLBACK_PDF_PAGES + 1;
let currentStart = 1;
let isAnimating = false;
const pageCache = new Map();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pdfToBookPage(pdfPageNumber) {
  return pdfPageNumber <= 1 ? 1 : pdfPageNumber + 1;
}

function bookToPdfPage(bookPageNumber) {
  if (bookPageNumber === INSERTED_BLANK_AFTER_COVER) return null;
  if (bookPageNumber < INSERTED_BLANK_AFTER_COVER) return bookPageNumber;
  return bookPageNumber - 1;
}

function isBlankBookPage(bookPageNumber) {
  return bookPageNumber === INSERTED_BLANK_AFTER_COVER || bookPageNumber > totalBookPages;
}

function maxSpreadStart() {
  return totalBookPages % 2 === 0 ? totalBookPages - 1 : totalBookPages;
}

function spreadStartFor(bookPageNumber) {
  const safePage = clamp(Number(bookPageNumber) || 1, 1, totalBookPages);
  const start = safePage % 2 === 0 ? safePage - 1 : safePage;
  return clamp(start, 1, maxSpreadStart());
}

function showView(viewName, pushHash = true) {
  const target = viewPanels.some((panel) => panel.dataset.viewPanel === viewName) ? viewName : 'book';

  viewPanels.forEach((panel) => {
    panel.classList.toggle('active-view', panel.dataset.viewPanel === target);
  });

  navLinks.forEach((link) => {
    link.classList.toggle('is-active', link.dataset.view === target);
  });

  if (pushHash && window.location.hash !== `#${target}`) {
    history.pushState(null, '', `#${target}`);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateControls(enabled = true) {
  const ready = enabled && Boolean(pdfDoc) && !isAnimating;
  firstBtn.disabled = !ready || currentStart === 1;
  prevBtn.disabled = !ready || currentStart === 1;
  nextBtn.disabled = !ready || currentStart + 2 > totalBookPages;
  pageInput.disabled = !ready;
  jumpBtn.disabled = !ready;
}

function setFaceImage(face, img, source) {
  if (!source) {
    img.removeAttribute('src');
    face.classList.add('blank-sheet');
    return;
  }

  face.classList.remove('blank-sheet');
  img.src = source;
}

async function renderPdfPageImage(pdfPageNumber, targetWidth = 1600) {
  const cacheKey = `${pdfPageNumber}-${targetWidth}`;
  if (pageCache.has(cacheKey)) return pageCache.get(cacheKey);

  const promise = pdfDoc.getPage(pdfPageNumber).then((page) => {
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

  pageCache.set(cacheKey, promise);
  return promise;
}

async function getBookPageSource(bookPageNumber, targetWidth = 1600) {
  if (isBlankBookPage(bookPageNumber)) return null;
  const pdfPageNumber = bookToPdfPage(bookPageNumber);
  if (!pdfPageNumber || pdfPageNumber < 1 || pdfPageNumber > pdfPageCount) return null;
  return renderPdfPageImage(pdfPageNumber, targetWidth);
}

async function setBookPage(img, pageShell, bookPageNumber) {
  const source = await getBookPageSource(bookPageNumber, 1600);
  if (!source) {
    img.removeAttribute('src');
    img.alt = `Blank book page ${bookPageNumber}`;
    pageShell.classList.add('blank-sheet');
    return;
  }

  pageShell.classList.remove('blank-sheet');
  const pdfPage = bookToPdfPage(bookPageNumber);
  img.alt = `Portfolio PDF page ${pdfPage}`;
  img.src = source;
}

function spreadLabel(start) {
  const right = Math.min(start + 1, totalBookPages);
  if (start === 1) return `Cover + blank page · Book pages 1–2 of ${totalBookPages}`;
  if (start === 3) return `CV + table of contents · Book pages 3–4 of ${totalBookPages}`;
  return `Book pages ${start}–${right} of ${totalBookPages}`;
}

async function renderSpread(updateLabel = true) {
  const right = currentStart + 1;
  if (updateLabel) pageStatus.textContent = `Loading ${spreadLabel(currentStart).toLowerCase()}…`;

  await Promise.all([
    setBookPage(leftPage, leftPageShell, currentStart),
    setBookPage(rightPage, rightPageShell, right)
  ]);

  pageStatus.textContent = spreadLabel(currentStart);
  pageInput.value = currentStart;
  preloadAround(currentStart);
  updateControls(true);
}

function preloadAround(start) {
  [start - 2, start - 1, start + 2, start + 3, start + 4].forEach((bookPage) => {
    const pdfPage = bookToPdfPage(bookPage);
    if (pdfPage && pdfPage >= 1 && pdfPage <= pdfPageCount) renderPdfPageImage(pdfPage, 1000);
  });
}

async function animateTurn(targetStart, direction) {
  const sourceStart = currentStart;
  isAnimating = true;
  document.body.classList.add('is-flipping');
  updateControls(false);
  pageStatus.textContent = 'Turning page…';

  if (direction === 'next') {
    const [oldRight, newLeft, newRight] = await Promise.all([
      getBookPageSource(sourceStart + 1, 1600),
      getBookPageSource(targetStart, 1600),
      getBookPageSource(targetStart + 1, 1600)
    ]);

    setFaceImage(flipFrontFace, flipFront, oldRight);
    setFaceImage(flipBackFace, flipBack, newLeft);
    await setBookPage(rightPage, rightPageShell, targetStart + 1);
    flipPage.className = 'flip-page next';
  } else {
    const [oldLeft, newLeft, newRight] = await Promise.all([
      getBookPageSource(sourceStart, 1600),
      getBookPageSource(targetStart, 1600),
      getBookPageSource(targetStart + 1, 1600)
    ]);

    setFaceImage(flipFrontFace, flipFront, oldLeft);
    setFaceImage(flipBackFace, flipBack, newRight);
    await setBookPage(leftPage, leftPageShell, targetStart);
    flipPage.className = 'flip-page prev';
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => flipPage.classList.add('active'));
  });

  window.setTimeout(async () => {
    currentStart = targetStart;
    await renderSpread(false);
    flipPage.className = 'flip-page';
    flipFront.removeAttribute('src');
    flipBack.removeAttribute('src');
    flipFrontFace.classList.remove('blank-sheet');
    flipBackFace.classList.remove('blank-sheet');
    isAnimating = false;
    document.body.classList.remove('is-flipping');
    pageStatus.textContent = spreadLabel(currentStart);
    updateControls(true);
  }, 1200);
}

function turnTo(bookPageNumber, preferredDirection = 'next') {
  const targetStart = spreadStartFor(bookPageNumber);
  if (isAnimating || targetStart === currentStart || !pdfDoc) return;
  const direction = targetStart > currentStart ? 'next' : preferredDirection;
  animateTurn(targetStart, direction);
}

function nextSpread() {
  if (currentStart + 2 <= totalBookPages) turnTo(currentStart + 2, 'next');
}

function prevSpread() {
  if (currentStart - 2 >= 1) turnTo(currentStart - 2, 'prev');
}

function openBookPage(bookPageNumber) {
  showView('book');
  window.setTimeout(() => turnTo(bookPageNumber, bookPageNumber > currentStart ? 'next' : 'prev'), 260);
}

function openPdfPage(pdfPageNumber) {
  openBookPage(pdfToBookPage(pdfPageNumber));
}

function buildProjectCards() {
  projectGrid.innerHTML = projects.map((project) => `
    <article class="project-card">
      <div class="project-thumb">
        <img data-pdf-thumb="${project.thumbPdfPage}" alt="Preview image for ${project.title}" />
      </div>
      <div class="project-body">
        <div class="project-meta">
          <span class="project-number">${project.number}</span>
          <span>PDF pages ${project.pages}</span>
        </div>
        <h3>${project.title}</h3>
        <p>${project.type}</p>
        <p>${project.description}</p>
        <button type="button" data-pdf-page="${project.startPdfPage}" disabled>Open in portfolio</button>
      </div>
    </article>
  `).join('');

  projectGrid.querySelectorAll('button[data-pdf-page]').forEach((button) => {
    button.addEventListener('click', () => openPdfPage(Number(button.dataset.pdfPage)));
  });
}

async function loadThumbnails() {
  const thumbs = [...projectGrid.querySelectorAll('img[data-pdf-thumb]')];
  await Promise.all(thumbs.map(async (img) => {
    const page = Number(img.dataset.pdfThumb);
    img.src = await renderPdfPageImage(page, 900);
  }));
  projectGrid.querySelectorAll('button[data-pdf-page]').forEach((button) => {
    button.disabled = false;
  });
}

async function initPdfBook() {
  updateControls(false);

  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    pdfDoc = await pdfjsLib.getDocument(PDF_URL).promise;
    pdfPageCount = pdfDoc.numPages;
    totalBookPages = pdfPageCount + 1;
    pageInput.max = totalBookPages;
    pdfNote.innerHTML = `Loaded <strong>${pdfPageCount}</strong> PDF pages with one inserted blank book page after the cover.`;
    await renderSpread();
    loadThumbnails();
  } catch (error) {
    console.error(error);
    pageStatus.textContent = 'Portfolio PDF could not be loaded.';
    pdfNote.classList.add('error');
    pdfNote.innerHTML = 'Upload the optimized file as <strong>portfolio.pdf</strong> to the repository root, then refresh this page.';
    updateControls(false);
  }
}

function initNavigation() {
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showView(link.dataset.view);
    });
  });

  window.addEventListener('popstate', () => {
    const view = window.location.hash.replace('#', '') || 'book';
    showView(view, false);
  });

  const initialView = window.location.hash.replace('#', '') || 'book';
  showView(initialView, false);
}

firstBtn.addEventListener('click', () => turnTo(1, 'prev'));
nextBtn.addEventListener('click', nextSpread);
prevBtn.addEventListener('click', prevSpread);
jumpBtn.addEventListener('click', () => openBookPage(Number(pageInput.value)));

pageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') openBookPage(Number(pageInput.value));
});

document.addEventListener('keydown', (event) => {
  if (document.activeElement === pageInput) return;
  if (event.key === 'ArrowRight') nextSpread();
  if (event.key === 'ArrowLeft') prevSpread();
});

window.addEventListener('load', () => {
  buildProjectCards();
  initNavigation();
  initPdfBook();
});
