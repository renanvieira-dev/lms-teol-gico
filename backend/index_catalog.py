import os
import sys
import json
import re
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.tl.types import (
    DocumentAttributeVideo,
    DocumentAttributeFilename
)

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

api_id_val = os.getenv("TELEGRAM_API_ID")
api_hash_val = os.getenv("TELEGRAM_API_HASH")

if not api_id_val or not api_hash_val:
    raise ValueError("Credenciais TELEGRAM_API_ID e TELEGRAM_API_HASH são obrigatórias no .env!")

API_ID = int(api_id_val)
API_HASH = api_hash_val

# Canais oficiais mapeados para os 3 níveis
CHANNELS = {
    "basico": "https://t.me/+aLrnPi630Sw3YjJh",
    "intermediario": "https://t.me/+tGAvt9R-8UJjNWFh",
    "avancado": "https://t.me/+xRXbQjx-111mNzkx"
}

client = TelegramClient("sessao_teologia", API_ID, API_HASH)

def clean_lesson_title(raw_title: str) -> str:
    """Limpa identificadores, hashes do YouTube e formata o título."""
    title = raw_title.strip()
    # Remove prefixos como #F203, #F001, #01
    title = re.sub(r"^#[A-Za-z0-9_-]+\s*", "", title)
    # Remove sufixos com ID de vídeo do YouTube (ex: -MtG67ogpgYQ)
    title = re.sub(r"-[A-Za-z0-9_-]{10,12}$", "", title)
    # Substitui underlines soltos por hífens limpos
    return title.replace(" _ ", " - ").strip()

def parse_module_and_title(raw_title: str, description: str):
    """Extrai a disciplina/módulo real a partir da legenda e do título."""
    caption_lines = [l.strip() for l in (description or "").split("\n") if l.strip()]
    first_caption = caption_lines[0] if caption_lines else ""

    module = None

    # 1. Identifica padrão clássico na legenda (ex: "14 - Patristica", "12 - Grego Biblico")
    match_legend = re.match(r"^\d+\s*[-–]\s*(.+)$", first_caption)
    if match_legend:
        module = match_legend.group(1).strip()
    elif first_caption and len(first_caption) <= 45 and not first_caption.startswith("http"):
        module = first_caption
    # 2. Se não houver módulo na legenda, tenta extrair do título dividido por traço
    elif " - " in raw_title:
        parts = raw_title.split(" - ")
        if len(parts) >= 2:
            module = parts[1].split(".")[0].strip()

    # Fallback para casos sem identificação direta
    if not module or module.lower() in ["geral", "video", "aula", "curso"]:
        module = "Fundamentos Gerais"

    # Remove eventuais códigos do nome do módulo e aplica capitalização
    module = re.sub(r"^#[A-Za-z0-9_-]+\s*", "", module).strip().title()
    clean_title = clean_lesson_title(raw_title)

    return module, clean_title

def extract_video_metadata(msg):
    """Extrai com segurança a duração, nome do ficheiro e tamanho do vídeo."""
    duration = 0
    file_name = None
    is_video = False
    file_size = 0

    doc = msg.video or (msg.document if (msg.document and getattr(msg.document, 'mime_type', '').startswith('video/')) else None)
    
    if doc:
        is_video = True
        file_size = doc.size if hasattr(doc, 'size') else 0
        for attr in getattr(doc, 'attributes', []):
            if isinstance(attr, DocumentAttributeVideo):
                duration = getattr(attr, 'duration', 0)
            elif isinstance(attr, DocumentAttributeFilename):
                file_name = getattr(attr, 'file_name', None)

    return is_video, duration, file_size, file_name

async def scan_single_level(target_level: str):
    """Indexa todas as mensagens de um canal/nível específico."""
    if target_level not in CHANNELS:
        print(f"Nível inválido: '{target_level}'. Opções disponíveis: {list(CHANNELS.keys())}")
        return []

    invite_url = CHANNELS[target_level]
    print(f"\n==========================================")
    print(f" A ligar ao nível [{target_level.upper()}]...")
    print(f" Canal: {invite_url}")
    print(f"==========================================")

    try:
        entity = await client.get_entity(invite_url)
    except Exception as e:
        print(f"Erro ao aceder ao canal {invite_url}: {e}")
        return []

    channel_title = getattr(entity, 'title', target_level)
    print(f"Canal identificado: {channel_title}")

    lessons = []
    counter = 1

    print("A analisar e a catalogar mensagens...")
    async for msg in client.iter_messages(entity, reverse=True):
        is_video, duration, file_size, file_name = extract_video_metadata(msg)

        if is_video:
            caption = (msg.text or "").strip()
            lines = [l.strip() for l in caption.split("\n") if l.strip()]
            
            raw_title = lines[0] if lines else (file_name or f"Aula {counter:03d}")
            desc = "\n".join(lines[1:]) if len(lines) > 1 else ""

            module, clean_title = parse_module_and_title(raw_title, desc)

            size_mb = round(file_size / (1024 * 1024), 2)
            mins = int(duration // 60)
            secs = int(duration % 60)

            item = {
                "id": counter,
                "telegram_msg_id": msg.id,
                "level": target_level,
                "module": module,
                "title": clean_title,
                "raw_title": raw_title,
                "description": desc,
                "file_name": file_name or f"{target_level}_aula_{counter:03d}.mp4",
                "duration_seconds": duration,
                "duration_formatted": f"{mins:02d}:{secs:02d}",
                "size_mb": size_mb,
                "date": msg.date.isoformat() if msg.date else None
            }
            lessons.append(item)
            print(f"[{target_level[:3].upper()} #{counter:03d}] {module} -> {clean_title[:45]} | {item['duration_formatted']} | {size_mb} MB")
            counter += 1

    return lessons

async def main():
    target = sys.argv[1].lower() if len(sys.argv) > 1 else "all"
    await client.start()

    catalog_file = Path(__file__).resolve().parent / "catalogo_aulas.json"
    existing_catalog = []
    if catalog_file.exists():
        try:
            with open(catalog_file, "r", encoding="utf-8") as f:
                existing_catalog = json.load(f)
        except Exception:
            existing_catalog = []

    levels_to_scan = list(CHANNELS.keys()) if target == "all" else [target]

    # Mantém os níveis que não estão a ser reindexados agora
    final_catalog = [item for item in existing_catalog if item.get("level") not in levels_to_scan]

    for lvl in levels_to_scan:
        lvl_lessons = await scan_single_level(lvl)
        final_catalog.extend(lvl_lessons)

    with open(catalog_file, "w", encoding="utf-8") as f:
        json.dump(final_catalog, f, ensure_ascii=False, indent=2)

    print("\n------------------------------------------")
    print("Catálogo gravado com sucesso em 'catalogo_aulas.json'!")
    for lvl in CHANNELS.keys():
        count = len([x for x in final_catalog if x.get("level") == lvl])
        print(f"• {lvl.capitalize()}: {count} aulas")
    print(f"Total Geral: {len(final_catalog)} aulas")
    print("------------------------------------------")

if __name__ == "__main__":
    with client:
        client.loop.run_until_complete(main())