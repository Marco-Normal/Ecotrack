-- Init Telefone
-- depends: 20260610_06_fN0Iw-init-recompensa
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
