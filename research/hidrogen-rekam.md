# NASKAH REKAM — "Hidrogen" (konten #6, REVISI 5 — ANALOGI KURIR SEPEDA)

**Ini naskah final buat direkam.** 7 scene, satu file MP3 per scene →
`gemini_in/hidrogen/1.mp3` … `7.mp3`. Voice = rekaman user. Jangan TTS.

Engine rencana: **`CinemaEngine`** (belum dibuat). Satu malam, satu gerakan kamera.

Strategi: **analogi kurir sepeda** yang dimainkan stickman, tetap memakai pola lama
(hook → data → **prokontra** → dampak → ending). Penjelasan to the point, kalimat pendek.
Durasi bebas. ±236 kata, perkiraan ≈1:50–2:10 mengikuti tempo rekaman. Bukan target.

Aturan penting: analogi itu alat bantu, bukan fakta baru. Nama model, angka, dan
atribusi sumber tetap benar. Daftar angka lengkap ada di bagian bawah dan di riset
`research/hidrogen.md`.

---

## 1. `1.mp3` — HOOK, 23.47, gudang
> Duabelas November malam. Kamu nggak klik apa-apa. Di balik pencarianmu, Google ganti modelnya: Gemini 4 Hydrogen.
> Bayangkan itu gudang kurir. Semalam, semua badge lama dicopot.

## 2. `2.mp3` — tiga kurir
> Karbon dan Argon: dua perencana di menara, mikir panjang buat rute paling sulit.
> Hidrogen si kurir sepeda. Satu tugas, sampai lebih dulu.
> Flash masih bawa truk.

## 3. `3.mp3` — balapan jalan datar
> Di jalan datar, sepeda dua setengah kali lebih cepat.
> Truk murah per kilometer, tapi muter-muter, boros token. Ongkos per pengiriman justru empat kali lebih mahal.
> Hitungan Artificial Analysis. Lebih mahal per token, lebih murah per pekerjaan selesai.

## 4. `4.mp3` — empat gigi
> Sepeda punya empat gigi: rendah, sedang, tinggi, sangat tinggi.
> Makin tinggi, makin lama boleh ragu, makin mahal.
> Kamu yang pilih.

## 5. `5.mp3` — sepuluh gerbang (PROKONTRA)
> Sepuluh gerbang uji lawan Claude dan GPT. Tujuh dilewati sepeda duluan.
> Pro: cepat, hemat, makin jarang salah alamat.
> Kontra: tiga tanjakan masih dimenangi Claude. Ongkos per kilometer lebih mahal. Satu poin di bawah di indeks independen.

(Kalimat caveat metodologi sengaja tidak direkam user. Pindah ke tipografi layar scene 5,
lihat "Catatan sinkronisasi audio" di bawah.)

## 6. `6.mp3` — pos sortir
> Di pos sortir, ada catatan yang bikin aku berhenti.
> Seorang ilmuwan mentok sepuluh hari. Kurir ini menemukan dua kesalahan di rute mereka, lalu usulkan jalan lain.
> Bayangkan. Mesin yang bilang: kamu salah arah.

## 7. `7.mp3` — ENDING, 05.12 (RETORIK + CTA)
> Pagi, kota seperti biasa. Paket sampai lebih cepat. Hampir nggak ada yang sadar kurirnya diganti semalam.
> Jadi kalau otak di balik layar bisa diganti tanpa pemberitahuan, kita sebenarnya milih apa?
> Menurutmu: paling cepat, atau paling tepat?
> Tulis pendapatmu di komentar.

---

## Catatan rekam
- **Durasi video = durasi audio.** `build.py` menggabungkan 7 file lalu menyelaraskan
  caption otomatis. Nggak ada target detik. Rekam pelan, angka dikasih jeda.
- Scene 1 sebut "Gemini 4 Hydrogen" jelas. Penonton harus tahu ini soal model AI,
  bukan film kurir. Scene 7 mengunci lagi lewat "otak di balik layar".
- Scene 3 = inti analogi. "Lebih mahal per token, lebih murah per pekerjaan selesai"
  diucapkan pelan, dikasih jeda sebelum kalimat itu.
- Scene 5 = pro/kontra. Baca "Kontra:" dengan nada sama seperti "Pro:", jangan terdengar
  membela sepeda. Kalimat terakhir soal "peta lawan" jangan dilewati.
- Scene 6: pelankan "kamu salah arah", jeda sebelum "Bayangkan". Puncak emosi.
- Scene 7 = pola ending tetap: pertanyaan retorik, "Menurutmu: ...?", lalu CTA
  "Tulis pendapatmu di komentar." Jeda sebelum CTA. CTA ringan, bukan intonasi selesai.

## Angka yang tampil di layar (tidak semua diucapkan)
**Internal, lawan Gemini 3.8 Flash**
- `2,5x` lebih cepat; Terminal-Bench 4.1 `18,2% ke 57%`; fabricated claims turun `>5x`.
- Biaya per tugas Artificial Analysis: Hydrogen high `$1,87` lawan Flash high `$7,77`.
- Harga per juta token: Hydrogen `$1,50 / $7,50`; Flash intro `$0,75 / $3,75`
  sampai 31 Des 2026, naik ke harga sama 1 Jan 2027.
- Level `low / medium / high / xhigh`: AA Index `27 / 41 / 51 / 54`,
  biaya `$0,29 / $0,80 / $1,87 / $3,16` per tugas.

**Eksternal, lawan Claude Sonnet 5.5 dan GPT-6.1**
- Tabel Google (10 uji): Hydrogen menang 7, Claude menang 3, GPT-6.1 Terra menang 0.
- Contoh baris: SWE-sweep `13,5% / 3,1% / 5,8%`; Terminal-Bench 4.1 `57,0% / 63,9% / —`;
  Agents' Last Exam `71,6% / 60,4% / 69,8%`; OSWorld-2.1 `77,6% / 83,9% / 74,2%`.
- Artificial Analysis: Hydrogen xhigh `54`, Sonnet 5.5 max `55`, GPT-6.1 Sol max `55`.
  Biaya per tugas `$3,16 / ~$9,9 / ~$1,26`.
- AA-Omniscience (halusinasi): `8% / 43% / 52%`. Sumber sekunder, tampilkan sebagai
  "ukuran AA-Omniscience", jangan jadi klaim utama.

## Pemetaan analogi ke visual stickman
| Fakta | Adegan |
|---|---|
| Rilis tanpa instalasi | gudang 23.47, stickman copot badge Flash, pasang badge H |
| Carbon / Argon / Hydrogen | 2 perencana di menara, 1 kurir sepeda |
| Gemini 3.8 Flash | truk tua, odometer berputar liar |
| 2,5x + biaya per tugas turun 4x | balapan jalan datar, sepeda duluan, truk muter |
| 4 thinking level | 4 gigi sepeda, tuas naik-turun, ongkos ikut naik |
| 10 uji Google | 10 gerbang, 7 bendera H, 3 bendera Claude di tanjakan |
| Kalah di Terminal-Bench & OSWorld | sepeda ngerem di tanjakan, zoom ke wajah |
| Fabricated claims turun >5x | kurir makin jarang salah alamat |
| Kutipan Andrew Carr (10 hari, 2 kesalahan) | pos sortir, kurir tunjuk rute alternatif |
| Pagi, semua pengguna | paket sampai, kota jalan biasa |

## Yang sengaja dihindari
- Analogi **tidak boleh** jadi klaim baru. "Truk boros" = kiasan untuk konsumsi token,
  bukan fakta mesin. Angka tetap beratribusi Google atau Artificial Analysis.
- Pro dan kontra **seimbang**: kontra wajib dibacakan, jangan cuma jadi pemanis.
- Tidak ada klaim "mengalahkan semua model". Tabel Google justru menunjukkan 3 uji dimenangi Claude.
- Tidak ada klaim "gratis semua" (blog resmi hanya bilang "untuk semua orang"; Antigravity & Sheets mulai dari Pro/Ultra).
- Tidak ada klaim "AI menggantikan programmer".
- **Varian jangan dicampur:** `GPT-6.1 Terra` (tabel Google) beda dengan `GPT-6.1 Sol`
  (Artificial Analysis). Narasi pakai "GPT" / "Claude" generik; nama varian cuma di layar.
- "Dua kali lipat per token" hanya benar saat rilis (Flash harga intro s.d. 31 Des 2026).
- Angka harga kompetitor tidak dipakai: sumber agregator saling bertentangan.
- Ending bukan pertanyaan menggantung kosong: wajib CTA "Tulis pendapatmu di komentar."

---

## Catatan sinkronisasi audio (14 Nov 2026)

Audio asli user ada di **`gemini_in/hydrogen/`** (ejaan Inggris, bukan `hidrogen/`),
7 file `1.mp3` … `7.mp3`. Durasi: 13.50 / 13.84 / 15.63 / 11.75 / 17.80 / 15.28 / 19.54
= **107.34 detik** (1:47).

Transkrip ulang memakai `faster-whisper` model `base`, bahasa Indonesia, lewat
numpy array 16 kHz (bukan `av.open`, karena PyAV terbaru menolak argumen
`metadata_errors`). Hasil: **satu kalimat tidak direkam**, yaitu penutup scene 5
`"Peta lawan sebagian digambar mereka sendiri."` Enam scene lain lengkap.

Keputusan:
- Kalimat itu **dihapus dari `captions`** di `src/scripts/hidrogen.json` supaya
  karaoke tidak menampilkan kata yang tidak diucapkan.
- Isinya tetap hadir lewat **tipografi layar** scene 5: label
  `PETA LAWAN SEBAGIAN SELF-REPORTED` dan `note` di data strip. Caveat metodologi
  tidak hilang, cuma pindah kanal.
- `captions` ke-7 scene disusun ulang mengikuti ucapan nyata; ejaan dirapikan dari
  hasil STT (model masih salah dengar "speda", "Peru", "Menurut mau", dll).

Folder audio bernama `hydrogen`. Perintah build memakai
`--in-dir G:/PROJECTAN/stick/gemini_in/hydrogen`. Jangan bikin folder duplikat.
