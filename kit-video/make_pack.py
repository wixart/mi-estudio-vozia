#!/usr/bin/env python3
"""Genera el paquete de voz (JSON para pegar en Estudio de Voz) a partir de script.json.
Uso: python3 make_pack.py script.json paquete_voz.json"""
import json, re, sys
s = json.load(open(sys.argv[1]))
pack = {"title": f"{s['title']} · {s['client']}", "voice": s.get("voice", "Kore"),
        "model": s.get("model", "gemini-3.1-flash-tts-preview"), "voice_style": s["voice_style"],
        "text": "\n\n".join(re.sub(r"\*", "", sc["text"]) for sc in s["scenes"])}
json.dump(pack, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
print(f"{len(pack['text'].split())} palabras · ≈ {len(pack['text'].split()) / 2.5:.0f} s")
