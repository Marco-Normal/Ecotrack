-- Insert Empresas
INSERT INTO empresas (cnpj, nome, rua, numero, cep, bairro, tipo) VALUES
('11222333000181', 'EcoRecicla Ltda',         'Rua da Reciclagem',  100, '01001000', 'Centro',   'Reciclavel'),
('22333444000192', 'Coleta Fácil Ltda',       'Av. Orgânica',      200, '02002000', 'Jardins',  'Orgânico'),
('33444555000103', 'TechRecicla S.A.',         'Rua Tecnológica',   300, '03003000', 'Vila Nova','Tecnologia')
ON CONFLICT DO NOTHING;

-- Insert Centro de Reciclagem
INSERT INTO centroReciclagem (cnpj, tipo) VALUES
('11222333000181', 'Reciclavel')
ON CONFLICT DO NOTHING;

-- Insert Centro de Coleta
INSERT INTO centroColeta (cnpj) VALUES
('11222333000181'),
('22333444000192'),
('33444555000103')
ON CONFLICT DO NOTHING;

-- Insert Estoque
INSERT INTO estoque (cnpj, tipo, valor, quantidade) VALUES
('11222333000181', 'Reciclavel',  100.00, 1000),
('22333444000192', 'Orgânico',    50.00,  500),
('33444555000103', 'Tecnologia',  200.00, 300)
ON CONFLICT DO NOTHING;

-- Insert Pessoa
INSERT INTO pessoa (cpf, nome, creditos) VALUES
('123.456.789-00', 'João Silva',   150),
('987.654.321-00', 'Maria Souza',  200),
('456.789.123-00', 'Carlos Pereira', 100)
ON CONFLICT DO NOTHING;

-- Insert Recompensa
INSERT INTO recompensa (cpf, cnpj, tipo) VALUES
('123.456.789-00', '11222333000181', 'Reciclavel'),
('987.654.321-00', '22333444000192', 'Orgânico'),
('456.789.123-00', '33444555000103', 'Tecnologia')
ON CONFLICT DO NOTHING;

-- Insert Telefones
INSERT INTO telefones (cpf, telefone) VALUES
('123.456.789-00', '(11) 99999-0001'),
('987.654.321-00', '(21) 98888-0002'),
('456.789.123-00', '(31) 97777-0003')
ON CONFLICT DO NOTHING;

-- Insert Lote
INSERT INTO lote (nome, tipo) VALUES
('LOTE-REC-2026-001', 'Reciclavel'),
('LOTE-ORG-2026-001', 'Orgânico'),
('LOTE-TEC-2026-001', 'Tecnologia')
ON CONFLICT DO NOTHING;

-- Insert Produto
INSERT INTO produto (centroColeta, tipo, pessoa, qtd, nome) VALUES
('22333444000192', 'Orgânico',    '123.456.789-00', 5,  'Restos de Alimentos'),
('33444555000103', 'Tecnologia',  '987.654.321-00', 2,  'Notebook Velho'),
('11222333000181', 'Reciclavel',  '456.789.123-00', 10, 'Garrafas PET'),
('22333444000192', 'Orgânico',    '123.456.789-00', 3,  'Cascas de Frutas'),
('33444555000103', 'Tecnologia',  '987.654.321-00', 1,  'Monitor Quebrado'),
('11222333000181', 'Reciclavel',  '123.456.789-00', 8,  'Jornais Velhos')
ON CONFLICT DO NOTHING;

-- Insert Transporte
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

-- Insert DentroLote
INSERT INTO dentroLote (produto, nroSerie)
SELECT p.nroControle, l.nroSerie
FROM produto p
JOIN lote l ON l.tipo::tipo = p.tipo
WHERE p.qtd IN (5, 2, 10)
ON CONFLICT DO NOTHING;

-- Insert Historico
INSERT INTO historico (codEnvio, status) VALUES
((SELECT codEnvio FROM transporte LIMIT 1 OFFSET 0), 'Processando'),
((SELECT codEnvio FROM transporte LIMIT 1 OFFSET 1), 'Em transporte'),
((SELECT codEnvio FROM transporte LIMIT 1 OFFSET 2), 'Entregue')
ON CONFLICT DO NOTHING;
