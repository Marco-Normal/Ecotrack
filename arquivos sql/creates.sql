-- Enum tipos
CREATE TYPE tipo AS ENUM ('Orgânico', 'Reciclavel', 'Tecnologia');

-- Init Tabela Empresa
CREATE TABLE IF NOT EXISTS empresas (
       cnpj CHAR(14) NOT NULL,
       nome VARCHAR,
       rua VARCHAR,
       numero INT,
       cep CHAR(8),
       bairro VARCHAR,
       tipo tipo NOT NULL,
       CONSTRAINT empresas_fk PRIMARY KEY(cnpj)
);

-- Init Centros
CREATE TABLE IF NOT EXISTS centroReciclagem (
       cnpj CHAR(14) NOT NULL,
       tipo tipo NOT NULL,
       CONSTRAINT centroReciclagem_fk PRIMARY KEY(cnpj),
       CONSTRAINT cr_empresas_fk
          FOREIGN KEY(cnpj)
          REFERENCES empresas(cnpj)
          ON DELETE CASCADE
          ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS centroColeta (
       cnpj CHAR(14) NOT NULL,
       CONSTRAINT centroColeta_fk PRIMARY KEY(cnpj),
       CONSTRAINT cc_empresas_fk
          FOREIGN KEY(cnpj)
          REFERENCES empresas(cnpj)
          ON DELETE CASCADE
          ON UPDATE CASCADE
);

-- Init Estoque
CREATE TABLE IF NOT EXISTS estoque(
       cnpj CHAR(14) NOT NULL,
       tipo VARCHAR NOT NULL,
       valor DECIMAL(10, 2), 
       quantidade INT,
       CONSTRAINT estoque_pk PRIMARY KEY(cnpj, tipo),
       CONSTRAINT est_empresa_fk
           FOREIGN KEY(cnpj)
           REFERENCES empresas(cnpj)
           ON DELETE CASCADE
           ON UPDATE CASCADE
);

-- Init Pessoa
CREATE TABLE IF NOT EXISTS pessoa(
       cpf CHAR(14) NOT NULL,
       nome VARCHAR,
       creditos INT DEFAULT(0) CHECK(creditos >= 0),
       CONSTRAINT pessoa_pk PRIMARY KEY(cpf)
);

-- Init Recompensa
CREATE TABLE IF NOT EXISTS recompensa(
       id UUID DEFAULT gen_random_uuid(),
       cpf CHAR(14) NOT NULL,
       cnpj CHAR(14) NOT NULL,
       tipo VARCHAR NOT NULL,
       datetime TIMESTAMP DEFAULT NOW(),
       CONSTRAINT recompensa_pk PRIMARY KEY(id),
       CONSTRAINT rec_pessoa_fk
           FOREIGN KEY(cpf)
           REFERENCES pessoa(cpf)
           ON DELETE RESTRICT
           ON UPDATE CASCADE,
       CONSTRAINT rec_estoque_fk
           FOREIGN KEY(tipo, cnpj)
           REFERENCES estoque(tipo, cnpj)
           ON DELETE CASCADE
           ON UPDATE CASCADE
);

-- Init Telefone
CREATE TABLE IF NOT EXISTS telefones(
       cpf CHAR(14) NOT NULL,
       telefone VARCHAR NOT NULL,
       CONSTRAINT telefones_pk PRIMARY KEY(cpf, telefone),
       CONSTRAINT tel_pessoa_fk
           FOREIGN KEY(cpf)
           REFERENCES pessoa(cpf)
           ON DELETE CASCADE
           ON UPDATE CASCADE
);

-- Init Lote
CREATE TABLE IF NOT EXISTS lote(
       nroSerie UUID DEFAULT gen_random_uuid(),
       tipo VARCHAR NOT NULL,
       dataHora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       nome VARCHAR NOT NULL,
       CONSTRAINT lote_pk PRIMARY KEY(nroSerie)
);

-- Init Transporte
CREATE TABLE IF NOT EXISTS transporte(
       codEnvio UUID DEFAULT gen_random_uuid(),
       destinatario CHAR(14), 
       remetente CHAR(14),
       lote UUID NOT NULL, 
       nome VARCHAR NOT NULL,
       CONSTRAINT transporte_fk PRIMARY KEY(codEnvio),
       CONSTRAINT emprDest_tran_fk
           FOREIGN KEY(destinatario)
           REFERENCES empresas(cnpj)
           ON DELETE SET NULL
           ON UPDATE CASCADE,
       CONSTRAINT emprRem_tran_fk
           FOREIGN KEY(remetente)
           REFERENCES empresas(cnpj)
           ON DELETE SET NULL
           ON UPDATE CASCADE,
       CONSTRAINT lote_trans_fk
           FOREIGN KEY(lote)
           REFERENCES lote(nroSerie)
           ON DELETE RESTRICT
           ON UPDATE CASCADE
);

-- Init DentroLote
CREATE TABLE IF NOT EXISTS dentroLote(
       produto UUID NOT NULL,
       nroSerie UUID NOT NULL,
       CONSTRAINT dentroLote_fk PRIMARY KEY(produto, nroSerie),
       CONSTRAINT lote_dentroLote_fk
           FOREIGN KEY(nroSerie)
           REFERENCES lote(nroSerie)
           ON DELETE CASCADE
           ON UPDATE CASCADE
    CONSTRAINT prod_dentroLote_fk
        FOREIGN KEY(produto)
        REFERENCES produto(nroControle)
        ON DELETE CASCADE
        ON UPDATE CASCADE;
);     

-- Init Produto
CREATE TABLE IF NOT EXISTS produto(
       nroControle UUID NOT NULL DEFAULT gen_random_uuid(),
       centroColeta CHAR(14),
       dataHora TIMESTAMP NOT NULL  DEFAULT NOW(),
       tipo tipo NOT NULL,
       pessoa CHAR(14) NOT NULL,
       qtd INT NOT NULL,
       nome VARCHAR NOT NULL, 
       CONSTRAINT produto_pk PRIMARY KEY(nroControle),
       CONSTRAINT cc_produto_fk
           FOREIGN KEY(centroColeta)
           REFERENCES centroColeta(cnpj)
           ON DELETE SET NULL
           ON UPDATE CASCADE,
       CONSTRAINT pess_produto_fk
           FOREIGN KEY(pessoa)
           REFERENCES pessoa(cpf)
           ON DELETE CASCADE
           ON UPDATE CASCADE
)

-- Init Historico
CREATE TABLE IF NOT EXISTS historico(
       codEnvio UUID NOT NULL,
       status VARCHAR CHECK (status IN ('Processando', 'Enviado', 'Em transporte', 'Entregue', 'Cancelado')),
       dataHora TIMESTAMP NOT NULL DEFAULT NOW(),
       CONSTRAINT historico_pk PRIMARY KEY (codEnvio, status),
       CONSTRAINT tran_historico_fk
           FOREIGN KEY (codEnvio)
           REFERENCES transporte(codEnvio)
           ON DELETE RESTRICT
           ON UPDATE CASCADE
);

-- Cria o papel (role) do usuário da aplicação
-- Substitua $APP_USER e $APP_PASSWORD pelos valores do .env
CREATE ROLE "app" WITH LOGIN PASSWORD 'app';

-- Concede permissões DML em todas as tabelas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "app";

-- Concede permissões DML em tabelas futuras
ALTER DEFAULT PRIVILEGES GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "app";

-- Concede uso/select em todas as sequências existentes
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "app";

-- Concede uso/select em sequências futuras
ALTER DEFAULT PRIVILEGES GRANT USAGE, SELECT ON SEQUENCES TO "app";

-- Revoga a opção de repasse de grants em todas as tabelas existentes
REVOKE GRANT OPTION FOR ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM "app";

-- Revoga a opção de repasse de grants em tabelas futuras
ALTER DEFAULT PRIVILEGES REVOKE GRANT OPTION FOR ALL PRIVILEGES ON TABLES FROM "app";

