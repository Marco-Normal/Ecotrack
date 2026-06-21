INSERT INTO historico (codEnvio, status) VALUES
((SELECT codEnvio FROM transporte LIMIT 1 OFFSET 0), 'Processando'),
((SELECT codEnvio FROM transporte LIMIT 1 OFFSET 1), 'Em transporte'),
((SELECT codEnvio FROM transporte LIMIT 1 OFFSET 2), 'Entregue')
ON CONFLICT DO NOTHING;
