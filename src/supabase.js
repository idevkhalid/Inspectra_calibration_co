import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const PHOTO_BUCKET = 'certificate-photos';

export const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

function requireClient() {
  if (!supabase) {
    throw new Error(
      'The verification service is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the environment.'
    );
  }
  return supabase;
}

function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  const message = String(error.message || '');
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.';
  if (/email not confirmed/i.test(message)) return 'This account has not been confirmed yet.';
  if (/duplicate key|unique constraint/i.test(message)) {
    return 'That serial number or Iqama already exists. Change the value and try again.';
  }
  if (/row-level security/i.test(message)) return 'You do not have permission to do that.';
  return message || fallback;
}

/* --------------------------------------------------------------- public API */

export async function verifyCertificate(query) {
  const client = requireClient();
  const q = String(query || '').trim();
  if (!q) return [];
  const { data, error } = await client.rpc('verify_certificate', { p_query: q });
  if (error) throw new Error(friendlyError(error, 'Unable to check this certificate right now.'));
  return Array.isArray(data) ? data : [];
}

export function photoUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const client = requireClient();
  return client.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/* ---------------------------------------------------------------- admin API */

export async function getSession() {
  const client = requireClient();
  const { data } = await client.auth.getSession();
  return data?.session || null;
}

export function onAuthChange(handler) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => handler(session));
  return () => data?.subscription?.unsubscribe?.();
}

export async function signIn(email, password) {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: String(email || '').trim(),
    password: String(password || '')
  });
  if (error) throw new Error(friendlyError(error, 'Unable to sign in.'));
  return data.session;
}

export async function signOut() {
  const client = requireClient();
  const { error } = await client.auth.signOut();
  if (error) throw new Error(friendlyError(error, 'Unable to sign out.'));
}

export async function listCertificates() {
  const client = requireClient();
  const { data, error } = await client
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(friendlyError(error, 'Unable to load certificates.'));
  return data || [];
}

export async function getCertificateAdmin(id) {
  const client = requireClient();
  const { data, error } = await client.from('certificates').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(friendlyError(error, 'Unable to load this certificate.'));
  return data;
}

function cleanPayload(payload) {
  const body = {
    full_name: String(payload.full_name || '').trim(),
    full_name_ar: String(payload.full_name_ar || '').trim() || null,
    iqama: String(payload.iqama || '').trim(),
    nationality: String(payload.nationality || '').trim() || null,
    profession: String(payload.profession || '').trim(),
    employer: String(payload.employer || '').trim() || null,
    employer_ar: String(payload.employer_ar || '').trim() || null,
    examiner_name: String(payload.examiner_name || '').trim() || null,
    equipment_type: String(payload.equipment_type || '').trim() || null,
    equipment_serial: String(payload.equipment_serial || '').trim() || null,
    certificate_type: String(payload.certificate_type || '').trim() || 'Safety Competency Certificate',
    training_hours:
      payload.training_hours === '' || payload.training_hours === null || payload.training_hours === undefined
        ? null
        : Number(payload.training_hours),
    result: String(payload.result || 'PASS').trim().toUpperCase(),
    issue_date: payload.issue_date || null,
    expiry_date: payload.expiry_date || null,
    status: String(payload.status || 'valid'),
    notes: String(payload.notes || '').trim() || null,
    photo_path: payload.photo_path || null
  };
  if (!body.full_name) throw new Error('Full name is required.');
  if (!body.iqama) throw new Error('Iqama / ID number is required.');
  if (!body.profession) throw new Error('Profession is required.');
  if (!body.issue_date) throw new Error('Issue date is required.');
  return body;
}

export async function saveCertificate(payload, id) {
  const client = requireClient();
  const body = cleanPayload(payload);
  if (id) {
    const { data, error } = await client.from('certificates').update(body).eq('id', id).select('*').single();
    if (error) throw new Error(friendlyError(error, 'Unable to save this certificate.'));
    return data;
  }
  const { data, error } = await client.from('certificates').insert(body).select('*').single();
  if (error) throw new Error(friendlyError(error, 'Unable to create this certificate.'));
  return data;
}

export async function deleteCertificate(id) {
  const client = requireClient();
  const { error } = await client.from('certificates').delete().eq('id', id);
  if (error) throw new Error(friendlyError(error, 'Unable to delete this certificate.'));
}

export async function uploadPhoto(file) {
  const client = requireClient();
  if (!file) return null;
  if (!/^image\//.test(file.type)) throw new Error('Choose an image file for the photo.');
  if (file.size > 5 * 1024 * 1024) throw new Error('The photo must be smaller than 5 MB.');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage.from(PHOTO_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type
  });
  if (error) throw new Error(friendlyError(error, 'Unable to upload the photo.'));
  return path;
}
