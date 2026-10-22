import os
import json
import asyncio
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.tl.types import MessageMediaDocument

load_dotenv()

API_ID = int(os.getenv("TELEGRAM_API_ID"))
API_HASH = os.getenv("TELEGRAM_API_HASH")
CHANNEL = os.getenv("TELEGRAM_CHANNEL")

client = TelegramClient("session_teleologia", API_ID, API_HASH)

def clean_text(text):
    if not text:
        return ""
    return text.strip()

async def scan():
    await client.start()
    print("Conectado ao Telegram com sucesso!")

    # Obtém o canal (suporta link de convite t.me/+..., @nomedocanal ou ID numérico)
    if CHANNEL.startswith("-100") or CHANNEL.lstrip("-").isdigit():
        entity = await client.get_entity(int(CHANNEL))
    else:
        entity = await client.get_entity(CHANNEL)

    lessons = []
    index = 1

    print(f"Lendo mensagens do canal: {getattr(entity, 'title', CHANNEL)}...")

    # reverse=True garante a ordem cronológica (da primeira aula à última)
    async for message in client.iter_messages(entity, reverse=True):
        is_video = False
        duration = 0
        file_size = 0

        if message.video:
            is_video = True
            duration = message.video.duration
            file_size = message.file.size
        elif message.document and message.document.mime_type and message.document.mime_type.startswith("video/"):
            is_video = True
            file_size = message.file.size

        if is_video:
            raw_text = clean_text(message.text or "")
            lines = raw_text.split("\n") if raw_text else []
            
            # Pega a primeira linha como título, ou define um padrão
            title = lines[0] if lines else f"Aula {index:02d}"
            description = "\n".join(lines[1:]).strip() if len(lines) > 1 else ""

            lesson_data = {
                "id": message.id,
                "order": index,
                "title": title,
                "description": description,
                "duration_seconds": duration,
                "size_mb": round(file_size / (1024 * 1024), 2) if file_size else 0,
                "date": message.date.isoformat(),
                "file_name": f"aula_{index:03d}.mp4"
            }
            
            lessons.append(lesson_data)
            print(f"[{index:02d}] {title} ({lesson_data['size_mb']} MB)")
            index += 1

    # Salva o inventário em JSON
    with open("curso_manifest.json", "w", encoding="utf-8") as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)

    print(f"\nConcluído! {len(lessons)} aulas mapeadas em 'curso_manifest.json'.")

if __name__ == "__main__":
    with client:
        client.loop.run_until_complete(scan())