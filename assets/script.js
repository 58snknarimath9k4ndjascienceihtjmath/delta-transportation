const menu = document.getElementById('mobileMenu');
const nav = document.getElementById('nav');

menu?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});

nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menu?.setAttribute('aria-expanded', 'false');
  menu?.setAttribute('aria-label', 'Open navigation');
}));

menu?.setAttribute('aria-controls', 'nav');
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    nav.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Open navigation');
    menu?.focus();
  }
});

document.getElementById('year').textContent = new Date().getFullYear();

function updateTimeTheme() {
  const now = new Date();
  const night = now.getHours() < 7 || now.getHours() >= 19;
  document.documentElement.dataset.theme = night ? 'dark' : 'light';
  document.documentElement.style.colorScheme = night ? 'dark' : 'light';
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) {
    favicon.href = new URL(
      night ? 'assets/SVG/favicon-night.svg' : 'assets/SVG/favicon.svg',
      document.baseURI
    ).href;
  }
}
updateTimeTheme();
window.setInterval(updateTimeTheme, 60_000);

const phoneButton = document.getElementById('copyPhone');
phoneButton?.addEventListener('click', async () => {
  const phone = '+1 (804) 300-9624';
  const toast = document.getElementById('copyToast');
  let copied = false;
  try {
    await navigator.clipboard.writeText(phone);
    copied = true;
  } catch {
    const field = document.createElement('textarea');
    field.value = phone;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    copied = document.execCommand('copy');
    field.remove();
  }
  toast.textContent = copied ? 'Phone number copied' : 'Number: +1 (804) 300-9624';
  toast.classList.add('show');
  window.clearTimeout(window.rvaCopyToastTimer);
  window.rvaCopyToastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
});

const revealTargets = document.querySelectorAll(
  '.hero-copy, .hero-visual, .section-head, .step-card, .service-card, .faq-item, .contact-card, .home-review-carousel, .home-reviews .review-privacy'
);
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });

revealTargets.forEach((element, index) => {
  if (!element.dataset.reveal) {
    if (element.classList.contains('hero-copy') || element.classList.contains('about-art')) {
      element.dataset.reveal = 'left';
    } else if (element.classList.contains('hero-visual') || element.classList.contains('about-copy')) {
      element.dataset.reveal = 'right';
    } else {
      element.dataset.reveal = index % 3 === 1 ? 'right' : index % 3 === 0 ? 'left' : 'up';
    }
  }
  element.style.transitionDelay = `${(index % 3) * 75}ms`;
  revealObserver.observe(element);
});


const slides = [...document.querySelectorAll('.hero-slideshow .slide')];
let activeSlide = Math.max(0, slides.findIndex(slide => slide.classList.contains('active')));
let slideAnimating = false;
let slideTimer;
let autoplayPaused = false;
function startSlideTimer(delay = 4000) {
  window.clearTimeout(slideTimer);
  if (slides.length > 1 && !autoplayPaused && !document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    slideTimer = window.setTimeout(() => showNextSlide(), delay);
  }
}
function showNextSlide() {
  if (slides.length < 2 || slideAnimating) return;
  window.clearTimeout(slideTimer);
  const next = (activeSlide + 1) % slides.length;
  const outgoing = slides[activeSlide];
  const incoming = slides[next];
  slideAnimating = true;
  outgoing.classList.remove('active');
  outgoing.setAttribute('aria-hidden', 'true');
  incoming.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => {
    incoming.classList.add('active');
    activeSlide = next;
  }, 320);
  window.setTimeout(() => {
    slideAnimating = false;
    startSlideTimer(3180);
  }, 820);
}
const slideshow = document.querySelector('.hero-slideshow');
slideshow?.addEventListener('pointerenter', () => { autoplayPaused = true; window.clearTimeout(slideTimer); });
slideshow?.addEventListener('pointerleave', () => { autoplayPaused = false; startSlideTimer(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) window.clearTimeout(slideTimer);
  else startSlideTimer();
});
startSlideTimer();
