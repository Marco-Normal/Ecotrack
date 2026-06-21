INSERT INTO estoque (cnpj, tipo, valor, quantidade) VALUES
('11222333000181', 'Reciclavel',  100.00, 1000),
('22333444000192', 'Orgânico',    50.00,  500),
('33444555000103', 'Tecnologia',  200.00, 300)
ON CONFLICT DO NOTHING;
