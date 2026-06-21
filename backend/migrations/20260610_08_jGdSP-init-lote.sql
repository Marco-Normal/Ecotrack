-- Init Lote
-- depends: 20260610_07_EUMIW-init-telefone
CREATE TABLE IF NOT EXISTS lote(
       nroSerie UUID DEFAULT gen_random_uuid(),
       codigoEnvio UUID NOT NULL,
       tipo VARCHAR NOT NULL,
       CONSTRAINT lote_fk PRIMARY KEY(nroSerie, codigoEnvio)
);
