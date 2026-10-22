import json
import re

CATALOG_PATH = "catalogo_aulas.json"

def clean_lesson_title(raw_title: str) -> str:
    """Remove IDs como #F203, hashtags e IDs do YouTube do final (-MtG67ogpgYQ)."""
    title = raw_title.strip()
    
    # Remove prefixos como #F203, #01, #F001
    title = re.sub(r"^#[A-Za-z0-9_-]+\s*", "", title)
    
    # Remove sufixos com ID do YouTube (ex: -MtG67ogpgYQ ou _wgBaqd-D6c no final)
    title = re.sub(r"-[A-Za-z0-9_-]{10,12}$", "", title)
    
    # Substitui underlines soltos por hífens limpos
    title = title.replace(" _ ", " - ").strip()
    return title

def extract_module(raw_title: str, description: str) -> tuple[str, str]:
    """Identifica a disciplina teológica real a partir da legenda e do título."""
    caption_lines = [l.strip() for l in (description or "").split("\n") if l.strip()]
    first_caption = caption_lines[0] if caption_lines else ""

    module = None

    # 1. Padrão claro na legenda: "14 - Patristica", "12 - Grego Biblico", "01 - Teologia"
    match_legend = re.match(r"^\d+\s*[-–]\s*(.+)$", first_caption)
    if match_legend:
        module = match_legend.group(1).strip()
    elif first_caption and len(first_caption) <= 45 and not first_caption.startswith("http"):
        module = first_caption

    # 2. Se a legenda não tinha módulo, tenta extrair do título (ex: "Catolicismo - Ciência Na Religião")
    if not module and " - " in raw_title:
        parts = raw_title.split(" - ")
        if len(parts) >= 2:
            module = parts[1].split(".")[0].strip()

    # Fallback se realmente não houver disciplina
    if not module or module.lower() in ["geral", "video", "aula"]:
        module = "Fundamentos Gerais"

    # Remove códigos remanescentes do nome do módulo
    module = re.sub(r"^#[A-Za-z0-9_-]+\s*", "", module).strip()
    module = module.title() # Capitalização elegante (ex: Patrística, Grego Bíblico)

    clean_title = clean_lesson_title(raw_title)
    return module, clean_title

def main():
    try:
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            lessons = json.load(f)
    except FileNotFoundError:
        print("Arquivo catalogo_aulas.json não encontrado!")
        return

    print(f"Processando {len(lessons)} aulas...")
    modules_count = {}

    for item in lessons:
        raw_t = item.get("raw_title") or item.get("title") or ""
        desc = item.get("description") or ""

        mod, clean_t = extract_module(raw_t, desc)
        
        item["module"] = mod
        item["title"] = clean_t
        item["raw_title"] = raw_t

        modules_count[mod] = modules_count.get(mod, 0) + 1

    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)

    print("\n✅ Catálogo reorganizado com sucesso!")
    print("\n--- Módulos identificados e quantidade de aulas ---")
    for mod, count in sorted(modules_count.items(), key=lambda x: x[1], reverse=True):
        print(f"• {mod}: {count} aulas")

if __name__ == "__main__":
    main()