"""
Migración: agrega columnas financieras a service_orders.
Ejecutar una sola vez: uv run python migrate_financial.py
"""
import sqlite3
import os
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "dronic.db")

MIGRATIONS = [
    "ALTER TABLE service_orders ADD COLUMN client_paid_total REAL NOT NULL DEFAULT 0",
    "ALTER TABLE service_orders ADD COLUMN dronic_received_total REAL NOT NULL DEFAULT 0",
    "ALTER TABLE service_orders ADD COLUMN dronic_receipt_verified_at DATETIME",
    "ALTER TABLE service_orders ADD COLUMN dronic_receipt_verified_by TEXT",
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
        for stmt in MIGRATIONS:
            # Extraer nombre de columna del statement
            col_name = stmt.split("ADD COLUMN")[1].strip().split()[0]
            if column_exists(cursor, "service_orders", col_name):
                print(f"  SKIP  {col_name} (ya existe)")
            else:
                cursor.execute(stmt)
                print(f"  OK    {col_name} agregada")

        conn.commit()
        print("\nMigración completada.")

        # Verificar resultado
        cursor.execute("PRAGMA table_info(service_orders)")
        cols = [row[1] for row in cursor.fetchall()]
        print(f"Columnas actuales en service_orders: {cols}")

    except Exception as e:
        conn.rollback()
        print(f"ERROR: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    run()
