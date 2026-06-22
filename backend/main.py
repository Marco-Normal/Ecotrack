from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from datetime import datetime
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

from .src.queries import PgPool

app = FastAPI()

# CORS – permite requisições do frontend (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB dependency

def get_db():
    pool = PgPool(user=os.getenv("DB_USER","postgres"),
                   password=os.getenv("DB_PASSWORD","postgres"),
                   dbname=os.getenv("DB_NAME","ecotrack"),
                   host=os.getenv("DB_HOST","localhost"))
    try:
        yield pool
    finally:
        pass

# Mapeamento de tipos entre frontend e DB
# Frontend: 'Reciclável', 'Orgânico', 'Tecnologia'
# DB:       'Reciclavel',  'Orgânico', 'Tecnologia'
TIPO_PARA_DB = {
    "Reciclavel": "Reciclavel",
    "Reciclável": "Reciclavel",
    "Orgânico": "Orgânico",
    "Organico": "Orgânico",
    "Tecnologia": "Tecnologia",
}

def normalizar_tipo(t: str) -> str:
    return TIPO_PARA_DB.get(t, t)

TIPO_DB_FRONTEND = {
    "Reciclavel": "Reciclável",
    "Orgânico": "Orgânico",
    "Tecnologia": "Tecnologia",
}

# Schemas

class ProdutoSchema(BaseModel):
    nroControle: uuid.UUID
    nome: str
    centroColeta: Optional[str] = None
    dataHora: datetime
    tipo: str
    pessoa: str
    qtd: int
    class Config:
        from_attributes = True

class LoteSchema(BaseModel):
    nroSerie: uuid.UUID
    nome: Optional[str] = None
    tipo: str
    dataHora: datetime
    qtd_produtos: Optional[int] = None
    class Config:
        from_attributes = True

class TransporteSchema(BaseModel):
    codEnvio: uuid.UUID
    nome: Optional[str] = None
    destinatario: Optional[str] = None
    remetente: Optional[str] = None
    lote: uuid.UUID
    class Config:
        from_attributes = True

class CriarLoteInput(BaseModel):
    nroSerie: uuid.UUID
    nome: Optional[str] = None
    tipo: str
    produtos: List[uuid.UUID]

class CriarTransporteInput(BaseModel):
    nome: Optional[str] = None
    destinatario: str
    remetente: str
    lote: uuid.UUID

class CriarProdutoInput(BaseModel):
    nome: str
    tipo: str
    qtd: int
    pessoa: str
    creditos: int

class ResgateInput(BaseModel):
    cpf: str
    cnpj: str
    tipo: str

# ── Produtos ──────────────────────────────────────────────────────────

@app.get("/api/produtos", response_model=List[ProdutoSchema])
async def listar_produtos(tipo: Optional[str] = None, db: PgPool = Depends(get_db)):
    if tipo is not None:
        tipo_db = normalizar_tipo(tipo)
        rows = db.produtos_disponiveis_por_tipo(tipo_db)
    else:
        rows = db.listar_produtos()
    if not rows:
        raise HTTPException(status_code=404, detail="Nenhum produto encontrado")
    return [ProdutoSchema(**dict(zip(["nroControle","nome","centroColeta","dataHora","tipo","pessoa","qtd"], r))) for r in rows]

@app.post("/api/produtos", response_model=ProdutoSchema)
async def criar_produto(input: CriarProdutoInput, db: PgPool = Depends(get_db)):
    with db._pegar_cursor() as cur:
        cur.execute("SELECT cpf FROM pessoa WHERE cpf = %s", (input.pessoa,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="CPF não encontrado")
    tipo_db = normalizar_tipo(input.tipo)
    nro_controle = uuid.uuid4()
    produto = db.inserir_produto(nro_controle, input.nome, tipo_db, input.pessoa, input.qtd, input.creditos)
    if not produto:
        raise HTTPException(status_code=500, detail="Falha ao criar produto")
    return ProdutoSchema(**dict(zip(["nroControle","nome","centroColeta","dataHora","tipo","pessoa","qtd"], produto)))

@app.get("/api/produtos/{cpf}", response_model=List[ProdutoSchema])
async def produtos_por_cpf(cpf: str, db: PgPool = Depends(get_db)):
    with db._pegar_cursor() as cur:
        cur.execute("SELECT cpf, nome, creditos FROM pessoa WHERE cpf = %s", (cpf,))
        pessoa = cur.fetchone()
    if not pessoa:
        raise HTTPException(status_code=404, detail="CPF não encontrado")
    rows = db.produtos_por_cpf(cpf)
    if not rows:
        raise HTTPException(status_code=404, detail="Nenhum produto para este CPF")
    return [ProdutoSchema(**dict(zip(["nroControle","nome","centroColeta","dataHora","tipo","pessoa","qtd"], r))) for r in rows]

@app.get("/api/produtos/{numeroControle}/logistica")
async def logistica(numeroControle: uuid.UUID, db: PgPool = Depends(get_db)):
    rows = db.vida_completa_produto(numeroControle)
    if not rows:
        raise HTTPException(status_code=404, detail="Timeline não encontrada")
    keys = ["nome_cidadao","tipo_produto","quantidade","empresa_destino","horario_entrega"]
    return [dict(zip(keys, r)) for r in rows]

# ── Lotes ────────────────────────────────────────────────────────────

@app.get("/api/lotes", response_model=List[LoteSchema])
async def listar_lotes(db: PgPool = Depends(get_db)):
    rows = db.listar_lotes()
    if not rows:
        raise HTTPException(status_code=404, detail="Nenhum lote encontrado")
    return [LoteSchema(**dict(zip(["nroSerie","nome","tipo","dataHora","qtd_produtos"], r))) for r in rows]

@app.get("/api/lotes/{nroSerie}/produtos")
async def produtos_do_lote(nroSerie: uuid.UUID, db: PgPool = Depends(get_db)):
    produtos = db.produtos_do_lote(nroSerie)
    return {"produtos": [str(p) for p in produtos]}

@app.post("/api/lotes", response_model=LoteSchema)
async def criar_lote(input: CriarLoteInput, db: PgPool = Depends(get_db)):
    tipo_db = normalizar_tipo(input.tipo)
    nome = input.nome or db.gerar_nome_lote(tipo_db)
    try:
        lote = db.criar_lote_com_produtos(
            input.nroSerie, nome, tipo_db, input.produtos
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return LoteSchema(**dict(zip(["nroSerie", "nome", "tipo", "dataHora"], lote)))

# ── Transportes ──────────────────────────────────────────────────────

@app.post("/api/transportes", response_model=TransporteSchema)
async def criar_transporte(input: CriarTransporteInput, db: PgPool = Depends(get_db)):
    res = db.inserir_transporte(input.nome, input.destinatario, input.remetente, input.lote)
    if not res:
        raise HTTPException(status_code=500, detail="Falha ao criar transporte")
    return TransporteSchema(**dict(zip(["codEnvio","nome","destinatario","remetente","lote"], res)))

# ── Rastreio ─────────────────────────────────────────────────────────

@app.get("/api/rastrear/{termo}")
async def rastrear(termo: str, db: PgPool = Depends(get_db)):
    data = db.rastrear_por_termo(termo)
    if not data:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    return data

# ── Resumo ───────────────────────────────────────────────────────────

@app.get("/api/resumo")
async def resumo(db: PgPool = Depends(get_db)):
    base = db.resumo_painel()
    if not base:
        raise HTTPException(status_code=404, detail="Resumo indisponível")
    lotes = db.listar_lotes()[:5]
    return {
        "contagens": {
            "total_produtos": base[0],
            "total_lotes": base[1],
            "total_transportes": base[2],
            "produtos_disponiveis": base[3]
        },
        "ultimos_lotes": [dict(zip(["nroSerie","nome","tipo","dataHora","qtd_produtos"], l)) for l in lotes],
        "empresas_maior_media": db.empresas_t_maior_media(),
        "desempenho_recompensa": db.desempenho_recompensa(),
        "empresas_todos_tipos": db.empresas_transportaram_todos_tipos_produto(),
        "cidadaos_acima_media": db.cidados_acima_media_quantidade()
    }

# endpoints para resgate de créditos

@app.get("/api/cidadao/{cpf}")
async def buscar_cidadao(cpf: str, db: PgPool = Depends(get_db)):
    row = db.cidadao_por_cpf(cpf)
    if not row:
        raise HTTPException(status_code=404, detail="Cidadão não encontrado")
    return dict(zip(["cpf", "nome", "creditos"], row))

@app.get("/api/estoque")
async def listar_estoque(db: PgPool = Depends(get_db)):
    rows = db.listar_estoque_resgate()
    if not rows:
        return []
    return [dict(zip(["cnpj", "empresa_nome", "tipo", "valor", "quantidade"], r)) for r in rows]

@app.post("/api/resgatar")
async def resgatar_creditos(input: ResgateInput, db: PgPool = Depends(get_db)):
    tipo_db = normalizar_tipo(input.tipo)
    try:
        resultado = db.executar_resgate_transacao(input.cpf, input.cnpj, tipo_db)
        return resultado
    except ValueError as e:
        # Pega as exceções de saldo e estoque que lançamos no queries.py
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno na transação.")
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)