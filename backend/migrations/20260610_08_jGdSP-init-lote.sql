-- Init Lote
-- depends: 20260610_07_EUMIW-init-telefone
CREATE TABLE IF NOT EXISTS lote(
       nroSerie UUID DEFAULT gen_random_uuid(),
       tipo VARCHAR NOT NULL,
       dataHora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       CONSTRAINT lote_pk PRIMARY KEY(nroSerie)
);
