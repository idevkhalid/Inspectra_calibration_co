import { verifyCertificate, isConfigured } from './supabase.js';
import { certificateMarkup, makeQrDataUrl, verifyUrlFor, esc, effectiveStatus } from './certificate.js';

export async function renderPrintPage({ serial }) {
  const app = document.getElementById('app');
  document.title = `Certificate ${serial} · Inspectra Calibration Company`;
  app.innerHTML = `
    <div class="print-page" style="padding:24px 0 60px">
      <div class="container" id="printBody">
        <div class="empty-state" style="margin-top:40px">
          <h2>Loading certificate…</h2>
          <p>Retrieving the official record for ${esc(serial)}.</p>
        </div>
      </div>
    </div>`;

  if (!isConfigured) {
    document.getElementById('printBody').innerHTML = `<div class="empty-state" style="margin-top:40px"><h2>Service unavailable</h2><p>The certificate database is not configured.</p></div>`;
    return;
  }

  try {
    const records = await verifyCertificate(serial);
    const cert = records.find((r) => String(r.serial).toUpperCase() === String(serial).toUpperCase()) || records[0];
    if (!cert) throw new Error('No certificate was found with this serial number.');
    const qr = await makeQrDataUrl(verifyUrlFor(cert.serial));
    const status = effectiveStatus(cert);
    document.getElementById('printBody').innerHTML = `
      <div class="print-hide" style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap">
        <a class="btn btn-ghost btn-sm" href="/">Inspectra</a>
        <span style="font-size:12px;color:var(--muted)">
          ${esc(cert.full_name)} · ${esc(cert.serial)} · <strong style="color:${status.key === 'valid' ? 'var(--green)' : 'var(--red)'}">${status.label}</strong>
        </span>
        <div style="margin-left:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <div class="print-size-toggle" role="group" aria-label="Print size">
            <button type="button" data-size="a4" class="is-active">A4 sheet</button>
            <button type="button" data-size="pvc">PVC card 85.6 × 54 mm</button>
          </div>
          <a class="btn btn-ghost btn-sm" href="/verify/${encodeURIComponent(cert.serial)}" data-link>Verification page</a>
          <button class="btn btn-ink btn-sm" type="button" id="printNow">Print / Save PDF</button>
        </div>
      </div>
      <div class="certificate-holder">${certificateMarkup(cert, qr)}</div>
      <p class="help-text print-hide" id="printNote" style="text-align:center;margin-top:16px">
        A4 landscape sheet — the card is printed large for reading and filing. Choose
        “PVC card” to print at the exact physical card size, with printer scaling set to 100 %.
      </p>`;

    document.getElementById('printNow')?.addEventListener('click', () => window.print());

    document.querySelectorAll('[data-size]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pvc = btn.dataset.size === 'pvc';
        document.body.classList.toggle('pvc-size', pvc);
        document
          .querySelectorAll('[data-size]')
          .forEach((b) => b.classList.toggle('is-active', b === btn));
        const note = document.getElementById('printNote');
        if (note) {
          note.textContent = pvc
            ? 'PVC card size (85.6 × 54 mm, CR80) — in the print dialog set scale to 100 % / actual size and enable background graphics.'
            : 'A4 landscape sheet — the card is printed large for reading and filing. Choose “PVC card” to print at the exact physical card size.';
        }
      });
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('size') === 'pvc') {
      document.querySelector('[data-size="pvc"]')?.click();
    }

    if (params.has('print')) {
      setTimeout(() => window.print(), 600);
    }
  } catch (error) {
    document.getElementById('printBody').innerHTML = `
      <div class="empty-state" style="margin-top:40px">
        <h2>Certificate not found</h2>
        <p>${esc(error.message || 'This certificate could not be loaded.')}</p>
        <a class="btn btn-ink" href="/verify">Back to verification</a>
      </div>`;
  }
}
