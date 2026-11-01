#!/usr/bin/env python3
"""Prueba MANUAL del envío al Forerunner (la hace David, no se ejecuta en CI).

Sube una rutina de 4 ejercicios (con nombres del catálogo real de Garmin) y la programa en
tu calendario de Garmin Connect, imprimiendo el ID resultante. No muestra credenciales.

Requisitos:   Python >= 3.12   ·   pip install "garminconnect>=0.3.20"
Variables:    GARMIN_EMAIL, GARMIN_PASSWORD   (opcional GARMINTOKENS = ruta de caché de tokens)

Uso:
    export GARMIN_EMAIL=...   GARMIN_PASSWORD=...        # en tu terminal, nunca en el repo
    python scripts/garmin_smoke_test.py                    # sube y programa para MAÑANA
    python scripts/garmin_smoke_test.py --dry-run          # solo imprime el JSON, no toca Garmin
    python scripts/garmin_smoke_test.py --delete 123456    # borra un entreno por su ID

Solo hace UN intento de login (sin reintentos) para no arriesgar un bloqueo de cuenta.
Instrucciones para revisarlo en el reloj y borrarlo: docs/GARMIN.md.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
from pathlib import Path


def build_workout() -> dict:
    from garminconnect.workout import (
        StrengthWorkout,
        WorkoutSegment,
        create_strength_rest_step,
        create_strength_set,
        create_strength_timed_set,
    )

    steps = [
        create_strength_set("SQUAT", 1, sets=2, reps=8, rest_seconds=45, exercise_name="GOBLET_SQUAT", description="Goblet squat"),
        create_strength_set("DEADLIFT", 4, sets=2, reps=8, rest_seconds=45, exercise_name="ROMANIAN_DEADLIFT", description="Peso muerto rumano"),
        create_strength_set("ROW", 7, sets=2, reps=10, rest_seconds=45, exercise_name="BANDED_FACE_PULLS", description="Face pull con banda"),
        create_strength_timed_set("PLANK", 10, sets=2, duration_seconds=30, rest_seconds=30, exercise_name="", description="Plancha"),
    ]
    _ = create_strength_rest_step  # (solo para dejar claro de dónde salen los descansos internos)
    wk = StrengthWorkout(
        workoutName="PRUEBA Mi Entrenador",
        estimatedDurationInSecs=600,
        workoutSegments=[WorkoutSegment(segmentOrder=1, sportType={"sportTypeId": 5, "sportTypeKey": "strength_training", "displayOrder": 1}, workoutSteps=steps)],
        description="Rutina de prueba. Bórrala tras comprobarla.",
    )
    return wk.to_dict()


def login():
    from garminconnect import Garmin

    email, password = os.environ.get("GARMIN_EMAIL"), os.environ.get("GARMIN_PASSWORD")
    if not email or not password:
        sys.exit("Faltan GARMIN_EMAIL / GARMIN_PASSWORD en el entorno.")
    tokens = Path(os.environ.get("GARMINTOKENS", "~/.garmin_smoke_tokens")).expanduser()
    garmin = Garmin(email, password)
    garmin.login(tokenstore=str(tokens))  # un solo intento; guarda los tokens para la próxima
    return garmin


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--delete", metavar="ID")
    ap.add_argument("--date", help="YYYY-MM-DD (por defecto, mañana)")
    args = ap.parse_args()

    if args.delete:
        login().delete_workout(args.delete)
        print(f"Borrado el entreno {args.delete}.")
        return

    payload = build_workout()
    if args.dry_run:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return

    date = args.date or (dt.date.today() + dt.timedelta(days=1)).isoformat()
    garmin = login()
    uploaded = garmin.upload_workout(payload)
    workout_id = uploaded.get("workoutId")
    garmin.schedule_workout(workout_id, date)
    print(f"OK · ID del entreno: {workout_id} · programado para {date}")
    print("Revísalo en Garmin Connect y sincroniza el Forerunner. Para borrarlo:")
    print(f"    python scripts/garmin_smoke_test.py --delete {workout_id}")


if __name__ == "__main__":
    main()
