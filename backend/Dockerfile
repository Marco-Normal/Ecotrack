FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock backend/.python-version backend/
RUN mkdir -p backend/src backend/migrations backend/seeds && \
    touch backend/__init__.py backend/src/__init__.py

RUN cd backend && uv sync --frozen --no-dev

COPY backend/ backend/

COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/docker-entrypoint.sh"]
