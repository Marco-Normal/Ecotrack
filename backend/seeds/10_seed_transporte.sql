INSERT INTO transporte (nome, destinatario, remetente, lote)
SELECT 'TRANSP-REC-2026-001', e1.cnpj, e2.cnpj, l.nroSerie
FROM lote l
JOIN empresas e1 ON e1.cnpj = '11222333000181'
JOIN empresas e2 ON e2.cnpj = '22333444000192'
WHERE l.tipo = 'Reciclavel'
ON CONFLICT DO NOTHING;

INSERT INTO transporte (nome, destinatario, remetente, lote)
SELECT 'TRANSP-ORG-2026-001', e1.cnpj, e2.cnpj, l.nroSerie
FROM lote l
JOIN empresas e1 ON e1.cnpj = '11222333000181'
JOIN empresas e2 ON e2.cnpj = '33444555000103'
WHERE l.tipo = 'Orgânico'
ON CONFLICT DO NOTHING;

INSERT INTO transporte (nome, destinatario, remetente, lote)
SELECT 'TRANSP-TEC-2026-001', e1.cnpj, e2.cnpj, l.nroSerie
FROM lote l
JOIN empresas e1 ON e1.cnpj = '33444555000103'
JOIN empresas e2 ON e2.cnpj = '22333444000192'
WHERE l.tipo = 'Tecnologia'
ON CONFLICT DO NOTHING;
