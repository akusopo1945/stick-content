#!/usr/bin/env python3
"""Generate Indonesian narration MP3 from a small script and emit exact caption timings."""
import json, os, subprocess, tempfile
from gtts import gTTS
from mutagen.mp3 import MP3
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30
GAP = 0.35      # silence between lines (s)
TAIL = 0.7      # trailing silence at end of each scene (s)

OUT_DIR = "G:/PROJECTAN/stick/stickman-story/public/audio"
JSON_OUT = "G:/PROJECTAN/stick/stickman-story/narration_timing.json"
os.makedirs(OUT_DIR, exist_ok=True)

# Script: scene -> list of narration lines (Indonesian)
SCRIPT = {
    "intro": [
        "Hai! Pernah kepikiran, apa itu kecerdasan buatan?",
    ],
    "explain": [
        "AI adalah mesin yang belajar dari ribuan contoh data.",
        "Sama seperti kita yang belajar dari pengalaman.",
    ],
    "diagram": [
        "Data masuk, dilatih jadi model, lalu menghasilkan keputusan.",
        "Sederhana kan? Itu dia, kecerdasan buatan!",
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
    parts = []          # list of (path, is_silence)
    cues = []
    t = 0.0
    for i, line in enumerate(lines):
        lp = os.path.join(tmp, f"l{i}.mp3")
        gen_line(line, lp)
        ld = dur(lp)
        parts.append((lp, False))
        cues.append({
            "from": round(t * FPS),
            "to": round((t + ld + 0.25) * FPS),
            "text": line,
            "pos": "lower" if scene_key != "explain" else "lower",
        })
        t += ld
        if i < len(lines) - 1:
            sp = os.path.join(tmp, f"s{i}.mp3")
            make_silence(sp, GAP)
            parts.append((sp, True))
            t += GAP
    # trailing silence
    tailp = os.path.join(tmp, "tail.mp3")
    make_silence(tailp, TAIL)
    parts.append((tailp, True))
    t += TAIL

    # concat via ffmpeg concat demuxer
    scene_mp3 = os.path.join(OUT_DIR, f"scene_{scene_key}.mp3")
    listfile = os.path.join(tmp, "list.txt")
    with open(listfile, "w") as f:
        for p, _ in parts:
            f.write(f"file '{p}'\n")
    subprocess.run([FF, "-y", "-f", "concat", "-safe", "0", "-i", listfile,
                    "-c", "copy", scene_mp3], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    scene_len = round(dur(scene_mp3) * FPS)
    # clamp cues within scene
    for c in cues:
        c["to"] = min(c["to"], scene_len - 2)
    return scene_mp3, scene_len, cues

scenes = []
seg_paths = []
for key, lines in SCRIPT.items():
    mp3, length, cues = build_scene(lines, key)
    seg_paths.append(mp3)
    scenes.append({"id": key, "len": length, "cues": cues})

# combine all scenes into one narration.mp3
total = sum(s["len"] for s in scenes)
listfile = os.path.join(tempfile.mkdtemp(), "all.txt")
with open(listfile, "w") as f:
    for p in seg_paths:
        f.write(f"file '{p}'\n")
final = os.path.join(OUT_DIR, "narration.mp3")
subprocess.run([FF, "-y", "-f", "concat", "-safe", "0", "-i", listfile,
                "-c", "copy", final], check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

data = {"fps": FPS, "total": total, "scenes": scenes, "narration": "audio/narration.mp3"}
with open(JSON_OUT, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("WROTE", final, "dur(s)=", round(dur(final), 2))
for s in scenes:
    print(f"  scene {s['id']:8s} len={s['len']} frames")
    for c in s["cues"]:
        print(f"     cue {c['from']:>4}-{c['to']:<4}  {c['text']}")
