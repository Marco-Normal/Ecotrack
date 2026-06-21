// ============================================================================
//  APP ROOT — navegação por abas e composição das features
//
//  Para adicionar uma nova aba:
//    1. Criar o componente em components/features/
//    2. Adicionar uma entrada em TABS
//    3. Renderizá-la no bloco de conteúdo abaixo
// ============================================================================

import React, { useState } from 'react';
import { styles } from './design/tokens';
import {
  IconRecycle,
  IconLayout,
  IconPackage,
  IconTruck,
  IconSearch,
  IconUser,
} from './icons';
import type { IconProps } from './icons';
import { GlobalStyles } from './components/ui';
import Painel             from './components/features/Painel';
import CadastroLote       from './components/features/CadastroLote';
import CadastroTransporte from './components/features/CadastroTransporte';
import ConsultaRastreio   from './components/features/ConsultaRastreio';
import AreaCidadao        from './components/features/AreaCidadao';

// ---------- tipos locais ------------------------------------------------------

type TabId = 'painel' | 'lote' | 'transporte' | 'rastreio' | 'cidadao';

const TABS: { id: TabId; label: string; Icone: React.FC<IconProps> }[] = [
  { id: 'painel',     label: 'Painel',               Icone: IconLayout  },
  { id: 'lote',       label: 'Cadastrar Lote',        Icone: IconPackage },
  { id: 'transporte', label: 'Cadastrar Transporte',  Icone: IconTruck   },
  { id: 'rastreio',   label: 'Rastrear Lote',         Icone: IconSearch  },
  { id: 'cidadao',    label: 'Área do Cidadão',       Icone: IconUser    },
];

// ---------- componente --------------------------------------------------------

const App: React.FC = () => {
  const [tab, setTab] = useState<TabId>('painel');

  return (
    <div className="ecotrack-root" style={styles.root}>
      <GlobalStyles />

      {/* Cabeçalho */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brandRow}>
            <div style={styles.brandMark}>
              <IconRecycle size={22} />
            </div>
            <div>
              <div style={styles.brandTitle}>ECOTRACK</div>
              <div style={styles.brandTag}>rastreamento de descarte sustentável</div>
            </div>
          </div>
        </div>
        <div style={styles.barcodeStripe} aria-hidden="true" />
      </header>

      {/* Navegação por abas */}
      <nav style={styles.tabNav} aria-label="Funcionalidades do sistema">
        <div style={styles.tabNavInner}>
          {TABS.map(({ id, label, Icone }) => {
            const ativo = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className="ecotrack-tab-btn"
                style={{ ...styles.tabButton, ...(ativo ? styles.tabButtonActive : {}) }}
                aria-current={ativo ? 'page' : undefined}
              >
                <Icone size={16} />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Conteúdo da aba ativa */}
      <main style={styles.main}>
        <div style={styles.mainInner}>
          {tab === 'painel'     && <Painel />}
          {tab === 'lote'       && <CadastroLote />}
          {tab === 'transporte' && <CadastroTransporte />}
          {tab === 'rastreio'   && <ConsultaRastreio />}
          {tab === 'cidadao'    && <AreaCidadao />}
        </div>
      </main>
    </div>
  );
};

export default App;