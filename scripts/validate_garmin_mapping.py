#!/usr/bin/env python3
"""Valida garmin_category / garmin_exercise de toda la biblioteca contra el catálogo
real de Garmin Connect que incluye `garminconnect` (garminconnect.exercises, Python >= 3.12).

Uso:
    pip install "garminconnect>=0.3.20"
    python scripts/validate_garmin_mapping.py            # sale con código 1 si hay discrepancias

Los ejercicios que no coinciden se listan con sugerencias; en el envío real se mandan como
paso genérico (categoría + nombre en la descripción) y quedan marcados.
No necesita credenciales ni red.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    from garminconnect import exercises as catalog
except ImportError:  # pragma: no cover
    sys.exit("Falta garminconnect: pip install 'garminconnect>=0.3.20' (Python >= 3.12)")

LIB = Path(__file__).resolve().parent.parent / "lib" / "strength" / "library.ts"
SRC = LIB.read_text(encoding="utf-8")

pairs = {(row["category"], row["exercise"]) for row in catalog.EXERCISES}
categories = {c for c, _ in pairs}

rows = re.findall(r'slug: "([^"]+)".*?garmin: \["([A-Z_0-9]+)", "([A-Z_0-9]*)"\]', SRC, flags=re.S)
bad = 0
for slug, category, exercise in rows:
    if (category, exercise) in pairs:
        continue
    bad += 1
    reason = "categoría desconocida" if category not in categories else "ejercicio no existe en esa categoría"
    words = exercise.lower().replace("_", " ").split()
    hint = [e["name"] + f" ({e['category']}/{e['exercise']})" for e in catalog.EXERCISES if all(w in e["name"].lower() for w in words[:2])][:3]
    print(f"✗ {slug}: {category}/{exercise} — {reason}. Sugerencias: {hint or 'ninguna'}")

print(f"{len(rows) - bad}/{len(rows)} ejercicios mapeados al catálogo de Garmin ({len(pairs)} entradas).")
sys.exit(1 if bad else 0)
