-- Init Pessoa
-- depends: 20260610_04_MPs7i-init-estoque
CREATE TABLE IF NOT EXISTS pessoa(
       cpf CHAR(14) NOT NULL,
       nome VARCHAR,
       creditos INT DEFAULT(0) CHECK(creditos > 0),
       CONSTRAINT pessoa_pk PRIMARY KEY(cpf)
)
