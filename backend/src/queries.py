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
        
    def cidados_acima_media_quantidade(self):
        """Esta query lista cidadãos que reciclam uma quantidade média de produtos 
        maior que a média geral de quantidade por transação. 
        Utiliza agregação, agrupamento e subquery na cláusula HAVING, semelhante 
        à query 'empresas_t_maior_media', mas focada em cidadãos.
        
        Não usa divisão relacional (evita o padrão de dupla negação EXISTS).
        """
        
        with self._pegar_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    p.nome AS nome_cidadao,
                    AVG(prod.qtd) AS media_quantidade_reciclada
                FROM pessoa AS p
                INNER JOIN produto AS prod ON p.cpf = prod.pessoa
                INNER JOIN dentroLote AS dl ON prod.nroControle = dl.produto
                INNER JOIN lote AS l ON dl.nroSerie = l.nroSerie AND dl.codEnvio = l.codigoEnvio
                INNER JOIN transporte AS t ON l.codigoEnvio = t.codEnvio
                INNER JOIN historico AS h ON t.codEnvio = h.codEnvio AND h.status = 'Entregue'
                GROUP BY p.nome
                HAVING AVG(prod.qtd) > (
                    SELECT AVG(qtd) 
                    FROM produto 
                    INNER JOIN dentroLote ON produto.nroControle = dentroLote.produto
                    INNER JOIN lote ON dentroLote.nroSerie = lote.nroSerie AND dentroLote.codEnvio = lote.codigoEnvio
                    INNER JOIN transporte ON lote.codigoEnvio = transporte.codEnvio
                    INNER JOIN historico ON transporte.codEnvio = historico.codEnvio
                    WHERE historico.status = 'Entregue'
                )
                ORDER BY media_quantidade_reciclada DESC;
            """)
            return cursor.fetchall()
    