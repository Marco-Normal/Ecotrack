-- Adiciona fk DentroLote
-- depends: 20260610_12_UFqKu-init-produto
ALTER TABLE dentroLote
ADD CONSTRAINT prod_dentroLote_fk
FOREIGN KEY(produto)
REFERENCES produto(nroControle);