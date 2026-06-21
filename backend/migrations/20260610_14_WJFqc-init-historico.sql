-- Init Historico
-- depends: 20260610_13_MXw0l-adiciona-fk-dentrolote

CREATE TABLE IF NOT EXISTS historico(
       codEnvio UUID NOT NULL,
       status VARCHAR CHECK (status IN ('Processando', 'Enviado', 'Em transporte', 'Entregue', 'Cancelado')),
       dataHora TIMESTAMP NOT NULL DEFAULT NOW(),
       CONSTRAINT historico_pk PRIMARY KEY (codEnvio, status),
       CONSTRAINT tran_historico_fk
           FOREIGN KEY (codEnvio)
           REFERENCES transporte(codEnvio)
           ON DELETE RESTRICT
           ON UPDATE CASCADE
);