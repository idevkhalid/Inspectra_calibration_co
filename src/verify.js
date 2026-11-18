import { headerMarkup, footerMarkup, bindHeader } from './layout.js';
import { verifyCertificate, isConfigured } from './supabase.js';
import {
  certificateMarkup,
  verificationTableMarkup,
  effectiveStatus,
  makeQrDataUrl,
  verifyUrlFor,
  esc,
  formatDate
} from './certificate.js';

const ICON_OK = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6L9 17l-5-5"/></svg>`;
const ICON_BAD = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
const ICON_WARN = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 8v5M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>`;

function searchForm(query = '') {
  return `
  <form class="search-form" id="verifySearchForm" novalidate style="margin-top:26px;max-width:620px">
    <div class="field">
      <label for="verifySearchInput" style="color:rgba(255,255,255,.6)">Serial number, Iqama / ID or name</label>
      <input
        id="verifySearchInput"
        type="text"
        value="${esc(query)}"
        placeholder="e.g. INS-2026-01001 or 2xxxxxxxxx"
        autocomplete="off"
        required
      />
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-gold" type="submit">Verify certificate</button>
      <a class="btn btn-ghost" style="border-color:rgba(255,255,255,.25);color:#fff" href="/" data-link>Back to home</a>
    </div>
    <p class="form-message" id="verifySearchMessage" role="status" aria-live="polite"></p>
  </form>`;
}

function statusBanner(cert) {
  const status = effectiveStatus(cert);
  const tone = status.tone === 'danger' ? ' is-invalid' : status.tone === 'warning' ? ' is-warning' : '';
  const icon = status.tone === 'valid' ? ICON_OK : status.tone === 'warning' ? ICON_WARN : ICON_BAD;

  const copy = {
    valid: ['Certificate verified', 'This certificate is genuine, issued by Inspectra Calibration Company and valid on the date of verification.'],
    expired: ['Certificate expired', 'This record exists in our register, but the certificate has passed its expiry date and is no longer valid.'],
    revoked: ['Certificate revoked', 'This certificate has been revoked by Inspectra Calibration Company and must not be accepted.'],
    suspended: ['Certificate suspended', 'This certificate is temporarily suspended. Contact Inspectra for more information.']
  }[status.key] || ['Record found', 'Review the certificate details below.'];

  return `
  <div class="status-banner${tone}">
    <div class="status-icon">${icon}</div>
    <div>
      <h2>${copy[0]} · <span style="color:var(--muted);font-weight:700">${status.label}</span></h2>
      <p>${copy[1]}</p>
    </div>
    <div class="result-actions print-hide">
      <a class="btn btn-ink btn-sm" href="/certificate/${encodeURIComponent(cert.serial)}" data-link>Print certificate</a>
      <button class="btn btn-ghost btn-sm" type="button" id="copyVerifyLink">Copy link</button>
    </div>
  </div>`;
}

function otherMatches(list, activeSerial) {
  if (!list || list.length < 2) return '';
  return `
  <div class="panel print-hide">
    <div class="panel-head" style="margin-bottom:10px">
      <div>
        <h2 style="font-size:19px">Other matching records</h2>
        <p>${list.length} records matched your search. Choose the correct holder.</p>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${list
        .filter((c) => c.serial !== activeSerial)
        .map(
          (c) =>
            `<button class="icon-btn" type="button" data-serial="${esc(c.serial)}">${esc(c.full_name)} · ${esc(c.serial)}</button>`
        )
        .join('')}
    </div>
  </div>`;
}

async function renderResult(container, cert, all) {
  const qr = await makeQrDataUrl(verifyUrlFor(cert.serial));
  container.innerHTML = `
    <div class="result-stack">
      ${statusBanner(cert)}
      ${verificationTableMarkup(cert)}
      <details class="cert-preview print-hide">
        <summary>Preview the printed certificate card</summary>
        <div class="certificate-holder">${certificateMarkup(cert, qr)}</div>
      </details>
      ${otherMatches(all, cert.serial)}
      <p class="help-text" style="text-align:center">
        Record last checked ${esc(formatDate(new Date().toISOString().slice(0, 10)))}. If the photo or
        details do not match the person presenting the certificate, do not accept it and contact
        Inspectra Calibration Company.
      </p>
    </div>`;

  document.getElementById('copyVerifyLink')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(verifyUrlFor(cert.serial));
      const btn = document.getElementById('copyVerifyLink');
      if (btn) btn.textContent = 'Link copied';
    } catch {
      window.prompt('Copy this verification link:', verifyUrlFor(cert.serial));
    }
  });

  container.querySelectorAll('[data-serial]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = all.find((c) => c.serial === btn.dataset.serial);
      if (next) void renderResult(container, next, all);
    });
  });
}

export async function renderVerifyPage({ query = '', navigate }) {
  const app = document.getElementById('app');
  const cleaned = String(query || '').trim();
  document.title = 'Verify a certificate · Inspectra Calibration Company';
  app.innerHTML = `
    ${headerMarkup('verify')}
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Certificate verification</p>
        <h1>Verify an Inspectra certificate</h1>
        <p>Search our register by serial number, Iqama / ID number or holder name. The result comes directly from our secure certificate database.</p>
        ${searchForm(cleaned)}
      </div>
    </section>
    <div class="verify-wrap">
      <div class="container" id="verifyResults"></div>
    </div>
    ${footerMarkup()}`;

  bindHeader();

  const form = document.getElementById('verifySearchForm');
  const input = document.getElementById('verifySearchInput');
  const formMessage = document.getElementById('verifySearchMessage');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      formMessage.textContent = 'Enter a serial number, Iqama / ID or name to search.';
      return;
    }
    navigate(`/verify/${encodeURIComponent(value)}`);
  });

  const results = document.getElementById('verifyResults');
  if (!cleaned) {
    results.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${ICON_WARN}</div>
        <h2>Start a verification</h2>
        <p>Enter the certificate serial number, the holder's Iqama / ID, or their full name above.</p>
      </div>`;
    return;
  }

  if (!isConfigured) {
    results.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${ICON_WARN}</div>
        <h2>Verification service unavailable</h2>
        <p>The portal is not connected to the certificate database yet. Please contact the administrator.</p>
      </div>`;
    return;
  }

  results.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon" style="background:#f5f1e6;color:#9a8f74">${ICON_OK}</div>
      <h2>Checking the register…</h2>
      <p>Looking up “${esc(cleaned)}”.</p>
    </div>`;

  try {
    const records = await verifyCertificate(cleaned);
    if (!records.length) {
      results.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICON_BAD}</div>
          <h2>No certificate found</h2>
          <p>We could not find a record for “${esc(cleaned)}”. Check the serial number or Iqama for typing errors, then try again.</p>
          <button class="btn btn-ink" type="button" id="retrySearch">Try another search</button>
        </div>`;
      document.getElementById('retrySearch')?.addEventListener('click', () => {
        input?.focus();
        window.scrollTo({ top: 120, behavior: 'smooth' });
      });
      return;
    }
    await renderResult(results, records[0], records);
  } catch (error) {
    results.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${ICON_BAD}</div>
        <h2>Unable to verify right now</h2>
        <p>${esc(error.message || 'Please try again in a moment.')}</p>
        <button class="btn btn-ink" type="button" onclick="location.reload()">Reload</button>
      </div>`;
  }
}
