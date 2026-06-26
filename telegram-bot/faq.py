
# FAQ data for the voting system bot
FAQ = {
    "¿Qué es el sistema de votación digital UNT?": "Es una plataforma segura para votar en las elecciones universitarias de la UNT.",
    "¿Cómo me registro?": "No necesitas registrarte. Solo usa tu DNI o carnet universitario.",
    "¿Cómo voto?": "1. Abre la página web 2. Valida tu identidad con DNI o carnet 3. Elige tu candidato 4. Confirma tu voto.",
    "¿Mi voto es secreto?": "¡Sí! Nadie podrá ver por quién votaste.",
    "¿Qué es un Zero-Knowledge Proof?": "Es una tecnología que asegura que tu voto sea secreto pero válido.",
    "¿Puedo verificar mi voto?": "Sí, después de votar te dan un código que te permite confirmar que tu voto se contó.",
    "¿Qué pasa si el sistema se cae?": "El sistema está diseñado para ser seguro, tus votos no se pierden.",
    "¿Quién puede votar?": "Los estudiantes activos de la UNT que estén en el padrón electoral.",
    "¿Hay un límite de tiempo para votar?": "Sí, las elecciones tienen un horario definido. Vota dentro de ese tiempo.",
    "ayuda": "¡Hola! Soy tu ayudante para el voto digital de la UNT. Puedes usar estos comandos: /start, /ayuda, /faq, /como_votar, /privacidad, /verificar. También puedes preguntarme lo que quieras.",
    "privacidad": "Tu información está segura. No compartimos datos y tu voto es secreto.",
    "verificar": "Después de votar, guarda el código que te dan. Con él podrás confirmar que tu voto se contó correctamente."
}

def get_faq_response(question: str) -> str | None:
    """
    Look for a direct match in the FAQ dictionary
    """
    question_lower = question.strip().lower()
    for q, a in FAQ.items():
        if question_lower in q.lower():
            return a
    return None
