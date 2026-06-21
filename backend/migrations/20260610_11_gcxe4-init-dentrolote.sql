-- Init DentroLote
-- depends: 20260610_10_ENDyo-adiciona-fk-lote
CREATE TABLE IF NOT EXISTS dentroLote(
       produto UUID NOT NULL,
       nroSerie UUID NOT NULL,
       CONSTRAINT dentroLote_fk PRIMARY KEY(produto, nroSerie)
       CONSTRAINT lote_dentroLote_fk
           FOREIGN KEY(nroSerie)
           REFERENCES lote(nroSerie)
           ON DELETE CASCADE
           ON UPDATE CASCADE
);     
