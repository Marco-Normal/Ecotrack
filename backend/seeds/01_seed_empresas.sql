INSERT INTO empresas (cnpj, nome, rua, numero, cep, bairro, tipo) VALUES
('11222333000181', 'EcoRecicla Ltda',         'Rua da Reciclagem',  100, '01001000', 'Centro',   'Reciclavel'),
('22333444000192', 'Coleta Fácil Ltda',       'Av. Orgânica',      200, '02002000', 'Jardins',  'Orgânico'),
('33444555000103', 'TechRecicla S.A.',         'Rua Tecnológica',   300, '03003000', 'Vila Nova','Tecnologia')
ON CONFLICT DO NOTHING;
