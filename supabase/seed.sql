-- Demo records so the verification portal and admin register are not empty
-- on a fresh install. Delete them from the admin panel once real certificates
-- are issued.
do $$
begin
  if not exists (select 1 from public.certificates) then
    insert into public.certificates
      (full_name, full_name_ar, iqama, nationality, profession, employer, employer_ar,
       examiner_name, equipment_type, equipment_serial,
       certificate_type, training_hours, result, issue_date, expiry_date, status)
    values
      ('Mohammed Ali Khan', 'محمد علي خان', '2456789012', 'Pakistani',
       'Concrete Pump Operator', 'Al Rajhi Construction', 'شركة الراجحي للإنشاءات',
       'Mohammed Imran', 'Concrete pump · Mercedes', '9032 ZRA',
       'Safety Competency Certificate', 8, 'PASS', '2026-02-10', '2027-02-09', 'valid'),
      ('Rajesh Kumar', 'راجيش كومار', '2387654321', 'Indian',
       'Flagman', 'NESMA & Partners', 'شركة نمسا وشركاؤها',
       'Mohammed Imran', 'Safety equipment', 'FLG-2210',
       'Safety Competency Certificate', 6, 'PASS', '2026-03-04', '2027-03-03', 'valid'),
      ('Abdul Karim Mia', 'عبد الكريم ميا', '2512345678', 'Bangladeshi',
       'Fire Watch', 'Binladin Contracting Group', 'مجموعة بن لادن السعودية',
       'Mohammed Imran', 'Fire watch station', 'FW-1180',
       'Safety Competency Certificate', 4, 'PASS', '2026-05-18', '2027-05-17', 'valid'),
      ('Yaqoub Ibrahim Yaqoub', 'يعقوب إبراهيم يعقوب', '2559278979', 'Sudanese',
       'Pipe Welder (TÜV)', 'Omar Al-Asr Al-Hadith Contracting', 'شركة عمر العصر الحديث للمقاولات',
       'Mohammed Afzal A.', 'Pipe welding machine · TÜV', 'WO-8979',
       'Welder Performance Certificate', 12, 'PASS', '2026-05-25', '2027-05-24', 'valid'),
      ('Mohammad Kaleem Abbasi', 'محمد كليم عباسي', '2376388811', 'Pakistani',
       'Concrete Pump Operator', 'Haif Ready Mix Co', 'شركة هيف للخرسانة الجاهزة',
       'Mohammed Imran', 'MERSEDES', '9032 ZRA',
       'Safety Competency Certificate', 8, 'PASS', '2026-05-07', '2027-05-06', 'valid'),
      ('Noor Hassan Ali', 'نور حسن علي', '2401234567', 'Indian',
       'Authorized Gas Tester', 'Saudi Aramco Contracting', 'شركة أرامكو السعودية للمقاولات',
       'Mohammed Imran', 'Multi-gas detector', 'GT-4410',
       'Safety Competency Certificate', 6, 'PASS', '2026-06-02', '2027-06-01', 'valid');
  end if;
end $$;
