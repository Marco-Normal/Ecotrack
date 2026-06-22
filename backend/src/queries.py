import psycopg
import uuid
from contextlib import contextmanager


class PgPool:
    def __init__(self, user: str, password: str, dbname="ecotrack"):
        self.dbname = dbname
        self.user = user
        self.password = password

    @contextmanager
    def _pegar_cursor(self):
        with psycopg.connect(
            host="localhost",
            port=5432,
            dbname=self.dbname,
            user=self.user,
            password=self.password,
        ) as conn:
            with conn.cursor() as cur:
                yield cur

    # ── Produtos ──────────────────────────────────────────────────────

    def listar_produtos(self):
        """Essa query lista todos os produtos cadastrados no sistema,
        devolvendo o número de controle (nroControle), o nome do produto,
        o centro de coleta onde foi entregue (centroColeta), a data e hora
        do descarte (dataHora), o tipo (tipo), o CPF da pessoa que descartou
        (pessoa) e a quantidade (qtd). Não possui filtros ou junções —
        é uma consulta direta à tabela `produto`.

        Útil para a tela de painel e demais listagens que precisam exibir
        todos os produtos disponíveis no sistema.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute(
                "SELECT nroControle, nome, centroColeta, dataHora, tipo, pessoa, qtd FROM produto"
            )
            return cursor.fetchall()

    def produtos_por_cpf(self, cpf: str):
        """Essa query lista todos os produtos descartados por um
        cidadão específico, identificado pelo seu CPF. Ela recebe o CPF
        como parâmetro e filtra a tabela `produto` pela coluna `pessoa`,
        devolvendo as mesmas colunas da query `listar_produtos`.

        Utilizada na Área do Cidadão para exibir o histórico de descartes
        de uma pessoa.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute(
                "SELECT nroControle, nome, centroColeta, dataHora, tipo, pessoa, qtd FROM produto WHERE pessoa = %s",
                (cpf,),
            )
            return cursor.fetchall()

    def produtos_disponiveis_por_tipo(self, tipo: int):
        """Essa query lista os produtos que ainda não foram associados
        a nenhum lote (ou seja, estão disponíveis para agrupamento),
        filtrados por um tipo específico (Reciclavel, Orgânico ou
        Tecnologia).

        Para isso, é feito um LEFT JOIN entre `produto` e `dentroLote`,
        onde mantemos apenas os produtos cujo `produto` é nulo no lado
        de `dentroLote` — ou seja, produtos que não possuem vínculo com
        nenhum lote. Além disso, aplicamos o filtro `p.tipo = %s` para
        retornar apenas produtos do tipo desejado.

        Utilizada no cadastro de lote (CadastroLote) para mostrar quais
        produtos podem ser agrupados em um novo lote.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute(
                """
                SELECT p.nroControle, p.nome, p.centroColeta, p.dataHora, p.tipo, p.pessoa, p.qtd
                FROM produto p
                LEFT JOIN dentroLote dl ON p.nroControle = dl.produto
                WHERE (dl.produto IS NULL) AND p.tipo = %s
                """,
                (tipo,),
            )
            return cursor.fetchall()

    def inserir_produto(self, nro_controle: uuid.UUID, nome: str, tipo: str, pessoa_cpf: str, qtd: int, creditos: int):
        with self._pegar_cursor() as cur:
            cur.execute(
                "INSERT INTO produto (nroControle, nome, tipo, pessoa, qtd) VALUES (%s, %s, %s, %s, %s) RETURNING nroControle, nome, centroColeta, dataHora, tipo, pessoa, qtd",
                (nro_controle, nome, tipo, pessoa_cpf, qtd),
            )
            result = cur.fetchone()
            cur.execute(
                "UPDATE pessoa SET creditos = creditos + %s WHERE cpf = %s",
                (creditos, pessoa_cpf),
            )
            return result

    # ── Lotes ─────────────────────────────────────────────────────────

    def listar_lotes(self):
        """Essa query lista todos os lotes cadastrados, exibindo o
        número de série (nroSerie), o nome (nome), o tipo (tipo), a
        data e hora de criação (dataHora) e a quantidade de produtos
        presentes em cada lote (qtd_produtos).

        Para contar os produtos, é realizado um LEFT JOIN entre `lote`
        e `dentroLote`, agrupando por lote e utilizando a função de
        agregação `COUNT`. O LEFT JOIN garante que lotes vazios (sem
        produtos associados) também apareçam, com contagem 0.

        Utilizada no painel (últimos lotes) e no cadastro de transporte
        (seleção do lote).
        """
        with self._pegar_cursor() as cursor:
            cursor.execute(
                """
                SELECT l.nroSerie, l.nome, l.tipo, l.dataHora,
                       COUNT(dl.produto) AS qtd_produtos
                FROM lote l
                LEFT JOIN dentroLote dl ON l.nroSerie = dl.nroSerie
                GROUP BY l.nroSerie, l.nome, l.tipo, l.dataHora
                ORDER BY l.dataHora DESC
                """
            )
            return cursor.fetchall()

    TIPO_ABBREV = {
        "Reciclavel": "REC",
        "Orgânico": "ORG",
        "Tecnologia": "TEC",
    }

    def gerar_nome_lote(self, tipo: str) -> str:
        abreviacao = self.TIPO_ABBREV.get(tipo, tipo[:3].upper())
        with self._pegar_cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM lote WHERE tipo = %s",
                (tipo,),
            )
            seq = cur.fetchone()[0] + 1
        return f"LOTE-{abreviacao}-{seq:03d}"

    def inserir_lote(self, nro_serie: uuid.UUID, nome: str | None, tipo: str):
        """Essa query insere um novo lote na tabela `lote` com um
        número de série (nroSerie), um nome opcional (nome) e um tipo
        (tipo). Utiliza a cláusula `RETURNING` para devolver os dados
        completos do lote recém-criado, incluindo nroSerie, nome, tipo
        e dataHora (gerada automaticamente pelo banco).

        O nroSerie é gerado pelo frontend como UUID, garantindo que
        cada lote tenha um identificador único.

        Chamada pelo endpoint POST /api/lotes.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute(
                "INSERT INTO lote (nroSerie, nome, tipo) VALUES (%s, %s, %s) RETURNING nroSerie, nome, tipo, dataHora",
                (nro_serie, nome, tipo),
            )
            return cursor.fetchone()

    def associar_produto_ao_lote(self, produto: uuid.UUID, nro_serie: uuid.UUID):
        """Essa query cria um vínculo entre um produto e um lote na
        tabela `dentroLote`, associando o `nroControle` do produto ao
        `nroSerie` do lote. Isso indica que o produto passou a fazer
        parte daquele lote.

        Chamada em sequência após `inserir_lote` para vincular os
        produtos selecionados ao lote recém-criado.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute(
                "INSERT INTO dentroLote (produto, nroSerie) VALUES (%s, %s)",
                (produto, nro_serie),
            )

    def produtos_do_lote(self, nro_serie: uuid.UUID):
        """Essa query retorna a lista de números de controle
        (nroControle) dos produtos que pertencem a um determinado lote,
        identificado pelo seu número de série (nroSerie).

        Para isso, é feito um INNER JOIN entre `produto` e `dentroLote`,
        onde a coluna `nroSerie` é usada como filtro. O resultado é uma
        lista simples de UUIDs.

        Utilizada na consulta de rastreio e na listagem de lotes para
        exibir os produtos de cada lote.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute(
                "SELECT p.nroControle FROM produto p INNER JOIN dentroLote dl ON p.nroControle = dl.produto WHERE dl.nroSerie = %s",
                (nro_serie,),
            )
            return [row[0] for row in cursor.fetchall()]
            
    def criar_lote_com_produtos(
        self, nro_serie: uuid.UUID, nome: str | None, tipo: str, produtos: list[uuid.UUID]
    ):
        with self._pegar_cursor() as cur:
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
        return lote

    # ── Transportes ──────────────────────────────────────────────────

    def inserir_transporte(self, cod_envio: uuid.UUID, nome: str | None, destinatario: str, remetente: str, lote: uuid.UUID):
        """Essa query insere um novo transporte na tabela `transporte`,
        associando um código de envio (codEnvio), um nome opcional
        (nome), o CNPJ do destinatário (destinatario), o CNPJ do
        remetente (remetente) e o lote transportado (lote).

        Utiliza `RETURNING` para devolver os dados completos do
        transporte recém-criado. O codEnvio é gerado como UUID pelo
        frontend.

        Chamada pelo endpoint POST /api/transportes.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute(
                "INSERT INTO transporte (codEnvio, nome, destinatario, remetente, lote) VALUES (%s, %s, %s, %s, %s) RETURNING codEnvio, nome, destinatario, remetente, lote",
                (cod_envio, nome, destinatario, remetente, lote),
            )
            return cursor.fetchone()

    def transportes_do_lote(self, nro_serie: uuid.UUID):
        """Essa query lista todos os transportes associados a um
        determinado lote, identificado pelo seu número de série
        (nroSerie). Além dos dados do transporte (codEnvio, nome,
        destinatario, remetente, lote), a query também traz os nomes
        das empresas remetente e destinatária através de LEFT JOINs
        com a tabela `empresas`.

        Utilizada na consulta de rastreio para exibir o histórico de
        transportes de um lote.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute(
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
            return cursor.fetchall()

    # ── Rastreamento ─────────────────────────────────────────────────

    def rastrear_por_termo(self, termo: str):
        """Essa query tem a função de buscar um lote pelo seu número de
        série (nroSerie) ou pelo seu nome (nome), retornando todos os
        dados do lote, os produtos que o compõem e os transportes
        associados.
        """
        with self._pegar_cursor() as cur:
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
        """Essa query retorna um resumo geral do sistema para ser
        exibido no painel inicial (dashboard). Ela calcula quatro
        métricas em subqueries correlacionadas:
        - total_produtos: quantidade total de produtos cadastrados
        - total_lotes: quantidade total de lotes criados
        - total_transportes: quantidade total de transportes registrados
        - produtos_disponiveis: quantidade de produtos que ainda não
          foram associados a nenhum lote (LEFT JOIN com dentroLote,
          filtrando WHERE dl.produto IS NULL)

        O resultado é uma única tupla com quatro valores inteiros.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute("""
                SELECT
                  (SELECT COUNT(*) FROM produto) AS total_produtos,
                  (SELECT COUNT(*) FROM lote) AS total_lotes,
                  (SELECT COUNT(*) FROM transporte) AS total_transportes,
                  (SELECT COUNT(*) FROM produto p
                   LEFT JOIN dentroLote dl ON p.nroControle = dl.produto
                   WHERE dl.produto IS NULL) AS produtos_disponiveis
            """)
            return cursor.fetchone()

    # ── Área do Cidadão ─────────────────────────────────────────────

    def timeline_logistica(self, nro_controle: uuid.UUID):
        """Essa query monta a linha do tempo logística de um produto
        específico, identificado pelo seu número de controle
        (nroControle). Ela devolve o nome do cidadão que descartou o
        produto, o tipo do produto, a quantidade, o nome da empresa
        destinatária e a data/hora da entrega.

        Para isso, uma sequência de INNER JOINs é realizada: partimos
        da `pessoa` que descartou o produto (primeiro JOIN com
        `produto`), seguimos para o lote ao qual o produto pertence
        (segundo JOIN com `dentroLote` e terceiro com `lote`),
        identificamos o transporte desse lote (quarto JOIN com
        `transporte`), buscamos o nome da empresa destinatária (quinto
        JOIN com `empresas`) e, por fim, pegamos a data e hora do
        histórico de entrega (sexto JOIN com `historico`).

        Os resultados são ordenados do mais recente para o mais antigo.

        Chamada pelo endpoint GET /api/produtos/{nroControle}/logistica.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute(
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
            return cursor.fetchall()

    def vida_completa_produto(self, produto: uuid.UUID):
        """Essa query tem a função de listar todo caminho que o
        `produto` realizou até o momento, devolvendo quem foi que
        entregou o produto, a quantidade, para qual empresa, e quais
        as informações completas de transporte, como data e hora e
        para onde foi.  Caso tenha acontecido mais de um transporte,
        ela lista todos.

        Para isso, uma sequência de `INNER JOIN`s são feitas, onde
        temos que pegar informações de quem descartou o produto
        (primeiro INNER JOIN), para qual lote e com que número de
        rastreio o produto foi (segundo INNER JOIN) a partir do código
        de rastreio, conseguimos o destinatário e rementente pelo
        transporte (terceiro INNER JOIN) e os nomes das empresas
        (quarto e quinto INNER JOIN), por fim, pegamos as informações
        de data e hora de entrega (sexto INNER JOIN) e ordenamos pelo
        mais recente.

        """
        with self._pegar_cursor() as cursor:
            cursor.execute(
                """
                    SELECT p.nome AS nome_cidadao, prod.tipo AS tipo_produto,
                           prod.qtd AS quantidade, emp_destino.nome AS empresa_destino,
                           h.dataHora AS horario_entrega
                    FROM pessoa AS p
                    INNER JOIN produto AS prod ON p.cpf = prod.pessoa
                    INNER JOIN dentroLote AS dl ON prod.nroControle = dl.produto
                    INNER JOIN lote AS l ON dl.nroSerie = l.nroSerie
                    INNER JOIN transporte AS t ON l.nroSerie = t.lote
                    INNER JOIN empresas AS emp_destino ON t.destinatario = emp_destino.cnpj
                    INNER JOIN historico AS h ON t.codEnvio = h.codEnvio
                    WHERE prod.nroControle = %s
                    ORDER BY h.dataHora DESC;
                    """,
                (produto,),
            )
            return cursor.fetchall()

    # ── Queries analíticas ───────────────────────────────────────────

    def empresas_t_maior_media(self):
        """Essa query responde à pergunta, quais empresas tem um
        média de entrega maior que a média geral. Pela necessidade de
        precisarmos fazer uma comparação com um valor que precisa ser
        calculado, a média geral de tempo de entrega, é necessário
        realizer uma subquery aninhada. Ela acaba não sendo tão lenta,
        por não ser dependente de uma tabela externa. Porém, ela não
        pode ser substituida por uma sequência de join pelo fato de
        precisarmos de um valor calculado.

        A query é montada, primeiro pegando todas as informações
        necessárias, i.e., data de ínicio de transporte (primeiro
        inner join), data do fim do transporte (segundo inner join),
        onde vamos agrupar por empresa (group by por cnpj e nome) e a
        filtragem para aquelas onde a média do ciclo de transporte
        como um todo foi maior que a média.  Essa média é calculado
        pela query interna, onde vamos pegar as informações de data do
        transporte apenas apra aqueles que já foram finalizados e
        calculamos a média dos mesmos.  É importante notar que pela
        cláusula final de WHERE, vamos pegar apenas os transportes
        finalizados
        """
        with self._pegar_cursor() as cursor:
            cursor.execute("""
                SELECT e.cnpj, e.nome, AVG(h_fim.dataHora - h_inicio.dataHora) AS tempo_medio_empresa
                FROM empresas AS e
                INNER JOIN transporte AS t ON e.cnpj = t.remetente
                INNER JOIN historico AS h_inicio
                    ON t.codEnvio = h_inicio.codEnvio AND h_inicio.status = 'Processando'
                INNER JOIN historico AS h_fim
                    ON t.codEnvio = h_fim.codEnvio AND h_fim.status = 'Entregue'
                GROUP BY e.cnpj, e.nome
                HAVING AVG(h_fim.dataHora - h_inicio.dataHora) > (
                    SELECT AVG(h_f.dataHora - h_i.dataHora)
                    FROM historico AS h_i
                    INNER JOIN historico AS h_f ON h_i.codEnvio = h_f.codEnvio
                    WHERE h_i.status = 'Processando' AND h_f.status = 'Entregue'
                );
            """)
            return cursor.fetchall()

    def desempenho_recompensa(self):
        """Essa query tem a função de fazer uma pequena sumarização
        para as empresas de reciclavel e tecnologia (esses tipos foram
        escolhidos arbitrariamente), mostrando o nome da empresa, seus
        estoques e quantas vezes cada tipo de recompensa que eles
        possuem foram resgatados. Dessa forma, a empresa pode, por
        exemplo identificar recompensas com maior demanda e aumentar sua
        quantidade, ou retirar recompensas com menor demanda.

        A query funciona encontrando todos os estoques de uma
        determinada empresa (primeiro INNER JOIN) e então fazer uma
        junção externa a esquerda, de forma a preservar todas as
        tuplas da junção anterior.  Isso é necessário, pois pode
        ocorrer de existir um tipo de recompensa no estoque que não foi
        resgatado, aparecendo então com nulo na parte de recompensa e
        consequentemente, o COUNT irá acusar 0 linhas, corretamente.
        A partir disso, agrupamos por empresa, tipo de recompensa no
        estoque e seu valor e ordenamos pelas mais resgatadas
        primeiro.

        """
        with self._pegar_cursor() as cursor:
            cursor.execute("""
                SELECT e.nome AS nome_empresa, est.tipo AS tipo_recompensa,
                       est.valor AS custo_creditos, COUNT(r.id) AS total_vezes_resgatada
                FROM empresas AS e
                INNER JOIN estoque AS est ON e.cnpj = est.cnpj
                LEFT JOIN recompensa AS r ON est.cnpj = r.cnpj AND est.tipo = r.tipo
                WHERE e.tipo IN ('Reciclavel', 'Tecnologia')
                GROUP BY e.nome, est.tipo, est.valor
                ORDER BY total_vezes_resgatada DESC;
            """)
            return cursor.fetchall()

    def empresas_transportaram_todos_tipos_produto(self):
        """Essa query tem a função de listar as empresas que já receberam,
        através de um transporte finalizado, entregas referentes a todos os
        tipos de produtos que elas possuem cadastrados em seu estoque de produtos
        atualmente, devolvendo o CNPJ, o nome e o tipo de atuação da empresa.
        A busca é restrita às empresas dos tipos 'Reciclavel' ou 'Tecnologia'.

        Para isso, aplicamos uma lógica de dupla negação (onde garantimos
        que não existe um tipo no estoque sem um transporte correspondente).
        Dentro dessa verificação, uma sequência de `INNER JOIN`s é feita:
        ligamos as informações de transporte com o histórico para validar
        se o status da viagem consta como 'Entregue' (primeiro INNER JOIN),
        juntamos com as informações do lote (segundo INNER JOIN) e dos itens
        presentes dentro desse lote (terceiro INNER JOIN) para conseguirmos
        chegar aos dados do produto transportado (quarto INNER JOIN). Assim,
        conseguimos checar se o tipo do produto entregue para esse destinatário
        bate com o tipo listado no estoque, e por fim, ordenamos o resultado
        pelo nome da empresa em ordem alfabética.

        Divisão relacional.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute("""
                SELECT e.cnpj, e.nome, e.tipo
                FROM empresas AS e
                WHERE e.tipo IN ('Reciclavel', 'Tecnologia')
                AND NOT EXISTS (
                    SELECT 1 FROM estoque AS est
                    WHERE est.cnpj = e.cnpj
                    AND NOT EXISTS (
                        SELECT 1 FROM transporte AS t
                        INNER JOIN historico AS h
                            ON t.codEnvio = h.codEnvio AND h.status = 'Entregue'
                        INNER JOIN lote AS l ON t.lote = l.nroSerie
                        INNER JOIN dentroLote AS dl ON l.nroSerie = dl.nroSerie
                        INNER JOIN produto AS p ON dl.produto = p.nroControle
                        WHERE t.destinatario = e.cnpj AND p.tipo::text = est.tipo
                    )
                )
                ORDER BY e.nome;
            """)
            return cursor.fetchall()

    def cidados_acima_media_quantidade(self):
        """Esta query lista cidadãos que reciclam uma quantidade média de produtos
        maior que a média geral de quantidade por transação.
        Utiliza agregação, agrupamento e subquery na cláusula HAVING, semelhante
        à query 'empresas_t_maior_media', mas focada em cidadãos.

        Não usa divisão relacional (evita o padrão de dupla negação EXISTS).
        """
        with self._pegar_cursor() as cursor:
            cursor.execute("""
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
                ORDER BY media_quantidade_reciclada DESC;
            """)
            return cursor.fetchall()

    def ranking_eficiencia_empresa_tipo(self):
        """Essa query tem a função de ranquear as empresas de acordo com a
        sua eficiência no tempo de entrega, agrupadas por tipo de produto.
        Ela devolve o tipo do produto, o nome da empresa destinatária, o tempo
        médio gasto nas entregas, o total de transportes realizados, a posição
        no ranking, uma classificação textual de desempenho e o tempo médio
        convertido em horas. O resultado final lista apenas as 5 melhores
        empresas para cada categoria de produto.

        Para isso, o processo é dividido em etapas lógicas. Primeiro, calculamos
        o tempo total de cada transporte cruzando a tabela de transportes com
        o histórico duas vezes (dois `INNER JOIN`s): uma para pegar o momento
        de início ('Processando') e outra para o fim ('Entregue'). Na sequência,
        uma série de `INNER JOIN`s liga esse transporte aos lotes, aos itens
        dentro do lote e aos produtos para descobrir qual foi o tipo de produto
        entregue, além de buscar o nome da empresa destinatária. Com essa base
        pronta, agrupamos os dados para tirar a média de tempo de cada empresa,
        filtrando apenas aquelas que têm pelo menos 3 entregas. Por fim,
        comparamos o tempo de cada empresa com a média geral do seu tipo de
        produto, gerando um ranking e uma classificação (Excelente, Dentro da
        média ou Acima da média), ordenando o pódio das mais eficientes.
        """
        with self._pegar_cursor() as cursor:
            cursor.execute("""
                WITH transporte_completo AS (
                    SELECT
                        t.destinatario AS cnpj_destino,
                        p.tipo AS tipo_produto,
                        h_fim.dataHora - h_inicio.dataHora AS tempo_ciclo,
                        e.nome AS nome_empresa
                    FROM transporte AS t
                    INNER JOIN historico AS h_inicio
                        ON t.codEnvio = h_inicio.codEnvio AND h_inicio.status = 'Processando'
                    INNER JOIN historico AS h_fim
                        ON t.codEnvio = h_fim.codEnvio AND h_fim.status = 'Entregue'
                    INNER JOIN lote AS l ON t.lote = l.nroSerie
                    INNER JOIN dentroLote AS dl ON l.nroSerie = dl.nroSerie
                    INNER JOIN produto AS p ON dl.produto = p.nroControle
                    INNER JOIN empresas AS e ON t.destinatario = e.cnpj
                ),
                metricas_por_empresa_tipo AS (
                    SELECT
                        cnpj_destino,
                        nome_empresa,
                        tipo_produto,
                        AVG(tempo_ciclo) AS tempo_medio,
                        COUNT(*) AS total_transportes,
                        MIN(tempo_ciclo) AS melhor_tempo,
                        MAX(tempo_ciclo) AS pior_tempo
                    FROM transporte_completo
                    GROUP BY cnpj_destino, nome_empresa, tipo_produto
                    HAVING COUNT(*) >= 3
                ),
                ranking AS (
                    SELECT
                        *,
                        ROW_NUMBER() OVER (
                            PARTITION BY tipo_produto ORDER BY tempo_medio ASC
                        ) AS rank_eficiencia,
                        AVG(tempo_medio) OVER (PARTITION BY tipo_produto) AS media_tipo,
                        CASE
                            WHEN tempo_medio <= AVG(tempo_medio) OVER (PARTITION BY tipo_produto) * 0.8
                                THEN 'Excelente'
                            WHEN tempo_medio <= AVG(tempo_medio) OVER (PARTITION BY tipo_produto) * 1.2
                                THEN 'Dentro da média'
                            ELSE 'Acima da média'
                        END AS classificacao
                    FROM metricas_por_empresa_tipo
                )
                SELECT
                    tipo_produto,
                    nome_empresa,
                    tempo_medio,
                    total_transportes,
                    rank_eficiencia,
                    classificacao,
                    ROUND(EXTRACT(EPOCH FROM tempo_medio)/3600, 2) AS tempo_medio_horas
                FROM ranking
                WHERE rank_eficiencia <= 5
                ORDER BY tipo_produto, rank_eficiencia;
            """)
            return cursor.fetchall()
            
# Queries para resgate de créditos ─────────────────────────

    def cidadao_por_cpf(self, cpf: str):
        """Busca os dados e saldo atual do cidadão."""
        with self._pegar_cursor() as cur:
            cur.execute("SELECT cpf, nome, creditos FROM pessoa WHERE cpf = %s", (cpf,))
            return cur.fetchone()

    def listar_estoque_resgate(self):
        """Lista opções de resgate que possuem quantidade > 0."""
        with self._pegar_cursor() as cur:
            cur.execute("""
                SELECT e.cnpj, emp.nome, e.tipo, e.valor, e.quantidade 
                FROM estoque e
                INNER JOIN empresas emp ON e.cnpj = emp.cnpj
                WHERE e.quantidade > 0
            """)
            return cur.fetchall()

    def executar_resgate_transacao(self, cpf: str, cnpj: str, tipo_estoque: str):
        """Transação ACID blindada para resgate de créditos."""
        with self._pegar_cursor() as cur:
            with cur.connection.transaction():

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
