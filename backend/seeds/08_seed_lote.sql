INSERT INTO lote (nome, tipo) VALUES
('LOTE-REC-2026-001', 'Reciclavel'),
('LOTE-ORG-2026-001', 'Orgânico'),
('LOTE-TEC-2026-001', 'Tecnologia')
ON CONFLICT DO NOTHING;
