INSERT INTO produto (centroColeta, tipo, pessoa, qtd, nome) VALUES
('22333444000192', 'Orgânico',    '123.456.789-00', 5,  'Restos de Alimentos'),
('33444555000103', 'Tecnologia',  '987.654.321-00', 2,  'Notebook Velho'),
('11222333000181', 'Reciclavel',  '456.789.123-00', 10, 'Garrafas PET'),
('22333444000192', 'Orgânico',    '123.456.789-00', 3,  'Cascas de Frutas'),
('33444555000103', 'Tecnologia',  '987.654.321-00', 1,  'Monitor Quebrado'),
('11222333000181', 'Reciclavel',  '123.456.789-00', 8,  'Jornais Velhos')
ON CONFLICT DO NOTHING;
