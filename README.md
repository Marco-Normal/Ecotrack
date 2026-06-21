# Como Executar o Projeto

## Frontend

Antes de iniciar, certifique-se de ter instalado em sua máquina:

- **Node.js** (versão 18 ou superior recomendada)
- Um gerenciador de pacotes como **npm** ou **yarn**

### Acessar a pasta do projeto

```bash
cd frontend
```

### Instalar as dependências necessárias

Usando **npm**:

```bash
npm install
```

Ou usando **yarn**:

```bash
yarn install
```

### Iniciar o ambiente de desenvolvimento

```bash
npm run dev
```
## Backend
#### IMPORTANTE!!
Essa é a versão inicial onde ainda _não corrigimos_ a segunda parte do relatório, portanto, provavelmente os arquivos `.sql` serão modificados.

Não tem problema, nesse caso o _commit_ do arquivo `.env` pois não será uma base que irá para produção e não contém nenhum segredo, além do que, facilita a integração. Porém, fica avisado que você *nunca deveria commitar o `.env`*

### QUICKSTART
```bash
cd backend
```
#### Python
Para começar a codar no python, crie um venv

```bash
python -m venv .venv
```
Inicie, então o ambiente

```bash
source .venv/bin/activate
```
Caso esse comando não de certo, o google é seu amigo

Instale o uv

```
pip install uv
```

Sincronize os pacotes

```
uv sync
```
Parabéns.

#### Docker
Tenha docker compose no seu computador e rode o comando

```bash
docker compose up -d
```
Se tudo der certo, a base de dados vai estar rodando no seu pc e você consegue acessar ela pela porta `5432`.
Se quiser conectar no dbeaver, coloque na conexão:

- Host: localhost
- Database: ecotrack
- Port: 5432
- Username: APP_USER
- PASSWORD: a_senha_super_secreta.

Recomendo fazer as migrações antes, por que se não o usuário `APP_USER` ainda não vai existir.

#### Migrações 
Tenha certeza que você tem o comando `yoyo` no seu pc. Ele vem automático se você fez o `uv sync`.
Rode o comando 
```bash
yoyo apply
```
Se você quiser ser realmente radical, pode usar

```bash
yoyo apply --batch
```

