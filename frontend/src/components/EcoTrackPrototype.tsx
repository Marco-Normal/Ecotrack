import React, { useState, FormEvent } from 'react';

// --- INTERFACES (TIPAGENS) ---
interface Lote {
  nroSerie: string;
  tipo: string;
  dataHora: string;
}

interface Transporte {
  codEnvio: string;
  remetente: string;
  destinatario: string;
  lote: string;
}

interface Mensagem {
  texto: string;
  tipo: 'sucesso' | 'erro' | '';
}

interface ResultadoConsulta {
  erro?: string;
  lote?: Lote;
  transportes?: Transporte[];
}

export default function EcoTrackPrototype() {
  // Simulação das tabelas do Banco de Dados
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [transportes, setTransportes] = useState<Transporte[]>([]);

  // Estados para os formulários
  const [abaAtiva, setAbaAtiva] = useState<string>('cadastroLote');
  const [mensagem, setMensagem] = useState<Mensagem>({ texto: '', tipo: '' });

  // Campos de Cadastro de Lote
  const [nroSerie, setNroSerie] = useState<string>('');
  const [tipoLote, setTipoLote] = useState<string>('Reciclável');

  // Campos de Cadastro de Transporte
  const [codEnvio, setCodEnvio] = useState<string>('');
  const [remetente, setRemetente] = useState<string>('');
  const [destinatario, setDestinatario] = useState<string>('');
  const [loteSelecionado, setLoteSelecionado] = useState<string>('');

  // Campos de Consulta
  const [buscaNroSerie, setBuscaNroSerie] = useState<string>('');
  const [resultadoConsulta, setResultadoConsulta] = useState<ResultadoConsulta | null>(null);

  // Exibe mensagens de erro ou sucesso
  const mostrarMensagem = (texto: string, tipo: 'sucesso' | 'erro') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem({ texto: '', tipo: '' }), 4000);
  };

  // --- FUNÇÕES DE CADASTRO ---
  const handleCadastrarLote = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (lotes.some(l => l.nroSerie === nroSerie)) {
      mostrarMensagem('Erro: Já existe um Lote cadastrado com este Número de Série.', 'erro');
      return;
    }

    const novoLote: Lote = {
      nroSerie,
      tipo: tipoLote,
      dataHora: new Date().toLocaleString()
    };

    setLotes([...lotes, novoLote]);
    mostrarMensagem(`Lote ${nroSerie} cadastrado com sucesso!`, 'sucesso');
    setNroSerie('');
  };

  const handleCadastrarTransporte = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Tratamento de erro: Empresa não pode enviar para si mesma
    if (remetente === destinatario) {
      mostrarMensagem('Erro: O Centro Remetente não pode ser o mesmo que o Destinatário.', 'erro');
      return;
    }

    if (transportes.some(t => t.codEnvio === codEnvio)) {
      mostrarMensagem('Erro: Já existe um transporte com este Código de Envio.', 'erro');
      return;
    }

    const novoTransporte: Transporte = {
      codEnvio,
      remetente,
      destinatario,
      lote: loteSelecionado
    };

    setTransportes([...transportes, novoTransporte]);
    mostrarMensagem(`Transporte ${codEnvio} cadastrado com sucesso!`, 'sucesso');
    setCodEnvio('');
    setRemetente('');
    setDestinatario('');
  };

  // --- FUNÇÃO DE CONSULTA ---
  const handleConsultar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const loteEncontrado = lotes.find(l => l.nroSerie === buscaNroSerie);
    
    if (!loteEncontrado) {
      setResultadoConsulta({ erro: 'Nenhum lote encontrado com este número de série.' });
      return;
    }

    const transportesDoLote = transportes.filter(t => t.lote === buscaNroSerie);
    
    setResultadoConsulta({
      lote: loteEncontrado,
      transportes: transportesDoLote
    });
  };

  // --- ESTILIZAÇÃO BÁSICA ---
  const estilos = {
    container: { fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' } as React.CSSProperties,
    menu: { display: 'flex', gap: '10px', marginBottom: '20px' } as React.CSSProperties,
    botaoMenu: (ativo: boolean): React.CSSProperties => ({ padding: '10px', cursor: 'pointer', backgroundColor: ativo ? '#2E7D32' : '#e0e0e0', color: ativo ? 'white' : 'black', border: 'none', borderRadius: '4px' }),
    form: { display: 'flex', flexDirection: 'column', gap: '15px' } as React.CSSProperties,
    input: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' } as React.CSSProperties,
    botaoSubmit: { padding: '10px', backgroundColor: '#1565C0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' } as React.CSSProperties,
    mensagem: (tipo: 'sucesso' | 'erro' | ''): React.CSSProperties => ({ padding: '10px', borderRadius: '4px', backgroundColor: tipo === 'erro' ? '#FFCDD2' : '#C8E6C9', color: tipo === 'erro' ? '#B71C1C' : '#1B5E20', marginBottom: '15px' }),
    cardConsulta: { backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px', marginTop: '15px' } as React.CSSProperties
  };

  return (
    <div style={estilos.container}>
      <h2>🌱 EcoTrack - Sistema de Gestão</h2>
      
      {mensagem.texto && (
        <div style={estilos.mensagem(mensagem.tipo)}>
          {mensagem.texto}
        </div>
      )}

      <div style={estilos.menu}>
        <button style={estilos.botaoMenu(abaAtiva === 'cadastroLote')} onClick={() => setAbaAtiva('cadastroLote')}>Novo Lote</button>
        <button style={estilos.botaoMenu(abaAtiva === 'cadastroTransporte')} onClick={() => setAbaAtiva('cadastroTransporte')}>Novo Transporte</button>
        <button style={estilos.botaoMenu(abaAtiva === 'consulta')} onClick={() => setAbaAtiva('consulta')}>Consultar Rastreio</button>
      </div>

      {/* --- ABA 1: CADASTRO DE LOTE --- */}
      {abaAtiva === 'cadastroLote' && (
        <form style={estilos.form} onSubmit={handleCadastrarLote}>
          <h3>Cadastrar Novo Lote de Resíduos</h3>
          <label>
            Número de Série do Lote:
            <input required style={estilos.input} type="text" value={nroSerie} onChange={(e) => setNroSerie(e.target.value)} placeholder="Ex: LOTE-001" />
          </label>
          <label>
            Tipo de Material:
            <select style={estilos.input} value={tipoLote} onChange={(e) => setTipoLote(e.target.value)}>
              <option value="Reciclável">Reciclável</option>
              <option value="Orgânico">Orgânico</option>
              <option value="Tecnologia">Tecnologia</option>
            </select>
          </label>
          <button style={estilos.botaoSubmit} type="submit">Registrar Lote no Sistema</button>
        </form>
      )}

      {/* --- ABA 2: CADASTRO DE TRANSPORTE --- */}
      {abaAtiva === 'cadastroTransporte' && (
        <form style={estilos.form} onSubmit={handleCadastrarTransporte}>
          <h3>Registrar Transporte de Lote</h3>
          <label>
            Código do Envio:
            <input required style={estilos.input} type="text" value={codEnvio} onChange={(e) => setCodEnvio(e.target.value)} placeholder="Ex: ENVIO-102" />
          </label>
          <label>
            Lote a ser transportado:
            <select required style={estilos.input} value={loteSelecionado} onChange={(e) => setLoteSelecionado(e.target.value)}>
              <option value="">-- Selecione um lote --</option>
              {lotes.map(l => (
                <option key={l.nroSerie} value={l.nroSerie}>{l.nroSerie} ({l.tipo})</option>
              ))}
            </select>
          </label>
          <label>
            CNPJ do Remetente (Origem):
            <input required style={estilos.input} type="text" value={remetente} onChange={(e) => setRemetente(e.target.value)} placeholder="Apenas números" />
          </label>
          <label>
            CNPJ do Destinatário (Destino):
            <input required style={estilos.input} type="text" value={destinatario} onChange={(e) => setDestinatario(e.target.value)} placeholder="Apenas números" />
          </label>
          <button style={estilos.botaoSubmit} type="submit">Iniciar Transporte</button>
        </form>
      )}

      {/* --- ABA 3: CONSULTA PARAMETRIZADA --- */}
      {abaAtiva === 'consulta' && (
        <div style={estilos.form}>
          <h3>Rastrear Histórico de um Lote</h3>
          <p style={{fontSize: '14px', color: '#666'}}>Digite o número de série para visualizar o tipo de material e por onde este lote já passou.</p>
          <form style={{display: 'flex', gap: '10px'}} onSubmit={handleConsultar}>
            <input required style={{...estilos.input, flex: 1}} type="text" value={buscaNroSerie} onChange={(e) => setBuscaNroSerie(e.target.value)} placeholder="Digite o Número de Série (Ex: LOTE-001)" />
            <button style={estilos.botaoSubmit} type="submit">Buscar</button>
          </form>

          {resultadoConsulta && (
            <div style={estilos.cardConsulta}>
              {resultadoConsulta.erro ? (
                <p style={{color: '#B71C1C'}}><strong>Aviso:</strong> {resultadoConsulta.erro}</p>
              ) : (
                <>
                  <h4>Detalhes do Lote: {resultadoConsulta.lote?.nroSerie}</h4>
                  <p><strong>Tipo:</strong> {resultadoConsulta.lote?.tipo}</p>
                  <p><strong>Criado em:</strong> {resultadoConsulta.lote?.dataHora}</p>
                  
                  <h4 style={{marginTop: '15px'}}>Histórico de Movimentações:</h4>
                  {resultadoConsulta.transportes?.length === 0 ? (
                    <p>Este lote ainda não foi transportado.</p>
                  ) : (
                    <ul style={{paddingLeft: '20px'}}>
                      {resultadoConsulta.transportes?.map((t, index) => (
                        <li key={index} style={{marginBottom: '10px'}}>
                          <strong>Código:</strong> {t.codEnvio} <br/>
                          <strong>De:</strong> {t.remetente} <strong>Para:</strong> {t.destinatario}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}