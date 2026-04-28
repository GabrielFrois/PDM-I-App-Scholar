DROP TABLE IF EXISTS notas       CASCADE;
DROP TABLE IF EXISTS disciplinas CASCADE;
DROP TABLE IF EXISTS alunos      CASCADE;
DROP TABLE IF EXISTS professores CASCADE;
DROP TABLE IF EXISTS usuarios    CASCADE;

-- Tabela usuarios
-- Usada pela API de autenticação (login com JWT)
CREATE TABLE usuarios (
  id         SERIAL       PRIMARY KEY,
  email      VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,           -- bcrypt hash
  perfil     VARCHAR(20)  NOT NULL DEFAULT 'aluno' CHECK (perfil IN ('aluno', 'admin')),
  criado_em  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Tabela alunos
CREATE TABLE alunos (
  id         SERIAL       PRIMARY KEY,
  nome       VARCHAR(150) NOT NULL,
  matricula  VARCHAR(20)  NOT NULL UNIQUE,
  curso      VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  telefone   VARCHAR(20),
  cep        VARCHAR(10),
  endereco   VARCHAR(200),
  cidade     VARCHAR(100),
  estado     CHAR(2),
  criado_em  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Tabela professores
CREATE TABLE professores (
  id             SERIAL       PRIMARY KEY,
  nome           VARCHAR(150) NOT NULL,
  titulacao      VARCHAR(50)  NOT NULL,
  area           VARCHAR(100) NOT NULL,
  tempo_docencia INTEGER      NOT NULL DEFAULT 0,
  email          VARCHAR(150) NOT NULL UNIQUE,
  criado_em      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Tabela disciplinas
CREATE TABLE disciplinas (
  id            SERIAL       PRIMARY KEY,
  nome          VARCHAR(150) NOT NULL,
  carga_horaria INTEGER      NOT NULL,
  professor_id  INTEGER      REFERENCES professores(id) ON DELETE SET NULL,
  curso         VARCHAR(100) NOT NULL,
  semestre      VARCHAR(20)  NOT NULL,
  criado_em     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Tabela notas
CREATE TABLE notas (
  id            SERIAL         PRIMARY KEY,
  aluno_id      INTEGER        NOT NULL REFERENCES alunos(id)      ON DELETE CASCADE,
  disciplina_id INTEGER        NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  nota1         NUMERIC(4, 1)  CHECK (nota1 BETWEEN 0 AND 10),
  nota2         NUMERIC(4, 1)  CHECK (nota2 BETWEEN 0 AND 10),
  media         NUMERIC(4, 1)  GENERATED ALWAYS AS (ROUND((nota1 + nota2) / 2.0, 1)) STORED,
  situacao      VARCHAR(20)    GENERATED ALWAYS AS (
                  CASE
                    WHEN (nota1 + nota2) / 2.0 >= 6 THEN 'Aprovado'
                    WHEN (nota1 + nota2) / 2.0 >= 5 THEN 'Exame'
                    ELSE 'Reprovado'
                  END
                ) STORED,
  criado_em     TIMESTAMP      NOT NULL DEFAULT NOW(),
  UNIQUE (aluno_id, disciplina_id)
);

-- Índices para performance nas consultas mais comuns
CREATE INDEX idx_alunos_matricula    ON alunos(matricula);
CREATE INDEX idx_alunos_email        ON alunos(email);
CREATE INDEX idx_notas_aluno         ON notas(aluno_id);
CREATE INDEX idx_disciplinas_curso   ON disciplinas(curso);