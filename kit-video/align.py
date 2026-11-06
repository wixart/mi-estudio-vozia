#!/usr/bin/env python3
"""Alinea el guion (script.json) con un audio de voz y genera timeline.json
con el tiempo de cada palabra, la escena a la que pertenece y los bloques de subtítulo.
Uso: python3 align.py script.json voz.wav timeline.json
"""
import json, re, sys, os, unicodedata, difflib
from faster_whisper import WhisperModel

script_path, audio_path, out_path = sys.argv[1:4]
S = json.load(open(script_path))

NUM = {"0":"cero","1":"uno","2":"dos","3":"tres","4":"cuatro","5":"cinco","6":"seis","7":"siete",
       "8":"ocho","9":"nueve","10":"diez","15":"quince","38":"treinta y ocho","65":"sesenta y cinco",
       "67":"sesenta y siete","2027":"dos mil veintisiete","2026":"dos mil veintiseis"}

def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)

def expand(w):
    """palabra del guion -> lista de tokens hablados normalizados (para casar con whisper)"""
    n = norm(w)
    if n in NUM: return [norm(x) for x in NUM[n].split()]
    if n.isdigit():
        try:
            from num2words import num2words
            return [norm(x) for x in num2words(int(n), lang="es").split()]
        except Exception: pass
    return [n] if n else []

# 1) palabras del guion
words = []
for si, sc in enumerate(S["scenes"]):
    for raw in sc["text"].split():
        emph = "*" in raw
        disp = raw.replace("*", "")
        words.append({"w": disp, "emph": emph, "scene": si})
# el énfasis con *...* puede abarcar varias palabras: "*38 años y 6 meses*"
for si, sc in enumerate(S["scenes"]):
    inside = False
    idx = [i for i, w in enumerate(words) if w["scene"] == si]
    for i, raw in zip(idx, sc["text"].split()):
        starts = raw.startswith("*") or raw.startswith("¿*")
        if starts: inside = True
        words[i]["emph"] = inside
        if raw.rstrip(".,:;?!").endswith("*"): inside = False

# 2) transcripción con marcas de tiempo por palabra
model = WhisperModel(sys.argv[sys.argv.index("--model")+1] if "--model" in sys.argv else "medium", device="cpu", compute_type="int8", download_root=os.environ.get("WHISPER_DIR", os.path.expanduser("~/.cache/whisper-models")))
import subprocess, numpy as np
pcm = subprocess.run(["ffmpeg","-v","error","-i",audio_path,"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True,check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
audio = np.concatenate([audio, np.zeros(16000 * 2, np.float32)])  # whisper recorta el final si no hay silencio
segs, info = model.transcribe(audio, language="es", word_timestamps=True, vad_filter=False,
                              initial_prompt=" ".join(w["w"] for w in words))
hyp = []
segs = list(segs)
if "--debug" in sys.argv:
    for sg in segs: print(f"{sg.start:6.2f}-{sg.end:6.2f} {sg.text}")
for sg in segs:
    for wd in sg.words:
        for tok in expand(wd.word.strip()):
            hyp.append({"t": tok, "s": wd.start, "e": wd.end})
duration = len(pcm) / 2 / 16000

# 3) tokens del guion con referencia a su palabra
ref = []
for wi, w in enumerate(words):
    for tok in expand(w["w"]):
        ref.append({"t": tok, "wi": wi})

sm = difflib.SequenceMatcher(a=[r["t"] for r in ref], b=[h["t"] for h in hyp], autojunk=False)
for tag, a0, a1, b0, b1 in sm.get_opcodes():
    if tag == "equal" or (tag == "replace" and a1 - a0 == b1 - b0):
        for k in range(a1 - a0):
            ref[a0 + k]["s"] = hyp[b0 + k]["s"]; ref[a0 + k]["e"] = hyp[b0 + k]["e"]
    elif tag == "replace" and b1 > b0:  # repartir el tramo proporcionalmente
        s0, e0 = hyp[b0]["s"], hyp[b1 - 1]["e"]
        n = a1 - a0
        for k in range(n):
            ref[a0 + k]["s"] = s0 + (e0 - s0) * k / n; ref[a0 + k]["e"] = s0 + (e0 - s0) * (k + 1) / n

for w in words: w["s"] = None; w["e"] = None
for r in ref:
    if "s" in r:
        w = words[r["wi"]]
        w["s"] = r["s"] if w["s"] is None else min(w["s"], r["s"])
        w["e"] = r["e"] if w["e"] is None else max(w["e"], r["e"])
# interpolar huecos
known = [i for i, w in enumerate(words) if w["s"] is not None]
for i, w in enumerate(words):
    if w["s"] is None:
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        t0 = words[prev]["e"] if prev is not None else 0.0
        t1 = words[nxt]["s"] if nxt is not None else duration
        p0 = prev if prev is not None else -1
        p1 = nxt if nxt is not None else len(words)
        f = (i - p0) / (p1 - p0)
        w["s"] = t0 + (t1 - t0) * f - 0.05; w["e"] = w["s"] + 0.25
missing = len(words) - len(known)

# 4) bloques de subtítulo: cortar en puntuación o cada ~5 palabras / 28 caracteres
chunks, cur = [], []
for i, w in enumerate(words):
    cur.append(i)
    txt = " ".join(words[k]["w"] for k in cur)
    end_scene = i + 1 == len(words) or words[i + 1]["scene"] != w["scene"]
    punct = re.search(r"[.?!:]$", w["w"]) is not None
    comma = w["w"].endswith(",")
    if end_scene or punct or (comma and len(cur) >= 3) or len(cur) >= 6 or len(txt) >= 30:
        chunks.append(cur); cur = []
for ci, ch in enumerate(chunks):
    for k in ch: words[k]["chunk"] = ci

# 5) escenas
scenes = []
for si, sc in enumerate(S["scenes"]):
    ws = [w for w in words if w["scene"] == si]
    scenes.append({"id": sc["id"], "s": ws[0]["s"], "e": ws[-1]["e"]})
json.dump({"duration": duration, "words": words, "scenes": scenes, "chunks": len(chunks)},
          open(out_path, "w"), ensure_ascii=False, indent=1)
print(f"duración {duration:.2f}s · {len(words)} palabras · sin casar: {missing}")
for sc in scenes: print(f"  {sc['id']:<11} {sc['s']:6.2f} → {sc['e']:6.2f}")
