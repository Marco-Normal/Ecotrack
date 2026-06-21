import psycopg
import uuid


class PgPool:
    def __init__(self, user: str, password: str, dbname="ecotrack"):
        self.dbname = dbname
        self.user = user
        self.password = password

    def _pegar_cursor(self):
        with psycopg.connect(
            f"dbname={self.dbname} user={self.user} password={self.password}"
        ) as conn:
            return conn.cursor()

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
                INNER JOIN transporte AS t
                ON e.cnpj = t.remetente
                -- Descobre o início do transporte
                INNER JOIN historico AS h_inicio
                ON t.codEnvio = h_inicio.codEnvio AND h_inicio.status = 'Processando'
                -- Descobre o fim do transporte
                INNER JOIN historico AS h_fim
                ON t.codEnvio = h_fim.codEnvio AND h_fim.status = 'Entregue'
                GROUP BY e.cnpj, e.nome
                -- Filtra apenas as empresas cuja média seja maior que a média geral
                HAVING AVG(h_fim.dataHora - h_inicio.dataHora) > (
                SELECT AVG(h_f.dataHora - h_i.dataHora)
                FROM historico AS h_i
                INNER JOIN historico AS  h_f ON h_i.codEnvio = h_f.codEnvio
                WHERE h_i.status = 'Processando' AND h_f.status = 'Entregue'
                );
                    """)
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
                    SELECT p.nome AS nome_cidadao, prod.tipo AS tipo_produto, prod.qtd AS quantidade, emp_destino.nome AS empresa_destino, h.dataHora AS horario_entrega
                    FROM pessoa AS p
                    INNER JOIN produto AS prod
                    ON p.cpf = prod.pessoa
                    INNER JOIN dentroLote AS dl
                    ON prod.nroControle = dl.produto
                    INNER JOIN lote AS l
                    ON dl.nroSerie = l.nroSerie AND dl.codEnvio = l.codigoEnvio
                    INNER JOIN transporte AS t
                    ON l.codigoEnvio = t.codEnvio
                    INNER JOIN empresas AS emp_destino
                    ON t.destinatario = emp_destino.cnpj
                    INNER JOIN historico AS h
                    ON t.codEnvio = h.codEnvio
                    WHERE prod.nroControle = %s
                    ORDER BY h.dataHora DESC;
                    """,
                (produto,),
            )
            return cursor.fetchall()

    def desempenho_recompensa(self):
        """Essa query tem a função de fazer uma pequena sumarização
        para as empresas de reciclavel e tecnologia (esses tipos foram
        escolhidos arbitrariamente), mostrando o nome da empresa, seus
        estoques e quantas vezes cada tipo de produtos que eles
        possuem foram resgatados. Dessa forma, a empresa pode, por
        exemplo identificar produtos com maior demanda e aumentar sua
        quantidade, ou retirar produtos com menor demanda.

        A query funciona encontrando todos os estoques de uma
        determinada empresa (primeiro INNER JOIN) e então fazer uma
        junção externa a esquerda, de forma a preservar todas as
        tuplas da junção anterior.  Isso é necessário, pois pode
        ocorrer de existir um tipo de produto no estoque que não foi
        resgatado, aparecendo então com nulo na parte de recompensa e
        consequentemente, o COUNT irá acusar 0 linhas, corretamente.
        A partir disso, agrupamos por empresa, tipo de recompensa no
        estoque e seu valor e ordenamos pelas mais resgatadas
        primeiro.

        """
        with self._pegar_cursor() as cursor:
            cursor.execute("""
                    SELECT e.nome AS nome_empresa, est.tipo AS tipo_recompensa, est.valor AS custo_creditos, COUNT(r.id) AS total_vezes_resgatada
                    FROM empresas AS e
                    INNER JOIN estoque AS est
                    ON e.cnpj = est.cnpj
                    LEFT JOIN recompensa AS r
                    ON est.cnpj = r.cnpj AND est.tipo = r.tipo
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
        A busca é restrita às empresas dos tipos 'Reciclavel', 'Tecnologia' 
        ou 'Coleta'.

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
                WHERE e.tipo IN ('Reciclavel', 'Tecnologia', 'Coleta')
                -- Divisão: NÃO EXISTE tipo no estoque SEM transporte entregue
                AND NOT EXISTS (
                    SELECT 1
                    FROM estoque AS est
                    WHERE est.cnpj = e.cnpj
                    -- Para este tipo, não há transporte entregue
                    AND NOT EXISTS (
                        SELECT 1
                        FROM transporte AS t
                        INNER JOIN historico AS h ON t.codEnvio = h.codEnvio
                        INNER JOIN lote AS l ON t.codEnvio = l.codigoEnvio
                        INNER JOIN dentroLote AS dl ON l.nroSerie = dl.nroSerie AND l.codigoEnvio = dl.codEnvio
                        INNER JOIN produto AS p ON dl.produto = p.nroControle
                        WHERE t.destinatario = e.cnpj
                        AND h.status = 'Entregue'
                        AND p.tipo = est.tipo
                    )
                )
                ORDER BY e.nome;
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
                    -- Base: transportes finalizados com tempo de ciclo
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
                    INNER JOIN lote AS l ON t.codEnvio = l.codigoEnvio
                    INNER JOIN dentroLote AS dl ON l.nroSerie = dl.nroSerie AND l.codigoEnvio = dl.codEnvio
                    INNER JOIN produto AS p ON dl.produto = p.nroControle
                    INNER JOIN empresas AS e ON t.destinatario = e.cnpj
                ),
                metricas_por_empresa_tipo AS (
                    -- Agregação por empresa e tipo
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
                    HAVING COUNT(*) >= 3  -- Mínimo 3 transportes para significância
                ),
                ranking AS (
                    -- Window function: rank por tipo de produto
                    SELECT 
                        *,
                        ROW_NUMBER() OVER (PARTITION BY tipo_produto ORDER BY tempo_medio ASC) AS rank_eficiencia,
                        AVG(tempo_medio) OVER (PARTITION BY tipo_produto) AS media_tipo,
                        CASE 
                            WHEN tempo_medio <= AVG(tempo_medio) OVER (PARTITION BY tipo_produto) * 0.8 THEN 'Excelente'
                            WHEN tempo_medio <= AVG(tempo_medio) OVER (PARTITION BY tipo_produto) * 1.2 THEN 'Dentro da média'
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
                WHERE rank_eficiencia <= 5  -- Top 5 por tipo
                ORDER BY tipo_produto, rank_eficiencia;
            """)
            return cursor.fetchall()