import psycopg
import uuid


class PgPool:
    def __init__(self, user: str, password: str, dbname="ecotrack"):
        self.dbname = dbname
        self.user = user
        self.password = password

    def _conn(self):
        return psycopg.connect(
            host="localhost",
            port=5432,
            dbname=self.dbname,
            user=self.user,
            password=self.password,
        )

    # ── Produtos ──────────────────────────────────────────────────────

    def listar_produtos(self):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT nroControle, nome, centroColeta, dataHora, tipo, pessoa, qtd FROM produto"
                )
                return cur.fetchall()

    def produtos_por_cpf(self, cpf: str):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT nroControle, nome, centroColeta, dataHora, tipo, pessoa, qtd FROM produto WHERE pessoa = %s",
                    (cpf,),
                )
                return cur.fetchall()

    def produtos_disponiveis_por_tipo(self, tipo: int):
        """Produtos que ainda não pertencem a nenhum lote, filtrados por tipo."""
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT p.nroControle, p.nome, p.centroColeta, p.dataHora, p.tipo, p.pessoa, p.qtd
                    FROM produto p
                    LEFT JOIN dentroLote dl ON p.nroControle = dl.produto
                    WHERE (dl.produto IS NULL) AND p.tipo = %s
                    """,
                    (tipo,),
                )
                return cur.fetchall()

    # ── Lotes ─────────────────────────────────────────────────────────

    def listar_lotes(self):
        """Retorna todos os lotes com nroSerie, nome, tipo, dataHora e contagem de produtos."""
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT l.nroSerie, l.nome, l.tipo, l.dataHora,
                           COUNT(dl.produto) AS qtd_produtos
                    FROM lote l
                    LEFT JOIN dentroLote dl ON l.nroSerie = dl.nroSerie
                    GROUP BY l.nroSerie, l.nome, l.tipo, l.dataHora
                    ORDER BY l.dataHora DESC
                    """
                )
                return cur.fetchall()

    def inserir_lote(self, nro_serie: uuid.UUID, nome: str | None, tipo: str):
        """Insere um lote e retorna (nroSerie, nome, tipo, dataHora)."""
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO lote (nroSerie, nome, tipo) VALUES (%s, %s, %s) RETURNING nroSerie, nome, tipo, dataHora",
                    (nro_serie, nome, tipo),
                )
                conn.commit()
                return cur.fetchone()

    def associar_produto_ao_lote(self, produto: uuid.UUID, nro_serie: uuid.UUID):
        """Cria um vínculo em dentroLote."""
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO dentroLote (produto, nroSerie) VALUES (%s, %s)",
                    (produto, nro_serie),
                )
                conn.commit()

    def produtos_do_lote(self, nro_serie: uuid.UUID):
        """Lista os nroControle dos produtos de um lote."""
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT p.nroControle FROM produto p INNER JOIN dentroLote dl ON p.nroControle = dl.produto WHERE dl.nroSerie = %s",
                    (nro_serie,),
                )
                return [row[0] for row in cur.fetchall()]
            
    def criar_lote_com_produtos(
        self, nro_serie: uuid.UUID, nome: str | None, tipo: str, produtos: list[uuid.UUID]
    ):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO lote (nroSerie, nome, tipo) VALUES (%s, %s, %s) "
                    "RETURNING nroSerie, nome, tipo, dataHora",
                    (nro_serie, nome, tipo),
                )
                lote = cur.fetchone()
                for prod in produtos:
                    cur.execute(
                        "INSERT INTO dentroLote (produto, nroSerie) VALUES (%s, %s)",
                        (prod, nro_serie),
                    )
            conn.commit()  # só chega aqui se tudo der certo
        return lote

    # ── Transportes ──────────────────────────────────────────────────

    def inserir_transporte(self, cod_envio: uuid.UUID, nome: str | None, destinatario: str, remetente: str, lote: uuid.UUID):
        """Insere transporte e retorna (codEnvio, nome, destinatario, remetente, lote)."""
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO transporte (codEnvio, nome, destinatario, remetente, lote) VALUES (%s, %s, %s, %s, %s) RETURNING codEnvio, nome, destinatario, remetente, lote",
                    (cod_envio, nome, destinatario, remetente, lote),
                )
                conn.commit()
                return cur.fetchone()

    def transportes_do_lote(self, nro_serie: uuid.UUID):
        """Transportes associados a um lote, com nomes das empresas."""
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT t.codEnvio, t.nome, t.destinatario, t.remetente, t.lote,
                           rem.nome AS remetente_nome, dest.nome AS destinatario_nome
                    FROM transporte t
                    LEFT JOIN empresas rem ON t.remetente = rem.cnpj
                    LEFT JOIN empresas dest ON t.destinatario = dest.cnpj
                    WHERE t.lote = %s
                    ORDER BY t.codEnvio
                    """,
                    (nro_serie,),
                )
                return cur.fetchall()

    # ── Rastreamento ─────────────────────────────────────────────────

    def rastrear_por_termo(self, termo: str):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT nroSerie, nome, tipo, dataHora FROM lote "
                    "WHERE nroSerie::text = %s OR nome = %s",
                    (termo, termo),
                )
                lote = cur.fetchone()
                if not lote:
                    return None
                nro_serie = lote[0]

                cur.execute(
                    """
                    SELECT p.nroControle, p.nome, p.centroColeta, p.dataHora,
                        p.tipo, p.pessoa, p.qtd
                    FROM produto p
                    INNER JOIN dentroLote dl ON p.nroControle = dl.produto
                    WHERE dl.nroSerie = %s
                    """,
                    (nro_serie,),
                )
                produtos = cur.fetchall()

                cur.execute(
                    """
                    SELECT t.codEnvio, t.nome, t.destinatario, t.remetente, t.lote,
                        rem.nome AS remetente_nome, dest.nome AS destinatario_nome
                    FROM transporte t
                    LEFT JOIN empresas rem ON t.remetente = rem.cnpj
                    LEFT JOIN empresas dest ON t.destinatario = dest.cnpj
                    WHERE t.lote = %s
                    ORDER BY t.codEnvio
                    """,
                    (nro_serie,),
                )
                transportes_raw = cur.fetchall()

        chaves_lote = ["nroSerie", "nome", "tipo", "dataHora"]
        chaves_produto = ["nroControle", "nome", "centroColeta", "dataHora", "tipo", "pessoa", "qtd"]
        chaves_transporte = ["codEnvio", "nome", "destinatario", "remetente", "lote", "remetente_nome", "destinatario_nome"]

        return {
            "lote": dict(zip(chaves_lote, lote)),
            "produtos": [dict(zip(chaves_produto, p)) for p in produtos],
            "transportes": [dict(zip(chaves_transporte, t)) for t in transportes_raw],
        }

    # ── Resumo / Painel ──────────────────────────────────────────────

    def resumo_painel(self):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                      (SELECT COUNT(*) FROM produto) AS total_produtos,
                      (SELECT COUNT(*) FROM lote) AS total_lotes,
                      (SELECT COUNT(*) FROM transporte) AS total_transportes,
                      (SELECT COUNT(*) FROM produto p
                       LEFT JOIN dentroLote dl ON p.nroControle = dl.produto
                       WHERE dl.produto IS NULL) AS produtos_disponiveis
                """)
                return cur.fetchone()

    # ── Área do Cidadão ─────────────────────────────────────────────

    def timeline_logistica(self, nro_controle: uuid.UUID):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT p.nome AS nome_cidadao, prod.tipo AS tipo_produto, prod.qtd AS quantidade,
                           emp_destino.nome AS empresa_destino, h.dataHora AS horario_entrega
                    FROM pessoa AS p
                    INNER JOIN produto AS prod ON p.cpf = prod.pessoa
                    INNER JOIN dentroLote AS dl ON prod.nroControle = dl.produto
                    INNER JOIN lote AS l ON dl.nroSerie = l.nroSerie
                    INNER JOIN transporte AS t ON l.nroSerie = t.lote
                    INNER JOIN empresas AS emp_destino ON t.destinatario = emp_destino.cnpj
                    INNER JOIN historico AS h ON t.codEnvio = h.codEnvio
                    WHERE prod.nroControle = %s
                    ORDER BY h.dataHora DESC
                    """,
                    (nro_controle,),
                )
                return cur.fetchall()

    # ── Queries analíticas (mantidas do original) ────────────────────

    def empresas_t_maior_media(self):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT e.cnpj, e.nome, AVG(h_fim.dataHora - h_inicio.dataHora) AS tempo_medio_empresa
                    FROM empresas AS e
                    INNER JOIN transporte AS t ON e.cnpj = t.remetente
                    INNER JOIN historico AS h_inicio ON t.codEnvio = h_inicio.codEnvio AND h_inicio.status = 'Processando'
                    INNER JOIN historico AS h_fim ON t.codEnvio = h_fim.codEnvio AND h_fim.status = 'Entregue'
                    GROUP BY e.cnpj, e.nome
                    HAVING AVG(h_fim.dataHora - h_inicio.dataHora) > (
                        SELECT AVG(h_f.dataHora - h_i.dataHora)
                        FROM historico AS h_i
                        INNER JOIN historico AS h_f ON h_i.codEnvio = h_f.codEnvio
                        WHERE h_i.status = 'Processando' AND h_f.status = 'Entregue'
                    )
                """)
                return cur.fetchall()

    def desempenho_recompensa(self):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT e.nome AS nome_empresa, est.tipo AS tipo_recompensa,
                           est.valor AS custo_creditos, COUNT(r.id) AS total_vezes_resgatada
                    FROM empresas AS e
                    INNER JOIN estoque AS est ON e.cnpj = est.cnpj
                    LEFT JOIN recompensa AS r ON est.cnpj = r.cnpj AND est.tipo = r.tipo
                    WHERE e.tipo IN ('Reciclavel', 'Tecnologia')
                    GROUP BY e.nome, est.tipo, est.valor
                    ORDER BY total_vezes_resgatada DESC
                """)
                return cur.fetchall()

    def empresas_transportaram_todos_tipos_produto(self):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT e.cnpj, e.nome, e.tipo
                    FROM empresas AS e
                    WHERE e.tipo IN ('Reciclavel', 'Tecnologia')
                    AND NOT EXISTS (
                        SELECT 1 FROM estoque AS est
                        WHERE est.cnpj = e.cnpj
                        AND NOT EXISTS (
                            SELECT 1 FROM transporte AS t
                            INNER JOIN historico AS h ON t.codEnvio = h.codEnvio AND h.status = 'Entregue'
                            INNER JOIN lote AS l ON t.lote = l.nroSerie
                            INNER JOIN dentroLote AS dl ON l.nroSerie = dl.nroSerie
                            INNER JOIN produto AS p ON dl.produto = p.nroControle
                            WHERE t.destinatario = e.cnpj AND p.tipo::text = est.tipo
                        )
                    )
                    ORDER BY e.nome
                """)
                return cur.fetchall()

    def cidados_acima_media_quantidade(self):
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT p.nome AS nome_cidadao, AVG(prod.qtd) AS media_quantidade_reciclada
                    FROM pessoa AS p
                    INNER JOIN produto AS prod ON p.cpf = prod.pessoa
                    INNER JOIN dentroLote AS dl ON prod.nroControle = dl.produto
                    INNER JOIN lote AS l ON dl.nroSerie = l.nroSerie
                    INNER JOIN transporte AS t ON l.nroSerie = t.lote
                    INNER JOIN historico AS h ON t.codEnvio = h.codEnvio AND h.status = 'Entregue'
                    GROUP BY p.nome
                    HAVING AVG(prod.qtd) > (
                        SELECT AVG(qtd) FROM produto
                        INNER JOIN dentroLote ON produto.nroControle = dentroLote.produto
                        INNER JOIN lote ON dentroLote.nroSerie = lote.nroSerie
                        INNER JOIN transporte ON lote.nroSerie = transporte.lote
                        INNER JOIN historico ON transporte.codEnvio = historico.codEnvio
                        WHERE historico.status = 'Entregue'
                    )
                    ORDER BY media_quantidade_reciclada DESC
                """)
                return cur.fetchall()
            
# Queries para resgate de créditos ─────────────────────────

    def cidadao_por_cpf(self, cpf: str):
        """Busca os dados e saldo atual do cidadão."""
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT cpf, nome, creditos FROM pessoa WHERE cpf = %s", (cpf,))
                return cur.fetchone()

    def listar_estoque_resgate(self):
        """Lista opções de resgate que possuem quantidade > 0."""
        with self._conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT e.cnpj, emp.nome, e.tipo, e.valor, e.quantidade 
                    FROM estoque e
                    INNER JOIN empresas emp ON e.cnpj = emp.cnpj
                    WHERE e.quantidade > 0
                """)
                return cur.fetchall()

    def executar_resgate_transacao(self, cpf: str, cnpj: str, tipo_estoque: str):
        """Transação ACID blindada para resgate de créditos."""
        with self._conn() as conn:
            # O bloco with conn.transaction() garante o COMMIT ou ROLLBACK automático
            with conn.transaction():
                with conn.cursor() as cur:
                    
                    # 1. Trava a linha da pessoa (FOR UPDATE) e checa o saldo
                    cur.execute("SELECT creditos FROM pessoa WHERE cpf = %s FOR UPDATE", (cpf,))
                    pessoa = cur.fetchone()
                    if not pessoa:
                        raise ValueError("Cidadão não encontrado.")
                    saldo_atual = pessoa[0]

                    # 2. Trava a linha do estoque (FOR UPDATE) e checa disponibilidade
                    cur.execute("""
                        SELECT quantidade, valor FROM estoque 
                        WHERE cnpj = %s AND tipo = %s FOR UPDATE
                    """, (cnpj, tipo_estoque))
                    estoque = cur.fetchone()
                    if not estoque:
                        raise ValueError("Estoque não encontrado.")
                    
                    qtd_atual, valor_custo = estoque
                    
                    # Validações de negócio
                    if qtd_atual <= 0:
                        raise ValueError("Estoque esgotado para este item.")
                    if saldo_atual < valor_custo:
                        raise ValueError(f"Saldo insuficiente. Você tem {saldo_atual} créditos e precisa de {valor_custo}.")

                    # 3. Debita os créditos da Pessoa
                    cur.execute("UPDATE pessoa SET creditos = creditos - %s WHERE cpf = %s", (valor_custo, cpf))

                    # 4. Reduz o estoque da Empresa
                    cur.execute("UPDATE estoque SET quantidade = quantidade - 1 WHERE cnpj = %s AND tipo = %s", (cnpj, tipo_estoque))

                    # 5. Registra o histórico da Recompensa
                    cur.execute("INSERT INTO recompensa (cpf, cnpj, tipo) VALUES (%s, %s, %s)", (cpf, cnpj, tipo_estoque))
                    
                    return {"sucesso": True, "novo_saldo": saldo_atual - valor_custo}