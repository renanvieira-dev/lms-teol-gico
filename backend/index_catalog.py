import asyncio
import json
import os
import re
from pathlib import Path
from telethon import TelegramClient
from telethon.tl.types import DocumentAttributeVideo, DocumentAttributeFilename
from dotenv import load_dotenv

# Carrega .env
env_backend = Path(__file__).parent / ".env"
env_root = Path(__file__).parent.parent / ".env"
if env_backend.exists():
    load_dotenv(env_backend)
else:
    load_dotenv(env_root)

API_ID = int(os.getenv("TELEGRAM_API_ID") or 0)
API_HASH = os.getenv("TELEGRAM_API_HASH") or ""
SESSION_NAME = os.getenv("TELEGRAM_SESSION_NAME", "lms_teologia_session")

CHANNEL_BASICO = (
    os.getenv("TELEGRAM_CHANNEL_BASICO") 
    or os.getenv("TELEGRAM_CHANNEL_ID") 
    or os.getenv("CHANNEL_ID")
)

CHANNELS = {
    "basico": CHANNEL_BASICO,
    "intermediario": os.getenv("TELEGRAM_CHANNEL_INTERMEDIARIO"),
    "avancado": os.getenv("TELEGRAM_CHANNEL_AVANCADO"),
}

def format_duration(seconds: int) -> str:
    if not seconds:
        return "00:00"
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}" if h > 0 else f"{m:02d}:{s:02d}"

async def index_channel(client, level: str, channel_raw: str):
    if not channel_raw:
        return []

    print(f"[*] A ler canal '{level}' ({channel_raw}) exatamente como está no Telegram...")
    try:
        entity = await client.get_entity(int(channel_raw) if channel_raw.lstrip('-').isdigit() else channel_raw)
    except Exception as e:
        print(f"[!] Erro ao aceder ao canal {channel_raw}: {e}")
        return []

    lessons = []
    # reverse=True lê da postagem mais antiga para a mais recente (ordem natural do curso)
    async for message in client.iter_messages(entity, reverse=True):
        if not message.video and not (message.document and message.document.mime_type and message.document.mime_type.startswith("video/")):
            continue

        duration = 0
        filename = ""

        if message.document:
            for attr in message.document.attributes:
                if isinstance(attr, DocumentAttributeVideo):
                    duration = attr.duration
                elif isinstance(attr, DocumentAttributeFilename):
                    filename = attr.file_name

        size_mb = round(message.file.size / (1024 * 1024), 2) if message.file else 0

        # Pega o texto da legenda exatamente como está
        raw_text = message.text.strip() if message.text else ""
        title = raw_text.split("\n")[0] if raw_text else (filename or f"Aula {len(lessons) + 1}")

        lessons.append({
            "id": len(lessons) + 1,
            "level": level,
            "telegram_msg_id": message.id,
            "title": title,
            "description": raw_text,
            "duration_seconds": duration,
            "duration_formatted": format_duration(duration),
            "size_mb": size_mb,
            "module": "Catálogo do Curso"
        })

    print(f"[✓] {len(lessons)} vídeos indexados na ordem original do Telegram.")
    return lessons

async def main():
    if not API_ID or not API_HASH:
        print("[!] TELEGRAM_API_ID ou TELEGRAM_API_HASH não configurados.")
        return

    client = TelegramClient(SESSION_NAME, API_ID, API_HASH)
    await client.start()

    all_lessons = []
    for level, ch_id in CHANNELS.items():
        if ch_id:
            found = await index_channel(client, level, ch_id)
            all_lessons.extend(found)

    if not all_lessons:
        print("[!] Nenhum vídeo foi localizado.")
        await client.disconnect()
        return

    out = Path(__file__).parent / "catalogo_aulas.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(all_lessons, f, ensure_ascii=False, indent=2)

    print(f"[🎉] catalogo_aulas.json salvo com sucesso! {len(all_lessons)} aulas na ordem real.")
    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())