-- Init Transporte
-- depends: 20260610_08_jGdSP-init-lote
CREATE TABLE IF NOT EXISTS transporte(
       codEnvio UUID DEFAULT gen_random_uuid(),
       destinatario CHAR(14) NOT NULL, 
       remetente CHAR(14) NOT NULL,
       lote UUID NOT NULL, 
       CONSTRAINT transporte_fk PRIMARY KEY(codEnvio),
       CONSTRAINT emprDest_tran_fk
           FOREIGN KEY(destinatario)
           REFERENCES empresas(cnpj),
       CONSTRAINT emprRem_tran_fk
           FOREIGN KEY(remetente)
           REFERENCES empresas(cnpj),
       CONSTRAINT lote_trans_fk
           FOREIGN KEY(lote)
           REFERENCES lote(nroSerie)
);
