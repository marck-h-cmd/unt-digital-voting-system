
import os
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import groq
import google.generativeai as genai
from faq import FAQ, get_faq_response

# Load environment variables
load_dotenv()

# Load config
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
LLM_PLATFORM = os.getenv("LLM_PLATFORM", "groq").lower()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize LLM clients
if LLM_PLATFORM == "groq" and GROQ_API_KEY:
    groq_client = groq.Client(api_key=GROQ_API_KEY)
elif LLM_PLATFORM == "gemini" and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-2.0-flash")
else:
    raise ValueError(f"Invalid LLM_PLATFORM '{LLM_PLATFORM}' or missing API key!")

# System prompt for the LLM
SYSTEM_PROMPT = """
Eres un ayudante amigable del Sistema de Votación Digital de la UNT. Ayudas a estudiantes y docentes con preguntas sobre cómo votar.

REGLAS:
1. NUNCA des datos privados
2. Habla en español simple y claro
3. Responde en pocas palabras, no expliques demasiado
4. No uses negritas ni símbolos especiales
5. Sé amable y cercano
6. Si no sabes algo, dilo y sugiere contactar soporte de la UNT
7. Usa la información de las preguntas frecuentes primero

Información clave:
- El sistema es seguro y tu voto es secreto
- Para votar usa tu DNI o carnet universitario
- Después de votar te dan un código para verificar que se contó
"""

def get_llm_response(user_input: str) -> str:
    """Get a response from the selected LLM (Groq or Gemini)"""
    try:
        if LLM_PLATFORM == "groq":
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_input},
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=1024,
            )
            return chat_completion.choices[0].message.content
        elif LLM_PLATFORM == "gemini":
            response = gemini_model.generate_content(
                contents=f"{SYSTEM_PROMPT}\n\nPregunta del usuario: {user_input}",
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=1024
                )
            )
            return response.text
    except Exception as e:
        print(f"LLM Error: {e}")
        return "Lo siento, estoy teniendo problemas para responder en este momento. Por favor intenta más tarde o contacta al soporte técnico de la universidad."

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "¡Hola! 🎉 Bienvenido al asistente del Sistema de Votación Digital UNT!\n\n"
        "Soy tu guía para todo lo relacionado con las elecciones universitarias digitales.\n"
        "Escribe /ayuda para ver los comandos disponibles o pregúntame cualquier cosa!"
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(FAQ["ayuda"])

async def faq_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    faq_list = "📋 Preguntas Frecuentes (FAQ):\n\n"
    for i, question in enumerate(FAQ.keys(), 1):
        if question not in ["ayuda", "privacidad", "verificar"]:
            faq_list += f"{i}. {question}\n"
    faq_list += "\nPregúntame cualquiera de estas y te respondo!"
    await update.message.reply_text(faq_list)

async def how_to_vote(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(FAQ["¿Cómo voto?"])

async def privacy_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(FAQ["privacidad"])

async def verify_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(FAQ["verificar"])

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_message = update.message.text
    print(f"Received message: {user_message}")

    # First check FAQ for exact matches
    faq_response = get_faq_response(user_message)
    if faq_response:
        await update.message.reply_text(faq_response)
        return

    # If no FAQ match, use LLM
    await update.message.reply_text("🔍 Buscando la mejor respuesta para ti...")
    llm_response = get_llm_response(user_message)
    await update.message.reply_text(llm_response)

def main():
    print("Starting Telegram Bot...")
    application = Application.builder().token(TELEGRAM_TOKEN).build()

    # Add command handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("ayuda", help_command))
    application.add_handler(CommandHandler("faq", faq_command))
    application.add_handler(CommandHandler("como_votar", how_to_vote))
    application.add_handler(CommandHandler("privacidad", privacy_command))
    application.add_handler(CommandHandler("verificar", verify_command))

    # Add message handler
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Run the bot
    print("Bot is running!")
    application.run_polling()

if __name__ == "__main__":
    main()
