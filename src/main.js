import { homeMarkup, bindHome } from './home.js';
import { renderVerifyPage } from './verify.js';
import { renderAdminPage } from './admin.js';
import { renderPrintPage } from './print.js';
import { headerMarkup, footerMarkup, bindHeader } from './layout.js';

const app = document.getElementById('app');

let pendingScroll = null;

function navigate(path, { replace = false } = {}) {
  const target = path.startsWith('/') ? path : `/${path}`;
  if (replace) window.history.replaceState({}, '', target);
  else window.history.pushState({}, '', target);
  void render();
}

function notFoundMarkup() {
  return `
    ${headerMarkup()}
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Page not found</p>
        <h1>This page does not exist</h1>
        <p>The link may be out of date. Use the verification page to check a certificate.</p>
        <div style="margin-top:26px;display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn btn-gold" href="/verify" data-link>Verify a certificate</a>
          <a class="btn btn-ghost" style="border-color:rgba(255,255,255,.25);color:#fff" href="/" data-link>Back to home</a>
        </div>
      </div>
    </section>
    <div class="verify-wrap"><div class="container"></div></div>
    ${footerMarkup()}`;
}

async function render() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const url = new URL(window.location.href);

  if (path === '/' || path === '') {
    app.innerHTML = `${headerMarkup('home')}${homeMarkup()}${footerMarkup()}`;
    bindHeader();
    bindHome(navigate);
    document.title = 'Inspectra Calibration Company — Certificate Verification';
  } else if (path === '/verify') {
    await renderVerifyPage({ query: url.searchParams.get('q') || '', navigate });
  } else if (path.startsWith('/verify/')) {
    const query = decodeURIComponent(path.slice('/verify/'.length));
    await renderVerifyPage({ query, navigate });
  } else if (path === '/admin' || path.startsWith('/admin/')) {
    await renderAdminPage({ navigate });
  } else if (path.startsWith('/certificate/')) {
    const serial = decodeURIComponent(path.slice('/certificate/'.length));
    await renderPrintPage({ serial });
  } else {
    app.innerHTML = notFoundMarkup();
    bindHeader();
    document.title = 'Page not found · Inspectra Calibration Company';
  }

  if (pendingScroll) {
    const target = document.querySelector(pendingScroll);
    pendingScroll = null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
}

document.addEventListener('click', (event) => {
  const scrollLink = event.target.closest('[data-scroll]');
  if (scrollLink) {
    event.preventDefault();
    const hash = scrollLink.getAttribute('href') || '';
    const id = hash.includes('#') ? hash.slice(hash.indexOf('#')) : '';
    if (!id) return;
    if (window.location.pathname === '/' || window.location.pathname === '') {
      document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      pendingScroll = id;
      navigate('/');
    }
    return;
  }

  const link = event.target.closest('a[data-link]');
  if (!link) return;
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const href = link.getAttribute('href');
  if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return;
  event.preventDefault();
  document.getElementById('siteHeader')?.classList.remove('is-open');
  if (href === `${window.location.pathname}${window.location.search}`) return;
  navigate(href);
});

window.addEventListener('popstate', () => void render());

void render();
