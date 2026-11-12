# STICKFORGE — Studio Animasi Stickman Berbasis AI

Pipeline produksi konten video vertikal (1080×1920, 30 fps) bergaya **stickman 2D**,
dikemudikan sepenuhnya oleh AI: dari brainstorming, riset fakta, penulisan naskah,
sintesis suara narasi, hingga render video siap unggah.

> Filosofi: manusia cukup kasih brief kasar (mis. "buatkan video soal isu X").
> Sisa tahap — sudut pandang, riset berita, naskah, audio, animasi — dikerjain AI
> sampai jadi file MP4. Struktur kaku, tapi isinya diambil dari realita, bukan template.

---

## ✨ Yang Bisa Dikerjain

- **3 gaya visual (engine) berbeda** — bukan cuma ganti warna, tapi beda total:
  - `StoryEngine` — sinematik gelap ala dokumenter mini (kamera gerak, depth of field)
  - `ComicEngine` — komik doodle, balon teks, papan tulis, panel
  - `KoranEngine` — editorial koran cetak: newsprint, halftone, headline kapital, op-ed
  - `KoranFlipEngine` — koran dengan animasi **page-flip**: halaman dibuka,
    headline kinetik per-kata, cap slam, ticker breaking-news
- **Narasi otomatis** — tiap scene pakai 1 file audio; digabung + di-sync caption karaoke
- **Caption bahasa Indonesia** dengan highlight kata-per-kata (gaya subtitle berita)
- **Data-driven** — angka/fakta dari riset berita beneran, bukan karangan

## 🎬 Video Contoh (sudah ada di repo)

| File | Tema | Engine | Durasi |
|------|------|--------|--------|
| `out/wapres.mp4`* | Kursi wakil presiden kosong | StoryEngine (sinematik) | ~60s |
| `out/pemakzulan.mp4`* | Proses pemakzulan & pengganti | ComicEngine (komik) | ~65s |
| `out/koran.mp4`* | Ekonomi pangan: beras mahal vs petani miskin | KoranEngine (editorial) | ~78s |
| `out/kursi.mp4`* | Kursi wapres kosong: siapa diuntungkan? | KoranFlipEngine (page-flip) | ~72s |

\* File MP4 hasil render **tidak di-commit** (ada di `.gitignore`/`out/`).
Naskah + kode sumber + audio narasi ada di repo; render ulang kapan saja.

---

## 🧱 Tech Stack

- **[Remotion](https://www.remotion.dev/)** 4.0 — framework React untuk bikin video lewat kode
- **React 19** + **TypeScript**
- **ffmpeg** (via `imageio-ffmpeg`) — penggabungan & pemotongan audio
- **Python 3** — `build.py` (glue audio + generate timing) & generator TTS
- **edge-tts** — TTS neural gratis (voice Indonesia) untuk narasi
- **@remotion/google-fonts** — Playfair, Oswald, Abril, PTSerif, dsb.

## 📁 Struktur Project

```
stick-content/
├── build.py                 # Pipeline: JSON -> glue audio -> generate wrapper -> register Root
├── gen_koran.py             # Generator narasi TTS (edge-tts) untuk tema koran
├── gen_gemini.py            # Generator narasi (Gemini/AI Studio) untuk tema lain
├── gen_kursi.py             # Generator narasi TTS (KursiStory, gaya KoranFlip)
├── gen_wapres.py / gen_narration.py
├── FLOW_PRODUKSI_ID.md      # SOP lengkap 7 tahap produksi (baca ini!)
├── gemini_in/               # 🎙️ Audio narasi per scene (simpul utama)
│   ├── koran/               #   1.mp3 ... 5.mp3   (5 scene)
│   ├── pemakzulan/          #   1.mp3 ... 5.mp3
│   ├── kursi/               #   1.mp3 ... 5.mp3   (KursiStory)
│   └── *.mp3 / *.wav        # audio lama (wapres)
└── stickman-story/          # Remotion project
    ├── src/
    │   ├── scripts/         # Naskah deklaratif JSON (wapres/koran/pemakzulan)
    │   ├── scenes/          # Engine + wrapper komposisi (auto-generated)
    │   ├── rig/             # Stickman rig (pose, look, ekspresi)
    │   ├── captions/        # Caption track + karaoke
    │   ├── environment/     # Latar, furnitur, props
    │   ├── motion/          # Easing & helper animasi
    │   └── styles/          # Palet & konstanta
    └── out/                 # Hasil render (gitignored)
```

---

## 🔧 Setup

Butuh **Node.js 18+** dan **Python 3.10+**.

```bash
# 1. Install dependency Remotion
cd stickman-story
npm install

# 2. Install tool Python (TTS + ffmpeg wrapper)
pip install -r requirements.txt   # lihat catatan di bawah
# atau manual:
pip install edge-tts mutagen imageio-ffmpeg
```

> **Catatan:** repo ini belum menyertakan `requirements.txt`. Jika belum ada,
> jalankan `pip install edge-tts mutagen imageio-ffmpeg` secara langsung.
> Path di `build.py` menunjuk ke `G:/PROJECTAN/stick/...` — sesuaikan
> konstanta `BASE`/`DEFAULT_IN` di `build.py` bila kamu clone ke lokasi lain.

## 🚀 Bikin Video Baru (alur singkat)

1. **Naskah** — tulis `stickman-story/src/scripts/<slug>.json` (lihat contoh yang ada).
   Field penting:
   ```json
   {
     "title": "Koran",
     "compositionId": "KoranStory",
     "engine": "KoranEngine",
     "fade": 12,
     "scenes": [
       {"id":"hook","type":"hook","audio":"koran/1.mp3",
        "headline":["BERAS *MAHAL*","PETANI *TETAP*"],"captions":["...teks scene 1..."]},
       {"id":"explain","type":"explain","audio":"koran/2.mp3","captions":["..."]},
       {"id":"causes","type":"causes","audio":"koran/3.mp3","captions":["..."]},
       {"id":"prokontra","type":"prokontra","audio":"koran/4.mp3","captions":["..."]},
       {"id":"ending","type":"ending","audio":"koran/5.mp3","captions":["..."]}
     ]
   }
   ```
   Tanda `*tebal*` = kata yang di-highlight di headline.

2. **Audio** — siapkan 5 file mp3 di `gemini_in/<slug>/1.mp3` … `5.mp3`
   (bisa pakai `gen_koran.py` untuk TTS otomatis, atau rekam/AI Studio sendiri).

3. **Build** — gabungkan audio & hitung timing, lalu generate kode:
   ```bash
   python3 build.py --script stickman-story/src/scripts/koran.json \
                    --in-dir G:/PROJECTAN/stick/gemini_in
   ```

4. **Render**:
   ```bash
   cd stickman-story
   npm run render -- KoranStory out/koran.mp4
   ```

5. **Cek & kirim** — screenshot tiap scene wajib dicek sebelum dianggap selesai.

Penjelasan tahap lengkap + pelajaran dari bug yang sudah dihadapi ada di
**[FLOW_PRODUKSI_ID.md](./FLOW_PRODUKSI_ID.md)**.

---

## 🎨 Engine Visual

Setiap tema pakai engine berbeda supaya konten nggak monoton:

| Engine | Vibe | Dipakai untuk |
|--------|------|--------------|
| `StoryEngine` | Dokumenter sinematik, kamera gerak | Isu politik/serius |
| `ComicEngine` | Komik doodle, balon & papan | Penjelasan konsep/step |
| `KoranEngine` | Editorial koran, halftone, op-ed | Ekonomi/data/berita |
| `KoranFlipEngine` | Page-flip, kinetik per-kata, ticker | Politik/berita panas |

Mau gaya ke-4? Tinggal salin satu engine, ganti palet + tata letak, daftarkan di `Root.tsx`
(otomatis dilakukan `build.py`).

## 🤝 Kontribusi / Pengembangan

Project ini dirancang sebagai **starter kit** yang bisa dikembangin:
- Tambah engine visual baru di `src/scenes/`
- Tambah rig/pose/ekspresi di `src/rig/`
- Perbaiki pipeline di `build.py`

## 📜 Lisensi

MIT — bebas dipakai & dimodif, asal tetap cantumkan atribusi.

---

<sub>Dibuat dengan Remotion + AI. Stickman-nya dijahit satu-satu pakai kode. ⚡</sub>
