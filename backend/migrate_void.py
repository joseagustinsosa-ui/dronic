"""
Migración: agrega columnas de anulación a payment_events y order_expenses.
Ejecutar una sola vez: py -m uv run python migrate_void.py
Es idempotente: hace SKIP si la columna ya existe.
"""
import sqlite3
import os
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "dronic.db")

MIGRATIONS = [
    ("payment_events", "is_voided",   "INTEGER NOT NULL DEFAULT 0"),
    ("payment_events", "voided_at",   "DATETIME"),
    ("payment_events", "voided_by",   "TEXT"),
    ("payment_events", "void_reason", "TEXT"),
    ("order_expenses", "is_voided",   "INTEGER NOT NULL DEFAULT 0"),
    ("order_expenses", "voided_at",   "DATETIME"),
    ("order_expenses", "voided_by",   "TEXT"),
    ("order_expenses", "void_reason", "TEXT"),
]


def column_exists(cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def run():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: no se encontró {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        for table, col, col_def in MIGRATIONS:
            if column_exists(cursor, table, col):
                print(f"  SKIP  {table}.{col} (ya existe)")
            else:
                cursor.execute(
                    f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"
                )
                print(f"  OK    {table}.{col} agregada")

        conn.commit()
        print("\nMigración completada.")

        for table in ("payment_events", "order_expenses"):
            cursor.execute(f"PRAGMA table_info({table})")
            cols = [row[1] for row in cursor.fetchall()]
            print(f"Columnas en {table}: {cols}")

    except Exception as e:
        conn.rollback()
        print(f"ERROR: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    run()
