import json
import re
from pathlib import Path

catalog_path = Path(__file__).parent / "catalogo_aulas.json"

if not catalog_path.exists():
    print("[!] catalogo_aulas.json não encontrado.")
    exit(1)

with open(catalog_path, "r", encoding="utf-8") as f:
    lessons = json.load(f)

print(f"[*] Processando {len(lessons)} aulas...")

initial_block = []  # Aulas F001 até F024
remaining_block = []  # F025 em diante

for lesson in lessons:
    raw = lesson.get("description", "") or lesson.get("title", "")
    line = raw.strip().split("\n")[0]
    
    # Verifica se pertence ao grupo F001 a F024
    f_match = re.search(r"^#?F(\d+)", line, re.IGNORECASE)
    f_num = int(f_match.group(1)) if f_match else None

    # Extrai o número da aula no final (ex: "aula 22", "Aula 05")
    aula_match = re.search(r"[Aa]ula\s*(\d+)", line)
    lesson_num = int(aula_match.group(1)) if aula_match else 0

    # Limpeza de título e hash do YouTube (-iZx2Um8O-hE)
    clean_line = re.sub(r"^#?F\d+\s+", "", line)
    clean_line = re.sub(r"-[A-Za-z0-9_-]{8,}.*$", "", clean_line).strip()
    clean_line = re.sub(r"-?\s*[Aa]ula\s*\d+.*$", "", clean_line).strip()

    parts = [p.strip() for p in clean_line.split("-") if len(p.strip()) > 1]

    if f_num is not None and 1 <= f_num <= 24:
        # Bloco F1 a F24: Introdução aos Estudos Teológicos
        # Estrutura: [Tema] - Introdução aos Estudos Teológicos
        title = parts[0] if len(parts) > 0 else f"Aula {lesson_num:02d}"
        module = "Introdução aos Estudos Teológicos"
        
        lesson["title"] = title
        lesson["module"] = module
        lesson["real_lesson_num"] = lesson_num if lesson_num > 0 else f_num
        initial_block.append(lesson)
    else:
        # A partir do F025: mantém a ordem natural do Telegram
        if len(parts) >= 2:
            module = parts[1].strip()
            title = parts[0].strip()
        elif len(parts) == 1:
            module = "Módulo Geral"
            title = parts[0].strip()
        else:
            module = "Módulo Geral"
            title = lesson.get("title", f"Aula {lesson.get('id', 0)}")

        lesson["title"] = title
        lesson["module"] = module
        remaining_block.append(lesson)

# 1. Ordena o bloco F1-F24 estritamente pela numeração real ("aula 01, 02... 24")
initial_block.sort(key=lambda x: x["real_lesson_num"])

# 2. Junta os dois blocos: primeiro o bloco F1-F24 ordenado, depois o restante na sequência do Telegram
final_list = initial_block + remaining_block

# 3. Renumera os IDs de 1 a 521 de forma contínua
for idx, item in enumerate(final_list, start=1):
    item["id"] = idx
    if "real_lesson_num" in item:
        del item["real_lesson_num"]

with open(catalog_path, "w", encoding="utf-8") as f:
    json.dump(final_list, f, ensure_ascii=False, indent=2)

print("\n[🎉] Reorganização concluída com sucesso!")
print(f"  • {len(initial_block)} aulas do bloco F01-F24 ordenadas cronologicamente (Aula 1 a {len(initial_block)}).")
print(f"  • {len(remaining_block)} aulas subsequentes mantidas na ordem original do canal.")