# Kit de vídeo explicativo vertical (1080×1920)

Motor para vídeos animados tipo «explicador» para redes sociales de clientes, con voz de Gemini TTS
(generada en la app Estudio de Voz de la raíz del repo) y subtítulos palabra a palabra sincronizados.

## Piezas
- `anim/engine.js` — motor genérico: fondos, subtítulos, cortinillas, primitivas (papel, sello, monedas, personaje, bocadillos…).
- `anim/index.html` — carga `timeline.js`, `brand.js`, `engine.js`, `scenes.js`.
- `align.py` — sincroniza guion y audio (faster-whisper) → `timeline.json`.
- `render.py` — renderiza con Chrome headless, mezcla voz + efectos → MP4.
- `make_pack.py` — guion → paquete de voz JSON para la app.
- `ejemplos/asesoria-gama/` — guion, escenas y dos estilos de marca (web limpia e infografía ilustrada).

## Flujo
1. Copiar `anim/` a una carpeta de proyecto; añadir `brand.js`, `scenes.js` y el logo del cliente.
2. `script.json` con escenas (`*palabra*` = énfasis) → `python3 make_pack.py script.json paquete_voz.json`.
3. El usuario genera el audio en Estudio de Voz y lo devuelve.
4. `python3 align.py script.json voz.wav timeline.json`
5. `python3 render.py timeline.json voz.wav salida.mp4` (`--stills 1.2,8.5` para fotogramas de prueba).
