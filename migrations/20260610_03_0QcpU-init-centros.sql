-- Init Centros
-- depends: 20260610_02_nPRO6-init-tabela-empresa
CREATE TABLE IF NOT EXISTS centroReciclagem (
       cnpj CHAR(14) NOT NULL,
       tipo tipo NOT NULL,
       CONSTRAINT centroReciclagem_fk PRIMARY KEY(cnpj),
       CONSTRAINT cr_empresas_fk
          FOREIGN KEY(cnpj)
          REFERENCES empresas(cnpj)
);

CREATE TABLE IF NOT EXISTS centroColeta (
       cnpj CHAR(14) NOT NULL,
       CONSTRAINT centroColeta_fk PRIMARY KEY(cnpj),
       CONSTRAINT cc_empresas_fk
          FOREIGN KEY(cnpj)
          REFERENCES empresas(cnpj)
);
