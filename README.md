# Absensi RS Arun

Progressive Web App (PWA) mobile-first untuk karyawan RS Arun Lhokseumawe.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Untuk pemeriksaan sebelum deploy:

```bash
npm run lint
npm run build
```

Atur `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `.env.local`
untuk Supabase Auth. Modul admin juga membutuhkan `SUPABASE_SERVICE_ROLE_KEY`
agar server dapat membuat akun Auth dengan email dan password yang dimasukkan
admin. Simpan key tersebut hanya di environment server; jangan gunakan prefix
`NEXT_PUBLIC_` atau kirim key ke kode browser.

Untuk pengembangan lokal, tambahkan `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local`
dan mulai ulang server setelah mengubah file. Di production, atur key yang sama
di environment variables milik host aplikasi. Ambil key dari Supabase Project
Settings → API Keys; jangan masukkan nilainya ke source control.

## Struktur folder

```text
app/
  admin/                 Dashboard ringkasan admin
    data/                 Modul akun, unit, grup jadwal, dan jam kerja
    laporan/              Rekap per unit dan unduhan PDF
  login/                 Halaman login karyawan
  offline/               Fallback saat navigasi offline
  profil/                Profil dan keluar dari akun
  riwayat/               Riwayat presensi
  page.tsx               Beranda karyawan
components/
  attendance/            Komponen waktu dan presensi
  auth/                  Form login dan tombol keluar
  pwa/                   Status koneksi dan pemasangan PWA
lib/
  supabase/              Klien Supabase browser dan server
public/
  icon.svg               Ikon aplikasi
  manifest.json          Metadata instalasi PWA
  sw.js                  Service worker dan offline fallback
proxy.ts                 Penyegaran sesi serta gerbang route
```

## Sesi dan navigasi

- Supabase Auth menggunakan email dan password; akun perlu dibuat atau
  dibuat oleh admin dari modul kelola data.
- `/`, `/riwayat`, dan `/profil` memerlukan sesi. `/login` mengarahkan pengguna
  yang sudah masuk ke beranda. Route offline tetap publik.
- `/admin` hanya dapat dibuka akun dengan `role = 'admin'` pada profil
  karyawan. Verifikasi role dilakukan di server, dan RLS membatasi data admin.
- Pemeriksaan sesi dilakukan satu kali di `proxy.ts`. Komponen tidak membuat
  redirect otomatis, dan tidak ada efek React yang memperbarui dependensinya
  sendiri.
- Route protection ini membuktikan identitas, bukan peran pegawai. Batasi akun
  Supabase yang dibuat untuk aplikasi ini kepada karyawan, dan terapkan
  Row-Level Security (RLS) sebelum menyajikan data personal dari database.

## Status integrasi

Login Supabase dan sesi cookie telah disiapkan. Beranda, profil, dan riwayat
membaca tabel profil/absensi setelah migrasi serta data aktual tersedia.
Karyawan dapat melakukan cek in dan cek out kapan saja melalui tombol di
beranda; waktu dicatat dari server dan tanggal kerja mengikuti zona waktu Aceh
(WIB). Geofencing belum diterapkan.

Service worker hanya menyimpan halaman offline generik. Halaman akun, respons
autentikasi, serta data presensi tidak disimpan ke cache offline.

## Menyiapkan data Supabase

1. Jalankan seluruh skrip migrasi di folder
   `supabase/migrations/` melalui Supabase SQL Editor. Migrasi ini membuat
   tabel dasar (bila belum ada), role dan RLS untuk akses mandiri karyawan,
   tindakan cek in/cek out, serta unit kerja, grup jadwal, status karyawan,
   dan jam kerja untuk admin.
2. Buat akun admin pertama di Supabase Auth, lalu buat profil awalnya secara
   manual. Nilai `id` harus sama dengan UUID pengguna di
   **Authentication → Users**. Contoh:

   ```sql
   insert into public.employee_profiles
     (id, employee_number, full_name, department, position, shift_name)
   select
     id,
     'ADMIN001',
     'Nama Admin',
     'Administrasi',
     'Administrator',
     'Admin'
   from auth.users
   where email = 'admin@rumahsakit.com'
   on conflict (id) do update set
     employee_number = excluded.employee_number,
     full_name = excluded.full_name,
     department = excluded.department,
     position = excluded.position,
     shift_name = excluded.shift_name,
     updated_at = now();
   ```

   Ganti nilai contoh dengan data resmi. Query tidak mengubah apa pun bila
   email tidak ditemukan; pastikan email cocok dengan akun yang sudah dibuat.
3. Tetapkan role admin hanya kepada akun administrator tepercaya:

   ```sql
   update public.employee_profiles
   set role = 'admin', updated_at = now()
   where id = (
     select id from auth.users
     where email = 'admin@rumahsakit.com'
   );
   ```

   Pastikan profil untuk email itu sudah dibuat sebelum menjalankan query.
   Setelah itu admin dapat membuat unit, jam kerja, dan akun karyawan dari
   `/admin/data`; email dan password akun dimasukkan langsung oleh admin.
4. Masukkan hanya catatan presensi nyata ke `attendance_records` melalui proses
   administrasi yang tepercaya. Jangan membuat catatan contoh untuk produksi.

Kebijakan RLS pada migrasi memberi setiap karyawan akses baca ke profil dan
presensinya sendiri, izin cek in/cek out hanya untuk presensinya sendiri, serta
akses baca lintas karyawan kepada admin. Mutasi data admin dilakukan melalui
aksi server yang memverifikasi role admin; pembuatan akun memakai service-role
key server-side dan password tidak disimpan di tabel profil.

Laporan tersedia di `/admin/laporan`, dapat difilter berdasarkan tanggal dan
unit kerja, dan dapat diunduh sebagai PDF. Untuk karyawan shift, laporan
menggunakan jadwal yang dipilih ketika cek in untuk menghitung keterlambatan
dan pulang cepat. Catatan tanpa jadwal aktual yang terpetakan tetap ditampilkan
tanpa perhitungan waktu tersebut. Laporan merangkum catatan yang tersimpan dan
tidak menganggap hari tanpa catatan sebagai absen karena kalender hari kerja
belum diatur. Rentang laporan dibatasi maksimal 366 hari.

Di `/admin/data`, buat grup jadwal (misalnya `Perawat Shift`), lalu petakan
jadwal pagi/siang/malam ke grup itu. Saat membuat akun karyawan, pilih unit
kerja, grup jadwal, dan status karyawan (`Harian` atau `Shift`); jadwal
individual tidak dipilih pada form karyawan. Laporan tetap menampilkan grup
karyawan.

Saat karyawan berstatus `Shift` melakukan cek in, aplikasi meminta pilihan
jadwal dari grup karyawan dan menyimpan jadwal terpilih pada catatan presensi.
Karyawan `Harian` tetap cek in tanpa pilihan jadwal. Terapkan migrasi
`20261007180000_add_employee_shift_checkin_selection.sql` untuk mengaktifkan
kolom, kebijakan akses, dan validasi grup pada presensi.
Profil karyawan yang sudah ada mendapat status awal `Harian`; ubah status dan
grupnya dari tab **Status karyawan** di `/admin/data`. Migrasi
`20261007190000_enable_admin_employee_schedule_mapping.sql` mengaktifkan
pemetaan tersebut oleh admin.
