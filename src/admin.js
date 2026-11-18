import {
  getSession,
  signIn,
  signOut,
  listCertificates,
  saveCertificate,
  deleteCertificate,
  uploadPhoto,
  photoUrl,
  isConfigured
} from './supabase.js';
import {
  PROFESSIONS,
  EQUIPMENT_TYPES,
  effectiveStatus,
  formatDate,
  todayIso,
  addYearsIso,
  esc,
  professionArabic,
  equipmentSuggestionFor
} from './certificate.js';
import { toast } from './layout.js';

const state = {
  session: null,
  certificates: [],
  editing: null,
  pendingPhoto: null,
  removePhoto: false,
  loading: false
};

function shell(inner, { topbar = true } = {}) {
  const top = topbar
    ? `<div class="admin-topbar">
        <div class="container admin-topbar-inner">
          <a class="brand" href="/" data-link><img src="/logo-horizontal.png" alt="Inspectra" /></a>
          <span class="admin-tag">Certificate Administration</span>
          <div class="spacer"></div>
          <a class="btn btn-ghost btn-sm" style="border-color:rgba(255,255,255,.25);color:#fff" href="/" data-link>View site</a>
          ${
            state.session
              ? `<button class="btn btn-gold btn-sm" type="button" id="signOutBtn">Sign out</button>`
              : ''
          }
        </div>
      </div>`
    : '';
  return `<div class="admin-shell">${top}<main class="admin-main"><div class="container">${inner}</div></main></div>`;
}

function loginMarkup() {
  return shell(
    `<section class="login-card">
      <img class="login-logo" src="/logo-horizontal.png" alt="Inspectra Calibration Company" />
      <h1>Administrator sign in</h1>
      <p>Issue certificates, generate serial numbers and manage the verification register.</p>
      <form class="admin-form" id="loginForm">
        <div class="field">
          <label for="loginEmail">Email address</label>
          <input id="loginEmail" type="email" autocomplete="username" required />
        </div>
        <div class="field">
          <label for="loginPassword">Password</label>
          <input id="loginPassword" type="password" autocomplete="current-password" required />
        </div>
        <button class="btn btn-ink" type="submit" id="loginSubmit">Sign in</button>
        <p class="form-message" id="loginMessage" role="status" aria-live="polite"></p>
      </form>
      <p class="help-text" style="text-align:center;margin-top:18px">
        Access is restricted to authorized Inspectra staff.
      </p>
    </section>`,
    { topbar: false }
  );
}

function statsMarkup() {
  const list = state.certificates;
  const valid = list.filter((c) => effectiveStatus(c).key === 'valid').length;
  const soon = list.filter((c) => {
    if (!c.expiry_date) return false;
    const exp = new Date(`${String(c.expiry_date).slice(0, 10)}T00:00:00Z`).getTime();
    const diff = exp - Date.now();
    return diff >= 0 && diff < 30 * 86400000;
  }).length;
  return `
  <div class="admin-stats">
    <div class="admin-stat"><b>${list.length}</b><span>Total certificates</span></div>
    <div class="admin-stat"><b style="color:var(--green)">${valid}</b><span>Currently valid</span></div>
    <div class="admin-stat"><b style="color:var(--amber)">${soon}</b><span>Expiring in 30 days</span></div>
  </div>`;
}

function formMarkup() {
  const cert = state.editing || {};
  const isEdit = Boolean(cert.id);
  const photo = cert.photo_path ? photoUrl(cert.photo_path) : '';
  const today = todayIso();
  return `
  <section class="panel" id="formPanel">
    <div class="panel-head">
      <div>
        <h2 id="formTitle">${isEdit ? 'Edit certificate' : 'Issue a new certificate'}</h2>
        <p id="formSubtitle">
          ${
            isEdit
              ? `Serial <strong>${esc(cert.serial)}</strong> · update the details, photo or validity.`
              : 'A unique serial number is generated automatically when you save.'
          }
        </p>
      </div>
      <button class="btn btn-ghost btn-sm" type="button" id="newCertBtn">New certificate</button>
    </div>

    <form class="admin-form" id="certForm" novalidate>
      <div class="photo-row">
        <div class="photo-preview" id="photoPreview">
          ${photo ? `<img src="${esc(photo)}" alt="Holder photo" />` : '<span style="font-size:10px;text-align:center;line-height:1.4">No photo</span>'}
        </div>
        <div>
          <input class="visually-hidden" type="file" id="photoInput" accept="image/*" />
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" type="button" id="photoPick">Upload photo</button>
            <button class="btn btn-ghost btn-sm" type="button" id="photoClear">Remove</button>
          </div>
          <p class="photo-meta">JPG or PNG, up to 5 MB. Displayed on the certificate and verification page.</p>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="field">
          <label for="fullName">Full name (English) *</label>
          <input id="fullName" name="full_name" type="text" value="${esc(cert.full_name || '')}" placeholder="Mohammed Ali Khan" required />
        </div>
        <div class="field">
          <label for="fullNameAr">Full name (Arabic)</label>
          <input id="fullNameAr" name="full_name_ar" type="text" dir="rtl" lang="ar" value="${esc(cert.full_name_ar || '')}" placeholder="محمد علي خان" />
        </div>
      </div>

      <div class="form-grid-2">
        <div class="field">
          <label for="iqama">Iqama / ID number *</label>
          <input id="iqama" name="iqama" type="text" value="${esc(cert.iqama || '')}" placeholder="2xxxxxxxxx" required />
        </div>
        <div class="field">
          <label for="nationality">Nationality</label>
          <input id="nationality" name="nationality" type="text" value="${esc(cert.nationality || '')}" placeholder="Pakistani" list="nationalityList" />
          <datalist id="nationalityList">
            <option value="Pakistani"></option><option value="Indian"></option><option value="Bangladeshi"></option>
            <option value="Nepali"></option><option value="Filipino"></option><option value="Egyptian"></option>
            <option value="Sudanese"></option><option value="Yemeni"></option><option value="Sri Lankan"></option>
            <option value="Saudi"></option><option value="Other"></option>
          </datalist>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="field">
          <label for="profession">Profession *</label>
          <input id="profession" name="profession" type="text" value="${esc(cert.profession || '')}" placeholder="Concrete Pump Operator" list="professionList" required />
          <datalist id="professionList">
            ${PROFESSIONS.map((p) => `<option value="${esc(p)}"></option>`).join('')}
          </datalist>
          <p class="field-hint" id="professionHint"></p>
        </div>
        <div class="field">
          <label for="employer">Employer / company</label>
          <input id="employer" name="employer" type="text" value="${esc(cert.employer || '')}" placeholder="Company name" />
        </div>
      </div>

      <div class="form-grid-2">
        <div class="field">
          <label for="employerAr">Company name (Arabic)</label>
          <input id="employerAr" name="employer_ar" type="text" dir="rtl" lang="ar" value="${esc(cert.employer_ar || '')}" placeholder="شركة مجد الفحطاني للتجارة والمقاولات" />
        </div>
        <div class="field">
          <label for="examinerName">Examiner name</label>
          <input id="examinerName" name="examiner_name" type="text" value="${esc(cert.examiner_name || '')}" placeholder="Mohammed Imran" />
        </div>
      </div>

      <div class="form-grid-2">
        <div class="field">
          <label for="equipmentType">Equipment type</label>
          <input id="equipmentType" name="equipment_type" type="text" value="${esc(cert.equipment_type || '')}" placeholder="Concrete pump · Mercedes" list="equipmentList" />
          <datalist id="equipmentList">
            ${EQUIPMENT_TYPES.map((e) => `<option value="${esc(e)}"></option>`).join('')}
          </datalist>
        </div>
        <div class="field">
          <label for="equipmentSerial">Equipment serial / base no.</label>
          <input id="equipmentSerial" name="equipment_serial" type="text" value="${esc(cert.equipment_serial || '')}" placeholder="9032 ZRA" />
        </div>
      </div>

      <div class="form-grid-2">
        <div class="field">
          <label for="certType">Certificate type</label>
          <input id="certType" name="certificate_type" type="text" value="${esc(cert.certificate_type || 'Safety Competency Certificate')}" />
        </div>
        <div class="form-grid-2">
          <div class="field">
            <label for="trainingHours">Training hours</label>
            <input id="trainingHours" name="training_hours" type="number" min="0" max="500" value="${cert.training_hours ?? ''}" placeholder="8" />
          </div>
          <div class="field">
            <label for="result">Result</label>
            <select id="result" name="result">
              ${['PASS', 'FAIL', 'COMPETENT'].map((r) => `<option value="${r}" ${(cert.result || 'PASS') === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="field">
          <label for="issueDate">Issue date *</label>
          <input id="issueDate" name="issue_date" type="date" value="${esc(cert.issue_date ? String(cert.issue_date).slice(0, 10) : today)}" required />
        </div>
        <div class="field">
          <label for="expiryDate">Expiry date</label>
          <input id="expiryDate" name="expiry_date" type="date" value="${esc(cert.expiry_date ? String(cert.expiry_date).slice(0, 10) : addYearsIso(today, 1))}" />
        </div>
      </div>

      <div class="form-grid-2">
        <div class="field">
          <label for="status">Status</label>
          <select id="status" name="status">
            ${[
              ['valid', 'Valid'],
              ['suspended', 'Suspended'],
              ['revoked', 'Revoked']
            ]
              .map(([v, l]) => `<option value="${v}" ${(cert.status || 'valid') === v ? 'selected' : ''}>${l}</option>`)
              .join('')}
          </select>
        </div>
        <div class="field">
          <label for="notes">Internal note</label>
          <input id="notes" name="notes" type="text" value="${esc(cert.notes || '')}" placeholder="Optional — not shown publicly" />
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-gold" type="submit" id="saveCertBtn">${isEdit ? 'Save changes' : 'Create certificate'}</button>
        ${
          isEdit
            ? `<a class="btn btn-ghost" href="/certificate/${encodeURIComponent(cert.serial)}" target="_blank" rel="noopener">Preview &amp; print</a>
               <button class="btn btn-danger" type="button" id="deleteCertBtn">Delete</button>`
            : ''
        }
      </div>
      <p class="form-message" id="certFormMessage" role="status" aria-live="polite"></p>
    </form>
  </section>`;
}

function listMarkup() {
  return `
  <section class="panel" id="listPanel">
    <div class="panel-head">
      <div>
        <h2>Certificate register</h2>
        <p>Every certificate issued through this portal, newest first.</p>
      </div>
      <button class="btn btn-ghost btn-sm" type="button" id="refreshCerts">Refresh</button>
    </div>
    <div class="table-toolbar">
      <input id="certSearch" type="search" placeholder="Search by name, serial, Iqama, profession or employer…" autocomplete="off" />
    </div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Holder</th><th>Serial</th><th>Profession</th><th>Validity</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody id="certRows"><tr><td colspan="6">Loading certificates…</td></tr></tbody>
      </table>
    </div>
  </section>`;
}

function rowMarkup(cert) {
  const status = effectiveStatus(cert);
  const badge = status.tone === 'valid' ? 'badge' : status.tone === 'warning' ? 'badge badge-warning' : 'badge badge-danger';
  return `
    <tr>
      <td>
        <span class="cell-strong">${esc(cert.full_name)}</span>
        <span class="cell-sub">${esc(cert.iqama)}${cert.nationality ? ` · ${esc(cert.nationality)}` : ''}</span>
      </td>
      <td><span class="cell-strong">${esc(cert.serial)}</span><span class="cell-sub">${esc(formatDate(cert.issue_date))}</span></td>
      <td>${esc(cert.profession)}</td>
      <td><span class="cell-sub">${esc(formatDate(cert.expiry_date))}</span></td>
      <td><span class="${badge}">${status.label}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" type="button" data-action="edit" data-id="${esc(cert.id)}">Edit</button>
          <button class="icon-btn" type="button" data-action="duplicate" data-id="${esc(cert.id)}">Make copy</button>
          <a class="icon-btn" href="/certificate/${encodeURIComponent(cert.serial)}" target="_blank" rel="noopener">Print</a>
          <button class="icon-btn is-danger" type="button" data-action="delete" data-id="${esc(cert.id)}">Delete</button>
        </div>
      </td>
    </tr>`;
}

function renderRows() {
  const tbody = document.getElementById('certRows');
  if (!tbody) return;
  const term = (document.getElementById('certSearch')?.value || '').trim().toLowerCase();
  const list = state.certificates.filter((c) => {
    if (!term) return true;
    return [c.full_name, c.full_name_ar, c.serial, c.iqama, c.profession, c.employer]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:26px">${
      state.certificates.length ? 'No certificate matches this search.' : 'No certificates yet. Issue the first one using the form above.'
    }</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(rowMarkup).join('');
}

function dashboardMarkup() {
  return shell(`
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:22px">
      <div>
        <h1 class="serif" style="font-size:34px;margin:0 0 4px;font-weight:600">Certificate register</h1>
        <p style="margin:0;color:var(--muted);font-size:13.5px">Signed in as ${esc(state.session?.user?.email || 'administrator')}</p>
      </div>
    </div>
    ${statsMarkup()}
    <div class="admin-grid">
      ${formMarkup()}
      ${listMarkup()}
    </div>
  `);
}

function refreshStats() {
  const host = document.querySelector('.admin-stats');
  if (host) host.outerHTML = statsMarkup();
}

function resetForm() {
  state.editing = null;
  state.pendingPhoto = null;
  state.removePhoto = false;
  const panel = document.getElementById('formPanel');
  if (!panel) return;
  panel.outerHTML = formMarkup();
  bindForm();
}

function fillForm(cert) {
  state.editing = cert;
  state.pendingPhoto = null;
  state.removePhoto = false;
  const panel = document.getElementById('formPanel');
  if (!panel) return;
  panel.outerHTML = formMarkup();
  bindForm();
  document.getElementById('formPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function readForm() {
  const get = (id) => document.getElementById(id)?.value ?? '';
  return {
    full_name: get('fullName'),
    full_name_ar: get('fullNameAr'),
    iqama: get('iqama'),
    nationality: get('nationality'),
    profession: get('profession'),
    employer: get('employer'),
    employer_ar: get('employerAr'),
    examiner_name: get('examinerName'),
    equipment_type: get('equipmentType'),
    equipment_serial: get('equipmentSerial'),
    certificate_type: get('certType'),
    training_hours: get('trainingHours'),
    result: get('result'),
    issue_date: get('issueDate'),
    expiry_date: get('expiryDate'),
    status: get('status'),
    notes: get('notes'),
    photo_path: state.removePhoto ? null : state.editing?.photo_path || null
  };
}

function bindForm() {
  const form = document.getElementById('certForm');
  if (!form) return;
  const message = document.getElementById('certFormMessage');
  const submit = document.getElementById('saveCertBtn');
  const fileInput = document.getElementById('photoInput');

  document.getElementById('photoPick')?.addEventListener('click', () => fileInput?.click());
  document.getElementById('photoClear')?.addEventListener('click', () => {
    state.pendingPhoto = null;
    state.removePhoto = true;
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('photoPreview');
    if (preview) preview.innerHTML = '<span style="font-size:10px;text-align:center;line-height:1.4">No photo</span>';
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    state.pendingPhoto = file;
    state.removePhoto = false;
    const preview = document.getElementById('photoPreview');
    if (preview) {
      preview.innerHTML = '';
      const img = document.createElement('img');
      img.alt = 'Selected photo';
      img.src = URL.createObjectURL(file);
      preview.append(img);
    }
  });

  document.getElementById('newCertBtn')?.addEventListener('click', () => {
    resetForm();
    toast('New certificate form ready.');
  });

  // Fill the matching Arabic name and equipment type as the profession is picked.
  const professionInput = document.getElementById('profession');
  const equipmentInput = document.getElementById('equipmentType');
  const professionHint = document.getElementById('professionHint');
  let lastSuggestion = '';

  const syncProfession = ({ fillEquipment = false } = {}) => {
    const value = professionInput?.value || '';
    const ar = professionArabic(value);
    const suggestion = equipmentSuggestionFor(value);

    if (professionHint) {
      professionHint.textContent = ar ? `${ar}${suggestion ? ` · ${suggestion}` : ''}` : '';
      professionHint.dir = ar ? 'rtl' : 'ltr';
    }

    if (!fillEquipment || !equipmentInput || !suggestion) return;
    const current = equipmentInput.value.trim();
    // Never overwrite a value the admin typed themselves.
    if (current && current !== lastSuggestion) return;
    equipmentInput.value = suggestion;
    lastSuggestion = suggestion;
  };

  professionInput?.addEventListener('input', () => syncProfession({ fillEquipment: true }));
  professionInput?.addEventListener('change', () => syncProfession({ fillEquipment: true }));
  syncProfession();

  document.getElementById('deleteCertBtn')?.addEventListener('click', async () => {
    if (!state.editing?.id) return;
    const cert = state.editing;
    if (!window.confirm(`Delete certificate ${cert.serial} for ${cert.full_name}? This cannot be undone.`)) return;
    try {
      await deleteCertificate(cert.id);
      toast('Certificate deleted.');
      resetForm();
      await loadCertificates();
    } catch (error) {
      toast(error.message || 'Unable to delete this certificate.', { error: true });
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (message) {
      message.textContent = '';
      message.classList.remove('is-success');
    }
    submit.disabled = true;
    const original = submit.textContent;
    submit.textContent = 'Saving…';
    try {
      let photoPath = state.removePhoto ? null : state.editing?.photo_path || null;
      if (state.pendingPhoto) photoPath = await uploadPhoto(state.pendingPhoto);
      const payload = { ...readForm(), photo_path: photoPath };
      const saved = await saveCertificate(payload, state.editing?.id);
      state.editing = saved;
      state.pendingPhoto = null;
      state.removePhoto = false;
      toast(`Saved · serial ${saved.serial}`);
      fillForm(saved);
      await loadCertificates();
    } catch (error) {
      if (message) message.textContent = error.message || 'Unable to save this certificate.';
      toast(error.message || 'Unable to save this certificate.', { error: true });
      submit.disabled = false;
      submit.textContent = original;
    }
  });
}

async function loadCertificates() {
  try {
    state.certificates = await listCertificates();
    refreshStats();
    renderRows();
  } catch (error) {
    const tbody = document.getElementById('certRows');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red);padding:22px">${esc(
        error.message || 'Unable to load certificates.'
      )}</td></tr>`;
    }
  }
}

function bindDashboard(navigate) {
  document.getElementById('signOutBtn')?.addEventListener('click', async () => {
    try {
      await signOut();
      state.session = null;
      state.certificates = [];
      state.editing = null;
      renderAdminPage({ navigate });
      toast('Signed out.');
    } catch (error) {
      toast(error.message || 'Unable to sign out.', { error: true });
    }
  });

  document.getElementById('refreshCerts')?.addEventListener('click', () => loadCertificates());
  document.getElementById('certSearch')?.addEventListener('input', renderRows);

  document.getElementById('certRows')?.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-action]');
    if (!btn) return;
    const cert = state.certificates.find((c) => c.id === btn.dataset.id);
    if (!cert) return;

    if (btn.dataset.action === 'edit') {
      fillForm(cert);
      return;
    }

    if (btn.dataset.action === 'duplicate') {
      const copy = { ...cert, id: undefined, serial: undefined, iqama: '', created_at: undefined, updated_at: undefined };
      fillForm(copy);
      document.getElementById('iqama')?.focus();
      toast('Copy prepared — enter the new Iqama number, then save to generate a new serial.');
      return;
    }

    if (btn.dataset.action === 'delete') {
      if (!window.confirm(`Delete certificate ${cert.serial} for ${cert.full_name}? This cannot be undone.`)) return;
      try {
        await deleteCertificate(cert.id);
        if (state.editing?.id === cert.id) resetForm();
        toast('Certificate deleted.');
        await loadCertificates();
      } catch (error) {
        toast(error.message || 'Unable to delete this certificate.', { error: true });
      }
    }
  });
}

export async function renderAdminPage({ navigate }) {
  document.title = 'Certificate administration · Inspectra Calibration Company';
  const app = document.getElementById('app');

  if (!isConfigured) {
    app.innerHTML = shell(
      `<div class="empty-state" style="margin-top:50px"><h2>Backend not configured</h2><p>Add the Supabase URL and anon key to the environment to use the administration panel.</p></div>`
    );
    return;
  }

  state.session = await getSession();

  if (!state.session) {
    app.innerHTML = loginMarkup();
    document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = document.getElementById('loginMessage');
      const submit = document.getElementById('loginSubmit');
      message.textContent = '';
      submit.disabled = true;
      submit.textContent = 'Signing in…';
      try {
        state.session = await signIn(
          document.getElementById('loginEmail').value,
          document.getElementById('loginPassword').value
        );
        await renderAdminPage({ navigate });
      } catch (error) {
        message.textContent = error.message || 'Unable to sign in.';
        submit.disabled = false;
        submit.textContent = 'Sign in';
      }
    });
    return;
  }

  app.innerHTML = dashboardMarkup();
  bindDashboard(navigate);
  bindForm();
  await loadCertificates();
}
