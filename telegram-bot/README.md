
# Bot de Telegram para el Sistema de Votación Digital UNT

## Descripción

Este es un bot de Telegram diseñado para responder preguntas frecuentes y guiar a los usuarios sobre cómo usar el Sistema de Votación Digital de la Universidad Nacional de Trujillo (UNT).

## Características

- ✅ Responde a preguntas frecuentes (FAQ) predefinidas
- ✅ Integración con Groq o Google Gemini (cambiable via .env)
- ✅ Guía paso a paso para votar
- ✅ Información sobre privacidad y seguridad
- ✅ No revela datos privados

## Requisitos previos

1. Tener un **token de bot de Telegram** (crea uno con [@BotFather](https://t.me/BotFather))
2. Tener una **API key de Groq** o una **API key de Google Gemini**
3. Instalar Python 3.8+

## Instalación y configuración

1. Navega al directorio `telegram-bot`
2. Copia `.env.example` a `.env`
3. Edita `.env` con tus credenciales:
   - `TELEGRAM_TOKEN`: Tu token de bot de Telegram
   - `LLM_PLATFORM`: Elije `groq` o `gemini`
   - `GROQ_API_KEY` o `GEMINI_API_KEY`: Tu clave API correspondiente
4. Instala dependencias:
   ```bash
   pip install -r requirements.txt
   ```

## Ejecución

Para iniciar el bot:
```bash
python main.py
```

## Comandos disponibles

- `/start` - Inicia el bot
- `/ayuda` - Muestra el menú de ayuda
- `/faq` - Lista todas las preguntas frecuentes
- `/como_votar` - Muestra la guía paso a paso para votar
- `/privacidad` - Información sobre la privacidad del sistema
- `/verificar` - Cómo verificar tu voto después de emitirlo

## Personalización del FAQ

Puedes editar el archivo `faq.py` para agregar o modificar las preguntas y respuestas frecuentes del bot!
