#!/usr/bin/env python3
"""Generate Indonesian narration MP3 for the 'Wapres mundur' story + exact caption timings."""
import json, os, subprocess, tempfile
from gtts import gTTS
from mutagen.mp3 import MP3
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30
GAP = 0.35
TAIL = 0.7

OUT_DIR = "G:/PROJECTAN/stick/stickman-story/public/audio"
JSON_OUT = "G:/PROJECTAN/stick/stickman-story/wapres_timing.json"
os.makedirs(OUT_DIR, exist_ok=True)

# Naskah: scene -> baris narasi (edukatif, netral, bukan nasihat hukum).
SCRIPT = {
    "hook": [
        "Pernah kepikiran: bisa nggak sih wakil presiden mundur di tengah jalan?",
    ],
    "konstitusi": [
        "Di Indonesia, presiden dan wakil presiden dipilih berpasangan, untuk lima tahun.",
        "Tapi UUD 1945 sebenarnya lebih banyak mengatur pemberhentian lewat MPR, bukan pengunduran diri sukarela.",
    ],
    "penyebab": [
        "Lalu, bagaimana bisa seorang wakil presiden lengser?",
        "Bisa karena meninggal, diberhentikan lewat proses, atau... mengundurkan diri.",
        "Nah, soal mengundurkan diri ini, hukumnya masih mengambang dan jadi perdebatan.",
    ],
    "prokontra": [
        "Kalau kursi wakil presiden kosong, presiden mengangkat pengganti dengan persetujuan DPR.",
        "Pro-nya: presiden lebih leluasa. Kontra-nya: DPR pegang kendali persetujuan.",
        "Dan bila presiden pun berhalangan, MPR yang menentukan arah negara.",
    ],
    "ending": [
        "Jadi, siapa yang sebenarnya menjaga kursi itu?",
        "Mungkin baru kita sadari... ketika waktunya benar-benar tiba.",
    ],
}

def dur(path):
    return MP3(path).info.length

def make_silence(path, secs):
    subprocess.run([FF, "-y", "-f", "lavfi", "-i", f"sine=frequency=0:duration={secs}",
                    "-ac", "1", "-ar", "44100", path], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def gen_line(text, out_path):
    gTTS(text=text, lang="id", tld="co.id", slow=False).save(out_path)

def build_scene(lines, scene_key):
    tmp = tempfile.mkdtemp()
    parts = []
    cues_local = []
    t = 0.0
    for i, line in enumerate(lines):
        lp = os.path.join(tmp, f"l{i}.mp3")
        gen_line(line, lp)
        ld = dur(lp)
        parts.append((lp, False))
        cues_local.append({"local_from": round(t * FPS), "local_to": round((t + ld + 0.25) * FPS), "text": line})
        t += ld
        if i < len(lines) - 1:
            sp = os.path.join(tmp, f"s{i}.mp3")
            make_silence(sp, GAP)
            parts.append((sp, True))
            t += GAP
    tailp = os.path.join(tmp, "tail.mp3")
    make_silence(tailp, TAIL)
    parts.append((tailp, True))
    t += TAIL

    scene_mp3 = os.path.join(OUT_DIR, f"scene_{scene_key}.mp3")
    listfile = os.path.join(tmp, "list.txt")
    with open(listfile, "w") as f:
        for p, _ in parts:
            f.write(f"file '{p}'\n")
    subprocess.run([FF, "-y", "-f", "concat", "-safe", "0", "-i", listfile, "-c", "copy", scene_mp3],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    scene_len = round(dur(scene_mp3) * FPS)
    return scene_mp3, scene_len, cues_local

scenes = []
seg_paths = []
cum = 0
for key, lines in SCRIPT.items():
    mp3, length, local = build_scene(lines, key)
    seg_paths.append(mp3)
    abs_cues = []
    for c in local:
        af = min(c["local_from"] + cum, length - 2 + cum)
        at = min(c["local_to"] + cum, length - 2 + cum)
        abs_cues.append({"from": af, "to": at, "text": c["text"], "pos": "lower"})
    scenes.append({"id": key, "from": cum, "len": length, "cues": abs_cues})
    cum += length

total = cum
listfile = os.path.join(tempfile.mkdtemp(), "all.txt")
with open(listfile, "w") as f:
    for p in seg_paths:
        f.write(f"file '{p}'\n")
final = os.path.join(OUT_DIR, "wapres_narration.mp3")
subprocess.run([FF, "-y", "-f", "concat", "-safe", "0", "-i", listfile, "-c", "copy", final],
               check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

data = {"fps": FPS, "total": total, "scenes": scenes, "narration": "audio/wapres_narration.mp3"}
with open(JSON_OUT, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("WROTE", final, "dur(s)=", round(dur(final), 2), "total_frames=", total)
for s in scenes:
    print(f"  scene {s['id']:11s} from={s['from']:>4} len={s['len']:>4}")
    for c in s["cues"]:
        print(f"     cue {c['from']:>4}-{c['to']:<4}  {c['text']}")
