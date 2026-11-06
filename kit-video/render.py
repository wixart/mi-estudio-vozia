#!/usr/bin/env python3
"""Renderiza el vídeo a partir de anim/ + timeline.json + voz.
  python3 render.py timeline.json voz.wav salida.mp4            -> vídeo completo
  python3 render.py timeline.json voz.wav x --stills 2.1,8.4    -> sólo fotogramas PNG en stills/
"""
import sys, os, json, base64, subprocess, threading, functools, http.server, socketserver, shutil
import numpy as np
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ANIM = os.path.join(HERE, "anim")
tl_path, voice, out = sys.argv[1:4]
stills = sys.argv[sys.argv.index("--stills") + 1].split(",") if "--stills" in sys.argv else None
FPS = 30

with open(os.path.join(ANIM, "timeline.js"), "w") as f:
    f.write("window.TIMELINE=" + open(tl_path).read() + ";")

# servidor local para que el navegador cargue fuentes y logo sin problemas de file://
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
Handler = functools.partial(Quiet, directory=ANIM)
srv = socketserver.TCPServer(("127.0.0.1", 0), Handler); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

def run(cmd): subprocess.run(cmd, check=True)

with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=shutil.which("google-chrome"), args=["--disable-gpu"])
    pg = br.new_page(viewport={"width": 540, "height": 960})
    msgs = []; pg.on("console", lambda m: msgs.append(m.text)); pg.on("pageerror", lambda e: msgs.append("ERROR " + str(e)))
    pg.goto(f"http://127.0.0.1:{port}/index.html"); pg.evaluate("window.ready")
    info = pg.evaluate("getBounds()")
    if stills:
        os.makedirs(os.path.join(HERE, "stills"), exist_ok=True)
        for s in stills:
            data = pg.evaluate(f"frameJPEG({float(s)})").split(",", 1)[1]
            open(os.path.join(HERE, "stills", f"t{float(s):06.2f}.jpg"), "wb").write(base64.b64decode(data))
        print("\n".join(set(msgs))); print(json.dumps(info)); sys.exit(0)

    os.makedirs(os.path.join(HERE, "parts"), exist_ok=True)
    total_frames = round(info["total"] * FPS)
    cuts = [round(sc["s"] * FPS) for sc in info["scenes"]] + [total_frames]
    parts = []
    for k in range(len(cuts) - 1):
        f0, f1 = cuts[k], cuts[k + 1]
        part = os.path.join(HERE, "parts", f"{k:02d}.mp4"); tmp = part.replace(".mp4", ".tmp.mp4")
        p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", str(FPS), "-i", "-",
                              "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", str(FPS), tmp], stdin=subprocess.PIPE)
        for fr in range(f0, f1):
            data = pg.evaluate(f"frameJPEG({fr / FPS})").split(",", 1)[1]
            p.stdin.write(base64.b64decode(data))
        p.stdin.close()
        if p.wait() != 0: sys.exit("ffmpeg falló en la parte %d" % k)
        os.replace(tmp, part); parts.append(part)
        print(f"escena {info['scenes'][k]['id']}: {f1 - f0} fotogramas", flush=True)
    sfx = pg.evaluate("getSfx()")
    br.close()
if msgs: print("consola:", "\n".join(set(msgs)))

# unir escenas
lst = os.path.join(HERE, "parts", "list.txt")
open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
video = os.path.join(HERE, "parts", "video.mp4")
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", video])

# efectos de sonido sintetizados + voz
SR = 48000; total = total_frames / FPS
mix = np.zeros(int(SR * (total + 1)), np.float32)
def env(n, a=.005, d=.1):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
R = np.random.default_rng(1)
def snd(kind):
    if kind == "pop":
        n = int(.12 * SR); t = np.arange(n) / SR; f = 900 * np.exp(-t * 25) + 300
        return .35 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .04)
    if kind == "tick":
        n = int(.05 * SR); return .25 * R.standard_normal(n) * env(n, .001, .008)
    if kind == "ding":
        n = int(.6 * SR); t = np.arange(n) / SR
        return .22 * (np.sin(2 * np.pi * 1320 * t) + .5 * np.sin(2 * np.pi * 1980 * t)) * env(n, .003, .18)
    if kind == "stamp":
        n = int(.35 * SR); t = np.arange(n) / SR
        return .7 * np.sin(2 * np.pi * 70 * t) * env(n, .002, .09) + .25 * R.standard_normal(n) * env(n, .001, .02)
    if kind == "down":
        n = int(.5 * SR); t = np.arange(n) / SR; f = 700 * np.exp(-t * 3)
        return .2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .01, .25)
    if kind == "whoosh":
        n = int(.45 * SR); t = np.arange(n) / SR; x = R.standard_normal(n)
        x = np.convolve(x, np.ones(24) / 24, "same"); e = np.sin(np.pi * t / t[-1]) ** 2
        return .35 * x * e
    return np.zeros(1)
for t0, kind in sfx:
    s = snd(kind).astype(np.float32); i = int(t0 * SR); mix[i:i + len(s)] += s[: len(mix) - i]
fx = os.path.join(HERE, "parts", "sfx.wav")
import wave
with wave.open(fx, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix * .5, -1, 1) * 32767).astype(np.int16).tobytes())

run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", voice, "-i", fx, "-filter_complex",
     "[1:a]aresample=48000,apad=pad_dur=4,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000[v];[2:a]volume=0.55[f];[v][f]amix=inputs=2:normalize=0:duration=longest,apad[a]",
     "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}", "-movflags", "+faststart", out])
print("listo:", out, f"{total:.2f}s")
