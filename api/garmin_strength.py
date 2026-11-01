"""Función serverless (Vercel, Python) que envía una rutina de FUERZA al Forerunner.

POST /api/garmin_strength
  Authorization: Bearer <access_token de Supabase del usuario>
  Body: {"workout": {<JSON de entreno de Garmin>}, "date": "YYYY-MM-DD" | null}

Seguridad:
  * Desactivada por defecto: solo funciona con GARMIN_SEND_ENABLED=true.
  * Autenticada con la sesión de Supabase (se valida el token contra /auth/v1/user).
  * Credenciales de Garmin SOLO en variables de entorno (GARMIN_EMAIL, GARMIN_PASSWORD).
  * Tokens de sesión de Garmin en la tabla privada `garmin_tokens` (RLS sin políticas de
    cliente; se accede con SUPABASE_SERVICE_ROLE_KEY, solo servidor).
  * Sin reintentos agresivos: un fallo de autenticación o un 429 de Garmin activa un
    cortacircuitos de 15 min en la instancia (evita bloqueos de cuenta) y se devuelve el error.
Por qué en el repo web y no en el bot: no toca el cron diario de mi-entrenador-garmin y
comparte despliegue y variables con la app (ver docs/DECISIONS.md D14).
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler

MAX_BODY_BYTES = 200_000
MIN_SECONDS_BETWEEN_SENDS = 20
BREAKER_SECONDS = 15 * 60

_last_send_by_user: dict[str, float] = {}
_breaker_until = 0.0


def enabled() -> bool:
    return os.environ.get("GARMIN_SEND_ENABLED", "false").strip().lower() == "true"


def validate_payload(payload: object) -> str | None:
    """Comprobación mínima de forma del entreno. Devuelve un mensaje de error o None."""
    if not isinstance(payload, dict):
        return "workout debe ser un objeto"
    if not isinstance(payload.get("workoutName"), str) or not payload["workoutName"].strip():
        return "falta workoutName"
    sport = payload.get("sportType") or {}
    if sport.get("sportTypeKey") != "strength_training":
        return "solo se admiten entrenos de fuerza"
    segments = payload.get("workoutSegments")
    if not isinstance(segments, list) or not segments:
        return "faltan workoutSegments"
    steps = segments[0].get("workoutSteps") if isinstance(segments[0], dict) else None
    if not isinstance(steps, list) or not steps or len(steps) > 200:
        return "workoutSteps vacío o demasiado largo"
    return None


def rate_limited(user_id: str, now: float | None = None) -> float:
    """Segundos que faltan para poder volver a enviar (0 = permitido). Registra el envío si procede."""
    now = time.time() if now is None else now
    last = _last_send_by_user.get(user_id, 0.0)
    wait = MIN_SECONDS_BETWEEN_SENDS - (now - last)
    if wait > 0:
        return wait
    _last_send_by_user[user_id] = now
    return 0.0


def _http_json(url: str, headers: dict[str, str], method: str = "GET", body: object | None = None) -> object:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers={**headers, "Content-Type": "application/json"}, method=method)
    with urllib.request.urlopen(req, timeout=10) as res:  # noqa: S310 (URL fija de Supabase)
        raw = res.read()
        return json.loads(raw) if raw else None


def supabase_user_id(token: str) -> str | None:
    base = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = os.environ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]
    try:
        user = _http_json(f"{base}/auth/v1/user", {"apikey": key, "Authorization": f"Bearer {token}"})
    except (urllib.error.URLError, ValueError):
        return None
    return user.get("id") if isinstance(user, dict) else None


def _service_headers() -> dict[str, str]:
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return {"apikey": key, "Authorization": f"Bearer {key}"}


def load_tokens(user_id: str) -> str | None:
    base = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    q = urllib.parse.urlencode({"user_id": f"eq.{user_id}", "select": "tokens"})
    rows = _http_json(f"{base}/rest/v1/garmin_tokens?{q}", _service_headers())
    return rows[0]["tokens"] if isinstance(rows, list) and rows else None


def save_tokens(user_id: str, tokens: str) -> None:
    base = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    headers = {**_service_headers(), "Prefer": "resolution=merge-duplicates,return=minimal"}
    _http_json(f"{base}/rest/v1/garmin_tokens", headers, "POST", {"user_id": user_id, "tokens": tokens, "updated_at": _now_iso()})


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def send(user_id: str, payload: dict, date: str | None) -> dict:
    """Login (con tokens cacheados) → subir → programar. Una sola pasada, sin reintentos."""
    from garminconnect import (  # import tardío: solo se necesita en el envío real
        Garmin,
        GarminConnectAuthenticationError,
        GarminConnectTooManyRequestsError,
    )

    global _breaker_until
    garmin = Garmin(os.environ["GARMIN_EMAIL"], os.environ["GARMIN_PASSWORD"])
    try:
        garmin.login(tokenstore=load_tokens(user_id))
        save_tokens(user_id, garmin.client.dumps())
        uploaded = garmin.upload_workout(payload)
        workout_id = uploaded.get("workoutId") if isinstance(uploaded, dict) else None
        scheduled = None
        if workout_id and date:
            garmin.schedule_workout(workout_id, date)
            scheduled = date
        return {"workout_id": workout_id, "scheduled_for": scheduled}
    except GarminConnectAuthenticationError as e:
        _breaker_until = time.time() + BREAKER_SECONDS
        raise PermissionError("Garmin rechazó el inicio de sesión. Revisa GARMIN_EMAIL/GARMIN_PASSWORD (pausado 15 min).") from e
    except GarminConnectTooManyRequestsError as e:
        _breaker_until = time.time() + BREAKER_SECONDS
        raise RuntimeError("Garmin limita las peticiones. Espera unos minutos.") from e


class handler(BaseHTTPRequestHandler):  # noqa: N801 (nombre exigido por Vercel)
    def _reply(self, status: int, body: dict, headers: dict[str, str] | None = None) -> None:
        raw = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self) -> None:  # noqa: N802
        if not enabled():
            return self._reply(403, {"error": "El envío a Garmin está desactivado (GARMIN_SEND_ENABLED)."})
        if time.time() < _breaker_until:
            wait = int(_breaker_until - time.time())
            return self._reply(503, {"error": "Envío en pausa tras un error de Garmin."}, {"Retry-After": str(wait)})

        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return self._reply(401, {"error": "Falta la sesión"})
        user_id = supabase_user_id(auth[7:])
        if not user_id:
            return self._reply(401, {"error": "Sesión inválida"})

        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY_BYTES:
            return self._reply(413, {"error": "Cuerpo vacío o demasiado grande"})
        try:
            body = json.loads(self.rfile.read(length))
        except ValueError:
            return self._reply(400, {"error": "JSON inválido"})

        problem = validate_payload(body.get("workout"))
        if problem:
            return self._reply(400, {"error": problem})
        date = body.get("date")
        if date is not None and (not isinstance(date, str) or len(date) != 10):
            return self._reply(400, {"error": "date debe ser YYYY-MM-DD"})

        wait = rate_limited(user_id)
        if wait > 0:
            return self._reply(429, {"error": "Demasiados envíos seguidos"}, {"Retry-After": str(int(wait) + 1)})

        try:
            result = send(user_id, body["workout"], date)
        except PermissionError as e:
            return self._reply(401, {"error": str(e)})
        except RuntimeError as e:
            return self._reply(429, {"error": str(e)}, {"Retry-After": str(BREAKER_SECONDS)})
        except Exception:  # noqa: BLE001 — nunca filtrar detalles internos al cliente
            return self._reply(502, {"error": "No se pudo enviar el entreno a Garmin."})
        return self._reply(200, result)

    def do_GET(self) -> None:  # noqa: N802
        self._reply(405, {"error": "Usa POST"})
