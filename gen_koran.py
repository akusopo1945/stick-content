#!/usr/bin/env python3
"""
gen_koran.py — narasi untuk KoranStory (tema EKONOMI PANGAN, gaya visual EDITORIAL/KORAN).

TTS: edge-tts (Microsoft neural, id-ID-ArdiNeural = suara pria, cocok buat anchor berita).
Output: gemini_in/koran/1.mp3 .. 5.mp3  -> lalu `python3 build.py --script ... --in-dir gemini_in/koran`

1 file = 1 scene. Timing caption dihitung build.py secara proporsional per karakter.
"""
import asyncio, os, sys
import edge_tts
from mutagen.mp3 import MP3

VOICE = "id-ID-ArdiNeural"
RATE = "+8%"
OUT_DIR = "G:/PROJECTAN/stick/gemini_in/koran"

# Tiap scene = daftar kalimat. Ini juga yang masuk `captions` di koran.json (harus sama).
SCRIPT = [
    [  # 1 — hook
        "Beras premium di pasar tembus enam belas ribu rupiah per kilo.",
        "Di tingkat petani, gabah dihargai sekitar delapan ribu.",
        "Dua-duanya naik. Tapi kenapa petani tetap merasa nggak untung?",
    ],
    [  # 2 — explain / bedah angka
        "Bulan lalu BPS mencatat Nilai Tukar Petani 132,60. Rekor tertinggi sepanjang sejarah.",
        "Artinya, harga yang diterima petani naik lebih cepat daripada biaya hidup dan biaya produksinya.",
        "Di atas kertas, ini kabar bagus. Tapi angka rata-rata selalu menyembunyikan sesuatu.",
    ],
    [  # 3 — causes
        "Pertama, biaya produksi. Pupuk, benih, dan upah buruh tani ikut naik.",
        "Kedua, rantai distribusi. Dari sawah sampai rak pasar, ada banyak tangan yang ambil untung.",
        "Ketiga, permainan harga. Pemerintah sudah menetapkan tiga belas tersangka mafia beras dari delapan kasus.",
    ],
    [  # 4 — prokontra
        "Yang setuju bilang: ini bukti kebijakan pangan jalan. Serapan Bulog tembus empat koma empat juta ton.",
        "Yang menolak bilang: angka rata-rata tidak bicara soal petani gurem yang cuma punya sepetak sawah.",
        "Dan selama HET dan HPP masih dikaji, ketidakpastian itu tetap dibayar oleh petani.",
    ],
    [  # 5 — ending
        "Swasembada itu soal produksi. Kesejahteraan itu soal harga.",
        "Kalau yang satu naik tapi yang lain jalan di tempat, sebenarnya untuk siapa panen ini?",
    ],
]


async def gen(idx: int, lines: list[str]):
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
    print("OK. Lanjut: python3 build.py --script stickman-story/src/scripts/koran.json --in-dir gemini_in/koran")


if __name__ == "__main__":
    asyncio.run(main())
