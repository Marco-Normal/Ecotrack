-- Init Estoque
-- depends: 20260610_03_0QcpU-init-centros
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
