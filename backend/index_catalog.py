import asyncio
import json
import os
import re
from pathlib import Path
from telethon import TelegramClient
from telethon.tl.types import DocumentAttributeVideo, DocumentAttributeFilename
from dotenv import load_dotenv

# Garante a leitura do .env mesmo que esteja em backend/ ou na raiz do projeto
env_backend = Path(__file__).parent / ".env"
env_root = Path(__file__).parent.parent / ".env"

if env_backend.exists():
    load_dotenv(env_backend)
elif env_root.exists():
    load_dotenv(env_root)
else:
    load_dotenv()

API_ID = int(os.getenv("TELEGRAM_API_ID") or 0)
API_HASH = os.getenv("TELEGRAM_API_HASH") or ""
SESSION_NAME = os.getenv("TELEGRAM_SESSION_NAME", "lms_teologia_session")

# Tenta capturar qualquer variação de nome do canal
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

print(f"[Debug] API_ID: {API_ID}")
print(f"[Debug] Canal Básico encontrado: {CHANNEL_BASICO}")

def format_duration(seconds: int) -> str:
    if not seconds:
        return "00:00"
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}" if h > 0 else f"{m:02d}:{s:02d}"

def extract_clean_title(message, filename: str) -> str:
    if message.text:
        first_line = message.text.strip().split("\n")[0]
        clean = re.sub(r'^[#\-_*\s]+', '', first_line).strip()
        if len(clean) > 3:
            return clean

    if filename:
        name_without_ext = os.path.splitext(filename)[0]
        return name_without_ext.replace("_", " ").replace("-", " ").strip()

    return f"Aula {message.id}"

async def index_channel(client, level: str, channel_raw: str):
    print(f"[*] A aceder ao canal '{level}' ({channel_raw})...")
    try:
        entity = await client.get_entity(int(channel_raw) if channel_raw.lstrip('-').isdigit() else channel_raw)
    except Exception as e:
        print(f"[!] Erro ao aceder ao canal {channel_raw}: {e}")
        return []

    lessons = []
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
        title = extract_clean_title(message, filename)

        lessons.append({
            "id": len(lessons) + 1,
            "level": level,
            "telegram_msg_id": message.id,
            "title": title,
            "description": message.text.strip() if message.text else "",
            "duration_seconds": duration,
            "duration_formatted": format_duration(duration),
            "size_mb": size_mb,
            "module": "Módulo Geral"
        })

    print(f"[✓] {len(lessons)} vídeos indexados para {level}.")
    return lessons

async def main():
    if not API_ID or not API_HASH:
        print("[!] TELEGRAM_API_ID ou TELEGRAM_API_HASH inválidos.")
        return

    client = TelegramClient(SESSION_NAME, API_ID, API_HASH)
    await client.start()

    all_lessons = []
    for level, channel in CHANNELS.items():
        if channel:
            found = await index_channel(client, level, channel)
            all_lessons.extend(found)

    if not all_lessons:
        print("[!] Nenhum vídeo foi localizado. Confirme se o ID do canal está correto no .env.")
        await client.disconnect()
        return

    output_path = Path(__file__).parent / "catalogo_aulas.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_lessons, f, ensure_ascii=False, indent=2)

    print(f"[🎉] Concluído! {len(all_lessons)} aulas gravadas em {output_path.name}.")
    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())