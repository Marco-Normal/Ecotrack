"""
Init usuários
"""

from yoyo import step
from dotenv import load_dotenv
import os

load_dotenv()
migrator_user = os.getenv("MIGRATOR_USER")
migrator_password = os.getenv("MIGRATOR_PASSWORD")
db_name = os.getenv("DB_NAME")
if migrator_user is None or migrator_password is None:
    raise ValueError(
        "Variáveis ambientes do usuário de migração estão faltando")
if db_name is None:
    raise ValueError(
        "Variável ambiente do nome da base de dados está faltando")
steps = [step(f'CREATE ROLE "{migrator_user}" WITH PASSWORD \'{migrator_password}\' LOGIN CREATEDB CREATEROLE;'),
         step(f"GRANT USAGE, CREATE ON SCHEMA public TO {migrator_user};"),
         step(
             f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {migrator_user};"),
         step(
             f"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {migrator_user};"),
         step(
             f"GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO {migrator_user};"),
         step(
             f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO {migrator_user};"),
         step(
             f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO {migrator_user};"),
         step(
             f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO {migrator_user};"),
         ]
