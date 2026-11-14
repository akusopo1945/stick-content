![STICKFORGE](banner.svg)

# STICKFORGE — Studio Video Penjelas Stikman

Studio mini buat bikin **video vertikal 1080×1920, 30 fps** bergaya stikman 2D.
Alur kerja otomatis urus brainstorming, riset fakta, naskah, kode animasi, timing,
render, hingga QA. Kamu yang pegang **suara narasi** dan keputusan kreatif.

> **Aturan keras:** narasi SELALU rekaman asli di `gemini_in/<slug>/1.mp3` … `N.mp3`.
> Tidak boleh dibuat suara sintetis (TTS / edge-tts / studio voice sintetis).
> Script `gen_*.py` sudah legacy. Kita cuma siapin teks naskah per scene buat direkam.

Alur lengkap ada di [FLOW_PRODUKSI_ID.md](./FLOW_PRODUKSI_ID.md).

---

## Kenapa ini beda

Bukan cuma ganti warna. Tiap topik dapat **gaya visual sendiri** plus mekanik
anti-bosan biar penonton betah sampai akhir.

- **6 engine visual** yang benar-benar beda — dokumenter malam, komik doodle,
  editorial koran, page-flip berita, dokumen arsip, hingga kota malam sinematik.
- **Caption karaoke** per kata, timing dihitung otomatis dari durasi audio asli.
- **Berdasarkan data**: angka dan fakta dari riset bersumber, klaimnya diberi
  atribusi jelas — bukan asal klaim.
- **Anti-monoton**: kamera drift / push-in, cutaway, dan aksi stikman berbeda
  di tiap scene.
- **Durasi mengikuti audio**: naskah tak dipaksa pangkas demi target detik.

## Video yang sudah jadi

| # | File | Tema | Gaya | Durasi |
|---|------|------|------|--------|
| 1 | `out/wapres.mp4` | Kursi wakil presiden kosong | StoryEngine | ~60s |
| 2 | `out/pemakzulan.mp4` | Proses pemakzulan | ComicEngine | ~65s |
| 3 | `out/koran.mp4` | Ekonomi pangan: beras mahal vs petani | KoranEngine | ~78s |
| 4 | `out/kursi.mp4` | Jika Gibran mundur, siapa diuntungkan | KoranFlipEngine | ~72s |
| 5 | `out/arsip.mp4` | Hampir 17 tahun tanpa wapres | ArsipEngine | 2:09 |
| 6 | `out/hidrogen.mp4` | Gemini 4 Hydrogen, analogi kurir sepeda | CinemaEngine | 1:47 |

File MP4 hasil render tidak di-commit (`.gitignore` → `out/`). Naskah, kode sumber,
dan audio narasi ada di repo — bisa di-render ulang kapan saja.

---

## Cara kerja

```
ide → riset fakta → naskah rekam → rekam suara per scene
   → cek ucapan vs naskah → script JSON → build timing
   → typecheck → render → QA → kirim
```

Intinya: manusia kasih **suara dan arah**, sistem yang urus **sisanya**.

## Tech Stack

- [Remotion](https://www.remotion.dev/) 4.0 + React 19 + TypeScript 5.9
- `@remotion/google-fonts` (Inter, Bebas Neue, IBM Plex Mono, Special Elite)
- **ffmpeg** via `imageio-ffmpeg` untuk menggabungkan audio
- **Python 3**: `build.py` (glue audio, hitung timing, generate wrapper, patch `Root.tsx`)
- **mutagen** untuk membaca durasi MP3
- Opsional: `faster-whisper` untuk transkrip ulang audio sebelum menyusun caption

## Struktur

```
stick-content/
├── banner.svg                  # banner repo
├── build.py                     # JSON -> glue audio -> <slug>.built.json -> wrapper TSX
├── FLOW_PRODUKSI_ID.md          # SOP 7 tahap produksi
├── requirements.txt             # mutagen, imageio-ffmpeg, edge-tts (legacy)
├── gemini_in/                   # audio narasi per scene (sumber suara)
│   ├── arsip/                   #   1.mp3 ... 7.mp3
│   └── hydrogen/                #   1.mp3 ... 7.mp3  (konten #6)
├── research/                    # riset fakta + naskah rekam per konten
└── stickman-story/              # project Remotion
    ├── src/scripts/             # naskah deklaratif JSON + *.built.json
    ├── src/scenes/              # engine visual + wrapper auto-generated
    ├── src/rig/                 # Stickman, pose, look, ekspresi
    ├── src/captions/            # caption track + karaoke
    ├── src/motion/              # easing & helper animasi
    ├── public/audio/            # hasil glue narrasi
    └── out/                     # MP4 hasil render (gitignored)
```

---

## Setup

Butuh Node.js 18+ dan Python 3.10+.

```bash
cd stickman-story
npm install

cd ..
pip install -r requirements.txt
```

`build.py` menunjuk ke `G:/PROJECTAN/stick/...` lewat konstanta `BASE` dan
`DEFAULT_IN`. Sesuaikan kalau repo di-clone ke lokasi lain.

## Alur produksi singkat

1. Diskusi ide, riset fakta, tentukan judul dan gaya.
2. Tulis naskah rekam di `research/<slug>-rekam.md`.
3. Rekam satu MP3 utuh per scene ke `gemini_in/<slug>/1.mp3` … `N.mp3`.
4. Cek ucapan vs naskah (transkrip ulang bila perlu), lalu samakan `captions`.
5. Tulis `stickman-story/src/scripts/<slug>.json`.
6. Build timing:
   ```bash
   python3 build.py --script stickman-story/src/scripts/hidrogen.json \
                    --in-dir G:/PROJECTAN/stick/gemini_in/hydrogen
   ```
7. Typecheck, render, QA screenshot, kirim:
   ```bash
   cd stickman-story
   npx tsc --noEmit
   npm run render -- HidrogenStory out/hidrogen.mp4
   ```

Catatan: nama folder audio boleh beda dari slug (mis. `hydrogen` untuk `hidrogen`),
selama `--in-dir` diarahkan ke folder yang benar.

## Gaya visual (engine)

| Engine | Karakter | Dipakai untuk |
|--------|----------|---------------|
| `StoryEngine` | Dokumenter sinematik gelap, kamera agresif | Isu politik / serius |
| `ComicEngine` | Komik doodle, balon teks, papan | Penjelasan konsep |
| `KoranEngine` | Editorial koran, halftone, op-ed | Ekonomi / data |
| `KoranFlipEngine` | Page-flip, headline kinetik, ticker | Berita panas |
| `ArsipEngine` | Dokumen sepia, timeline, cutaway film | Sejarah / arsip |
| `CinemaEngine` | Kota malam, panggung terang, analogi visual, pro/kontra | Teknologi |

Engine baru: tulis `src/scenes/<Nama>Engine.tsx`, daftarkan `type` di `TYPES`,
lalu set `"engine"` di script JSON. `build.py` otomatis membuat wrapper dan
mendaftarkan komposisi di `Root.tsx`.

## Sumber starter kit

Folder `stickman-story/` berasal dari starter kit
[`ahmadaryanto/stickman-story`](https://github.com/ahmadaryanto/stickman-story)
karya **Ahmad Jeffry Aryanto** (MIT). File inti yang masih dipakai: `rig/`,
`camera/`, `captions/`, `audio/`, `motion/`, `environment/`, `styles/`, dan contoh
scene. Engine, script JSON, serta pipeline `build.py` adalah karya turunan
project ini.

## Lisensi

MIT — bebas dipakai dan dimodifikasi dengan tetap mencantumkan atribusi.
