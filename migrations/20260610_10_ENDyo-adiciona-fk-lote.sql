-- Adiciona fk lote
-- depends: 20260610_09_Eng9d-init-transporte

ALTER TABLE LOTE
ADD CONSTRAINT tran_lote_fk
FOREIGN KEY(codigoEnvio)
REFERENCES transporte(codEnvio);