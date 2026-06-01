# App Scholar

Aplicativo mobile para gerenciamento de informações acadêmicas, desenvolvido com **React Native + Expo** (frontend) e **Node.js + PostgreSQL** (backend), para a disciplina de **Programação para Dispositivos Móveis I**.

---

## Sobre o projeto

O App Scholar é uma aplicação full-stack que permite autenticação por perfil (admin, professor e aluno), cadastro de entidades acadêmicas e consulta de boletins. O projeto foi desenvolvido em duas etapas:

- **Parte 1 — Interface mobile (P1):** toda a UI/UX com dados simulados (mock).
- **Parte 2 — Integração backend (P2):** API REST com Node.js, autenticação JWT, banco de dados PostgreSQL e integração completa com o frontend.

---

## Tecnologias utilizadas

### Frontend
- React Native 
- Expo 
- TypeScript
- React Navigation (Native Stack)
- Axios 
- Expo Secure Store 

### Backend
- Node.js
- Express
- PostgreSQL
- JSON Web Token
- bcrypt

---

## Estrutura do projeto

```
PDM-I-App-Scholar/
├── backend/
│   ├── controllers/
│   │   ├── authController.js          # Login e geração de token JWT
│   │   ├── alunosController.js        # CRUD de alunos
│   │   ├── professoresController.js   # CRUD de professores
│   │   ├── disciplinasController.js   # CRUD de disciplinas
│   │   ├── notasController.js         # Lançamento e atualização de notas
│   │   └── boletimController.js       # Consulta de boletim por matrícula
│   ├── database/
│   │   ├── db.js                      # Pool de conexões PostgreSQL
│   │   ├── migrate.js                 # Script de criação das tabelas
│   │   ├── schema.sql                 # DDL completo do banco
│   │   └── seed.js                    # Dados iniciais para desenvolvimento
│   ├── middlewares/
│   │   ├── auth.js                    # Verificação do token JWT
│   │   └── autorizar.js               # Controle de acesso por perfil
│   ├── models/
│   │   ├── Aluno.js
│   │   ├── Professor.js
│   │   ├── Disciplina.js
│   │   └── Nota.js
│   ├── routes/
│   │   └── api.js                     # Definição de todas as rotas REST
│   ├── .env.example                   # Modelo de variáveis de ambiente
│   ├── package.json
│   └── server.js                      # Ponto de entrada do servidor
│
└── frontend/
    ├── App.tsx                         # Providers globais (Navigation + Auth)
    ├── app.json                        # Configurações do Expo
    └── src/
        ├── components/
        │   ├── InputField.tsx          # Input reutilizável com label e erro
        │   ├── PrimaryButton.tsx       # Botão reutilizável com estado de loading
        │   └── SelectField.tsx         # Seletor dropdown reutilizável
        ├── contexts/
        │   └── AuthContext.tsx         # Contexto global de autenticação (JWT + SecureStore)
        ├── hooks/
        │   ├── useFormulario.ts        # Hook genérico de formulários com validação
        │   ├── useBoletim.ts           # Hook de carregamento do boletim via API
        │   └── useIBGE.ts             # Hook de consulta de CEP via API ViaCEP/IBGE
        ├── navigation/
        │   └── AppNavigator.tsx        # Controle de rotas (stack autenticado/público)
        ├── screens/
        │   ├── LoginScreen.tsx
        │   ├── DashboardScreen.tsx
        │   ├── CadastroAlunoScreen.tsx
        │   ├── CadastroProfessorScreen.tsx
        │   ├── CadastroDisciplinaScreen.tsx
        │   ├── LancamentoNotasScreen.tsx
        │   └── BoletimScreen.tsx
        ├── services/
        │   ├── api.ts                  # Instância axios com interceptors de JWT
        │   ├── cadastroService.ts      # Chamadas REST de cadastro
        │   ├── notasService.ts         # Chamadas REST de notas
        │   └── boletimService.ts       # Chamada REST do boletim
        └── styles/
            └── theme.ts               # Paleta de cores, espaçamentos e tipografia
```

---

## Banco de dados

O banco é PostgreSQL com as seguintes tabelas:

- **usuarios** — credenciais e perfil de acesso (`aluno`, `professor`, `admin`)
- **alunos** — dados pessoais e endereço; suporta soft delete (`deleted_at`)
- **professores** — dados acadêmicos; suporta soft delete
- **disciplinas** — vinculadas ao professor responsável; suporta soft delete
- **notas** — uma linha por combinação aluno+disciplina; `media` e `situacao` são colunas geradas automaticamente pelo PostgreSQL

### Regras de negócio no banco
- `media = ROUND((nota1 + nota2) / 2.0, 1)` — calculada pelo PostgreSQL (`GENERATED ALWAYS AS ... STORED`)
- `situacao`: `Aprovado` (média ≥ 6), `Exame` (média ≥ 5), `Reprovado` (média < 5)
- Índices parciais em `deleted_at IS NULL` garantem performance nas consultas de registros ativos

---

## API REST

Todas as rotas ficam sob o prefixo `/api`. Rotas protegidas exigem o header:

```
Authorization: Bearer <token>
```

| Método | Rota | Perfis permitidos | Descrição |
|--------|------|-------------------|-----------|
| `POST` | `/api/login` | público | Autentica e retorna o token JWT |
| `POST` | `/api/alunos` | admin | Cadastra aluno |
| `GET` | `/api/alunos` | admin, professor, aluno | Lista alunos |
| `PUT` | `/api/alunos/:id` | admin, aluno | Atualiza aluno |
| `DELETE` | `/api/alunos/:id` | admin | Remove aluno (soft delete) |
| `POST` | `/api/professores` | admin | Cadastra professor |
| `GET` | `/api/professores` | admin, professor | Lista professores |
| `PUT` | `/api/professores/:id` | admin, professor | Atualiza professor |
| `DELETE` | `/api/professores/:id` | admin | Remove professor (soft delete) |
| `POST` | `/api/disciplinas` | admin | Cadastra disciplina |
| `GET` | `/api/disciplinas` | admin, professor | Lista disciplinas |
| `PUT` | `/api/disciplinas/:id` | admin | Atualiza disciplina |
| `DELETE` | `/api/disciplinas/:id` | admin | Remove disciplina (soft delete) |
| `GET` | `/api/notas/disciplina/:disciplinaId` | admin, professor | Lista notas por disciplina |
| `PUT` | `/api/notas` | admin, professor | Lança ou atualiza nota |
| `GET` | `/api/boletim/:matricula` | admin, professor, aluno | Retorna boletim por matrícula |

> **Nota de controle de acesso:** professores visualizam apenas suas próprias disciplinas; alunos consultam apenas o próprio boletim. Esses filtros são aplicados nos controllers.

---

## Telas implementadas

### 1. Login
- Autenticação real contra a API REST com retorno de token JWT
- Token persistido no `expo-secure-store` para sessão entre aberturas do app
- Validação de campos obrigatórios com mensagens de erro inline
- Spinner de carregamento durante a requisição

### 2. Dashboard
- Cards de navegação para as cinco áreas do sistema
- Exibe o nome do usuário autenticado
- Botão de logout que limpa o token do SecureStore

### 3. Cadastro de Alunos
- Campos: nome, matrícula, curso, e-mail, telefone, CEP, endereço, cidade e estado
- Preenchimento automático de endereço via consulta de CEP (API ViaCEP)
- Validação completa antes do envio; dados persistidos no PostgreSQL via API

### 4. Cadastro de Professores
- Campos: nome, titulação, área de atuação, tempo de docência e e-mail
- Validação completa com mensagens de erro por campo; dados persistidos via API

### 5. Cadastro de Disciplinas
- Campos: nome, carga horária, professor responsável (seletor dinâmico), curso e semestre
- Lista de professores carregada dinamicamente da API
- Validação completa; dados persistidos via API

### 6. Lançamento de Notas
- Seleção de disciplina e de aluno a partir de listas carregadas pela API
- Campos para Nota 1 e Nota 2 com validação de intervalo (0–10)
- Envio via `PUT /api/notas`; feedback de sucesso/erro

### 7. Boletim Acadêmico
- Dados reais carregados via `GET /api/boletim/:matricula`
- Tabela com: disciplina, nota 1, nota 2, média e situação
- Badges coloridos por situação: verde (Aprovado), laranja (Exame), vermelho (Reprovado)
- Resumo com contagem de aprovados, em exame e reprovados

---

## Hooks e padrões

### Hooks nativos utilizados
- **`useState`** — estado de campos, erros, loading e dados
- **`useEffect`** — carregamento de dados ao montar as telas e limpeza de efeitos
- **`useContext`** — acesso ao `AuthContext` sem prop drilling

### Hooks customizados
- **`useFormulario`** — hook genérico reutilizado nas três telas de cadastro; gerencia `formulario`, `erros`, `atualizarCampo`, `validar` e `resetar`
- **`useBoletim`** — encapsula a chamada ao `boletimService`, estados de loading/erro e cálculo dos contadores
- **`useIBGE`** — consulta a API ViaCEP pelo CEP informado e preenche automaticamente endereço, cidade e estado

### Segurança no frontend
- Token JWT armazenado com `expo-secure-store` (nunca em `AsyncStorage`)
- Interceptor de requisição injeta o header `Authorization: Bearer <token>` em todas as chamadas
- Interceptor de resposta executa logout automático ao receber `401` ou `403`

---

## Como executar

### Pré-requisitos

- Node.js ≥ 18
- PostgreSQL ≥ 14 rodando localmente
- Expo Go instalado no celular (ou emulador Android/iOS)

---

### 1. Configurar o Backend

```bash
cd backend

# Copiar e preencher as variáveis de ambiente
cp .env.example .env
# Editar .env com as credenciais do PostgreSQL e uma chave JWT segura

# Instalar dependências
npm install

# Criar as tabelas no banco
npm run migrate

# (Opcional) Popular com dados de exemplo
npm run seed

# Iniciar o servidor em modo desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

---

### 2. Configurar o Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento Expo
npx expo start
```

Escaneie o QR Code exibido no terminal com o aplicativo **Expo Go**.

> **Atenção:** o frontend detecta automaticamente o IP da máquina via `expo-constants` para montar a `baseURL` do axios. O celular e o computador precisam estar na **mesma rede Wi-Fi**.

---

### Variáveis de ambiente do backend (`.env`)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=appscholar
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

JWT_SECRET=troque_por_uma_chave_secreta_segura
PORT=3000
```

---

## Credenciais de acesso (seed de desenvolvimento)

Após executar `npm run seed` no backend, os seguintes usuários ficam disponíveis:

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@fatec.sp.gov.br | 123456 |
| Professor | professor@fatec.sp.gov.br | 123456 |
| Aluno | aluno@fatec.sp.gov.br | 123456 |

---

## Scripts disponíveis

### Backend
| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia com nodemon |
| `npm start` | Inicia em modo produção |
| `npm run migrate` | Cria/recria as tabelas no banco |
| `npm run seed` | Insere dados de exemplo |

### Frontend
| Script | Descrição |
|--------|-----------|
| `npx expo start` | Inicia o servidor de desenvolvimento |
| `npx expo start --android` | Abre direto no emulador Android |
| `npx expo start --ios` | Abre direto no simulador iOS |
| `npx expo start --web` | Abre no navegador |