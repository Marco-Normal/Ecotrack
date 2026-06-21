INSERT INTO pessoa (cpf, nome, creditos) VALUES
('123.456.789-00', 'João Silva',   150),
('987.654.321-00', 'Maria Souza',  200),
('456.789.123-00', 'Carlos Pereira', 100)
ON CONFLICT DO NOTHING;
