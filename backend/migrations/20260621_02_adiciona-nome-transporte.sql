-- Adiciona coluna nome na tabela transporte
-- depends: 20260621_01_adiciona-nome-lote

ALTER TABLE transporte ADD COLUMN IF NOT EXISTS nome VARCHAR;