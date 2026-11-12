#!/usr/bin/env python3
"""
gen_kursi.py — narasi untuk KursiStory (tema POLITIK: kursi wapres kosong).
Gaya visual: KoranFlipEngine (flip page + kinetic headline + ticker).

TTS: edge-tts (id-ID-ArdiNeural). Output: gemini_in/kursi/1.mp3 .. 5.mp3
-> python3 build.py --script stickman-story/src/scripts/kursi.json --in-dir gemini_in/kursi

Catatan factual (terverifikasi, sumber berita 11-12 Nov 2026):
- Gibran mengajukan pengunduran diri, jabatan kosong 12 Nov 2026.
- Mekanisme konstitusi: Presiden mengajukan 2 calon ke MPR; MPR sidang maks 60 hari.
- Skenario (Solo/Prabowo/konspirasi) = DAGŋ speculative, bukan fakta.
"""
import asyncio, os
import edge_tts
from mutagen.mp3 import MP3

VOICE = "id-ID-ArdiNeural"
RATE = "+8%"
OUT_DIR = "G:/PROJECTAN/stick/gemini_in/kursi"

SCRIPT = [
    [  # 1 — hook (no.1)
        "Gibran mundur dari wakil presiden. Siapa yang sebenarnya diuntungkan?",
        "Tiga skenario beredar: geng Solo, kubu Prabowo, atau konspirasi lain.",
    ],
    [  # 2 — explain (mekanisme konstitusi)
        "Pertama, ini mekanismenya. Menurut konstitusi, presiden mengajukan dua calon ke MPR.",
        "Lalu MPR menyelenggarakan sidang maksimal enam puluh hari untuk memilih wakil presiden.",
        "Jadi, bukan pilihan langsung rakyat, tapi pilihan lewat forum tertinggi itu.",
    ],
    [  # 3 — skenario
        "Skenario A, gugur dari gencar Solo. Penggantinya tetap dari lingkaran Solo.",
        "Skenario B, konsolidasi Prabowo. Dua calon dipilih dari partai pendukung koalisi.",
        "Skenario C, konspirasi. Deal PDIP, jalur personal, atau alasan di balik itu semua.",
    ],
    [  # 4 — prokontra
        "Yang pro bilang: ini membuka ruang demokrasi lewat jalur konstitusi.",
        "Yang kontra bilang: ini preseden destabilisasi dan politik yang tidak selesai.",
        "Dan dua-duanya sepakat: enam puluh hari menentukan siapa yang benar-benar pegang kursi.",
    ],
    [  # 5 — ending (retorik + tanya penonton)
        "Kalau kursi itu kosong, sebenarnya siapa yang paling diuntungkan?",
        "Dan kamu pilih yang seperti apa: pemimpin kuat, atau aman-aman saja? Tulis di komen.",
    ],
]

async def gen(idx, lines):
    path = os.path.join(OUT_DIR, f"{idx}.mp3")
    text = " ".join(lines)
    c = edge_tts.Communicate(text, VOICE, rate=RATE)
    await c.save(path)
    return path

async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for i, lines in enumerate(SCRIPT, start=1):
        p = await gen(i, lines)
        d = MP3(p).info.length
        print(f"  scene {i}: {d:6.2f}s  ({len(lines)} caption)  -> {p}")
    print("OK.")

if __name__ == "__main__":
    asyncio.run(main())
