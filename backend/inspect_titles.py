import json

with open("catalogo_aulas.json", "r", encoding="utf-8") as f:
    data = json.load(f)

general_lessons = [x for x in data if x.get("module") == "Módulo Geral"]

print(f"Total no Módulo Geral: {len(general_lessons)}")
print("\n--- Exemplos de títulos e descrições no Módulo Geral ---")
for i, item in enumerate(general_lessons[:15], 1):
    raw = item.get("raw_title") or item.get("title") or ""
    desc_sample = (item.get("description") or "").replace("\n", " | ")[:70]
    print(f"\n[{i:02d}] TÍTULO: {raw}")
    if desc_sample:
        print(f"     LEGENDA: {desc_sample}")