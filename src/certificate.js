import QRCode from 'qrcode';
import { SITE_URL, photoUrl } from './supabase.js';

/**
 * Profession catalogue. Every trade Inspectra assesses, grouped by the kind of
 * work it belongs to, with its Arabic name (printed on cards) and the equipment
 * that is normally certified with it — the admin form fills this in.
 */
export const PROFESSION_CATALOG = [
  // ---------------------------------------------------------- concrete pumping
  { name: 'Concrete Pump Operator', ar: 'مشغل مضخة الخرسانة', equipment: 'Concrete pump' },
  { name: 'Concrete Pump Assistant', ar: 'مساعد مضخة الخرسانة', equipment: 'Concrete pump' },
  { name: 'Concrete Vibrator Operator', ar: 'مشغل هزاز خرسانة', equipment: 'Concrete vibrator' },
  { name: 'Concrete Saw Operator', ar: 'مشغل منشار خرسانة', equipment: 'Concrete saw' },
  { name: 'Shotcrete Operator', ar: 'مشغل شوت كريت', equipment: 'Shotcrete machine' },

  // -------------------------------------------------------- lifting and rigging
  { name: 'Rigger', ar: 'مسؤول تعليق', equipment: 'Rigging gear' },
  { name: 'Slinger', ar: 'معلّق الأحمال', equipment: 'Rigging gear' },
  { name: 'Banksman', ar: 'مرشد الرافعة', equipment: 'Crane slinging' },
  { name: 'Crane Operator', ar: 'مشغل رافعة', equipment: 'Crane' },
  { name: 'Crane Supervisor', ar: 'مشرف رافعات', equipment: 'Crane' },
  { name: 'Mobile Crane Operator', ar: 'مشغل رافعة متحركة', equipment: 'Mobile crane' },
  { name: 'Boom Truck Operator', ar: 'مشغل شاحنة رافعة', equipment: 'Boom truck' },
  { name: 'Lifting Supervisor', ar: 'مشرف رفع', equipment: 'Lifting plan' },
  { name: 'Forklift Operator', ar: 'مشغل رافعة شوكية', equipment: 'Forklift' },
  { name: 'Telehandler Operator', ar: 'مشغل تيلي هاندلر', equipment: 'Telehandler' },

  // --------------------------------------------------- welding and fabrication
  { name: 'Welder', ar: 'لحام', equipment: 'Welding machine' },
  { name: 'Pipe Welder (TÜV)', ar: 'لحام أنابيب (معتمد من TÜV)', equipment: 'Pipe welding machine · TÜV' },
  { name: 'Pipe Fitter', ar: 'مركّب أنابيب', equipment: 'Pipe fitting tools' },
  { name: 'Fabricator', ar: 'حداد تشكيل', equipment: 'Fabrication tools' },
  { name: 'Welding Inspector', ar: 'مفتش لحام', equipment: 'Welding inspection kit' },
  { name: 'Gas Cutter', ar: 'عامل قطع بالغاز', equipment: 'Oxy-fuel cutting set' },
  { name: 'Arc Air Gouger', ar: 'عامل حفر قوسي', equipment: 'Air carbon arc gouging' },
  { name: 'Sandblaster', ar: 'عامل سفع رملي', equipment: 'Sandblasting unit' },

  // ------------------------------------------------- hot work and power tools
  { name: 'Fire Watch', ar: 'مراقب حريق', equipment: 'Fire watch station' },
  { name: 'Grinder', ar: 'عامل تجليخ', equipment: 'Angle grinder' },
  { name: 'Wood Cutter', ar: 'عامل قطع خشب', equipment: 'Wood cutter' },
  { name: 'Hilti Operator', ar: 'مشغل هيلتي', equipment: 'Hilti tools' },
  { name: 'Jack Hammer Operator', ar: 'مشغل مطرقة هدم', equipment: 'Jack hammer' },
  { name: 'Core Drill Operator', ar: 'مشغل حفر لب', equipment: 'Core drill' },

  // ----------------------------------- confined space, gas testing and rescue
  { name: 'Authorized Gas Tester', ar: 'فاحص غازات معتمد', equipment: 'Multi-gas detector' },
  { name: 'Hole Watcher', ar: 'مراقب فتحات', equipment: 'Confined space entry' },
  { name: 'Standby Man', ar: 'مراقب احتياطي', equipment: 'Confined space entry' },
  { name: 'Confined Space Entrant', ar: 'داخل الأماكن المغلقة', equipment: 'Confined space entry' },
  { name: 'Confined Space Supervisor', ar: 'مشرف أماكن مغلقة', equipment: 'Confined space entry' },
  { name: 'Rescue Team Member', ar: 'عضو فريق إنقاذ', equipment: 'Rescue equipment' },

  // ---------------------------------------------- earthmoving and heavy plant
  { name: 'Excavator Operator', ar: 'مشغل حفارة', equipment: 'Excavator' },
  { name: 'Crawler Excavator Operator', ar: 'مشغل حفارة زحافة', equipment: 'Crawler excavator' },
  { name: 'Backhoe Operator', ar: 'مشغل باكهو', equipment: 'Backhoe loader' },
  { name: 'JCB Operator', ar: 'مشغل JCB', equipment: 'JCB backhoe loader' },
  { name: 'Bobcat Operator', ar: 'مشغل بوبكات', equipment: 'Bobcat / skid-steer loader' },
  { name: 'Wheel Loader Operator', ar: 'مشغل لودر', equipment: 'Wheel loader' },
  { name: 'Bulldozer Operator', ar: 'مشغل بلدوزر', equipment: 'Bulldozer' },
  { name: 'Grader Operator', ar: 'مشغل جريدر', equipment: 'Motor grader' },
  { name: 'Compactor Machine Operator', ar: 'مشغل ماكينة دك', equipment: 'Compactor / roller' },
  { name: 'Roller Operator', ar: 'مشغل رصّاصة', equipment: 'Roller / compactor' },
  { name: 'Dump Truck Driver', ar: 'سائق قلاب', equipment: 'Dump truck' },
  { name: 'Drill Machine Operator', ar: 'مشغل ماكينة حفر', equipment: 'Drill machine' },
  { name: 'Generator Operator', ar: 'مشغل مولد كهرباء', equipment: 'Generator' },
  { name: 'Heavy Equipment Operator', ar: 'مشغل معدات ثقيلة', equipment: 'Heavy equipment' },

  // --------------------------------------------------- electrical and mechanical
  { name: 'Electrician', ar: 'كهربائي', equipment: 'Electrical tools' },
  { name: 'Electrical Technician', ar: 'فني كهرباء', equipment: 'Electrical tools' },
  { name: 'Generator Technician', ar: 'فني مولدات', equipment: 'Generator' },
  { name: 'Mechanical Fitter', ar: 'فني ميكانيكا', equipment: 'Mechanical tools' },
  { name: 'Millwright', ar: 'فني تركيب معدات', equipment: 'Mechanical tools' },

  // -------------------------------------------------- scaffolding and access
  { name: 'Scaffolder', ar: 'عامل سقالات', equipment: 'Scaffolding' },
  { name: 'Scaffolding Supervisor', ar: 'مشرف سقالات', equipment: 'Scaffolding' },
  { name: 'Scaffolding Inspector', ar: 'مفتش سقالات', equipment: 'Scaffolding' },

  // -------------------------------------------------------------------- safety
  { name: 'Safety Officer', ar: 'مسؤول سلامة', equipment: 'Safety equipment' },
  { name: 'Safety Supervisor', ar: 'مشرف سلامة', equipment: 'Safety equipment' },
  { name: 'HSE Officer', ar: 'مسؤول صحة وسلامة وبيئة', equipment: 'Safety equipment' },
  { name: 'First Aider', ar: 'مسعف أولي', equipment: 'First aid kit' },
  { name: 'Fire Fighter', ar: 'رجل إطفاء', equipment: 'Fire fighting equipment' },
  { name: 'Flagman', ar: 'مراقب إشارات', equipment: 'Safety equipment' },

  // -------------------------------------------------------------------- other
  { name: 'Other', ar: 'أخرى', equipment: '' }
];

export const PROFESSIONS = PROFESSION_CATALOG.map((p) => p.name);

export const PROFESSION_AR = Object.fromEntries(
  PROFESSION_CATALOG.map((p) => [p.name, p.ar])
);

/** Equipment names offered as suggestions for the equipment-type field. */
export const EQUIPMENT_TYPES = Array.from(
  new Set(PROFESSION_CATALOG.map((p) => p.equipment).filter(Boolean))
).sort((a, b) => a.localeCompare(b));

const PROFESSION_BY_NAME = new Map(
  PROFESSION_CATALOG.map((p) => [p.name.toLowerCase(), p])
);


/** Arabic name for a profession, or '' when the trade is not in the catalogue. */
export function professionArabic(name) {
  return PROFESSION_AR[name] || '';
}

/** Equipment that is normally certified with this profession ('' if unknown). */
export function equipmentSuggestionFor(name) {
  const key = String(name || '').trim().toLowerCase();
  if (!key) return '';
  const exact = PROFESSION_BY_NAME.get(key);
  if (exact) return exact.equipment;
  const partial = PROFESSION_CATALOG.find(
    (p) => p.name !== 'Other' && key.length >= 4 && p.name.toLowerCase().includes(key)
  );
  return partial ? partial.equipment : '';
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

export function verifyUrlFor(serial) {
  return `${SITE_URL}/verify/${encodeURIComponent(String(serial || ''))}`;
}

export async function makeQrDataUrl(text) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 420,
    color: { dark: '#101820', light: '#ffffff' }
  });
}

export function formatDate(value) {
  if (!value) return '—';
  const raw = String(value).slice(0, 10);
  const [y, m, d] = raw.split('-').map(Number);
  if (!y || !m || !d) return String(value);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

/** 11 / 05 / 2026 — the date layout printed on the physical PVC card. */
export function formatCardDate(value) {
  if (!value) return '—';
  const raw = String(value).slice(0, 10);
  const [y, m, d] = raw.split('-');
  if (!y || !m || !d) return String(value);
  return `${d} / ${m} / ${y}`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addYearsIso(iso, years = 1) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function effectiveStatus(cert) {
  if (!cert) return { key: 'unknown', label: 'Unknown', tone: 'warning' };
  if (cert.status === 'revoked') return { key: 'revoked', label: 'Revoked', tone: 'danger' };
  if (cert.status === 'suspended') return { key: 'suspended', label: 'Suspended', tone: 'warning' };
  const expiry = cert.expiry_date ? String(cert.expiry_date).slice(0, 10) : '';
  if (expiry && expiry < todayIso()) return { key: 'expired', label: 'Expired', tone: 'danger' };
  return { key: 'valid', label: 'Valid', tone: 'valid' };
}

const USER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 21c0-4 3.4-6.9 7.5-6.9s7.5 2.9 7.5 6.9"/></svg>`;

/**
 * Front face of the Inspectra PVC identity card, based on the printed card:
 * navy header with the gold NS mark, holder photo, gold profession band,
 * IQ/PAS/IDNO + issue/expiry dates, company name and QR verification block.
 */
export function certificateMarkup(cert, qrDataUrl) {
  const status = effectiveStatus(cert);
  const photo = cert.photo_path ? photoUrl(cert.photo_path) : '';
  const companyAr = cert.employer_ar
    ? `<div class="cc-company-ar" dir="rtl" lang="ar">${esc(cert.employer_ar)}</div>`
    : '';
  const examiner = cert.examiner_name
    ? `Engr. ${esc(cert.examiner_name)}`
    : 'Engr. Authorized Examiner';

  const photoBlock = photo
    ? `<img class="cc-photo-img" src="${esc(photo)}" alt="Certificate holder photo" crossorigin="anonymous" />`
    : `<div class="cc-photo-empty">${USER_ICON}<span>Holder photo</span></div>`;

  return `
  <article class="cert-card" aria-label="Certificate ${esc(cert.serial)}">
    <header class="cc-head">
      <div class="cc-brand">
        <img class="cc-logo" src="/logo-mark.png" alt="" aria-hidden="true" />
        <div class="cc-brand-text">
          <span class="cc-brand-name">Inspectra</span>
          <span class="cc-brand-sub">Calibration Co</span>
        </div>
      </div>
      <div class="cc-tuv" aria-hidden="true">TUV</div>
    </header>

    <div class="cc-serial-row">
      <span class="cc-serial">${esc(cert.serial)}</span>
    </div>

    <div class="cc-photo-col">
      <div class="cc-photo">${photoBlock}</div>
      <div class="cc-examiner">
        <span class="cc-examiner-label">Examiner:</span>
        <span class="cc-examiner-name">${examiner}</span>
        <span class="cc-examiner-sign" aria-hidden="true">Inspectra</span>
      </div>
    </div>

    <div class="cc-name-block">
      <div class="cc-name-row">
        <span class="cc-label">Name:</span>
        <h2 class="cc-name">${esc(cert.full_name)}</h2>
      </div>
      ${
        cert.full_name_ar
          ? `<p class="cc-name-ar" dir="rtl" lang="ar">${esc(cert.full_name_ar)}</p>`
          : ''
      }
    </div>

    <div class="cc-main">
      <div class="cc-profession"><span>${esc(cert.profession)}</span></div>

      <dl class="cc-fields">
        <div class="cc-field"><dt>IQ/PAS/IDNO:</dt><dd>${esc(cert.iqama)}</dd></div>
        <div class="cc-field"><dt>Date of Issue:</dt><dd>${formatCardDate(cert.issue_date)}</dd></div>
        <div class="cc-field"><dt>Expiry Date:</dt><dd>${formatCardDate(cert.expiry_date)}</dd></div>
        <div class="cc-field"><dt>Co.Name:</dt><dd>${esc(cert.employer || '—')}</dd></div>
      </dl>
      ${companyAr}
    </div>

    <div class="cc-qr-col">
      <div class="cc-qr-box">
        ${qrDataUrl ? `<img class="cc-qr-img" src="${qrDataUrl}" alt="QR code linking to the verification page for ${esc(cert.serial)}" />` : ''}
        <img class="cc-qr-mark" src="/logo-mark.png" alt="" aria-hidden="true" />
      </div>
      <span class="cc-qr-label">Scan to verify</span>
      <span class="cc-status cc-status-${status.tone}">${status.label}</span>
    </div>

    <footer class="cc-foot">
      <span>Inspectra Calibration Co. · Safety Division</span>
      <span class="cc-foot-site">www.inspectra-sa.com</span>
      <span>Cert. No. ${esc(cert.serial)}</span>
    </footer>
  </article>`;
}

/**
 * Public verification record — the yellow-label / grey-value table used on the
 * Inspectra mobile verification screen, with the holder photo and status pill.
 */
export function verificationTableMarkup(cert) {
  const status = effectiveStatus(cert);
  const photo = cert.photo_path ? photoUrl(cert.photo_path) : '';
  const phonics = photo
    ? `<img src="${esc(photo)}" alt="Photo of ${esc(cert.full_name)}" crossorigin="anonymous" />`
    : `<div class="vr-photo-empty">${USER_ICON}</div>`;

  const rows = [
    ['Operator name', cert.full_name],
    ['Residence or ID number', cert.iqama],
    ['Equipment type', cert.equipment_type || '—'],
    ['Type of function/equipment', cert.profession],
    ['Certificate serial', cert.serial],
    ['Serial number or base', cert.equipment_serial || '—'],
    ['Company name', cert.employer || '—'],
    ['Certificate start date', String(cert.issue_date || '').slice(0, 10) || '—'],
    ['Certificate end date', String(cert.expiry_date || '').slice(0, 10) || '—']
  ];

  const badgeClass =
    status.tone === 'valid' ? 'is-active' : status.tone === 'warning' ? 'is-warning' : 'is-blocked';
  const badgeLabel = status.key === 'valid' ? 'active' : status.label.toLowerCase();

  return `
  <section class="vr-card" aria-label="Verification record for ${esc(cert.full_name)}">
    <header class="vr-head">
      <img src="/logo-horizontal.png" alt="Inspectra Calibration Company" />
    </header>
    <div class="vr-body">
      <div class="vr-photo">${phonics}</div>
      <table class="vr-table">
        <tbody>
          ${rows
            .map(
              ([label, value]) =>
                `<tr><th scope="row">${esc(label)}</th><td>${esc(value)}</td></tr>`
            )
            .join('')}
          <tr>
            <th scope="row">Certificate status</th>
            <td><span class="vr-status ${badgeClass}">${esc(badgeLabel)}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>`;
}
