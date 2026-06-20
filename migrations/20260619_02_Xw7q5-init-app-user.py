"""
Init App user
"""

from yoyo import step
from dotenv import load_dotenv
import os

__depends__ = {"20260610_14_WJFqc-init-historico"}
load_dotenv()
app_user = os.getenv("APP_USER")
app_password = os.getenv("APP_PASSWORD")
db_name = os.getenv("DB_NAME")
if app_user is None or app_password is None:
    raise ValueError(
        "Variáveis ambientes do usuário de migração estão faltando")
if db_name is None:
    raise ValueError(
        "Variável ambiente do nome da base de dados está faltando")
steps = [
    step(f"CREATE ROLE {app_user} WITH LOGIN PASSWORD {app_password}"),
    step(
        f"GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {app_user};"
    ),
    step(
        f"ALTER DEFAULT PRIVILEGES GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {app_user};"
    ),
    step(
        f"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {app_user};"),
    step(
        f"ALTER DEFAULT PRIVILEGES GRANT USAGE, SELECT ON SEQUENCES TO {app_user};"),
    step(f"REVOKE GRANT OPTION FOR ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM {app_user};"),
    step(f"ALTER DEFAULT PRIVILEGES REVOKE GRANT OPTION FOR ALL PRIVILEGES ON TABLES FROM {app_user};"),
]
