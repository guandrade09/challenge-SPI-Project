import contextlib
import getpass
import json
import os
import sqlite3
from datetime import datetime

import numpy as np

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(_BASE_DIR, "known_faces.db")
_LEGACY_JSON_PATH = os.path.join(_BASE_DIR, "known_faces.json")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS people (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS embeddings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id   INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    vector      BLOB NOT NULL,
    created_at  TEXT NOT NULL,
    enrolled_by TEXT NOT NULL
);
"""


class FaceDatabase:
    """Armazena embeddings faciais por pessoa em SQLite.

    Cada escrita roda em uma transação; o SQLite serializa gravações concorrentes
    (via lock de arquivo + WAL) em vez de deixar dois processos corromperem o
    mesmo arquivo, como podia acontecer com o JSON. Cada amostra também guarda
    quando e por qual usuário do SO foi cadastrada.
    """

    def __init__(self, path: str = DEFAULT_DB_PATH):
        self.path = path
        self._init_schema()
        self._migrate_legacy_json()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path, timeout=10)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _init_schema(self):
        with contextlib.closing(self._connect()) as conn, conn:
            conn.executescript(_SCHEMA)

    def _migrate_legacy_json(self):
        """Importa known_faces.json (formato antigo) uma única vez, se existir."""
        if not os.path.exists(_LEGACY_JSON_PATH):
            return
        with contextlib.closing(self._connect()) as conn, conn:
            already_migrated = conn.execute("SELECT COUNT(*) FROM embeddings").fetchone()[0] > 0
        if already_migrated:
            return

        with open(_LEGACY_JSON_PATH, "r", encoding="utf-8") as f:
            legacy_data = json.load(f)

        for name, embeddings in legacy_data.items():
            for raw in embeddings:
                vector = np.array(raw, dtype=np.float32).reshape(1, -1)
                self.add(name, vector, enrolled_by="migração-json")

        migrated_path = _LEGACY_JSON_PATH + ".migrated"
        os.replace(_LEGACY_JSON_PATH, migrated_path)
        print(f"[face_id] known_faces.json migrado para SQLite e renomeado para {os.path.basename(migrated_path)}")

    def add(self, name: str, embedding: np.ndarray, enrolled_by: str | None = None):
        enrolled_by = enrolled_by or getpass.getuser()
        vector_blob = np.asarray(embedding, dtype=np.float32).tobytes()
        created_at = datetime.now().isoformat(timespec="seconds")

        with contextlib.closing(self._connect()) as conn, conn:
            conn.execute("INSERT OR IGNORE INTO people(name) VALUES (?)", (name,))
            person_id = conn.execute("SELECT id FROM people WHERE name = ?", (name,)).fetchone()[0]
            conn.execute(
                "INSERT INTO embeddings(person_id, vector, created_at, enrolled_by) VALUES (?, ?, ?, ?)",
                (person_id, vector_blob, created_at, enrolled_by),
            )

    def remove(self, name: str):
        with contextlib.closing(self._connect()) as conn, conn:
            conn.execute("DELETE FROM people WHERE name = ?", (name,))

    def names(self) -> list[str]:
        with contextlib.closing(self._connect()) as conn:
            rows = conn.execute("SELECT name FROM people ORDER BY name").fetchall()
        return [row[0] for row in rows]

    def all_embeddings(self):
        with contextlib.closing(self._connect()) as conn:
            rows = conn.execute(
                "SELECT p.name, e.vector FROM embeddings e JOIN people p ON p.id = e.person_id"
            ).fetchall()
        for name, blob in rows:
            yield name, np.frombuffer(blob, dtype=np.float32).reshape(1, -1)

    def history(self, name: str | None = None) -> list[tuple[str, str, str]]:
        """Retorna (nome, quando, cadastrado_por) de cada amostra, mais recente primeiro."""
        query = (
            "SELECT p.name, e.created_at, e.enrolled_by "
            "FROM embeddings e JOIN people p ON p.id = e.person_id"
        )
        params: tuple = ()
        if name:
            query += " WHERE p.name = ?"
            params = (name,)
        query += " ORDER BY e.created_at DESC"

        with contextlib.closing(self._connect()) as conn:
            return conn.execute(query, params).fetchall()
