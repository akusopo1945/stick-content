# Tutorial: Bikin Video Stickman dari Kode (Remotion) + Narasi TTS

Panduan praktis pakai repo [`ahmadaryanto/stickman-story`](https://github.com/ahmadaryanto/stickman-story)
untuk menghasilkan video stickman vertikal (1080×1920, 30 fps) ber-narasi Bahasa Indonesia.
Tutorial ini mencakup alur yang sudah kita kerjakan: bikin scene custom + narasi lewat TTS (Google / Gemini / gTTS).

---

## 1. Ini apa?

`stickman-story` adalah **starter kit edukatif** untuk bikin video dokumenter pendek bergaya stickman.
Bukan engine produksi penuh — cuma bagian reusable (stickman, pose, ruangan, kamera, caption, 3 contoh).

**Stack:**
- **Remotion** — bikin video dari kode (tiap frame digambar via React).
- **React + TypeScript** — komponen & type safety.
- **SVG** — semua stickman & furnitur digambar vektor datar.
- **npm / Node.js** — jalanin script & render.

Hasil: MP4 vertikal. Cocok buat Reels / TikTok / Shorts.

---

## 2. Persiapan (sekali saja)

- **Node.js** ≥ 22 (repo tested di v24; v22 aman). Download: https://nodejs.org
- **Git** — untuk clone.
- **npm** (ikut Node).
- Koneksi internet (saat `npm ci`, Remotion akan download Chromium headless otomatis saat render pertama).

Cek:
```bash
node -v
npm -v
git --version
```

---

## 3. Clone & install

```bash
git clone https://github.com/ahmadaryanto/stickman-story.git
cd stickman-story
npm ci
```

> `npm ci` butuh beberapa menit (Remotion + download Chromium saat render pertama).

---

## 4. Struktur proyek (file penting)

| Butuh | File |
|---|---|
| Stickman (badan, tangan, muka) | `src/rig/Stickman.tsx` |
| Pose (`idle, walk, sit, typing, point, cheer`) | `src/rig/poses.ts` |
| Pakaian & rambut | `src/rig/looks.tsx` |
| Duduk di kursi | `src/rig/seat.ts` |
| Kamera & layer | `src/camera/Camera2D.tsx` |
| Easing & keyframe | `src/motion/ease.ts` |
| Ruangan (dinding, lantai, meja, monitor, papan, label) | `src/environment/Furniture.tsx` |
| Caption (judul bawah) | `src/captions/CaptionTrack.tsx` |
| Narasi MP3 (opsional) | `src/audio/Narration.tsx` |
| Warna, font, ukuran frame | `src/styles/palette.ts` |
| Daftar video yang bisa di-render | `src/Root.tsx` |

---

## 5. Konsep dasar

- **Frame-based:** 30 fps. 1 detik = 30 frame. Gambar dihitung dari `useCurrentFrame()` — harus deterministik (tanpa timer / random tak di-seed).
- **Pose:** tiap pose = sudut sendi (pinggul, lutut, bahu, siku, lean, dll). Blending via `mix(a,b,k)`.
- **Kamera:** objek virtual 2D, punya `x, y, zoom, rot`. Gerak pakai keyframe `keysObj(frame, [[f0,state0],[f1,state1],...])`.
- **Caption:** list `{from, to, text, pos}` dalam frame. Posisi: `top|upper|mid|lower`.
- **Narasi:** file MP3 di `public/audio/`, dipasang via prop `narration="audio/namafile.mp3"`.

**Metode kerja (REUSE → RESKIN → NEW):**
1. **REUSE** contoh yang sudah jalan (copy `src/scenes/Example03*.tsx`).
2. **RESKIN** — ubah teks, warna, posisi, frame, caption. Mayoritas kerjaan di sini.
3. **NEW** — cuma kalau butuh part baru.

---

## 6. Coba contoh dulu (cepat)

Preview live di browser:
```bash
npm run studio          # buka http://localhost:3000
```
Render salah satu contoh ke MP4:
```bash
npm run render -- Example03-MiniDocumentary out/contoh.mp4
```
Cek 1 frame saja (cepat, tanpa render penuh):
```bash
npm run still -- Example03-MiniDocumentary out/cek.png --frame=150
```

---

## 7. Bikin scene sendiri (contoh: `AiStory`)

Kita sudah buat `src/scenes/AiStory.tsx` — mini dokumenter "Apa itu Kecerdasan Buatan?"
3 adegan: (1) sapaan, (2) tunjuk papan "BELAJAR DARI DATA", (3) diagram `Data → Model → Keputusan`.

### 7a. Pola scene (inti)

```tsx
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0,   {x: 0,   y: 120, zoom: 1.15, rot: 0}],
    [S1.len, {x: 0, y: 120, zoom: 1.15, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}><Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} /></Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Stickman x={0} y={FLOOR} scale={1.5} facing={1} pose={idle(t)} look={CASUAL} expr="happy" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};
```

Aturan:
- Karakter & lantai di `<Layer depth={1}>`, dinding di `<Layer depth={0.5}>`.
- Setiap objek kamera butuh `x, y, zoom, rot`.
- Caption global — `from/to` pakai **frame absolut** komposisi (bukan lokal scene).

### 7b. Daftarkan di `src/Root.tsx`

```tsx
import {AiStory, AISTORY_FRAMES} from "./scenes/AiStory";

<Composition
  id="AiStory"
  component={AiStory}
  durationInFrames={AISTORY_FRAMES}
  fps={FPS} width={W} height={H}
  defaultProps={{narration: "audio/narration.mp3"}}
/>
```

Lalu cek:
```bash
npx remotion compositions src/index.ts   # harus muncul "AiStory"
npm run typecheck                        # harus exit 0
```

---

## 8. Tambah narasi pakai TTS (Google / Gemini / gTTS)

Repo tidak ada TTS bawaan. Kamu harus sediakan MP3 narasi sendiri. Tiga pilihan:

### Opsi A — gTTS (gratis, no key) — yang kita pakai
Script Python: tulis naskah per baris → generate MP3 tiap baris → ukur durasi → gabung → **caption di-timing persis**.
```bash
pip install gTTS mutagen imageio-ffmpeg
python3 gen_narration.py        # hasil: public/audio/narration.mp3 + narration_timing.json
```
`gen_narration.py` ada di luar folder repo (`G:/PROJECTAN/stick/gen_narration.py`). Edit variabel `SCRIPT` untuk ganti naskah.

### Opsi B — Gemini TTS (kualitas lebih oke, butuh API key)
Pakai `gemini-2.5-flash` / `gemini-2.5-pro` untuk generate audio dari teks.
Butuh `GEMINI_API_KEY`. Aku bisa modif `gen_narration.py` agar memanggil Gemini alih-alih gTTS
(tambah `google-generativeai`, ganti fungsi `gen_line`). Alur gabung & timing tetap sama.

### Opsi C — Google Cloud Text-to-Speech
Butuh service-account / API key GCP, enable "Cloud Text-to-Speech API".
Bisa pilih voice `id-ID` (bahasa Indonesia) & style (Standard/Neural2/Studio).

### Pasang ke scene
Taruh MP3 di `public/audio/`, lalu di komponen:
```tsx
<Narration file={narration} />   // narration = "audio/narration.mp3"
```
Sudah kita set sebagai `defaultProps` di `Root.tsx`, jadi render otomatis pakai audio.

---

## 9. Render video final

```bash
# preview dulu (anjurkan cek tiap caption & gerak kamera)
npm run studio

# cek frame tertentu
npm run still -- AiStory out/cek.png --frame=200

# render penuh (Chromium otomatis ke-download pertama kali)
npm run render -- AiStory out/ai-story.mp4
```

Hasil: `out/ai-story.mp4` (vertikal 1080×1920, ada narasi + caption).

---

## 10. Troubleshooting

- **`spawn EFTYPE` / "not a valid application" saat `npm run render`**
  → Environment (terutama sandbox/CI) menolak jalanin binary native Remotion (esbuild / Chromium).
  Solusi: render di **mesin lokal biasa** (Windows/Mac/Linux dengan Node normal), bukan di sandbox terbatas.
- **Node terlalu lama** → pakai Node 22+.
- **Caption overlap / meleset** → cek ulang `from/to` (frame absolut) lewat `npm run still`.
- **Suara tidak keluar** → pastikan path di `Narration` benar (`audio/...`, relatif ke `public/`) & file MP3 ada.
- **Chromium gagal download** → cek internet; atau set `REMOTION_CHROMIUM_EXECUTABLE_PATH` ke Chrome yang sudah terinstall.

---

## 11. Alternatif cepat: VideoGen (AI) — bukan repo

Kalau cuma mau lihat klip stickman **sekarang** tanpa coding/render, bisa pakai fitur `VideoGen`
(Generate Video) di WorkBuddy: beri prompt "stickman explaining AI, white background, flat 2D".
Hasilnya AI-generated — **bukan** rig/pose/caption persis repo, cuma estetika mirip.

---

## 12. Ringkasan perintah

```bash
git clone https://github.com/ahmadaryanto/stickman-story.git
cd stickman-story
npm ci
npm run studio                              # preview
npx remotion compositions src/index.ts      # lihat daftar (termasuk AiStory)
npm run typecheck                           # validasi kode
npm run render -- AiStory out/ai-story.mp4  # render final (butuh mesin lokal)
```

File yang sudah kita siapkan:
- `src/scenes/AiStory.tsx` — scene custom (3 adegan, Indo).
- `src/Root.tsx` — sudah daftarkan `AiStory`.
- `public/audio/narration.mp3` — narasi Indo 25.6 detik (gTTS), caption timing persis.
- `G:/PROJECTAN/stick/gen_narration.py` — generator naskah→MP3→timing.

---

## 13. STICKFORGE — workflow baru (gratis, konten berkelas)

Filosofi: **lu yang siapin audio (TTS gratis), aku yang urus animasi.** TTS dibikin manual di
Google AI Studio (aistudio.google.com/generate-speech) -> gratis, tanpa kuota API, voice bisa dipilih.
Animasi dihasilkan otomatis dari script JSON.

### Alur
1. **Siapkan audio per scene** di Google AI Studio, download MP3, taruh di `G:/PROJECTAN/stick/gemini_in/`
   dengan nama persis = field `"audio"` di script. Contoh: `hook.mp3`, `konstitusi.mp3`, ...
2. **Tulis/edit script** di `src/scripts/<nama>.json` (deklaratif: scene + teks caption + visual).
3. **Build**: `python3 build.py --script stickman-story/src/scripts/wapres.json`
   - Validasi audio ada di `gemini_in` (stop + kasih tau kalau kurang).
   - Glue + timing persis (mutagen) -> `public/audio/Wapres_narration.mp3` + `wapres.built.json`.
   - Generate `src/scenes/WapresStory.tsx` (wrapper otomatis, jangan edit manual).
   - Register komposisi di `Root.tsx` (idempoten — aman dijalankan berkali-kali).
4. **Render lokal** (sandbox ini tak bisa native binary):
   ```bash
   cd stickman-story
   npm run render -- WapresStory out/wapres.mp4
   ```

### Format `scripts/<nama>.json`
```json
{
  "title": "Wapres",
  "compositionId": "WapresStory",
  "voice": "Kore",
  "fade": 12,
  "scenes": [
    {"id":"hook","type":"hook","audio":"hook.mp3","captions":["..."]},
    {"id":"konstitusi","type":"explain","audio":"konstitusi.mp3","look":"blue",
     "board":["PRESIDEN","+","WAPRES","5 TAHUN"],"captions":["...","..."]},
    {"id":"penyebab","type":"causes","audio":"penyebab.mp3","labels":["VISI?","KESEHATAN?","POLITIK?"],"captions":[...]},
    {"id":"prokontra","type":"prokontra","audio":"prokontra.mp3","pro":"LELUASA","kontra":"DPR KUAT","captions":[...]},
    {"id":"ending","type":"ending","audio":"ending.mp3","captions":[...]}
  ]
}
```

### Tipe scene (template, REUSE->RESKIN)
- `hook` — `?` besar + stickman worried (pembuka pertanyaan).
- `explain` — whiteboard (`board`: array baris) + 1 stickman pointing. `look`: `blue`/`casual`/`orange`.
- `causes` — label melayang (`labels`) + 2 stickman.
- `prokontra` — kotak PRO/KONTRA (`pro`/`kontra` = teks bawah).
- `ending` — `?` ngambang + stickman netral (penutup menggantung).
- `diagram` — 3 node alur panah (contoh: DATA->MODEL->KEPUTUSAN).

Opsi per scene: `look` (casual/blue/orange), `expr` (neutral/happy/worried/focused/...), `glow`, `bg`.

### Sentuhan premium (gratis)
- **Transisi crossfade** antar scene (overlap `fade` frame) — sudah aktif.
- Caption lower-third rapi + rise/fade bawaan `CaptionTrack`.
- Kamera halus (zoom lembut per scene via `Camera2D`).
- Sudah aktif (premium pass): caption karaoke per-kata (word highlight kuning), kamera push-in + handheld drift,
  transisi "push" + sapuan cahaya (shine), partikel background melayang, "?" animasi bounce + echo ring + glow pulse,
  pro/kontra box bounce (easeOutBack) + flash, board pop-in.
- Word timing dihitung otomatis di `build.py` (proporsional per-karakter) — tak perlu rekam ulang.
- Rencana: BGM bed royalty-free, preset export (TikTok 9:16 / YouTube 16:9).

### File inti
- `G:/PROJECTAN/stick/build.py` — otak pipeline (validate->glue->timing->generate->register).
- `src/scenes/StoryEngine.tsx` — renderer generik + template scene + transisi.
- `src/scenes/WapresStory.tsx` — auto-generated (jangan edit manual).
- `src/scenes/wapres.json` — script sumber (edit ini tiap bikin video).
- `src/scenes/wapres.built.json` — hasil timing (reference).

Biaya: **Rp 0**. Remotion + ffmpeg + AI Studio semua gratis. "Berklas" datang dari sistem
(template rapi + transisi + caption) dan editing, bukan API berbayar.
