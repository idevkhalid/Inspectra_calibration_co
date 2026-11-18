const CHECK = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`;
const SHIELD = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>`;

export function homeMarkup() {
  return `
  <section class="hero">
    <div class="container hero-inner">
      <div>
        <p class="eyebrow">Official certificate verification</p>
        <h1>Trust every certificate.<br /><em>Verify it in seconds.</em></h1>
        <p class="hero-copy">
          Confirm the authenticity of Inspectra Calibration Company competency certificates for
          concrete pump operators, flagmen, fire watch personnel and other safety-critical roles.
          Enter the serial number, Iqama or holder name to view the official record and photo.
        </p>
        <ul class="hero-points">
          <li>${CHECK} Instant online results</li>
          <li>${CHECK} Photo and full details</li>
          <li>${CHECK} QR code on every certificate</li>
        </ul>
      </div>
      <div class="search-card">
        <h2>Search a certificate</h2>
        <p>Use the serial number printed on the certificate, the holder's Iqama / ID number, or the full name.</p>
        <form class="search-form" id="homeSearchForm" novalidate>
          <div class="field">
            <label for="homeSearchInput">Serial number, Iqama / ID or name</label>
            <input
              id="homeSearchInput"
              name="q"
              type="text"
              placeholder="e.g. INS-2026-01001 or 2xxxxxxxxx"
              autocomplete="off"
              required
            />
          </div>
          <button class="btn btn-ink" type="submit">${SHIELD} Verify certificate</button>
          <p class="form-message" id="homeSearchMessage" role="status" aria-live="polite"></p>
        </form>
        <p class="help-text" style="margin-top:14px">
          Scanning the QR code on a certificate opens its record directly — no typing required.
        </p>
      </div>
    </div>
  </section>

  <section class="section" id="how-it-works">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow" style="justify-content:center">How it works</p>
        <h2>Three steps to certainty</h2>
        <p>Each certificate carries a unique serial number and a QR code linked to this portal.</p>
      </div>
      <div class="steps">
        <article class="step-card">
          <span class="step-num">01</span>
          <h3>Scan or search</h3>
          <p>Scan the QR code on the certificate with any phone camera, or type the serial number, Iqama or name here.</p>
        </article>
        <article class="step-card">
          <span class="step-num">02</span>
          <h3>Review the record</h3>
          <p>The portal retrieves the official record from our secure database, including the holder's photo, profession and validity dates.</p>
        </article>
        <article class="step-card">
          <span class="step-num">03</span>
          <h3>Confirm and keep</h3>
          <p>A green <strong>Valid</strong> status means the certificate is genuine and current on the date of verification.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="stats-strip">
    <div class="container">
      <div class="stats">
        <div class="stat"><b>100%</b><span>Online verification</span></div>
        <div class="stat"><b>&lt; 3s</b><span>Average result time</span></div>
        <div class="stat"><b>24 / 7</b><span>Portal availability</span></div>
        <div class="stat"><b>KSA</b><span>Nationwide coverage</span></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow" style="justify-content:center">Certified roles</p>
        <h2>Built for safety-critical work</h2>
        <p>Competency certificates issued for personnel working on construction and industrial sites.</p>
      </div>
      <div class="industry-grid">
        <div class="industry">Concrete Pump Operator</div>
        <div class="industry">Flagman</div>
        <div class="industry">Fire Watch</div>
        <div class="industry">Rigger</div>
        <div class="industry">Crane Operator</div>
        <div class="industry">Scaffolder</div>
        <div class="industry">Electrician</div>
        <div class="industry">Safety Officer</div>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="cta-band">
        <div>
          <h2>Need to confirm a certificate right now?</h2>
          <p>The verification portal is available around the clock for employers, inspectors and site managers.</p>
        </div>
        <a class="btn btn-gold" href="/verify" data-link>Open verification</a>
      </div>
    </div>
  </section>`;
}

export function bindHome(navigate) {
  const form = document.getElementById('homeSearchForm');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('homeSearchInput');
    const message = document.getElementById('homeSearchMessage');
    const value = input.value.trim();
    if (!value) {
      message.textContent = 'Enter a serial number, Iqama / ID or name to search.';
      input.focus();
      return;
    }
    message.textContent = '';
    navigate(`/verify/${encodeURIComponent(value)}`);
  });
}
