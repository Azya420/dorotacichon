const PDF_URL = 'portfolio.pdf';
const FALLBACK_PDF_PAGES = 58;

const projects = [
  {
    number: '01',
    title: 'Sea Echo',
    type: 'Bachelor’s Thesis & Competition',
    pages: '4–13',
    startPdfPage: 4,
    thumbPdfPage: 4,
    thumbCrop: { x: 0.22, y: 0.12, w: 0.38, h: 0.22, scale: 0.98 },
    description: 'Seaside resort of the Silesian University of Technology.'
  },
  {
    number: '02',
    title: 'Neighborhood Fabric',
    type: 'Competition',
    pages: '14–21',
    startPdfPage: 14,
    thumbPdfPage: 14,
    thumbCrop: { x: 0.24, y: 0.10, w: 0.34, h: 0.24, scale: 1.05 },
    description: 'Revitalization of a former university campus into a mixed-use district.'
  },
  {
    number: '03',
    title: 'Beco das Artes',
    type: 'Student Project & Competition',
    pages: '22–29',
    startPdfPage: 22,
    thumbPdfPage: 22,
    thumbCrop: { x: 0.27, y: 0.10, w: 0.34, h: 0.24, scale: 1.02 },
    description: 'Cultural corridor and renovation concept for a historic building in Covilhã.'
  },
  {
    number: '04',
    title: 'Gardens Next Door',
    type: 'Student Project',
    pages: '30–35',
    startPdfPage: 30,
    thumbPdfPage: 30,
    thumbCrop: { x: 0.26, y: 0.10, w: 0.39, h: 0.24, scale: 1.02 },
    description: 'Community housing and garden-based social spaces.'
  },
  {
    number: '05',
    title: 'Windberg',
    type: 'Competition',
    pages: '36–41',
    startPdfPage: 36,
    thumbPdfPage: 36,
    thumbCrop: { x: 0.27, y: 0.10, w: 0.42, h: 0.23, scale: 1.02 },
    description: 'Urban wellness intervention within a natural cave landscape.'
  },
  {
    number: '06',
    title: 'NSU BRA Canopy',
    type: 'Competition',
    pages: '42–47',
    startPdfPage: 42,
    thumbPdfPage: 42,
    thumbCrop: { x: 0.25, y: 0.12, w: 0.42, h: 0.20, scale: 1.05 },
    description: 'Lightweight canopy proposal for shade, gathering, and public identity.'
  },
  {
    number: '07',
    title: 'Where Boundaries Fade',
    type: 'Master’s Thesis',
    pages: '48–57',
    startPdfPage: 48,
    thumbPdfPage: 48,
    thumbCrop: { x: 0.28, y: 0.07, w: 0.36, h: 0.23, scale: 1.0 },
    description: 'Architecture of coexistence based on mycelium and bioactive air filtration.'
  }
];

const bookStage = document.getElementById('bookStage');
const pageStatus = document.getElementById('pageStatus');
const pdfNote = document.getElementById('pdfNote');
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
let pageFlip = null;
let isBookReady = false;
let flipBookElement = null;
const pageCache = new Map();
const thumbnailCache = new Map();

function showView(viewName, pushHash = true) {
  const target = viewPanels.some((panel) => panel.dataset.viewPanel === viewName) ? viewName : 'book';
  viewPanels.forEach((panel) => panel.classList.toggle('active-view', panel.dataset.viewPanel === target));
  navLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.view === target));

  if (pushHash && window.location.hash !== `#${target}`) {
    history.pushState(null, '', `#${target}`);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateControls() {
  const ready = Boolean(pageFlip) && isBookReady;
  const pageIndex = ready ? pageFlip.getCurrentPageIndex() : 0;
  const lastIndex = Math.max(0, pdfPageCount - 1);

  firstBtn.disabled = !ready || pageIndex === 0;
  prevBtn.disabled = !ready || pageIndex === 0;
  nextBtn.disabled = !ready || pageIndex >= lastIndex;
  pageInput.disabled = !ready;
  jumpBtn.disabled = !ready;
}

function updateStatus(pageIndex = 0) {
  if (!pdfDoc) {
    pageStatus.textContent = 'Loading portfolio…';
    return;
  }

  const pageNumber = pageIndex + 1;

  if (pageNumber === 1) {
    pageStatus.textContent = `Cover · page 1 of ${pdfPageCount}`;
  } else if (pageNumber === pdfPageCount) {
    pageStatus.textContent = `Last page · page ${pdfPageCount} of ${pdfPageCount}`;
  } else {
    const left = pageNumber % 2 === 0 ? pageNumber : pageNumber - 1;
    const right = Math.min(left + 1, pdfPageCount);
    pageStatus.textContent = `Pages ${left}–${right} of ${pdfPageCount}`;
  }

  pageInput.value = pageNumber;
  updateControls();
}

function loadPageFlipLibrary() {
  return new Promise((resolve, reject) => {
    if (window.St?.PageFlip) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[data-page-flip-library]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js';
    script.defer = true;
    script.dataset.pageFlipLibrary = 'true';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function renderPdfPageImage(pdfPageNumber, targetWidth = 1250) {
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
      return canvas.toDataURL('image/webp', 0.9);
    });
  });

  pageCache.set(cacheKey, promise);
  return promise;
}

async function renderProjectThumbnail(project) {
  const cacheKey = `project-thumb-${project.number}`;
  if (thumbnailCache.has(cacheKey)) return thumbnailCache.get(cacheKey);

  const promise = pdfDoc.getPage(project.thumbPdfPage).then((page) => {
    const viewport = page.getViewport({ scale: 1 });
    const scale = 1800 / viewport.width;
    const scaledViewport = page.getViewport({ scale });
    const sourceCanvas = document.createElement('canvas');
    const sourceContext = sourceCanvas.getContext('2d', { alpha: false });

    sourceCanvas.width = Math.floor(scaledViewport.width);
    sourceCanvas.height = Math.floor(scaledViewport.height);

    return page.render({ canvasContext: sourceContext, viewport: scaledViewport }).promise.then(() => {
      const crop = project.thumbCrop;
      const sx = Math.floor(crop.x * sourceCanvas.width);
      const sy = Math.floor(crop.y * sourceCanvas.height);
      const sw = Math.floor(crop.w * sourceCanvas.width);
      const sh = Math.floor(crop.h * sourceCanvas.height);

      const outputCanvas = document.createElement('canvas');
      const outputContext = outputCanvas.getContext('2d', { alpha: false });
      outputCanvas.width = 1200;
      outputCanvas.height = 520;
      outputContext.fillStyle = '#ffffff';
      outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

      const maxWidth = outputCanvas.width * 0.86;
      const maxHeight = outputCanvas.height * 0.78;
      const drawScale = Math.min(maxWidth / sw, maxHeight / sh) * (crop.scale || 1);
      const dw = sw * drawScale;
      const dh = sh * drawScale;
      const dx = (outputCanvas.width - dw) / 2;
      const dy = (outputCanvas.height - dh) / 2;

      outputContext.drawImage(sourceCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
      return outputCanvas.toDataURL('image/webp', 0.92);
    });
  });

  thumbnailCache.set(cacheKey, promise);
  return promise;
}

function createBookPage(pdfPageNumber) {
  const page = document.createElement('div');
  page.className = 'book-page';
  page.dataset.pdfPage = String(pdfPageNumber);

  if (pdfPageNumber === 1) page.classList.add('book-cover');
  if (pdfPageNumber === pdfPageCount) page.classList.add('book-back-cover');

  page.innerHTML = `<div class="page-loader">Page ${pdfPageNumber}</div>`;
  return page;
}

async function fillBookPage(pageElement, pdfPageNumber, targetWidth = 1250) {
  const src = await renderPdfPageImage(pdfPageNumber, targetWidth);
  pageElement.innerHTML = '';
  const img = document.createElement('img');
  img.src = src;
  img.alt = `Portfolio page ${pdfPageNumber}`;
  pageElement.appendChild(img);
}

function getPageSize() {
  const stageRect = bookStage.getBoundingClientRect();
  const maxBookWidth = Math.max(720, Math.floor(stageRect.width || 1100));
  const maxBookHeight = Math.max(360, Math.floor(stageRect.height || 520));
  const pageWidth = Math.floor(maxBookWidth / 2);
  const pageHeight = Math.floor(Math.min(maxBookHeight, pageWidth / 1.414));
  return { pageWidth, pageHeight };
}

async function buildIssuuStyleBook() {
  await loadPageFlipLibrary();

  bookStage.innerHTML = '<div id="flipBook" class="flipbook" aria-label="Interactive portfolio flipbook"></div>';
  flipBookElement = document.getElementById('flipBook');

  const pages = [];
  for (let pdfPage = 1; pdfPage <= pdfPageCount; pdfPage += 1) {
    const pageElement = createBookPage(pdfPage);
    pages.push(pageElement);
    flipBookElement.appendChild(pageElement);
  }

  pageStatus.textContent = 'Rendering cover…';
  await Promise.all([
    fillBookPage(pages[0], 1, 1350),
    pages[1] ? fillBookPage(pages[1], 2, 1200) : Promise.resolve(),
    pages[2] ? fillBookPage(pages[2], 3, 1200) : Promise.resolve()
  ]);

  const { pageWidth, pageHeight } = getPageSize();

  pageFlip = new St.PageFlip(flipBookElement, {
    width: pageWidth,
    height: pageHeight,
    size: 'stretch',
    minWidth: 300,
    maxWidth: 900,
    minHeight: 210,
    maxHeight: 640,
    drawShadow: true,
    flippingTime: 850,
    usePortrait: false,
    startPage: 0,
    autoSize: true,
    maxShadowOpacity: 0.28,
    showCover: true,
    mobileScrollSupport: false,
    swipeDistance: 30,
    showPageCorners: true,
    disableFlipByClick: false
  });

  pageFlip.loadFromHTML(pages);
  pageFlip.on('flip', (event) => updateStatus(event.data));
  pageFlip.on('changeState', () => updateControls());

  isBookReady = true;
  updateStatus(0);

  renderRemainingPages(pages);
}

async function renderRemainingPages(pages) {
  for (let i = 3; i < pages.length; i += 1) {
    const pdfPageNumber = i + 1;
    pageStatus.textContent = `Preparing page ${pdfPageNumber} of ${pdfPageCount}…`;
    await fillBookPage(pages[i], pdfPageNumber, 1200);

    if (pageFlip) {
      pageFlip.updateFromHtml(pages);
    }
  }

  const currentIndex = pageFlip?.getCurrentPageIndex?.() || 0;
  updateStatus(currentIndex);
}

function nextPage() {
  if (!pageFlip || !isBookReady) return;
  pageFlip.flipNext('bottom');
}

function prevPage() {
  if (!pageFlip || !isBookReady) return;
  pageFlip.flipPrev('bottom');
}

function firstPage() {
  if (!pageFlip || !isBookReady) return;
  pageFlip.turnToPage(0);
}

function jumpToPage(pageNumber) {
  if (!pageFlip || !isBookReady) return;
  const targetIndex = Math.min(Math.max(Number(pageNumber) || 1, 1), pdfPageCount) - 1;
  showView('book');
  window.setTimeout(() => pageFlip.turnToPage(targetIndex), 180);
}

function openPdfPage(pdfPageNumber) {
  jumpToPage(pdfPageNumber);
}

function buildProjectCards() {
  projectGrid.innerHTML = projects.map((project, index) => `
    <article class="project-card">
      <button type="button" class="project-open-area" data-pdf-page="${project.startPdfPage}" aria-label="Open ${project.title} in portfolio">
        <span class="project-thumb">
          <img data-project-thumb-index="${index}" alt="Preview image for ${project.title}" />
        </span>
        <span class="project-body">
          <span class="project-number">${project.number}</span>
          <span class="project-pages">${project.pages}</span>
          <span class="project-title">${project.title}</span>
          <span class="project-type">${project.type}</span>
        </span>
      </button>
    </article>
  `).join('');

  projectGrid.querySelectorAll('button[data-pdf-page]').forEach((button) => {
    button.addEventListener('click', () => openPdfPage(Number(button.dataset.pdfPage)));
  });
}

async function loadThumbnails() {
  const thumbs = [...document.querySelectorAll('img[data-project-thumb-index]')];
  await Promise.all(thumbs.map(async (img) => {
    const project = projects[Number(img.dataset.projectThumbIndex)];
    img.src = await renderProjectThumbnail(project);
  }));
}

async function initPdfBook() {
  updateControls();

  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    pdfDoc = await pdfjsLib.getDocument(PDF_URL).promise;
    pdfPageCount = pdfDoc.numPages;
    pageInput.max = pdfPageCount;
    pdfNote.innerHTML = `Issuu-style flipbook loaded from <strong>${pdfPageCount}</strong> PDF pages.`;

    await buildIssuuStyleBook();
    await loadThumbnails();
  } catch (error) {
    console.error(error);
    pageStatus.textContent = 'Portfolio PDF could not be loaded.';
    pdfNote.classList.add('error');
    pdfNote.innerHTML = 'Upload the optimized file as <strong>portfolio.pdf</strong> to the repository root, then refresh this page.';
    updateControls();
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

  showView(window.location.hash.replace('#', '') || 'book', false);
}

firstBtn.addEventListener('click', firstPage);
nextBtn.addEventListener('click', nextPage);
prevBtn.addEventListener('click', prevPage);
jumpBtn.addEventListener('click', () => jumpToPage(pageInput.value));

pageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') jumpToPage(pageInput.value);
});

document.addEventListener('keydown', (event) => {
  if (document.activeElement === pageInput) return;
  if (event.key === 'ArrowRight') nextPage();
  if (event.key === 'ArrowLeft') prevPage();
});

window.addEventListener('resize', () => {
  if (!pageFlip || !isBookReady) return;
  const { pageWidth, pageHeight } = getPageSize();
  pageFlip.update({ width: pageWidth, height: pageHeight });
});

window.addEventListener('load', () => {
  buildProjectCards();
  initNavigation();
  initPdfBook();
});
