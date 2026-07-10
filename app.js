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
    thumbCrop: { x: 0.42, y: 0.03, w: 0.56, h: 0.74, scale: 0.92 },
    description: 'Seaside resort of the Silesian University of Technology.'
  },
  {
    number: '02',
    title: 'Neighborhood Fabric',
    type: 'Competition',
    pages: '14–21',
    startPdfPage: 14,
    thumbPdfPage: 14,
    thumbCrop: { x: 0.42, y: 0.03, w: 0.56, h: 0.74, scale: 0.92 },
    description: 'Revitalization of a former university campus into a mixed-use district.'
  },
  {
    number: '03',
    title: 'Beco das Artes',
    type: 'Student Project & Competition',
    pages: '22–29',
    startPdfPage: 22,
    thumbPdfPage: 22,
    thumbCrop: { x: 0.42, y: 0.03, w: 0.56, h: 0.74, scale: 0.92 },
    description: 'Cultural corridor and renovation concept for a historic building in Covilhã.'
  },
  {
    number: '04',
    title: 'Gardens Next Door',
    type: 'Student Project',
    pages: '30–35',
    startPdfPage: 30,
    thumbPdfPage: 30,
    thumbCrop: { x: 0.42, y: 0.03, w: 0.56, h: 0.74, scale: 0.92 },
    description: 'Community housing and garden-based social spaces.'
  },
  {
    number: '05',
    title: 'Windberg',
    type: 'Competition',
    pages: '36–41',
    startPdfPage: 36,
    thumbPdfPage: 36,
    thumbCrop: { x: 0.42, y: 0.03, w: 0.56, h: 0.74, scale: 0.92 },
    description: 'Urban wellness intervention within a natural cave landscape.'
  },
  {
    number: '06',
    title: 'NSU BRA Canopy',
    type: 'Competition',
    pages: '42–47',
    startPdfPage: 42,
    thumbPdfPage: 42,
    thumbCrop: { x: 0.42, y: 0.03, w: 0.56, h: 0.74, scale: 0.92 },
    description: 'Lightweight canopy proposal for shade, gathering, and public identity.'
  },
  {
    number: '07',
    title: 'Where Boundaries Fade',
    type: 'Master’s Thesis',
    pages: '48–57',
    startPdfPage: 48,
    thumbPdfPage: 48,
    thumbCrop: { x: 0.42, y: 0.03, w: 0.56, h: 0.74, scale: 0.92 },
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

function injectAboutStyles() {
  if (document.getElementById('about-cv-refinement-styles')) return;

  const style = document.createElement('style');
  style.id = 'about-cv-refinement-styles';
  style.textContent = `
    #about .cv-heading-row {
      grid-template-columns: minmax(0, 1fr);
      max-width: 1120px;
    }

    #about .cv-sheet.refined-cv {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      border: 1px solid var(--line);
      background: #fff;
    }

    .cv-photo-card {
      grid-column: span 3;
      display: grid;
      gap: 18px;
      align-content: start;
      padding: 22px;
      border-right: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
      background: #fff;
    }

    .cv-photo-frame {
      aspect-ratio: 1 / 1.08;
      overflow: hidden;
      display: grid;
      place-items: center;
      background: #f5f5f5;
      border: 1px solid var(--line);
    }

    .cv-photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: grayscale(1) contrast(1.04);
    }

    .cv-name-block h3 {
      margin: 0 0 8px;
      font-family: var(--display);
      font-size: clamp(32px, 4vw, 54px);
      line-height: .9;
      letter-spacing: .01em;
      text-transform: uppercase;
      font-weight: 400;
    }

    .cv-name-block p {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.55;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .cv-block.cv-compact,
    .cv-block.cv-profile-refined,
    .cv-block.cv-wide,
    .cv-block.cv-achievements-refined {
      min-height: auto;
      padding: 22px;
      border-right: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
    }

    .cv-profile-refined {
      grid-column: span 5;
    }

    .cv-contact-refined {
      grid-column: span 4;
    }

    .cv-compact {
      grid-column: span 4;
    }

    .cv-wide {
      grid-column: span 6;
    }

    .cv-achievements-refined {
      grid-column: 1 / -1;
      border-right: 0 !important;
    }

    .cv-block h3,
    .cv-photo-card h3 {
      margin-bottom: 14px;
      font-family: var(--display);
      font-size: 30px;
      line-height: .92;
      font-weight: 400;
      letter-spacing: .02em;
      text-transform: uppercase;
    }

    .cv-profile-refined p {
      margin-bottom: 12px;
    }

    .cv-meta-list,
    .cv-skill-grid,
    .cv-achievement-grid {
      display: grid;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .cv-meta-list li,
    .cv-skill-grid li,
    .cv-achievement-grid li {
      display: grid;
      gap: 3px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--line);
    }

    .cv-meta-list strong,
    .cv-skill-grid strong,
    .cv-achievement-grid strong {
      color: #111;
      font-weight: 900;
      line-height: 1.22;
    }

    .cv-meta-list span,
    .cv-skill-grid span,
    .cv-achievement-grid span,
    .cv-profile-refined p,
    .cv-interest-text {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.48;
    }

    .cv-achievement-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 22px;
    }

    .cv-year {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 54px;
      margin-right: 8px;
      padding: 3px 7px;
      border: 1px solid var(--line);
      border-radius: 999px;
      font-size: 11px;
      letter-spacing: .08em;
    }

    @media (max-width: 1120px) {
      .cv-photo-card,
      .cv-profile-refined,
      .cv-contact-refined,
      .cv-compact,
      .cv-wide {
        grid-column: span 6;
      }
      .cv-achievement-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .cv-photo-card,
      .cv-profile-refined,
      .cv-contact-refined,
      .cv-compact,
      .cv-wide,
      .cv-achievements-refined {
        grid-column: 1 / -1;
        border-right: 0 !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function enhanceAboutSection() {
  injectAboutStyles();

  const cvSheet = document.querySelector('#about .cv-sheet');
  if (!cvSheet) return;

  cvSheet.className = 'cv-sheet refined-cv';
  cvSheet.innerHTML = `
    <aside class="cv-photo-card">
      <div class="cv-photo-frame">
        <img id="cvPhoto" alt="Dorota Cichoń portrait from CV" />
      </div>
      <div class="cv-name-block">
        <h3>Dorota Cichoń</h3>
        <p>MSc Eng. Arch. · Architecture portfolio</p>
      </div>
    </aside>

    <section class="cv-block cv-profile-refined">
      <h3>Profile</h3>
      <p>Architecture graduate from the Silesian University of Technology, Poland, with a strong interest in unconventional design approaches, bio-inspired solutions, and creative spatial thinking.</p>
      <p>Open to new challenges and opportunities for professional growth.</p>
      <p class="cv-interest-text"><strong>Interests:</strong> architecture with a focus on unconventional spatial design and bio-inspired solutions, as well as photography, travel, and visual arts.</p>
    </section>

    <section class="cv-block cv-contact-refined">
      <h3>Contact</h3>
      <ul class="cv-meta-list">
        <li><strong>E-mail</strong><span><a href="mailto:dorotacichon5@gmail.com">dorotacichon5@gmail.com</a></span></li>
        <li><strong>Phone</strong><span><a href="tel:+48570886838">+48 570 886 838</a></span></li>
        <li><strong>Date of birth</strong><span>04.04.2001</span></li>
        <li><strong>City</strong><span>Gliwice</span></li>
      </ul>
    </section>

    <section class="cv-block cv-compact">
      <h3>Work experience</h3>
      <ul class="cv-meta-list">
        <li><strong>Brand Ambassador, Sales</strong><span>09.2025–08.2026 · 11 months · MS Services · Tarnowskie Góry, Poland</span></li>
        <li><strong>English Tutor</strong><span>12.2024–07.2025 · 8 months · ROZMOWA School · Pilchowice, Poland</span></li>
        <li><strong>Internship</strong><span>09.2023–03.2024 · 6 months · NEXT ARCHITECTS · Amsterdam, Netherlands</span></li>
      </ul>
    </section>

    <section class="cv-block cv-compact">
      <h3>Education</h3>
      <ul class="cv-meta-list">
        <li><strong>Silesian University of Technology</strong><span>2024–2026 · 1.5 years · Faculty: Architecture · Education level: Master’s studies</span></li>
        <li><strong>Silesian University of Technology</strong><span>2020–2024 · 4 years · Faculty: Architecture · Education level: Bachelor of Engineering studies</span></li>
        <li><strong>VIA University College</strong><span>08.2022–02.2023 · 6 months · Architecture Technology and Construction Management · Student exchange — Erasmus+ programme</span></li>
      </ul>
    </section>

    <section class="cv-block cv-compact">
      <h3>Additional education</h3>
      <ul class="cv-meta-list">
        <li><strong>Art Courses</strong><span>2016–2020 · 4 years · Drawing / Painting / Architectural Sketching · Level: advanced</span></li>
        <li><strong>State Music School of the 1st and 2nd Degree in Gliwice</strong><span>2011–2016 · 6 years · Education level: First degree · Instrument: piano</span></li>
      </ul>
    </section>

    <section class="cv-block cv-wide">
      <h3>Abilities</h3>
      <ul class="cv-skill-grid">
        <li><strong>Software skills · BIM, CAD + more</strong><span>Rhino, Revit, SketchUp, AutoCAD, Lumion, Enscape</span></li>
        <li><strong>Adobe</strong><span>Photoshop, Illustrator, Lightroom, InDesign</span></li>
        <li><strong>MS Office</strong><span>Excel, Word, PowerPoint</span></li>
      </ul>
    </section>

    <section class="cv-block cv-wide">
      <h3>Language skills</h3>
      <ul class="cv-skill-grid">
        <li><strong>Polish</strong><span>Mother tongue</span></li>
        <li><strong>English</strong><span>C1 level</span></li>
      </ul>
    </section>

    <section class="cv-block cv-achievements-refined">
      <h3>Achievements</h3>
      <ul class="cv-achievement-grid">
        <li><strong><span class="cv-year">2026</span>Where Boundaries Fade — An Architecture of Coexistence</strong><span>Master’s thesis project under patent protection process. Mycelium-based bioactive air filtration system currently being prepared for patent protection. Individual project: Dorota Cichoń.</span></li>
        <li><strong><span class="cv-year">2026</span>The Neighborhood Fabric — 1st Prize</strong><span>1st Prize — BACON Student Design Competition. Public project presentation and publication in Architektura & Biznes magazine. International architecture and urban design competition organized by the Center for Architecture and Design in collaboration with AIA Philadelphia, recognizing an innovative and sustainable project proposal. Team: Oliwia Jagła, Dorota Cichoń.</span></li>
        <li><strong><span class="cv-year">2025</span>Tiny Houses — Top 50</strong><span>Top 50. Publication in Architektura & Biznes magazine and Amazing Architecture. International Architecture Competition Tiny House 2024 — a global design challenge by Volume Zero Competitions, inviting architects to create sustainable off-grid micro-homes of up to 300 sq ft, focused on innovation, spatial efficiency, and minimal environmental impact.</span></li>
        <li><strong><span class="cv-year">2025</span>Urban Arcade — 1st Prize</strong><span>1st Prize — BACON Student Design Competition. Public project presentation and publication in Architektura & Biznes magazine. International architecture and urban design competition organized by the Center for Architecture and Design in collaboration with AIA Philadelphia, recognizing an innovative and sustainable project proposal. Team: Aleksandra Chylak, Dorota Cichoń, Karolina Supron, Oliwia Jagła.</span></li>
        <li><strong><span class="cv-year">2024</span>Beco das Artes — Grand Prix</strong><span>Grand Prix. Public project presentation and publication in Architektura & Biznes magazine. Academic competition organized by the Silesian University of Technology and the University of Beira Interior, dedicated to the renovation of a historic building in Covilhã, Portugal. Team: Aleksandra Chylak, Dorota Cichoń.</span></li>
        <li><strong><span class="cv-year">2024</span>Best Architecture Diploma — Top 12</strong><span>Selected for the TOP 12 of the Best Architecture Diploma 2025 competition by Architektura & Biznes.</span></li>
        <li><strong><span class="cv-year">2024</span>The Revival — honourable mention</strong><span>Honourable mention. Into the Rabbit Hole — international architecture competition focused on designing innovative, healing spaces that promote mental well-being through creativity and unconventional solutions.</span></li>
        <li><strong><span class="cv-year">2023</span>Models of the GZM Metropolitan Structure</strong><span>Special Mention 2023 by the Silesian Branch of the Society of Polish Town Planners. Book prepared as part of the course: Urban Design — City Structure, Faculty of Architecture, Silesian University of Technology. Modelling section, co-author of three chapters.</span></li>
        <li><strong><span class="cv-year">2018</span>Odyssey of the Mind — 2nd place</strong><span>International team-based creativity competition. Phase 2/3 — national level, Gdynia, Poland.</span></li>
        <li><strong><span class="cv-year">2016</span>Odyssey of the Mind — 5th place</strong><span>International team-based creativity competition. Phase 3/3 — international level, Michigan, USA.</span></li>
        <li><strong><span class="cv-year">2015</span>Odyssey of the Mind — top 20</strong><span>International team-based creativity competition. Phase 3/3 — international level, Illinois, USA.</span></li>
      </ul>
    </section>
  `;
}

async function renderCvPhoto() {
  const photo = document.getElementById('cvPhoto');
  if (!photo || !pdfDoc) return;

  try {
    const page = await pdfDoc.getPage(2);
    const viewport = page.getViewport({ scale: 2.2 });
    const sourceCanvas = document.createElement('canvas');
    const sourceContext = sourceCanvas.getContext('2d', { alpha: false });

    sourceCanvas.width = Math.floor(viewport.width);
    sourceCanvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: sourceContext, viewport }).promise;

    const sx = Math.floor(sourceCanvas.width * 0.046);
    const sy = Math.floor(sourceCanvas.height * 0.068);
    const sw = Math.floor(sourceCanvas.width * 0.122);
    const sh = Math.floor(sourceCanvas.height * 0.164);

    const outputCanvas = document.createElement('canvas');
    const outputContext = outputCanvas.getContext('2d', { alpha: false });
    outputCanvas.width = 720;
    outputCanvas.height = 760;
    outputContext.fillStyle = '#eeeeee';
    outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

    const scale = Math.max(outputCanvas.width / sw, outputCanvas.height / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (outputCanvas.width - dw) / 2;
    const dy = (outputCanvas.height - dh) / 2;

    outputContext.drawImage(sourceCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
    photo.src = outputCanvas.toDataURL('image/webp', 0.9);
  } catch (error) {
    console.warn('CV photo could not be rendered', error);
  }
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
  const cacheKey = `balanced-project-title-thumb-${project.number}`;
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
      outputCanvas.height = 849;

      outputContext.fillStyle = '#ffffff';
      outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

      const backgroundScale = Math.max(outputCanvas.width / sw, outputCanvas.height / sh);
      const bgWidth = sw * backgroundScale;
      const bgHeight = sh * backgroundScale;
      const bgX = (outputCanvas.width - bgWidth) / 2;
      const bgY = (outputCanvas.height - bgHeight) / 2;
      outputContext.save();
      outputContext.filter = 'blur(16px) contrast(1.04)';
      outputContext.globalAlpha = 0.42;
      outputContext.drawImage(sourceCanvas, sx, sy, sw, sh, bgX, bgY, bgWidth, bgHeight);
      outputContext.restore();

      outputContext.fillStyle = 'rgba(255,255,255,0.22)';
      outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

      const maxWidth = outputCanvas.width * 0.92;
      const maxHeight = outputCanvas.height * 0.90;
      const foregroundScale = Math.min(maxWidth / sw, maxHeight / sh) * (crop.scale || 1);
      const fgWidth = sw * foregroundScale;
      const fgHeight = sh * foregroundScale;
      const fgX = (outputCanvas.width - fgWidth) / 2;
      const fgY = (outputCanvas.height - fgHeight) / 2;
      outputContext.drawImage(sourceCanvas, sx, sy, sw, sh, fgX, fgY, fgWidth, fgHeight);

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

    await renderCvPhoto();
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
  enhanceAboutSection();
  buildProjectCards();
  initNavigation();
  initPdfBook();
});
