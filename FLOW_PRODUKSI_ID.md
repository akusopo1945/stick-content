# FLOW PRODUKSI — dari Ide ke Video Stickman (AI-First, Terstruktur)

> **Objektif:** menjadikan produksi video stickman sebagai *tools terstruktur* — urutannya jelas, artefaknya jelas, quality gate-nya jelas — **tapi tetap digerakkan AI** (aku: brainstorming, riset, judul/tema, naskah, teks narasi, animasi, build, render, QA). **Suara/voice selalu milik manusia** — AI tidak pernah generate TTS. Manusia memegang **keputusan kreatif** di setiap gerbang; AI yang mengeksekusi tanpa harus dituntun langkah demi langkah.
>
> Prinsipnya satu: **perintah manusia cukup di level brief** ("buatkan tema lainnya"), yang mengisi detailnya adalah AI. Begitu sebuah tahap selesai, AI lanjut ke tahap berikutnya tanpa menunggu instruksi baru.

---

## 1. Struktur folder (konvensi tetap)

```
G:/PROJECTAN/stick/
├── FLOW_PRODUKSI_ID.md        <- dokumen ini (sop)
├── build.py                   <- glue audio + timing + wrapper + Root
├── gen_<slug>.py              <- LEGACY (TTS). JANGAN dipakai lagi.
├── gen_gemini.py / gen_*.py   <- generator lama, referensi saja
├── research/<slug>.md         <- catatan riset + naskah rekam (opsional tapi disarankan)
└── gemini_in/
    └── <slug>/                <- folder audio per video (wajib, REKAMAN MANUSIA)
        ├── 1.mp3              <- audio scene 1
        ├── 2.mp3              <- audio scene 2
        ├── ...                <- satu file per scene, jumlah mengikuti naskah
        └── N.mp3              <- audio scene terakhir
    └── koran/  └── pemakzulan/  ...   <- satu folder per video

stickman-story/
├── src/scripts/<slug>.json          <- script deklaratif: SENJATA tunggal tiap video
├── src/scripts/<slug>.built.json    <- hasil build (timing), jangan edit
├── src/scenes/<CompositionId>.tsx   <- auto-generated, jangan edit manual
├── src/scenes/<EngineName>Engine.tsx<- engine visual (1 tema = 1 engine)
└── out/<slug>.mp4                   <- hasil render final
```

**Aturan penamaan slug:** satu kata pendek, huruf kecil, gampang diucapkan: `koran`, `pemakzulan`, `wapres`. `compositionId` = PascalCase + `Story` (`KoranStory`).

---

## 2. Alur 7 tahap

### Tahap 0 — Brief (dari manusia)
Manusia cukup memberikan arah kasar: topik, arah visual, atau "buatkan yang lain". AI menyimpulkan sisanya dan **tidak mengembalikan pertanyaan** kalau masih bisa diputuskan sendiri (sesuai SOUL: resourceful dulu, baru tanya).

**Gerbang 0:** kalau arahnya ambigu *dan* menyangkut orang nyata (nama, dakwaan, klaim hukum) → AI tanya dulu sebelum riset.

### Tahap 1 — Brainstorming & sudut pandang (AI)
AI menyusun 2–3 pilihan sudut dari satu isu, lalu memilih yang paling kuat dengan kriteria:
- **Relevansi:** sedang dibicarakan orang *saat ini* (ada berita ≤ 2 minggu terakhir).
- **Konflik jelas:** ada dua fakta yang bertabrakan ("angka bagus vs kenyataan", "hak vs janji").
- **Bisa divisualkan:** translate jadi adegan stickman (tanya, data, 3 sebab, dua kubu, penutup).

Output Tahap 1 = satu kalimat angle yang dipakai di semua tahap berikutnya. Contoh KoranStory:
> *"Beras mahal, petani katanya sejahtera — kok hasil pintar?"*

### Tahap 2 — Riset BERF AKTA (AI)
AI wajib `WebSearch` + `WebFetch` sumber primer (Antara, BPS, AP, CNBC), lalu mencatat ke `research/<slug>.md` dengan format:

| Angka/klaim | Nilai | Sumber | Tanggal |
|---|---|---|---|
| NTP Okt 2026 | 132,60 (+1,13%) | Antara/BPS | 2 Nov 2026 |
| Beras premium | Rp16.203/kg | Panel Harga Bapanas | 5 Nov 2026 |

**Aturan keras:** hanya klaim yang punya sumber + tanggal yang boleh masuk narasi. Klaim tanpa sumber dibuang, bukan dikarang. Kalau sumbernya bertentangan, sudut yang dipakai harus yang **paling berhati-hati** (framing pertanyaan: "kenapa…?", bukan tuduhan).

**Gerbang 2:** kalau isu bersifat hukum/menuduh orang tertentu dengan sumber lemah → tanya manusia sebelum lanjut.

### Tahap 3 — Judul, tema & pilihan engine (AI)
AI memilih empat hal sekaligus:
1. **Slug + judul** (buat nama folder `gemini_in/<slug>` dan judul file `out/<slug>.mp4`).
2. **Tema visual = engine** — pilih yang paling beda dari video sebelumnya:
   `StoryEngine` (cinematic gelap) · `ComicEngine` (doodle kertas) · `KoranEngine` (koran editorial) · `KoranFlipEngine` (koran + page-flip) · `ArsipEngine` (dokumen arsip + timeline + cutaway rekaman) · `CinemaEngine` (kota malam + panggung terang, analogi kurir sepeda, kamera drift, pro/kontra). Kalau tema baru benar-benar beda, tulis engine baru — jangan dipaksakan ke engine lama.
4. **Palet & tipografi** — warna + font (Google Fonts) yang menguatkan tema.

**Prinsip anti-monoton (wajib sejak video #5):** jangan biarkan halaman statis lebih dari ~5 detik. Sertakan minimal: kamera drift/push-in, cutaway adegan dengan zoom ke stickman, dan aksi karakter yang berbeda tiap scene (`walk`, `point`, `cheer`, `mix`, `idle`). Lihat `ArsipEngine` → `CameraDrift` / `LiveStage`, dan `CinemaEngine` → panggung terang + aset bergerak.

**Transisi wajib blackout (pelajaran video #6):** crossfade polos bikin judul dua scene tumpang tindih (ghosting). Tutup scene lama dengan overlay gelap di 12 frame terakhir, lalu buka scene baru dari gelap. Jangan cuma mengandalkan opacity fade-out.

**Cek audio sebelum build:** transkrip ulang rekaman user (mis. `faster-whisper`) untuk memastikan `captions` benar-benar sama dengan ucapan. Kalimat yang tidak direkam wajib dihapus dari `captions`, isinya boleh pindah ke tipografi layar. Jangan pernah menampilkan kata yang tidak diucapkan.

### Tahap 4 — Penulisan naskah (AI) ← **narasi lahir di sini, paling awal**
AI menulis `src/scripts/<slug>.json`. Ini **satu-satunya sumber kebenaran**: teks narasi, caption, aset visual, dan tipe scene semuanya di sini.

Struktur baku lima scene (bisa ditambah, video #5 memakai 7 scene):

| Scene | Fungsi | Caption (1 kalimat per baris) |
|---|---|---|
| `hook` | Lempar paradoks | 3 kalimat, kalimat terakhir = pertanyaan |
| `explain` | Bedah angka/istilah | 3 kalimat, angka ditulis lengkap |
| `causes` | 3 penyebab bernomor | 3 kalimat, satu per penyebab |
| `prokontra` | Dua kubu | 3 kalimat, seimbang |
| `ending` | Satu pertanyaan gantung | 2 kalimat, pendek |

- Gaya bahasa: santai-spoken, kalimat pendek (≤ 15 kata), tanpa bahasa bertele-tele.
- Field tambahan per engine (opsional, aman): `kicker`, `headline`, `stats`, `cols`, `proBody`, `kontraBody`, `quote`, `stamp`.
- Target total: **60–130 detik**, menyesuaikan jumlah scene.

**Gerbang 4:** AI kirim teks narasi per scene ke manusia (langsung di chat + disimpan di `research/<slug>-rekam.md`). AI **berhenti** di sini sampai audio rekaman masuk.

### Tahap 5 — Rekam voice (MANUSIA) → folder `gemini_in/<slug>/`

> **ATURAN KERAS:** AI **DILARANG** generate TTS / edge-tts / AI Studio speech. Suara = rekaman manusia sendiri. `gen_<slug>.py` dan `gen_kursi.py` adalah legacy, jangan dijalankan lagi.

Yang dilakukan AI: menyiapkan **teks narasi per scene** (sudah ada di Tahap 4) untuk direkam manusia.
Yang dilakukan manusia: rekam satu file utuh per scene, taruh di `gemini_in/<slug>/1.mp3 .. N.mp3`.

- Urutan file = urutan scene; satu file per scene, jangan dipotong per kalimat.
- Durasi asli tiap file dipakai `build.py` (mutagen) untuk menghitung timing caption/karaoke — jangan dipadatkan atau dipotong.
- Kalau durasi audio berubah, **wajib re-run `build.py`** supaya timing, total frame, dan wrapper tersinkron.

**Gerbang 5:** AI tidak lanjut ke Tahap 6 sebelum semua file audio ada.

### Tahap 6 — Build & render (AI)
```bash
cd G:/PROJECTAN/stick
py -3 build.py --script stickman-story/src/scripts/<slug>.json --in-dir G:/PROJECTAN/stick/gemini_in/<slug>
cd stickman-story
npx tsc --noEmit                       # typecheck harus hijau
npm run render -- <CompositionId> out/<slug>.mp4
```
Yang dilakukan `build.py` otomatis: validasi file audio ada di `gemini_in/<slug>/` → glue N scene → timing caption + karaoke kata (proporsional per karakter) → generate `<CompositionId>.tsx` → daftarkan ke `Root.tsx` (idempoten). Durasi final + jumlah frame dicetak di console.

### Tahap 7 — QA visual, revisi, dan pengiriman (AI)
AI **wajib verifikasi visual** sebelum menyerahkan (jangan "percaya" render begitu saja):

- [ ] `ffprobe` via imageio-ffmpeg: durasi cocok dengan audio, resolusi 1080×1920, 30 fps, stereo.
- [ ] Ekstrak 1 frame per scene (`ffmpeg -ss <t>`), periksa: karakter **utuh di frame** (tidak offside), kepala tidak ketutup balon, kaki tidak kena caption, teks tidak kepotong, tidak nabrak kolom/bingkai.
- [ ] Perbaiki akar masalah (koordinat, skala, viewBox, offset) — bukan patch kosmetik.
- [ ] Re-render sampai hijau, bersihkan folder `out/chk`, presentasikan `out/<slug>.mp4`.
- [ ] Tulis log kerja ke `.workbuddy-ai/memory/YYYY-MM-DD.md`.

**Gerbang 7:** deliver hanya bila QA lolos. Kalau ada temuan tapi butuh keputusan (mis. pilihan topik baru), AI yang memilih dengan 근거 dan mencatatnya di memory — bukan menunggu perintah.

---

## 3. Pembagian peran — "terstruktur tapi AI yang mikir"

| Tahap | AI (utama) | Manusia (gerbang) |
|---|---|---|
| 0–1 Ide & sudut | Usul 2–3 sudut, pilih terkuat | Setuju / arahkan |
| 2 Riset | Cari, verifikasi, catat sumber | Putuskan bila klaim sensitif |
| 3 Judul & tema | Pilih slug, engine, palet | Setuju |
| 4 Naskah | Tulis semua caption | Review cepat (opsional) |
| 5 Audio | Siapkan teks narasi; cek file masuk | **Rekam sendiri**, taruh di `gemini_in/<slug>/` |
| 6 Build/Render | Jalankan, typecheck, render | — |
| 7 QA & deliver | Periksa visual, perbaiki, presentasi | Tonton & beri masukan visual |

**Kenapa tetap "pakai AI":** keputusan di tiap tahap diambil AI berdasarkan data konteks (bukan template kaku), tapi gerbang manusia-nya tetap ada untuk keputusan yang butuh selera dan tanggung jawab. Strukturnya memberi *urutan* dan *bukti* (folder, JSON, frame), AI-nya mengisi *isi*.

---

## 4. Kegagalan yang sudah pernah terjadi (jangan diulang)

1. **Karakter offside** — SVG `x=0` adalah tepi kiri, bukan tengah; dan baseline `FLOOR=420` adalah warisan engine berkamera. Setiap engine *tanpa kamera* wajib punya konstanta sendiri: `CX = W/2`, baseline kaki di atas zona caption.
2. **Balon menutup kepala** — hitung `HEAD_TOP(scale) = baseline - 268*scale` (rig: kaki 118 + torso 92 + kepala 36), lalu beri offset per komponen.
3. **Teks kepotong** — `Label` satu baris; pakai helper wrap + auto-shrink (`fitLines`/`BubbleText`).
4. **Karakter mengecil (letterbox)** — `<svg preserveAspectRatio="meet">` di kotak yang rasionya tidak sama dengan viewBox. Samakan viewBox dengan rasio kotak (`VB_W = VB_H * (w/h)`).
5. **Concat audio menggugurkan segmen** — jangan concat demuxer; pakai concat filter (`-filter_complex "[i:a]...concat=n=5:v=0:a=1[out]"`).
6. **strip hitam saat zoom** — jangan turunkan skala < 1 di transisi; pastikan wall/background lebih tinggi dari kebutuhan.

---

## 5. Perintah cepat (copy-paste)

```bash
# 1. Rekam voice manusia -> gemini_in/<slug>/1.mp3 .. N.mp3
#    (teks narasi ada di research/<slug>-rekam.md; JANGAN jalankan gen_*.py)

# 2. Build
py -3 build.py --script stickman-story/src/scripts/<slug>.json --in-dir G:/PROJECTAN/stick/gemini_in/<slug>

# 3. Typecheck + render
cd stickman-story
npx tsc --noEmit
npm run render -- <CompositionId> out/<slug>.mp4

# 4. QA frame per scene
FF=$(py -3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
"$FF" -y -ss <detik> -i out/<slug>.mp4 -frames:v 1 out/chk/<scene>.png
```

---

*Dokumen ini adalah SOP tetap: setiap video baru wajib mengikutinya dari Tahap 0 sampai 7 tanpa melompat, kecuali gerbang yang ditandai "opsional".*
