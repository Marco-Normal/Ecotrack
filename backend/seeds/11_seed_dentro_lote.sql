INSERT INTO dentroLote (produto, nroSerie)
SELECT p.nroControle, l.nroSerie
FROM produto p
JOIN lote l ON l.tipo::tipo = p.tipo
WHERE p.qtd IN (5, 2, 10)
ON CONFLICT DO NOTHING;
