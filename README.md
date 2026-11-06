# Estudio de Voz

PWA para generar locuciones con Gemini TTS (una sola toma, voz constante) y descargarlas en WAV.

- Sitio estático: no necesita build. En Vercel: framework «Other», sin comando de build.
- La API key de Gemini se guarda solo en el navegador del usuario (localStorage).
- Pega el «paquete de voz» (JSON con `voice`, `voice_style`, `text`) y pulsa «Generar locución».
