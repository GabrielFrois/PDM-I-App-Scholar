# App Scholar

Aplicativo mobile para gerenciamento de informações acadêmicas, desenvolvido com React Native e Expo para a disciplina de **Programação para Dispositivos Móveis I** — Fatec Jacareí.

---

## Sobre o projeto

O App Scholar permite autenticação de usuários, cadastro de informações acadêmicas e consulta de boletins. O projeto é dividido em duas etapas: esta primeira entrega cobre toda a interface mobile (UI/UX) com dados simulados; a segunda etapa integrará o backend com Node.js, APIs REST e banco de dados PostgreSQL.

---

## Tecnologias utilizadas

- React Native
- Expo
- TypeScript
- React Navigation

---

## Estrutura do projeto

```
app-scholar/
├── App.tsx                        # Providers globais
├── app.json                       # Configurações do Expo
└── src/
    ├── components/
    │   ├── BotaoPrimario.tsx      # Botão reutilizável
    │   └── CampoEntrada.tsx       # Input reutilizável
    ├── contexts/
    │   └── AuthContext.tsx        # Contexto de autenticação
    ├── navigation/
    │   └── AppNavigator.tsx       # Controle de rotas
    ├── screens/
    │   ├── LoginScreen.tsx        
    │   ├── DashboardScreen.tsx    
    │   ├── CadastroAlunoScreen.tsx
    │   ├── CadastroProfessorScreen.tsx
    │   ├── CadastroDisciplinaScreen.tsx
    │   └── BoletimScreen.tsx     
    └── styles/
        └── theme.ts               # Paleta de cores, espaçamentos e tipografia
```

---

## Telas implementadas

### 1. Login
- Campos: e-mail e senha
- Validação de campos obrigatórios com mensagem de erro inline
- Feedback visual de carregamento durante a autenticação
- Redirecionamento automático ao painel após login bem-sucedido

### 2. Dashboard
- Cards de navegação para as quatro áreas do sistema
- Exibição do nome do usuário autenticado
- Botão de saída do sistema

### 3. Cadastro de Alunos
- Campos: nome, matrícula, curso, e-mail, telefone, CEP, endereço, cidade e estado
- Divisão em seções: Dados Pessoais e Endereço
- Validação completa de todos os campos antes de salvar
- Dados armazenados temporariamente no estado do aplicativo e exibidos no console

### 4. Cadastro de Professores
- Campos: nome, titulação, área de atuação, tempo de docência e e-mail
- Validação completa com mensagens de erro por campo

### 5. Cadastro de Disciplinas
- Campos: nome da disciplina, carga horária, professor responsável, curso e semestre
- Validação completa com mensagens de erro por campo

### 6. Boletim Acadêmico
- Dados simulados (mock) carregados via `useEffect`
- Exibição em tabela: disciplina, nota 1, nota 2, média e situação
- Resumo visual com contagem de aprovados, em exame e reprovados
- Badges coloridos por situação: verde (aprovado), laranja (exame), vermelho (reprovado)

---

## Hooks utilizados

### `useState`
Gerencia o estado de todos os campos de formulário, mensagens de erro, estados de carregamento e dados temporários em memória.

### `useEffect`
Utilizado nas telas de cadastro para registrar a montagem da tela (ponto de integração com API na Parte 2) e no boletim para simular o carregamento assíncrono de dados com limpeza de efeito colateral (`clearTimeout`).

### `useContext`
Implementado por meio do `AuthContext`, que disponibiliza para todas as telas o estado de autenticação, os dados do usuário logado e as funções de `login` e `logout` sem necessidade de prop drilling.

---

## Credenciais de acesso (dados simulados)

```
E-mail: gabriel@fatec.sp.gov.br
Senha:  123456
```

---

## Como executar

**Pré-requisitos:** Node.js, npm e o aplicativo Expo Go instalado no celular (iOS ou Android).

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npx expo start
```

Após iniciar, escaneie o QR Code exibido no terminal com o aplicativo Expo Go.