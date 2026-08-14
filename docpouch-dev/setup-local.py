#!/usr/bin/env python3
"""setup-local.py — Legt Struktur + Tool-Details-Dokument für Systemic Consensing
auf der lokalen DocPouch (docker-compose, http://localhost:3031) an.

Idempotent: Läuft mehrfach ohne Fehler, existierende Strukturen/Docs werden übersprungen.

Nutzung:
    docker compose up -d        # DocPouch auf :3031
    python docpouch-dev/setup-local.py
"""

import json
import sys
import time
import urllib.request
import urllib.error

BASE = "http://localhost:3031"
USER = "admin"
PASS = "adminSecret"
TYPE = 6
STRUCTURE_NAME = "Systemic Consensing Session"
TOOL_NAME = "Systemic Consensing"
ICON = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAACrklEQVR4nO3dTTIDQRyGcZOaFZYcIbhBhOOgXAKROIWv45C4gcQRWGIbJapCKonMJDOpdD/Pb6FQEov/O293enwkayU4bH32y3heuoeL9aTo5yzsCQ+aHw59iR4bG4XMbqEncejhh2GuBzr4eIJQyfsAh7+65plNrsQcXLrOh+DxMnsTZPrCuoMPUjtDEGYuAQ4/XFlm928AHH74Zs1wakXUG673MWk3Jy8HuV8FKC4TA+DVH59pMx2rhf3Gu0e6Ees0N0dmPvLB/oXDJ+i0fkPgHgBuGACvfo6/s7YB4NLhe279kAabgdq5mz+ip6vNxCUAzgDAJbUz65/MBoAzAHBp39d/aKnzZ3MJgDMAcAYALu17DwDNBoAzAHAGAM5zADgbAM6jYDgbAM49AJwNAGcA4AwAnPcC4GwAOAMAZwDgDACcB0Fw3guAcwmAMwBw7gHgbAC41J8KZ7MB4NwDwNkAcAYAzgDApX1/OxTNBoAzAHAGAM5zADgbAM57AXA2AJx7ADgbAM4AwBkAOO8FwNkAcAYAzgDAeQ4AZwPAeS8AzgaAcw8AZwPAGQA4/0IInHsAOJcAOAMAZwDgDACcfy0czgaAMwBwBgDOgyA4GwDOewFwNgCcewA4GwDOAMAZADjvBcDZAHAGAM4AwHkOAOdRMJxLAJwBgEu+3+ydvvnf44Cer7cSGwDOAMANloBvuy4DKN3rrcHs0+Fn3AUguQTADQPQvfmpBMXv76xtALixq373xDOBmHVvR5t+Yu3vnLy6JYxQ73Z7bN6VrF+osE2bqXsAuH+v9J1jl4IY9O6mN3pl3gcqDLNmOHMJMAThyjK7XFd41SUhCC85mjt3xVeP3Besspf7fMt2pexvoOWZZzYLDdM2WA2LXJSFXc2GYbmKauJS6twwlKOM5fcL/UGq0e5nT/4AAAAASUVORK5CYII="

PACE = 1.5
_last = 0.0


def api(method, path, payload=None, token=None, retries=4):
    global _last
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    for _ in range(retries):
        wait = PACE - (time.time() - _last)
        if wait > 0:
            time.sleep(wait)
        _last = time.time()
        req = urllib.request.Request(
            BASE + path,
            data=json.dumps(payload).encode() if payload is not None else None,
            method=method,
            headers=headers,
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                body = r.read().decode()
                return json.loads(body) if body else None
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(float(e.headers.get("Retry-After", 10)) + 1)
                continue
            print("  HTTP %d: %s" % (e.code, e.read().decode()[:300]), file=sys.stderr)
            return None
        except Exception as e:
            print("  ERR %s — retry" % e, file=sys.stderr)
            time.sleep(2)
    return None


def login():
    out = api("POST", "/users/login", {"name": USER, "password": PASS})
    if not out or "token" not in out:
        print("LOGIN FAIL", out, file=sys.stderr)
        sys.exit(1)
    return out["token"]


def main():
    token = login()
    print("logged in as", USER)

    data = api("GET", "/structures/list", token=token)
    structs = data if isinstance(data, list) else (data.get("structures") or data.get("data") or [])
    by_name = {s.get("name"): s for s in structs}

    structure_id = None
    if STRUCTURE_NAME in by_name:
        structure_id = by_name[STRUCTURE_NAME]["_id"]
        print("structure exists:", STRUCTURE_NAME, structure_id)
    else:
        payload = {
            "name": STRUCTURE_NAME,
            "type": TYPE,
            "subType": 0,
            "description": "Container-Dokument einer Systemischen-Konsens-Abstimmung mit Frage, Optionen, Zeitlimit und den Widerstands-Bewertungen der Teilnehmer (Skala 0-10)",
            "fields": [
                {"name": "title", "displayName": "Title", "type": "string"},
                {"name": "question", "displayName": "Question", "type": "string"},
                {"name": "options", "displayName": "Options", "type": "array", "items": "string"},
                {"name": "endTime", "displayName": "End Time", "type": "string"},
                {"name": "status", "displayName": "Status", "type": "string"},
                {"name": "votes", "displayName": "Votes", "type": "object"},
            ],
        }
        out = api("POST", "/structures/create", payload, token=token)
        if isinstance(out, dict) and "_id" in out:
            structure_id = out["_id"]
            print("structure created:", STRUCTURE_NAME, structure_id)
        else:
            print("structure FAILED:", json.dumps(out)[:300], file=sys.stderr)
            sys.exit(1)

    # TDD prüfen
    tdd_docs = api("POST", "/docs/fetch/", {"type": 0, "subType": 0}, token=token)
    docs = tdd_docs.get("docs") if isinstance(tdd_docs, dict) else (tdd_docs if isinstance(tdd_docs, list) else [])
    existing = next((d for d in docs if (d.get("content") or {}).get("name") == TOOL_NAME), None)
    if existing:
        print("TDD exists:", TOOL_NAME, existing.get("_id"))
    else:
        tdd = {
            "_id": "",
            "content": {
                "name": TOOL_NAME,
                "description": "Entscheidungs-Tool nach der Methode des Systemischen Konsenses (Skala 0-10).",
                "url": "http://localhost:3001/Tools/SysConsens/",
                "responsible": "",
                "icon": ICON,
                "incomingDataStructureIDs": [],
                "outgoingDataStructureIDs": [],
                "assignments": {"consensusSession": {"structureId": structure_id, "type": TYPE, "subType": 0}},
            },
            "owner": "",
            "shareWithDepartment": False,
            "shareWithGroup": False,
            "subType": 0,
            "title": "Tool details — " + TOOL_NAME,
            "type": 0,
            "public": True,
        }
        out = api("POST", "/docs/create", tdd, token=token)
        if isinstance(out, dict) and ("_id" in out or "id" in out):
            print("TDD created ->", out.get("_id") or out.get("id"))
        else:
            print("TDD FAILED:", json.dumps(out)[:300], file=sys.stderr)

    print("DONE. App: http://localhost:3001/Tools/SysConsens/")


if __name__ == "__main__":
    main()
