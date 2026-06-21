-- Remove todos os dados (respeitando FK) e reinicia sequências
TRUNCATE TABLE
  historico,
  dentroLote,
  transporte,
  produto,
  lote,
  telefones,
  recompensa,
  pessoa,
  estoque,
  centroColeta,
  centroReciclagem,
  empresas
CASCADE;