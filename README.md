# Inspectra Calibration Company — Certificate Verification Portal

A complete certificate issuance and public verification platform for Inspectra
Calibration Company, built with Vite, vanilla JavaScript and Supabase.

## What it does

**Public site**

- Search the certificate register by serial number, Iqama / ID number or holder name.
- Each certificate page shows the official record: holder name (English + Arabic),
  photo, Iqama, equipment, profession, employer (English + Arabic), certificate serial,
  issue date, expiry date and a live **Valid / Expired / Revoked** status.
- Every certificate carries a QR code that opens
  `https://<site>/verify/<serial>` directly — scanning it shows the holder's record
  with no typing.
- Print / Save-as-PDF view (`/certificate/<serial>`) rendered as the Inspectra PVC
  identity card, matching the printed card: navy header with the NS mark and TUV,
  holder photo, gold profession band, `IQ/PAS/IDNO`, issue / expiry dates, company
  name (English + Arabic), examiner signature and QR block.
  - **A4 sheet** (default) prints the card large for filing and emailing.
  - **PVC card 85.6 × 54 mm** prints at the exact CR80 card size for card printers — or
    open `/certificate/<serial>?size=pvc` directly.

**Admin panel** (`/admin`)

- Email + password sign-in (Supabase Auth).
- Issue certificates; serial numbers are generated automatically
  (`INS-2026-01001`, `INS-2026-01002`, …).
- Upload and change the holder photo.
- Record the Arabic company name, examiner, equipment type and equipment serial /
  base number — all of these appear on the printed card and the verification record.
- **Make copy** duplicates an existing certificate (same name, photo, profession,
  employer, equipment and dates) and clears the Iqama so you only enter the new
  Iqama — saving generates a fresh serial number. This is how you produce any number
  of copies.
- Edit, revoke/suspend, delete and search the register.
- Status is calculated automatically: a certificate past its expiry date shows as
  **Expired** on the public page.
- Picking a profession shows its Arabic name and pre-fills the matching equipment
  type, so cards stay consistent across operators.

## Supported professions

The profession field accepts free text, but the catalogue in
`src/certificate.js` (`PROFESSION_CATALOG`) drives the suggestions, the Arabic
name and the equipment hint. Each entry is `{ name, ar, equipment }`.
`EQUIPMENT_TYPES` is derived from it and backs the equipment-type picker.

| Family | Professions |
| --- | --- |
| Concrete pumping | Concrete Pump Operator, Concrete Pump Assistant, Concrete Vibrator Operator, Concrete Saw Operator, Shotcrete Operator |
| Lifting & rigging | Rigger, Slinger, Banksman, Crane Operator, Crane Supervisor, Mobile Crane Operator, Boom Truck Operator, Lifting Supervisor, Forklift Operator, Telehandler Operator |
| Welding & fabrication | Welder, Pipe Welder (TÜV), Pipe Fitter, Fabricator, Welding Inspector, Gas Cutter, Arc Air Gouger, Sandblaster |
| Hot work & power tools | Fire Watch, Grinder, Wood Cutter, Hilti Operator, Jack Hammer Operator, Core Drill Operator |
| Confined space & rescue | Authorized Gas Tester, Hole Watcher, Standby Man, Confined Space Entrant, Confined Space Supervisor, Rescue Team Member |
| Earthmoving & heavy plant | Excavator Operator, Crawler Excavator Operator, Backhoe Operator, JCB Operator, Bobcat Operator, Wheel Loader Operator, Bulldozer Operator, Grader Operator, Compactor Machine Operator, Roller Operator, Dump Truck Driver, Drill Machine Operator, Generator Operator, Heavy Equipment Operator |
| Electrical & mechanical | Electrician, Electrical Technician, Generator Technician, Mechanical Fitter, Millwright |
| Scaffolding & access | Scaffolder, Scaffolding Supervisor, Scaffolding Inspector |
| Safety | Safety Officer, Safety Supervisor, HSE Officer, First Aider, Fire Fighter, Flagman |
| Other | Other |

Every profession carries its Arabic name and a default equipment type, for example
Pipe Welder (TÜV) → لحام أنابيب (معتمد من TÜV) → `Pipe welding machine · TÜV`.

Add a trade by appending one object to `PROFESSION_CATALOG`; the admin datalist,
the Arabic hint and the equipment autofill all pick it up automatically.

## Local development

```bash
npm install
cp .env.example .env      # then fill in the two Supabase values
npm run dev
```

## Supabase setup (one time)

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. (Optional) run `supabase/seed.sql` to load five demo certificates.
4. Create the administrator:
   - **Authentication → Users → Add user** with the staff email and a strong
     password, and tick *Auto confirm*.
   - Copy the new user's UUID, then run:

     ```sql
     insert into public.admins (user_id, note)
     values ('<user-uuid>', 'Certificate administrator');
     ```
5. Copy **Project URL** and the **anon public** key into `.env`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
6. Set `VITE_SITE_URL` to the public domain so QR codes point at the right host.

## Deploy

The site is a static Vite build. On Vercel:

```bash
npm run build
vercel deploy --prod
```

Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_SITE_URL` to the Vercel
project environment variables before building. `vercel.json` rewrites the pretty
URLs (`/verify/...`, `/certificate/...`, `/admin`) to the single-page app.

**Current live deployment**

- Site: https://inspectra-certificates.vercel.app
- Supabase project: `inspectra-certificates` (ref `sepzvbwzcmnyjksxhbjt`, region Mumbai)
- Admin sign-in: `/admin` — the account was created for the client and the password
  should be changed after first login (Supabase → Authentication → Users).

### Issuing a copy of a certificate

1. Open `/admin` and sign in.
2. Find the original record and press **Make copy**. The form is filled with the same
   name, photo, profession, employer and dates, and the Iqama field is cleared.
3. Type the new Iqama (and change the name / profession if needed) and press
   **Create certificate**. A brand-new serial number is generated.
4. Press **Preview & print** to open the card and save it as a PDF, or print it
   directly. The QR code on it already points at the new record. Choose **A4 sheet**
   for a large copy or **PVC card** for the exact physical card size (print at 100 %
   / actual size, with background graphics on).

## Upgrading an existing database

`supabase/schema.sql` is idempotent and can be re-run on an existing project: it adds
the `employer_ar`, `examiner_name`, `equipment_type` and `equipment_serial` columns if
they are missing, and replaces the `verify_certificate` function so the public
verification record includes them.

## Notes

- Photographs are stored in the public `certificate-photos` Supabase Storage bucket
  because they must be visible on the public verification page.
- The `verify_certificate` database function is the only public read path; the
  `certificates` table itself is protected by row-level security and is readable
  only by administrators.
- The certificate design is HTML/CSS, so colours, wording and layout can be edited
  in `src/certificate.js` and `src/styles.css`. The card face is built on the
  `certificate-photos` / `logo-mark.png` artwork derived from the Inspectra logo, so
  it stays sharp at both A4 and CR80 sizes.
