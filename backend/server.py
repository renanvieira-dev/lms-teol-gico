import os
import json
import re
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from telethon import TelegramClient
from google import genai

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

API_ID_RAW = os.getenv("TELEGRAM_API_ID")
API_HASH = os.getenv("TELEGRAM_API_HASH")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

if not API_ID_RAW or not API_HASH:
    raise ValueError("TELEGRAM_API_ID e TELEGRAM_API_HASH são obrigatórios no .env!")

API_ID = int(API_ID_RAW)
ai_client = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None

client = TelegramClient("sessao_teologia", API_ID, API_HASH)

CHANNELS = {
    "basico": "https://t.me/+aLrnPi630Sw3YjJh",
    "intermediario": "https://t.me/+tGAvt9R-8UJjNWFh",
    "avancado": "https://t.me/+xRXbQjx-111mNzkx"
}
channel_entities = {}

catalog_path = Path(__file__).resolve().parent / "catalogo_aulas.json"
lessons_catalog = []

def load_catalog():
    global lessons_catalog
    if catalog_path.exists():
        with open(catalog_path, "r", encoding="utf-8") as f:
            lessons_catalog = json.load(f)

load_catalog()

summaries_cache_path = Path(__file__).resolve().parent / "resumos_ia.json"
summaries_cache = {}
if summaries_cache_path.exists():
    try:
        with open(summaries_cache_path, "r", encoding="utf-8") as f:
            summaries_cache = json.load(f)
    except Exception:
        summaries_cache = {}

def save_summaries_cache():
    with open(summaries_cache_path, "w", encoding="utf-8") as f:
        json.dump(summaries_cache, f, ensure_ascii=False, indent=2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global channel_entities
    await client.start()
    for level, url in CHANNELS.items():
        try:
            ent = await client.get_entity(url)
            channel_entities[level] = ent
            print(f"Canal [{level.upper()}] conectado com sucesso: {getattr(ent, 'title', url)}")
        except Exception as e:
            print(f"Aviso: Não foi possível conectar ao nível [{level}]: {e}")
    yield
    await client.disconnect()

app = FastAPI(title="LMS Teologia Multi-Nível", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/lessons")
async def get_lessons():
    load_catalog()
    return JSONResponse(content=lessons_catalog)

@app.get("/api/stream/{level}/{msg_id}")
async def stream_video(level: str, msg_id: int, request: Request):
    global channel_entities
    
    entity = channel_entities.get(level)
    if not entity:
        if level in CHANNELS:
            entity = await client.get_entity(CHANNELS[level])
            channel_entities[level] = entity
        else:
            raise HTTPException(status_code=404, detail="Nível não catalogado.")

    try:
        message = await client.get_messages(entity, ids=msg_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Erro ao buscar mensagem: {str(e)}")

    if not message or not (message.video or message.document):
        raise HTTPException(status_code=404, detail="Vídeo não encontrado.")

    file_size = message.file.size
    mime_type = message.file.mime_type or "video/mp4"

    range_header = request.headers.get("range")
    start = 0
    end = file_size - 1

    if range_header:
        match = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if match:
            start = int(match.group(1))
            if match.group(2):
                end = int(match.group(2))

    chunk_size = 1024 * 1024  # 1 MB por requisição parcial
    if (end - start + 1) > chunk_size:
        end = min(start + chunk_size - 1, file_size - 1)

    content_length = end - start + 1

    async def file_chunk_generator():
        async for chunk in client.iter_download(
            message.media,
            offset=start,
            request_size=256 * 1024,
            limit=content_length
        ):
            yield chunk

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
        "Content-Type": mime_type,
    }

    return StreamingResponse(
        file_chunk_generator(),
        status_code=206 if range_header else 200,
        headers=headers
    )

@app.get("/api/lessons/{msg_id}/summary")
async def get_summary(msg_id: int):
    str_id = str(msg_id)
    if str_id in summaries_cache:
        return {"summary": summaries_cache[str_id], "cached": True}
    return {"summary": None, "cached": False}

@app.post("/api/lessons/{msg_id}/generate-summary")
async def generate_summary(msg_id: int):
    if not ai_client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada no .env.")

    str_id = str(msg_id)
    lesson = next((l for l in lessons_catalog if l.get("telegram_msg_id") == msg_id), None)
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada no catálogo.")

    title = lesson.get("title", "")
    description = lesson.get("description", "")
    level = lesson.get("level", "Geral").upper()

    prompt = f"""
Você é um teólogo e professor em Teologia Sistemática e História da Igreja.
Gere um guia de estudos aprofundado, didático e estritamente formatado para a aula do nível {level}:

Título da Lição: {title}
Ementa/Contexto: {description}

Diretrizes obrigatórias de formatação:
- NÃO inclua linhas horizontais (---).
- NÃO inclua cabeçalhos de nível 1 (#) repetindo o título da aula.
- Use exatamente os seguintes títulos de seção iniciados com '##':

## 📖 Visão Panorâmica
Apresentação essencial do tema, objetivos pedagógicos e relevância teológica.

## 🏛️ Conceitos-Chave e Fundamentos
Pilares doutrinários, definições e distinções metodológicas essenciais em itens estruturados.

## 📜 Contexto Histórico e Tradição
Como este debate se desenvolveu na tradição bíblica e cristã através dos séculos.

## 🔍 Referências Bíblicas e Autores Fundamentais
Textos sagrados cruciais comentados e pensadores/teólogos determinantes com suas principais teses.

## 💡 Questões para Fixação e Reflexão
2 a 3 perguntas analíticas para autoavaliação e estudo reflexivo.
"""

    try:
        response = ai_client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )
        summary_text = response.text
        summaries_cache[str_id] = summary_text
        save_summaries_cache()
        return {"summary": summary_text, "cached": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao comunicar com a IA: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=False)