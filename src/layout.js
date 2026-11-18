import { esc } from './certificate.js';

export function headerMarkup(active = '') {
  const link = (href, key, label) =>
    `<a href="${href}" data-link data-nav="${key}" class="${active === key ? 'is-active' : ''}">${label}</a>`;
  return `
  <header class="site-header" id="siteHeader">
    <div class="container site-header-inner">
      <a class="brand" href="/" data-link aria-label="Inspectra Calibration Company home">
        <img src="/logo-horizontal.png" alt="Inspectra Calibration Company" />
      </a>
      <button class="nav-toggle" id="navToggle" type="button" aria-label="Open menu" aria-expanded="false">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <nav class="site-nav" aria-label="Main navigation">
        ${link('/', 'home', 'Home')}
        ${link('/verify', 'verify', 'Verify Certificate')}
        <a href="/#how-it-works" data-scroll>How it works</a>
        <a href="/#contact" data-scroll>Contact</a>
        ${link('/admin', 'admin', 'Admin Panel')}
        <a href="/verify" data-link class="nav-cta">Verify now</a>
      </nav>
    </div>
  </header>`;
}

export function footerMarkup() {
  return `
  <footer class="site-footer" id="contact">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="/logo-horizontal.png" alt="Inspectra Calibration Company" />
          <p>
            Inspectra Calibration Company provides inspection, testing and safety competency
            certification for the construction, industrial and heavy-equipment sectors across the
            Kingdom of Saudi Arabia. Every certificate issued through this portal can be verified
            online using its serial number.
          </p>
        </div>
        <div>
          <h3 class="footer-title">Verification</h3>
          <ul class="footer-links">
            <li><a href="/verify" data-link>Verify a certificate</a></li>
            <li><a href="/#how-it-works" data-scroll>How verification works</a></li>
            <li><a href="/admin" data-link>Administrator login</a></li>
            <li><a href="/#contact">Report a concern</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer-title">Get in touch</h3>
          <ul class="footer-links">
            <li><a href="tel:+966566675748">+966 56 667 5748</a></li>
            <li><a href="mailto:info@inspectra-sa.com">info@inspectra-sa.com</a></li>
            <li>Sat – Fri · 9:00 – 18:00</li>
            <li>Riyadh, Saudi Arabia</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Inspectra Calibration Company. All rights reserved.</span>
        <span>Certificate verification portal · ${esc('Version 1.0')}</span>
      </div>
    </div>
  </footer>`;
}

export function bindHeader() {
  const header = document.getElementById('siteHeader');
  const toggle = document.getElementById('navToggle');
  if (header && toggle) {
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
}

export function toast(message, { error = false } = {}) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = `toast${error ? ' is-error' : ''}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 4200);
}
