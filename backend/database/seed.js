// Povoa o banco com dados de exemplo para testes

require('dotenv').config();

const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'appscholar',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

function nomeParaEmail(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    + '@fatec.sp.gov.br';
}

async function seed() {
  try {
    await client.connect();
    console.log('[seed] Conectado ao PostgreSQL.');

    await client.query('BEGIN');

    await client.query('DELETE FROM notas');
    await client.query('DELETE FROM matriculas');
    await client.query('DELETE FROM disciplinas');
    await client.query('DELETE FROM alunos');
    await client.query('DELETE FROM cursos');
    await client.query('DELETE FROM professores');
    await client.query('DELETE FROM usuarios');
    console.log('[seed] Dados antigos removidos.');

    const senhaHash = await bcrypt.hash('123456', 10);

    // Professores
    const professoresData = [
      { nome: 'Luciano Silva',    titulacao: 'Mestre',       area: 'Engenharia de Software',  tempo_docencia: 8,  email: 'luciano.silva@fatec.sp.gov.br'    },
      { nome: 'Camila Fernandes', titulacao: 'Doutora',      area: 'Banco de Dados',          tempo_docencia: 12, email: 'camila.fernandes@fatec.sp.gov.br' },
      { nome: 'Roberto Almeida',  titulacao: 'Mestre',       area: 'Redes e Sistemas',        tempo_docencia: 5,  email: 'roberto.almeida@fatec.sp.gov.br'  },
      { nome: 'Marcos Costa',     titulacao: 'Mestre',       area: 'Sistemas Embarcados',     tempo_docencia: 7,  email: 'marcos.costa@fatec.sp.gov.br'     },
      { nome: 'Fernanda Lima',    titulacao: 'Especialista', area: 'Matematica Aplicada',     tempo_docencia: 4,  email: 'fernanda.lima@fatec.sp.gov.br'    },
      { nome: 'Patricia Mendes',  titulacao: 'Doutora',      area: 'Inteligencia Artificial', tempo_docencia: 9,  email: 'patricia.mendes@fatec.sp.gov.br'  },
      { nome: 'Andre Oliveira',   titulacao: 'Mestre',       area: 'Arquitetura de Software', tempo_docencia: 6,  email: 'andre.oliveira@fatec.sp.gov.br'   },
      { nome: 'Renata Souza',     titulacao: 'Especialista', area: 'Gestao de Projetos',      tempo_docencia: 3,  email: 'renata.souza@fatec.sp.gov.br'     },
      { nome: 'Felipe Castro',    titulacao: 'Mestre',       area: 'Seguranca da Informacao', tempo_docencia: 10, email: 'felipe.castro@fatec.sp.gov.br'    },
      { nome: 'Beatriz Rocha',    titulacao: 'Doutora',      area: 'Computacao em Nuvem',     tempo_docencia: 8,  email: 'beatriz.rocha@fatec.sp.gov.br'    },
    ];

    // Disciplinas
    // Sem o campo "curso" — a FK curso_id será preenchida após inserir o curso
    const disciplinas = [
      // 1º Semestre
      { nome: 'Logica de Programacao',               carga_horaria: 80, professor: 'Luciano Silva',    semestre: '1º Semestre' },
      { nome: 'Fundamentos de Redes',                carga_horaria: 60, professor: 'Roberto Almeida',  semestre: '1º Semestre' },
      { nome: 'Matematica Discreta',                 carga_horaria: 60, professor: 'Fernanda Lima',    semestre: '1º Semestre' },
      // 2º Semestre
      { nome: 'Programacao Orientada a Objetos',     carga_horaria: 80, professor: 'Luciano Silva',    semestre: '2º Semestre' },
      { nome: 'Banco de Dados I',                    carga_horaria: 80, professor: 'Camila Fernandes', semestre: '2º Semestre' },
      { nome: 'Calculo Aplicado',                    carga_horaria: 60, professor: 'Fernanda Lima',    semestre: '2º Semestre' },
      // 3º Semestre
      { nome: 'Estrutura de Dados',                  carga_horaria: 80, professor: 'Andre Oliveira',   semestre: '3º Semestre' },
      { nome: 'Banco de Dados II',                   carga_horaria: 80, professor: 'Camila Fernandes', semestre: '3º Semestre' },
      { nome: 'Engenharia de Software',              carga_horaria: 60, professor: 'Renata Souza',     semestre: '3º Semestre' },
      // 4º Semestre
      { nome: 'Programacao para Dispositivos Moveis I',  carga_horaria: 80, professor: 'Luciano Silva',    semestre: '4º Semestre' },
      { nome: 'Banco de Dados Relacional',               carga_horaria: 80, professor: 'Camila Fernandes', semestre: '4º Semestre' },
      { nome: 'Programacao Web',                         carga_horaria: 80, professor: 'Roberto Almeida',  semestre: '4º Semestre' },
      { nome: 'Internet das Coisas',                     carga_horaria: 60, professor: 'Marcos Costa',     semestre: '4º Semestre' },
      { nome: 'Estatistica Aplicada',                    carga_horaria: 60, professor: 'Fernanda Lima',    semestre: '4º Semestre' },
      // 5º Semestre
      { nome: 'Programacao para Dispositivos Moveis II', carga_horaria: 80, professor: 'Luciano Silva',   semestre: '5º Semestre' },
      { nome: 'Inteligencia Artificial',                 carga_horaria: 80, professor: 'Patricia Mendes', semestre: '5º Semestre' },
      { nome: 'Seguranca da Informacao',                 carga_horaria: 60, professor: 'Felipe Castro',   semestre: '5º Semestre' },
      // 6º Semestre
      { nome: 'Computacao em Nuvem',              carga_horaria: 80, professor: 'Beatriz Rocha',  semestre: '6º Semestre' },
      { nome: 'Gestao de Projetos de Software',   carga_horaria: 60, professor: 'Renata Souza',   semestre: '6º Semestre' },
      { nome: 'Trabalho de Conclusao de Curso',   carga_horaria: 80, professor: 'Andre Oliveira', semestre: '6º Semestre' },
    ];

    // Alunos
    const alunosPorSemestre = [
      { nome: 'Ana Clara',       semIdx: 0 },
      { nome: 'Bruno Souza',     semIdx: 0 },
      { nome: 'Carlos Eduardo',  semIdx: 1 },
      { nome: 'Daniela Rocha',   semIdx: 1 },
      { nome: 'Eduardo Lima',    semIdx: 1 },
      { nome: 'Fernanda Alves',  semIdx: 2 },
      { nome: 'Gabriel Martins', semIdx: 2 },
      { nome: 'Helena Costa',    semIdx: 3 },
      { nome: 'Igor Santos',     semIdx: 3 },
      { nome: 'Juliana Pereira', semIdx: 3 },
      { nome: 'Lucas Carvalho',  semIdx: 4 },
      { nome: 'Mariana Ribeiro', semIdx: 4 },
      { nome: 'Nicolas Gomes',   semIdx: 5 },
      { nome: 'Olivia Ferreira', semIdx: 5 },
      { nome: 'Pedro Henrique',  semIdx: 5 },
    ];

    const semestres = [
      '1º Semestre', '2º Semestre', '3º Semestre',
      '4º Semestre', '5º Semestre', '6º Semestre',
    ];

    const alunosData = alunosPorSemestre.map((a, index) => ({
      nome:      a.nome,
      semIdx:    a.semIdx,
      matricula: `2026${String(index + 1).padStart(3, '0')}`,
      email:     nomeParaEmail(a.nome),
      telefone:  `(12) 99999-${String(index + 1).padStart(4, '0')}`,
      cep:       '12245-000',
      endereco:  `Rua Voluntarios da Patria, ${100 + index}`,
      cidade:    'Jacareí',
      estado:    'SP',
    }));

    // Inserção de usuários
    const usuarios = [
      { email: 'admin@fatec.sp.gov.br', senha_hash: senhaHash, perfil: 'admin' },
      ...professoresData.map(p => ({ email: p.email, senha_hash: senhaHash, perfil: 'professor' })),
      ...alunosData.map(a => ({ email: a.email, senha_hash: senhaHash, perfil: 'aluno' })),
    ];

    for (const u of usuarios) {
      await client.query(
        'INSERT INTO usuarios (email, senha_hash, perfil) VALUES ($1, $2, $3)',
        [u.email, u.senha_hash, u.perfil]
      );
    }
    console.log(`[seed] ${usuarios.length} usuarios inseridos.`);

    // Inserção de professores
    const professorIds = {};
    for (const p of professoresData) {
      const res = await client.query(
        'INSERT INTO professores (nome, titulacao, area, tempo_docencia, email) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [p.nome, p.titulacao, p.area, p.tempo_docencia, p.email]
      );
      professorIds[p.nome] = res.rows[0].id;
    }
    console.log(`[seed] ${professoresData.length} professores inseridos.`);

    // Inserção do curso 
    const NOME_CURSO = 'Desenvolvimento de Software Multiplataforma';
    const cursoRes = await client.query(
      `INSERT INTO cursos (nome, area, duracao_sem, coordenador_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [NOME_CURSO, 'Tecnologia da Informação', 6, professorIds['Luciano Silva']]
    );
    const cursoId = cursoRes.rows[0].id;
    console.log(`[seed] Curso '${NOME_CURSO}' inserido (id=${cursoId}, coordenador: Luciano Silva).`);

    // Inserção de disciplinas
    // Usa cursoId (FK) em vez do texto do nome do curso
    const disciplinaIds = {};
    for (const d of disciplinas) {
      const res = await client.query(
        `INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso_id, semestre)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [d.nome, d.carga_horaria, professorIds[d.professor], cursoId, d.semestre]
      );
      disciplinaIds[d.nome] = res.rows[0].id;
    }
    console.log(`[seed] ${disciplinas.length} disciplinas inseridas.`);

    // Inserção de alunos
    const alunoIds = [];
    for (const a of alunosData) {
      const res = await client.query(
        `INSERT INTO alunos (nome, matricula, curso_id, email, telefone, cep, endereco, cidade, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [a.nome, a.matricula, cursoId, a.email, a.telefone, a.cep, a.endereco, a.cidade, a.estado]
      );
      alunoIds.push({ id: res.rows[0].id, semIdx: a.semIdx });
    }
    console.log(`[seed] ${alunoIds.length} alunos inseridos.`);

    // Inserção de notas
    let notasInseridas = 0;
    for (const { id: alunoId, semIdx } of alunoIds) {
      const semestreDoAluno    = semestres[semIdx];
      const disciplinasDoAluno = disciplinas.filter(d => d.semestre === semestreDoAluno);
      for (const d of disciplinasDoAluno) {
        const nota1 = parseFloat((Math.random() * 5 + 5).toFixed(1));
        const nota2 = parseFloat((Math.random() * 5 + 5).toFixed(1));
        await client.query(
          'INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2) VALUES ($1, $2, $3, $4)',
          [alunoId, disciplinaIds[d.nome], nota1, nota2]
        );
        notasInseridas++;
      }
    }
    console.log(`[seed] ${notasInseridas} notas inseridas.`);

    // Inserção de matrículas
    let matriculasInseridas = 0;
    for (const { id: alunoId, semIdx } of alunoIds) {
      const semestreDoAluno    = semestres[semIdx];
      const disciplinasDoAluno = disciplinas.filter(d => d.semestre === semestreDoAluno);
      for (const d of disciplinasDoAluno) {
        await client.query(
          'INSERT INTO matriculas (aluno_id, disciplina_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [alunoId, disciplinaIds[d.nome]]
        );
        matriculasInseridas++;
      }
    }
    console.log(`[seed] ${matriculasInseridas} matrículas inseridas.`);

    await client.query('COMMIT');
    console.log('[seed] Concluido com sucesso!');
    console.log('---');
    console.log('[seed] Logins gerados (senha padrao para todos: 123456):');
    console.log('[seed]   admin     -> admin@fatec.sp.gov.br');
    console.log('[seed]   professor -> luciano.silva@fatec.sp.gov.br   (1º, 2º, 4º e 5º sem.)');
    console.log('[seed]   professor -> camila.fernandes@fatec.sp.gov.br (2º, 3º e 4º sem.)');
    console.log('[seed]   professor -> patricia.mendes@fatec.sp.gov.br  (5º sem.)');
    console.log('[seed]   professor -> beatriz.rocha@fatec.sp.gov.br    (6º sem.)');
    console.log('');
    console.log('[seed] Alunos por semestre:');
    for (let i = 0; i < semestres.length; i++) {
      const grupo = alunosData.filter(a => a.semIdx === i);
      console.log(`[seed]   ${semestres[i]}:`);
      grupo.forEach(a => console.log(`[seed]     ${a.nome.padEnd(20)} -> ${a.email}`));
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] Erro durante a execucao:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();