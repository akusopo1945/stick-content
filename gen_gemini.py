#!/usr/bin/env python3
"""
Generate narration via Google Gemini TTS (the engine behind aistudio.google.com/generate-speech)
and glue segments into one MP3 with EXACT caption timings.

Two modes:
  A) api     : calls Gemini TTS REST API per line. Needs env GEMINI_API_KEY.
  B) manual  : you download each line's MP3 from AI Studio UI, save as <scene>_l<idx>.mp3
               in --in-dir, and this script only glues + times them.

Output: public/audio/wapres_gemini.mp3  +  wapres_gemini_timing.json  (same schema as gen_wapres.py)
Then point the WapresStory composition at audio/wapres_gemini.mp3 and sync CAPTIONS from the JSON.
"""
import os, sys, json, base64, re, subprocess, tempfile, argparse, time
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30
GAP = 0.35     # silence between lines (s)
TAIL = 0.7     # trailing silence per scene (s)

OUT_DIR = "G:/PROJECTAN/stick/stickman-story/public/audio"
JSON_OUT = "G:/PROJECTAN/stick/stickman-story/wapres_gemini_timing.json"
os.makedirs(OUT_DIR, exist_ok=True)

MODEL = "gemini-2.5-flash-preview-tts"   # dedicated TTS model; ganti ke gemini-2.5-pro-preview-tts utk kualitas atas
VOICE = "Kore"                            # prebuilt voice (language-agnostic)

# Naskah (sama dengan WapresStory). Edit di sini untuk cerita lain.
SCRIPT = {
    "hook": ["Pernah kepikiran: bisa nggak sih wakil presiden mundur di tengah jalan?"],
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

def duration(path):
    out = subprocess.run([FF, "-hide_banner", "-i", path, "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", out)
    if not m: return 0.0
    h, mi, s = map(float, m.groups())
    return h * 3600 + mi * 60 + s

def make_silence(path, secs):
    subprocess.run([FF, "-y", "-f", "lavfi", "-i", f"sine=frequency=0:duration={secs}",
                    "-ac", "1", "-ar", "44100", path], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def to_mp3(src, dst):
    subprocess.run([FF, "-y", "-i", src, "-ac", "1", "-ar", "44100", dst], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def tts_api(text, key):
    import urllib.request, time
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}"
           f":generateContent")
    body = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}},
        },
    }
    last = None
    for attempt in range(6):
        req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                    headers={"Content-Type": "application/json",
                                             "X-goog-api-key": key})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = json.loads(r.read())
            part = data["candidates"][0]["content"]["parts"][0]["inlineData"]
            return base64.b64decode(part["data"])   # audio/pcm (16-bit)
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 429:
                wait = 5 * (attempt + 1)
                print(f"  429 rate-limit, retry {attempt+1} in {wait}s...")
                time.sleep(wait)
                continue
            print("API ERROR", e.code, e.read().decode()[:400]); raise
    raise last

def get_line_audio(text, key, mode, in_dir, scene_key, idx):
    if mode == "api":
        cache = os.path.join(OUT_DIR, "_gemini_cache", f"{scene_key}_l{idx}.mp3")
        os.makedirs(os.path.dirname(cache), exist_ok=True)
        if os.path.exists(cache) and duration(cache) > 0.2:
            return cache                       # resume: pakai hasil sebelumnya
        raw = tts_api(text, key)
        pcm = os.path.join(tempfile.mkdtemp(), "raw.pcm")
        open(pcm, "wb").write(raw)
        to_mp3_pcm(pcm, cache)                 # Gemini TTS default 16-bit PCM 24000 Hz mono
        return cache
    else:
        src = os.path.join(in_dir, f"{scene_key}_l{idx}.mp3")
        if not os.path.exists(src):
            raise FileNotFoundError(f"File tidak ada: {src}")
        return src

def to_mp3_pcm(pcm, dst):
    # raw PCM 16-bit LE, 24000 Hz, mono -> mp3
    subprocess.run([FF, "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", pcm,
                    "-ac", "1", "-ar", "44100", dst], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def build_scene(lines, scene_key, mode, in_dir, key):
    tmp = tempfile.mkdtemp()
    parts = []
    local = []
    t = 0.0
    for i, line in enumerate(lines):
        if i > 0:
            time.sleep(2)   # jeda antar request -> hindari 429
        src = get_line_audio(line, key, mode, in_dir, scene_key, i + 1)
        mp3 = os.path.join(tmp, f"l{i}.mp3")
        to_mp3(src, mp3) if mode == "api" else (lambda: (open(mp3, "wb").write(open(src, "rb").read())))()
        ld = duration(mp3)
        parts.append(mp3)
        local.append({"from": round(t * FPS), "to": round((t + ld + 0.25) * FPS), "text": line})
        t += ld
        if i < len(lines) - 1:
            sp = os.path.join(tmp, f"s{i}.mp3")
            make_silence(sp, GAP)
            parts.append(sp); t += GAP
    tailp = os.path.join(tmp, "tail.mp3")
    make_silence(tailp, TAIL); parts.append(tailp); t += TAIL

    scene_mp3 = os.path.join(OUT_DIR, f"scene_{scene_key}_gemini.mp3")
    listfile = os.path.join(tmp, "list.txt")
    with open(listfile, "w") as f:
        for p in parts: f.write(f"file '{p}'\n")
    subprocess.run([FF, "-y", "-f", "concat", "-safe", "0", "-i", listfile, "-c", "copy", scene_mp3],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return scene_mp3, round(duration(scene_mp3) * FPS), local

def build_scene_gemini(scene_key, lines, key):
    """1 TTS call per scene (reuse file jika sudah ada). Timing proporsional per karakter."""
    scene_mp3 = os.path.join(OUT_DIR, f"scene_{scene_key}_gemini.mp3")
    if os.path.exists(scene_mp3) and duration(scene_mp3) > 0.5:
        d = duration(scene_mp3)                      # reuse hasil sebelumnya -> hemat quota
    else:
        raw = tts_api(" ".join(lines), key)           # 1 request untuk 1 scene
        pcm = os.path.join(tempfile.mkdtemp(), "raw.pcm")
        open(pcm, "wb").write(raw)
        to_mp3_pcm(pcm, scene_mp3)
        d = duration(scene_mp3)
    total_chars = max(1, sum(len(l) for l in lines))
    local, cl = [], 0
    for line in lines:
        est = d * (len(line) / total_chars)
        local.append({"from": round(cl * FPS), "to": round((cl + est + 0.25) * FPS), "text": line})
        cl += est + GAP
    length = round((cl + TAIL) * FPS)
    return scene_mp3, length, local

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["api", "manual", "api-one", "manual-scene"], required=True)
    ap.add_argument("--in-dir", help="folder berisi <scene>_l<idx>.mp3 (untuk manual)")
    args = ap.parse_args()

    key = os.environ.get("GEMINI_API_KEY")
    if args.mode in ("api", "api-one") and not key:
        print("ERROR: butuh GEMINI_API_KEY"); sys.exit(1)
    if args.mode == "manual" and not args.in_dir:
        print("ERROR: manual butuh --in-dir"); sys.exit(1)

    if args.mode == "manual":
        scenes, seg_paths, cum = [], [], 0
        for sk, lines in SCRIPT.items():
            mp3, length, local = build_scene(lines, sk, "manual", args.in_dir, key)
            seg_paths.append(mp3)
            abs_cues = [{"from": min(c["from"]+cum, length-2+cum), "to": min(c["to"]+cum, length-2+cum), "text": c["text"], "pos":"lower"} for c in local]
            scenes.append({"id": sk, "from": cum, "len": length, "cues": abs_cues}); cum += length
    elif args.mode == "manual-scene":
        # 1 file per scene dari AI Studio UI: <in-dir>/<scene>.mp3. Reuse cache lama kalau file tak ada.
        from mutagen.mp3 import MP3
        scenes, seg_paths, cum = [], [], 0
        for sk, lines in SCRIPT.items():
            src = os.path.join(args.in_dir, f"{sk}.mp3")
            if not os.path.exists(src):
                alt = os.path.join(OUT_DIR, f"scene_{sk}_gemini.mp3")
                if os.path.exists(alt) and MP3(alt).info.length > 0.5:
                    src = alt
                else:
                    print(f"ERROR: tak ada {sk}.mp3 di --in-dir & tak ada cache"); sys.exit(1)
            d = MP3(src).info.length                       # durasi ASLI (tanpa padding)
            total_chars = max(1, sum(len(l) for l in lines))
            local, cl = [], 0
            for line in lines:
                est = d * (len(line) / total_chars)        # proporsional thd audio asli
                local.append({"from": round(cl * FPS), "to": round((cl + est) * FPS), "text": line})
                cl += est
            length = round(d * FPS) + 9                     # +0.3s tail per scene
            scenes.append({"id": sk, "from": cum, "len": length,
                           "cues": [{"from": min(c["from"]+cum, length-2+cum), "to": min(c["to"]+cum, length-2+cum), "text": c["text"], "pos":"lower"} for c in local]})
            seg_paths.append(src); cum += length
    else:
        # api / api-one: 1 call per scene, reuse file lama, tahan banting kalau 429
        scenes, seg_paths, cum = [], [], 0
        for sk, lines in SCRIPT.items():
            try:
                mp3, length, local = build_scene_gemini(sk, lines, key)
            except Exception as e:
                print(f"  SKIP {sk}: {e}"); continue
            seg_paths.append(mp3)
            abs_cues = [{"from": min(c["from"]+cum, length-2+cum), "to": min(c["to"]+cum, length-2+cum), "text": c["text"], "pos":"lower"} for c in local]
            scenes.append({"id": sk, "from": cum, "len": length, "cues": abs_cues}); cum += length

    if not seg_paths:
        print("Tidak ada scene berhasil (semua 429?). Re-run nanti: python3 gen_gemini.py --mode api"); sys.exit(1)

    # concat FILTER: decode tiap input mandiri -> resample otomatis.
    # Lebih aman dr concat demuxer yg bisa buang segmen kalau profil MP3 beda.
    final = os.path.join(OUT_DIR, "wapres_gemini.mp3")
    cmd = [FF, "-y"]
    for p in seg_paths:
        cmd += ["-i", p]
    n = len(seg_paths)
    ins = "".join(f"[{i}:a]" for i in range(n))
    cmd += ["-filter_complex", f"{ins}concat=n={n}:v=0:a=1[out]",
            "-map", "[out]", "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", final]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    json.dump({"fps": FPS, "total": cum, "scenes": scenes, "narration": "audio/wapres_gemini.mp3"}, open(JSON_OUT,"w"), indent=2, ensure_ascii=False)
    print("WROTE", final, "dur(s)=", round(duration(final),2), "frames=", cum)
    for s in scenes:
        print(f"  {s['id']:11s} from={s['from']:>4} len={s['len']:>4}")
        for c in s["cues"]:
            print(f"     {c['from']:>4}-{c['to']:<4} {c['text']}")

if __name__ == "__main__":
    main()
