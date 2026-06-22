import os
import glob
import psycopg
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER", "admin")
DB_PASSWORD = os.getenv("DB_PASSWORD", "admin")
DB_NAME = os.getenv("DB_NAME", "ecotrack")
DB_HOST = os.getenv("DB_HOST", "localhost")

SEED_DIR = os.path.dirname(os.path.abspath(__file__))

conn = psycopg.connect(
    host=DB_HOST,
    port=5432,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
)
conn.autocommit = True

reset_file = os.path.join(SEED_DIR, "reset.sql")
files = [reset_file] + sorted(glob.glob(os.path.join(SEED_DIR, "[0-9]*.sql")))

print(f"Limpando dados existentes e rodando {len(files)-1} scripts de seed...\n")
for f in files:
    name = os.path.basename(f)
    print(f"  → {name}...", end=" ")
    try:
        with conn.cursor() as cur:
            cur.execute(open(f).read())
        print("OK")
    except Exception as e:
        print(f"ERRO: {e}")
        conn.close()
        exit(1)

conn.close()
print("\nSeed concluído com sucesso!")
