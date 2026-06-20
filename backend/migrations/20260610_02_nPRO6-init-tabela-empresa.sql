-- Init Tabela Empresa
-- depends: 20260610_01_bV6O1-enum-tipos
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