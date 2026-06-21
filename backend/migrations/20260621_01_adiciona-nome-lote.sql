-- Adiciona coluna nome na tabela lote
-- depends: 20260610_14_WJFqc-init-historico

ALTER TABLE lote ADD COLUMN IF NOT EXISTS nome VARCHAR;