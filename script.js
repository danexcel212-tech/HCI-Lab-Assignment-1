/* Daniel Excel portfolio: script.js */

/* ---------- Dark mode ---------- */
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
}

// sync the button with the theme the <head> script already picked
applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem('theme', next); } catch (e) {}
    });
}

/* ---------- Hamburger menu ---------- */
const menuToggle = document.getElementById('menu-toggle');
const navList = document.getElementById('nav-list');

function setMenu(open) {
    if (!menuToggle || !navList) return;
    navList.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
}

if (menuToggle && navList) {
    menuToggle.addEventListener('click', () => setMenu(!navList.classList.contains('open')));

    // close after picking a link
    navList.addEventListener('click', e => {
        if (e.target.closest('a')) setMenu(false);
    });

    // close with Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && navList.classList.contains('open')) {
            setMenu(false);
            menuToggle.focus();
        }
    });

    // close when tapping outside the header
    document.addEventListener('click', e => {
        if (!e.target.closest('.site-header')) setMenu(false);
    });

    // reset when the window grows to desktop width
    window.matchMedia('(min-width: 860px)').addEventListener('change', e => {
        if (e.matches) setMenu(false);
    });
}

/* ---------- Active nav link ---------- */
const spyItems = [...document.querySelectorAll('.nav-list a[href^="#"]')]
    .map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter(item => item.section);

function updateActiveLink() {
    if (!spyItems.length) return;
    const offset = 150;
    let current = null;

    for (const item of spyItems) {
        if (item.section.getBoundingClientRect().top <= offset) current = item;
    }
    // at the very bottom, highlight the last link
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = spyItems[spyItems.length - 1];
    }

    spyItems.forEach(item => {
        if (item === current) item.link.setAttribute('aria-current', 'true');
        else item.link.removeAttribute('aria-current');
    });
}

/* ---------- Back-to-top wheel ---------- */
const toTop = document.getElementById('to-top');
const toTopRing = toTop ? toTop.querySelector('.to-top-ring') : null;
const ringCircumference = 2 * Math.PI * 21; // r = 21 in the SVG

if (toTopRing) toTopRing.style.strokeDasharray = ringCircumference;

function updateToTop() {
    if (!toTop || !toTopRing) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    toTopRing.style.strokeDashoffset = ringCircumference * (1 - progress);
    toTop.classList.toggle('show', window.scrollY > 300);
}

if (toTop) {
    // smooth scrolling comes from CSS (and is turned off for reduced motion)
    toTop.addEventListener('click', () => window.scrollTo({ top: 0 }));
}

/* ---------- Skills carousel ---------- */
const carousel = document.getElementById('skill-carousel');
const slideList = document.getElementById('skill-slides');
const slides = slideList ? [...slideList.querySelectorAll('.skill-card')] : [];
const carouselControls = document.getElementById('skill-controls');
const carouselDots = document.getElementById('skill-dots');
const carouselPrev = document.getElementById('skill-prev');
const carouselNext = document.getElementById('skill-next');
const carouselPause = document.getElementById('skill-pause');
const slideInterval = 3000; // milliseconds each card stays on screen
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let dots = [];
let slideIndex = 0;
let slideTimer = null;
let userPaused = false;    // the pause button was pressed
let pointerPaused = false; // a mouse is over the carousel
let focusPaused = false;   // keyboard focus is inside the carousel

function showSlide(index) {
    slideIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, n) => {
        const active = n === slideIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, n) => {
        if (n === slideIndex) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
    });
}

// restarts the countdown to the next card, or stops it while something pauses it
function syncTimer() {
    clearInterval(slideTimer);
    slideTimer = null;
    const canPlay = !reducedMotion.matches && !userPaused && !pointerPaused && !focusPaused;
    if (canPlay) slideTimer = setInterval(() => showSlide(slideIndex + 1), slideInterval);
    // screen readers only hear about changes when the cards are not switching by themselves
    slideList.setAttribute('aria-live', canPlay ? 'off' : 'polite');
}

function updatePauseButton() {
    carouselPause.hidden = reducedMotion.matches;
    carouselPause.classList.toggle('paused', userPaused);
    carouselPause.setAttribute('aria-label', userPaused ? 'Start automatic switching' : 'Pause automatic switching');
}

function goToSlide(index) {
    showSlide(index);
    syncTimer(); // a manual change restarts the countdown
}

if (carousel && slideList && carouselControls && carouselDots && carouselPrev && carouselNext && carouselPause && slides.length > 1) {
    slides.forEach((slide, n) => {
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', `${n + 1} of ${slides.length}`);
    });

    // one dot per card, built from the cards so new skills get a dot automatically
    dots = slides.map((slide, n) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Show ${slide.querySelector('h3').textContent} (${n + 1} of ${slides.length})`);
        dot.addEventListener('click', () => goToSlide(n));
        carouselDots.appendChild(dot);
        return dot;
    });

    carouselPrev.addEventListener('click', () => goToSlide(slideIndex - 1));
    carouselNext.addEventListener('click', () => goToSlide(slideIndex + 1));
    carouselPause.addEventListener('click', () => {
        userPaused = !userPaused;
        updatePauseButton();
        syncTimer();
    });

    // pause while a mouse is over the carousel or keyboard focus is inside it
    carousel.addEventListener('pointerenter', e => {
        if (e.pointerType === 'mouse') { pointerPaused = true; syncTimer(); }
    });
    carousel.addEventListener('pointerleave', e => {
        if (e.pointerType === 'mouse') { pointerPaused = false; syncTimer(); }
    });
    carousel.addEventListener('focusin', e => {
        if (e.target.matches(':focus-visible')) { focusPaused = true; syncTimer(); }
    });
    carousel.addEventListener('focusout', e => {
        if (!carousel.contains(e.relatedTarget)) { focusPaused = false; syncTimer(); }
    });

    // swipe left or right on a phone
    let touchStartX = null;
    slideList.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    slideList.addEventListener('touchend', e => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) > 40) goToSlide(slideIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });

    reducedMotion.addEventListener('change', () => {
        updatePauseButton();
        syncTimer();
    });

    carousel.classList.add('is-ready');
    carouselControls.hidden = false;
    showSlide(0);
    updatePauseButton();
    syncTimer();
}

/* ---------- Page-level listeners ---------- */
function onPageScroll() {
    updateToTop();
    updateActiveLink();
}

function onPageResize() {
    onPageScroll();
}

window.addEventListener('scroll', onPageScroll, { passive: true });
window.addEventListener('resize', onPageResize);
onPageResize();