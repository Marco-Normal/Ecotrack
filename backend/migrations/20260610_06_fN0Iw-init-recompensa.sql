-- Init Recompensa
-- depends: 20260610_05_uG8Xf-init-pessoa

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
           ON DELETE SET NULL
           ON UPDATE CASCADE,
       CONSTRAINT rec_estoque_fk
           FOREIGN KEY(tipo, cnpj)
           REFERENCES estoque(tipo, cnpj)
           ON DELETE CASCADE
           ON UPDATE CASCADE
)