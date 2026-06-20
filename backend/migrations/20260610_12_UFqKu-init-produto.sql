-- Init Produto
-- depends: 20260610_11_gcxe4-init-dentrolote
CREATE TABLE IF NOT EXISTS produto(
       nroControle UUID NOT NULL DEFAULT gen_random_uuid(),
       centroColeta CHAR(14) NOT NULL,
       dataHora TIMESTAMP NOT NULL  DEFAULT NOW(),
       tipo tipo NOT NULL,
       pessoa CHAR(14) NOT NULL,
       qtd INT NOT NULL,
       CONSTRAINT produto_pk PRIMARY KEY(nroControle),
       CONSTRAINT cc_produto_fk
           FOREIGN KEY(centroColeta)
           REFERENCES centroColeta(cnpj),
       CONSTRAINT pess_produto_fk
           FOREIGN KEY(pessoa)
           REFERENCES pessoa(cpf)
)
