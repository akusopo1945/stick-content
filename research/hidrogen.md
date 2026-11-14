# Riset — "Hidrogen" (konten #6)

Sumber riset: **Exa AI Explorer** milik user di `https://exa.13.211.188.77.nip.io/`
(`/api/search` mode `deep` + `/api/answer`), diverifikasi ulang ke sumber primer via `WebFetch`.
Tanggal riset: 14 November 2026. Riset lanjutan perbandingan model: 14 November 2026.

## 1. Fakta inti (sumber primer = blog.google, 12 Nov 2026)

| Fakta | Nilai | Sumber |
|---|---|---|
| Tanggal rilis | **12 November 2026** (artikel diperbarui 13 Nov) | blog.google "Introducing Gemini 4 Hydrogen" |
| Nama keluarga | Gemini 4 **Carbon**, **Argon**, **Hydrogen** (nama unsur kimia) | blog.google |
| Positioning | Carbon/Argon = *frontier*, penalaran mendalam jangka panjang. Hydrogen = **eksekusi cepat** untuk coding harian & agentic workflows | blog.google (EN & ID) |
| Kecepatan | **2,5x lebih cepat** dari Gemini 3.8 Flash di setting bawaan `high` | blog.google |
| Terminal-Bench 4.1 | **57% vs 18,2%** (Flash) — naik >3x | blog.google |
| Klaim rekaan | *fabricated claims* turun **>5x** | blog.google |
| Kejujuran agen | **94%** honesty rate; overreach turun 81%, under-service turun 79% | blog.google |
| 4 tingkat berpikir | `low`, `medium`, `high` (default), `xhigh` (baru) | blog.google |
| AA Intelligence Index | Hydrogen `high` **51** vs Argon **50**; Hydrogen `xhigh` **54** | blog.google + Artificial Analysis |
| Index per level (AA) | low **27**, medium **41**, high **51**, xhigh **54** | the-decoder / Artificial Analysis |
| Biaya per tugas (AA) | low **$0,29**, medium **$0,80**, high **$1,87**, xhigh **$3,16** | the-decoder / Artificial Analysis |
| Harga API | **$1,50**/jt token input, **$7,50**/jt token output, flat di jendela konteks 1 juta token | blog.google |
| Konteks | native **1 juta token input**, hingga **1 juta token output** | blog.google / AI Studio docs |
| Ketersediaan | global; Gemini app, **Google Search untuk semua pengguna**, semua tingkatan AI Studio & Gemini API, Sheets & Antigravity (Pro/Ultra) | blog.google |

## 2. Fakta yang bikin cerita (bukan sekadar spesifikasi)

- **Carbon rilis 10 November 2026**, Hydrogen menyusul **12 November** — dua hari kemudian.
  the-decoder (12 Nov) menyebut Argon jadi usang **< 4 minggu** setelah rilisnya karena Hydrogen
  (model lebih murah & lebih ringan) justru mengunggulinya di AA Index.
  → *Angle: "Dua hari. Itu umur sebuah model jadi yang terbaik."*
- **Nama unsur, bukan nomor versi.** Hidrogen = unsur paling ringan & paling melimpah di alam semesta.
  → *Metafora visual: yang paling ringan justru paling dulu sampai.*
- **Tanpa instalasi.** Google Search naik model untuk **semua pengguna global** sejak hari rilis.
  → *Hook paling kuat: "Kamu nggak klik apa-apa, tapi otak di balik pencarianmu sudah diganti."*
- **Kutipan Andrew Carr (Chief Scientist, Cartwheel)**, dari blog resmi:
  > "Model Gemini 4 Hydrogen yang baru menunjukkan sikap yang cermat dan skeptis—sesuatu yang
  > belum pernah saya lihat pada model-model Gemini sebelumnya. [...] Kami telah berupaya
  > memecahkan masalah yang rumis selama 10 hari dengan menggunakan model-model canggih dari
  > kompetitor, namun model Hydrogen ini berhasil menemukan 2 masalah dalam pendekatan kami
  > sekaligus mengusulkan perbaikannya."
  → *Beat paling manusiawi: mesin yang berani bilang "kamu salah".*
- **Paradoks harga (paling berbobot):** per token Hydrogen **2x lebih mahal** dari Flash saat rilis
  ($1,50/$7,50 lawan $0,75/$3,75 harga intro), tapi **biaya per tugas selesai justru ~4x lebih murah**
  ($1,87 lawan $7,77 di level high, hitungan Artificial Analysis). Flash menghabiskan jauh lebih
  banyak token untuk skor jauh lebih rendah. Harga Flash naik ke $1,50/$7,50 pada 1 Jan 2027.
- **Liputan Indonesia (13 Nov 2026):** Kompas Tekno "Bisa Bikin Kode, Analisis Data, dan Minim
  'Halu'"; Medcom "Kerjakan Tugas 2,5x Lebih Cepat"; blog Google versi `id-id` tersedia.
  → Isu ini punya coverage lokal, bukan cuma berita luar.

## 3. Perbandingan dengan model lain (riset lanjutan 14 Nov 2026)

### 3a. Tabel Google sendiri — Hydrogen vs Claude Sonnet 5.5 vs GPT-6.1 Terra

Tabel 10 baris terbit sebagai **gambar** di announcement blog dan model card. On The Wire
(13 Nov 2026) membacanya: **Hydrogen menang 7 baris, Claude Sonnet 5.5 menang 3, GPT-6.1 Terra
menang 0** (satu baris tanpa angka Terra).

| Benchmark | Hydrogen | Claude Sonnet 5.5 | GPT-6.1 Terra |
|---|---|---|---|
| SWE-sweep | **13,5%** | 3,1% | 5,8% |
| Terminal-Bench 4.1 (cheating-adjusted) | 57,0% | **63,9%** | — |
| Agents' Last Exam v1.1 | **71,6%** | 60,4% | 69,8% |
| AutomationBench-AA | **76,1%** | 71,8% | 60,2% |
| Vending-Bench 2 (saldo) | **$14.549** | $11.165 | $9.107 |
| OSWorld-2.1 (offline subset) | 77,6% | **83,9%** | 74,2% |
| MKA | **53,4%** | 52,0% | 43,8% |
| Chartography | **66,6%** | 61,6% | 63,2% |
| Terminal-Bench-Science 0.1 | 51,4% | **59,9%** | 58,3% |
| HLE-Diamond | **58,8%** | 53,3% | 47,3% |

**Catatan metodologi Google (wajib diingat):** hasil Hydrogen dijalankan lewat Gemini API dengan
thinking setting tertinggi kecuali disebut lain (Terminal-Bench 4.1 pakai `high`).
*"All the results for non-Gemini models are sourced from providers' self-reported numbers
unless otherwise mentioned"* — sebagian dari leaderboard publik termasuk Artificial Analysis,
beberapa dihitung Google sendiri (mis. OSWorld Sonnet 5.5). MKA adalah benchmark buatan Google.
Grafik Terminal-Bench memakai versi 4.0 karena data kompetitor 4.1 tidak tersedia lintas level.
**Ini bukan uji head-to-head independen.**

### 3b. Artificial Analysis (independen) — Intelligence Index dan biaya

- Hydrogen `xhigh` **54**, nyaris setara **Claude Sonnet 5.5 (max) 55** dan **GPT-6.1 Sol (max) 55**.
- Techmeme mengutip @artificialanlys: Hydrogen *"nearly ties Claude Sonnet 5.5 and GPT-6.1 Sol,
  at a third of Sonnet's cost but ~2.5x that of Sol."*
- Biaya per tugas: Hydrogen xhigh **$3,16**, Sonnet 5.5 max **~$9,9** (≈3,1x), Sol max **~$1,26** (≈40%).
- Angka konsisten di ai-bot.cn dan getaibook.com. Tetap dibingkai sebagai ukuran/estimasi AA.

### 3c. Halusinasi (sumber sekunder, bukan klaim utama)

AA-Omniscience: Hydrogen **8%**, Claude Sonnet 5.5 **43%**, GPT-6.1 Sol **52%**.
Sumber: ai-bot.cn / Baijiahao (13 Nov 2026). Tidak ada di artikel blog.google.
Aman dipakai sebagai angka layar dengan label "ukuran AA-Omniscience", jangan jadi klaim narasi.

### 3d. Data yang SENGAJA tidak dipakai

- **Harga API kompetitor saling bertentangan:** Data Studios (via Exa `/api/answer`) menyebut
  GPT-6.1 Terra `$1,00/$5,00` dan Sonnet 5.5 `$2,00/$10,00`; ai-bot.cn mengestimasikan
  `$0,6/$3` dan `$3/$15`. Jangan dibacakan, jangan ditampilkan.
- **Varian GPT beda:** `GPT-6.1 Terra` di tabel Google, `GPT-6.1 Sol` di Artificial Analysis.
  Narasi memakai sebutan generik "GPT" / "OpenAI"; nama varian hanya di tipografi layar.
- Angka Terminal-Bench 4.0 (`54% / 64% / 56%`) tidak dicampur dengan 4.1.

## 4. Batas aman (jangan dilanggar di naskah)

- Angka benchmark & kecepatan adalah **klaim Google**, atau ukuran independen Artificial Analysis.
  Narasi memakai framing "Google bilang..." / "di tabel Google" / "Artificial Analysis hitung...",
  bukan fakta absolut.
- Tabel 10 baris **wajib** disebut "tabel Google" — nomor lawan sebagian self-reported, bukan uji independen.
- Jangan klaim "mengalahkan semua model". Tabel Google justru menunjukkan **3 uji dimenangi Claude**.
- "Dua kali lipat per token" hanya berlaku **saat rilis** (Flash harga intro s.d. 31 Des 2026).
  Narasi memakai "waktu itu".
- "Sepertiga biaya Sonnet" = **biaya per tugas**, bukan harga per token.
- Blog resmi **tidak pernah menyebut kata "gratis"**. Yang ada: "untuk semua orang",
  "untuk semua pengguna", "di semua tingkatan". Antigravity & Sheets justru dimulai dari
  pelanggan **Pro/Ultra**. Jangan bilang "gratis semua".
- Jangan klaim "menggantikan programmer" — tidak ada sumber kuat di riset ini.
- Jangan sebut "minim halu" sebagai fakta; yang ada adalah *fabricated claims turun >5x* dan
  angka AA-Omniscience dari sumber sekunder.
- Tidak menyerang pihak/individu. Aman untuk monetisasi.
- Versi naskah final (REVISI 5, **analogi kurir sepeda**, pola lama pro/kontra,
  durasi bebas): kalimat pendek, to the point. Angka bermakna diucapkan, tabel lengkap
  pindah ke tipografi layar. Atribusi sumber tetap disebut. Lihat `research/hidrogen-rekam.md`.
- **Analogi = alat bantu, bukan fakta baru.** "Truk boros", "sepeda ringan", "tanjakan Claude"
  adalah kiasan visual. Jangan sampai narasi atau caption menyajikannya sebagai data.
  Nama model harus disebut di scene 1 supaya penonton paham ini soal Gemini 4 Hydrogen.
- **Pro dan kontra wajib seimbang.** Kontra tidak boleh dihilangkan atau jadi pemanis:
  per token 2x lebih mahal, kalah 3 uji dari Claude, selisih 1 poin AA Index,
  angka lawan sebagian self-reported, laporan Safety & Security masih "coming soon".

## 5. Sumber

1. https://blog.google/intl/id-id/products/explore-get-answers/memperkenalkan-gemini-4-hydrogen/
2. https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/
3. https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-4-hydrogen/
4. https://blog.google/products-and-platforms/products/search/gemini-4-hydrogen-search-upgrade/
5. https://deepmind.google/models/model-cards/gemini-4-hydrogen/
6. https://the-decoder.com/googles-gemini-4-hydrogen-outscores-the-bigger-argon-just-four-weeks-after-its-launch/
7. https://venturebeat.com/technology/google-launches-gemini-4-hydrogen-a-faster-smarter-pricier-flash-successor
8. https://arstechnica.com/google/2026/11/google-rolls-out-gemini-4-hydrogen-finally-replacing-3-8...
9. https://tekno.kompas.com/read/2026/11/13/13030027/... (13 Nov 2026)
10. https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/ (10 Nov 2026)
11. https://onthewire.ai/article/google-releases-gemini-4-hydrogen-a-faster-gemini-4-model-it-pitches-for-everyda (tabel 10 baris + metodologi, 13 Nov 2026)
12. https://getaibook.com/news/gemini-4-hydrogen-flash-successor-1-50-7-50-terminal-bench (biaya per tugas AA, 13 Nov 2026)
13. https://www.techmeme.com/261112/p60 (kutipan @artificialanlys)
14. https://ai-bot.cn/gemini-4-hydrogen (tabel komparasi, 13 Nov 2026)
15. https://www.datastudios.org/post/gemini-4-hydrogen-vs-gpt-6-1-terra-claude-sonnet-5-5-api-prices-task-costs
16. https://hub.baai.ac.cn/view/59610 (AA Index 54 vs 55, 13 Nov 2026)
17. Exa `/api/answer`, requestId `5295365573e0f56382b9274763f6ad25` (14 Nov 2026)

## 6. Catatan tooling

Exa AI Explorer bisa dipakai sebagai **sumber riset Tahap 2** di SOP:
- `GET /api/news?category=<national|business|technology|...>&refresh=true`
- `POST /api/search` body `{query, type: "auto|lite|deep", numResults, contentsType: "highlights"}`
- `POST /api/answer` body `{query, systemPrompt}` → jawaban + citations + `costDollars`
- `POST /api/agent/start` body `{query, effort, outputSchema}` + `GET /api/agent/status/<runId>`
- `GET /api/health` → status & API key (masked).
Catatan: `/api/news` kategori `national` di VPS ini isinya masih didominasi berita AI global,
jadi untuk isu nasional lebih tajam pakai `/api/search` dengan query spesifik.
`/api/answer` cepat (±1,8 dtk, $0,005) dan berguna buat cross-check angka, tapi tetap
verifikasi ke sumber primer sebelum dipakai di naskah.
