-- Init DentroLote
-- depends: 20260610_10_ENDyo-adiciona-fk-lote
CREATE TABLE IF NOT EXISTS dentroLote(
       produto UUID NOT NULL,
       nroSerie UUID NOT NULL,
       codEnvio UUID NOT NULL,
       CONSTRAINT dentroLote_fk PRIMARY KEY(produto, nroSerie, codEnvio)
);
